import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobDetails } from '../api/index';

// Moved API key to environment variable for security
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.0-flash:generateMessage';

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({
    job: null,
    loading: true,
    error: null,
    questions: [],
    currentIndex: 0,
    currentAnswer: '',
    answers: [],
    result: null,
    isSubmitting: false,
    progress: 0
  });

  useEffect(() => {
    if (!API_KEY) {
      setState(prev => ({ ...prev, error: 'API key not configured', loading: false }));
      return;
    }

    const fetchData = async () => {
      try {
        const job = await getJobDetails(jobId);
        setState(prev => ({ ...prev, job }));
        await generateQuestions(job.description);
      } catch (err) {
        setState(prev => ({ ...prev, error: err.message || 'Failed to load job details' }));
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [jobId]);

  const generateQuestions = async (desc) => {
    try {
      const prompt = `Generate 5-10 relevant interview questions based on this job description. 
        Return ONLY a valid JSON array of questions. Format: ["question1", "question2", ...]
        
        Job Description:
        ${desc}`;

      const resp = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      if (!resp.ok) throw new Error(`API request failed with status ${resp.status}`);

      const data = await resp.json();
      const content = data.candidates?.[0]?.message?.content;
      
      if (!content) throw new Error('No content in response');
      
      const parsedQuestions = JSON.parse(content);
      if (!Array.isArray(parsedQuestions)) throw new Error('Invalid question format');

      setState(prev => ({
        ...prev,
        questions: parsedQuestions,
        progress: 100 / (parsedQuestions.length || 1)
      }));
    } catch (err) {
      console.error('Question generation error:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to generate questions. Please try again later.'
      }));
    }
  };

  const handleAnswerChange = (e) => {
    setState(prev => ({ ...prev, currentAnswer: e.target.value }));
  };

  const submitAnswer = () => {
    if (!state.currentAnswer.trim()) {
      setState(prev => ({ ...prev, error: 'Please provide an answer before submitting' }));
      return;
    }

    const updatedAnswers = [
      ...state.answers,
      {
        question: state.questions[state.currentIndex],
        answer: state.currentAnswer
      }
    ];

    const isLastQuestion = state.currentIndex >= state.questions.length - 1;
    
    setState(prev => ({
      ...prev,
      answers: updatedAnswers,
      currentAnswer: '',
      currentIndex: isLastQuestion ? prev.currentIndex : prev.currentIndex + 1,
      progress: isLastQuestion ? 100 : ((prev.currentIndex + 1) * (100 / prev.questions.length)),
      error: null
    }));

    if (isLastQuestion) {
      evaluateAnswers(updatedAnswers);
    }
  };

  const evaluateAnswers = async (allAnswers) => {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const content = allAnswers.map((a, i) => 
        `Question ${i+1}: ${a.question}\nAnswer: ${a.answer}`
      ).join('\n\n');

      const prompt = `Evaluate these interview answers for a ${state.job.title} position.
        Return ONLY a valid JSON object with these properties:
        - feedback: array of strings (specific feedback for each answer)
        - score: number (1-10 overall rating)
        - recommendation: string (one paragraph summary)
        - strengths: array of strings (key strengths)
        - areasForImprovement: array of strings
        
        Answers:
        ${content}`;

      const resp = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5, // Lower temperature for more consistent evaluations
        }),
      });

      if (!resp.ok) throw new Error(`Evaluation failed with status ${resp.status}`);

      const data = await resp.json();
      const resultText = data.candidates?.[0]?.message?.content;
      
      if (!resultText) throw new Error('No evaluation content received');
      
      const result = JSON.parse(resultText);
      
      setState(prev => ({
        ...prev,
        result,
        isSubmitting: false
      }));
    } catch (err) {
      console.error('Evaluation error:', err);
      setState(prev => ({
        ...prev,
        error: 'Failed to evaluate answers. Please try again.',
        isSubmitting: false
      }));
    }
  };

  const handlePrevious = () => {
    if (state.currentIndex > 0) {
      setState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
        currentAnswer: prev.answers[prev.currentIndex - 1]?.answer || '',
        error: null
      }));
    }
  };

  if (state.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="text-red-600 mb-4">{state.error}</div>
          <button
            onClick={() => navigate('/jobs')}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  if (state.result) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Interview Results for {state.job.title}
            </h2>
            <div className="flex justify-center items-center mb-6">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e6e6e6"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeDasharray={`${state.result.score * 10}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">
                    {state.result.score}/10
                  </span>
                </div>
              </div>
            </div>
            <p className="text-lg text-gray-600 mb-4">
              {state.result.recommendation}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Strengths</h3>
            <ul className="space-y-2">
              {state.result.strengths?.map((strength, i) => (
                <li key={i} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
            <ul className="space-y-2">
              {state.result.areasForImprovement?.map((area, i) => (
                <li key={i} className="flex items-start">
                  <svg className="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Feedback</h3>
            <div className="space-y-6">
              {state.answers.map((answer, i) => (
                <div key={i} className="border-l-4 border-indigo-200 pl-4 py-2">
                  <h4 className="font-medium text-gray-900">Question {i + 1}: {answer.question}</h4>
                  <p className="text-gray-600 mb-2">Your answer: {answer.answer}</p>
                  {state.result.feedback?.[i] && (
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">
                      <span className="font-medium">Feedback:</span> {state.result.feedback[i]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => navigate('/jobs')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {state.job.title}
            </h2>
            <p className="text-gray-600">{state.job.company}</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Question {state.currentIndex + 1} of {state.questions.length}
              </span>
              <span className="text-sm font-medium text-indigo-600">
                {Math.round(state.progress)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${state.progress}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {state.questions[state.currentIndex]}
            </h3>
            <textarea
              value={state.currentAnswer}
              onChange={handleAnswerChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Type your answer here..."
            />
          </div>

          {state.error && (
            <div className="mb-4 text-red-600 text-sm">{state.error}</div>
          )}

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={state.currentIndex === 0 || state.isSubmitting}
              className={`px-4 py-2 rounded-md ${state.currentIndex === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Previous
            </button>
            <button
              onClick={submitAnswer}
              disabled={state.isSubmitting}
              className={`px-6 py-2 rounded-md text-white ${state.isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} flex items-center`}
            >
              {state.isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : state.currentIndex < state.questions.length - 1 ? (
                'Next Question'
              ) : (
                'Submit Answers'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplication;