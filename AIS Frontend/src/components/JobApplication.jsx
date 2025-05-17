import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobDetails } from '../api/index';

const API_KEY = 'AIzaSyBnB_CoT7Bm4NT0_tOQTJ_JgH2_OKAxoKA'; // hardcoded key
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.0-flash:generateMessage';

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const j = await getJobDetails(jobId);
        setJob(j);
        await generateQuestions(j.description);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const generateQuestions = async (desc) => {
    try {
      const resp = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Generate 10 interview questions based on this job description. Return ONLY a JSON array of questions.\n\n${desc}` }],
          temperature: 0.7,
        }),
      });
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const data = await resp.json();
      const text = data.candidates?.[0]?.message?.content;
      setQuestions(JSON.parse(text));
    } catch (err) {
      console.error(err);
      setError('Failed to generate questions.');
    }
  };

  const submitAnswer = () => {
    if (!currentAnswer.trim()) return;
    const updated = [...answers, { question: questions[currentIndex], answer: currentAnswer }];
    setAnswers(updated);
    setCurrentAnswer('');
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(ci => ci + 1);
    } else {
      evaluateAnswers(updated);
    }
  };

  const evaluateAnswers = async (all) => {
    setIsSubmitting(true);
    try {
      const content = all.map((a,i) => `Q${i+1}: ${a.question}\nA: ${a.answer}`).join('\n\n');
      const resp = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Evaluate these answers. Return ONLY a JSON with feedback (array), score, recommendation.\n\n${content}` }],
          temperature: 0.7,
        }),
      });
      if (!resp.ok) throw new Error(`API ${resp.status}`);
      const data = await resp.json();
      const text = data.candidates?.[0]?.message?.content;
      setResult(JSON.parse(text));
    } catch (err) {
      console.error(err);
      setError('Failed to evaluate answers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading application...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  if (result) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Results for {job.title}</h2>
        <p>Score: {result.score}/10</p>
        <p>Recommendation: {result.recommendation}</p>
        <ul className="mt-4 list-disc pl-6">
          {result.feedback.map((f,i) => <li key={i}>{f}</li>)}
        </ul>
        <button onClick={() => navigate('/jobs')} className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded">Back to Jobs</button>
      </div>
    );
  }

  const question = questions[currentIndex] || '';
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
      <p className="mb-4">Question {currentIndex + 1} of {questions.length}</p>
      <p className="mb-4">{question}</p>
      <textarea
        value={currentAnswer}
        onChange={e => setCurrentAnswer(e.target.value)}
        rows={5}
        className="w-full border p-2 rounded mb-4"
      />
      <button
        onClick={submitAnswer}
        disabled={isSubmitting}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >{currentIndex < questions.length - 1 ? 'Next' : 'Submit'}</button>
    </div>
  );
};

export default JobApplication;
