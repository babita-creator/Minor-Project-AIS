import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getAllJobs, getCompanyDetails, deleteJob } from '../api/index';
import { generateQuestions, evaluateAnswer } from '../api/gemini';
import Cookies from 'js-cookie';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [companyDetailsMap, setCompanyDetailsMap] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState('');

  // New states for answers and evaluation
  const [answers, setAnswers] = useState({});
  const [evaluationResults, setEvaluationResults] = useState({});
  const [evaluating, setEvaluating] = useState(false);

  const navigate = useNavigate();

  // Capture console.log messages and push to state
  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev, args.join(' ')]);
    };
    return () => { console.log = originalLog; };
  }, []);

  // Fetch jobs
  useEffect(() => {
    console.log('Fetching jobs...');
    (async () => {
      try {
        const response = await getAllJobs();
        console.log('Jobs response:', response);
        setJobs(Array.isArray(response) ? response : []);
      } catch (err) {
        setError(err.message);
        console.log('Error fetching jobs:', err.message);
      } finally {
        setLoading(false);
        console.log('Finished fetching jobs.');
      }
    })();
  }, []);

  // Decode user token
  useEffect(() => {
    const token = Cookies.get('token');
    console.log('Token from cookies:', token);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded);
        setUserRole(decoded.role);
        setUserId(decoded.id);
      } catch (err) {
        console.error('Invalid token', err);
      }
    }
  }, []);

  // Fetch company details
  const fetchCompanyDetails = async id => {
    if (!id || companyDetailsMap[id]) return;
    console.log(`Fetching details for company: ${id}`);
    try {
      const resp = await getCompanyDetails(id);
      console.log(`Company ${id} details:`, resp);
      setCompanyDetailsMap(prev => ({ ...prev, [id]: resp || { name: 'N/A', email: 'N/A' } }));
    } catch (err) {
      console.error(`Error fetching company ${id}:`, err);
      setCompanyDetailsMap(prev => ({ ...prev, [id]: { name: 'Error', email: 'N/A' } }));
    }
  };
  useEffect(() => { jobs.forEach(job => fetchCompanyDetails(job.company)); }, [jobs]);

  const handleSearchChange = e => {
    setSearchTerm(e.target.value);
    console.log('Search term:', e.target.value);
  };

  // Generate questions when applying


  const handleDeleteJob = async (jobId, createdBy) => {
    console.log(`Attempt to delete job ${jobId} by user ${userId}`);
    if (userRole !== 'company' || userId !== createdBy) {
      console.warn('Unauthorized delete attempt');
      setErrorMessage("You can't delete this job because you didn’t create it.");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      console.log(`Deleting job: ${jobId}`);
      await deleteJob(jobId);
      console.log('Job deleted successfully');
      setJobs(prev => prev.filter(j => j._id !== jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
      setErrorMessage('Failed to delete the job.');
    }
  };

  const filteredJobs = jobs.filter(job => job.title.toLowerCase().includes(searchTerm.toLowerCase()));


const handleApplyNow = async (job) => {
  console.log(`User ${userId} requesting questions for job ${job._id}`);
  setErrorMessage('');
  setEvaluationResults({});
  setAnswers({});
  try {
    const qs = await generateQuestions(job.description);
    console.log('Generated questions:', qs);
    setQuestions(qs);
    setSelectedJobTitle(job.title);
    setSelectedJobId(job._id);  // <--- Set the job id here!
    setModalOpen(true);
  } catch (err) {
    console.error('Error generating questions:', err);
    setErrorMessage('Failed to generate questions.');
  }
};

const handleSubmitAnswers = async () => {
  setEvaluating(true);
  setErrorMessage('');
  try {
    const results = {};

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const answer = answers[i] || '';

      if (!answer.trim()) {
        results[i] = 'No answer provided.';
        continue;
      }

      console.log(`[QA] Evaluating answer for question ${i}:`, answer);
      const feedbackText = await evaluateAnswer(question, answer);
      console.log(`[QA] Received feedback for question ${i}:`, feedbackText);
      results[i] = feedbackText;

      // Extract numeric score from feedback text
      const scoreMatch = feedbackText.match(/Score:\s*(\d+)\/10/i);
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
      console.log(`[QA] Parsed score for question ${i}:`, score);

      // Construct payload including jobId
      const payload = {
        jobId: selectedJobId,          // <--- add jobId here
        question,
        answer,
        evaluation: { score, feedback: feedbackText },
      };

      console.log(`[QA] Sending to backend for question ${i}:`, payload);

      try {
        const resp = await fetch('http://localhost:5000/api/interview-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // if needed
          body: JSON.stringify(payload),
        });
        if (!resp.ok) {
          const errBody = await resp.text();
          console.error(`[QA] Backend returned error for question ${i}:`, resp.status, errBody);
        } else {
          console.log(`[QA] Successfully saved question ${i} to backend.`);
        }
      } catch (saveErr) {
        console.error(`[QA] Network error saving question ${i}:`, saveErr);
      }
    }

    setEvaluationResults(results);

  } catch (err) {
    setErrorMessage('Failed to evaluate answers.');
    console.error('[QA] Unexpected error:', err);
  } finally {
    setEvaluating(false);
  }
};

  const handleAnswerChange = (index, value) => {
    setAnswers(prev => ({ ...prev, [index]: value }));
  };



  if (loading) return <div className="text-gray-700 p-4">Loading jobs...</div>;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  return (
    <div className="p-4 md:p-8 min-h-screen pt-6 pb-12" style={{ backgroundColor: '#eef2ff' }}>
      <div className="max-w-6xl mx-auto space-y-6">
<div className="mb-6 m-10 relative z-10 bg-white p-4 rounded-xl shadow-md border border-gray-200">
  <input
    type="text"
    placeholder="Search by job title"
    value={searchTerm}
    onChange={handleSearchChange}
    className="w-full px-4 py-2 border border-gray-300 bg-gray-50 text-gray-800 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
  />
</div>


        {errorMessage && (
          <div className="p-4 bg-red-100 text-red-700 rounded-md shadow-md mb-6 text-center">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => {
            const company = companyDetailsMap[job.company] || {};
            const isOwner = userRole === 'company' && userId === job.createdBy;
            return (
              <div key={job._id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-indigo-700">{job.title}</h3>
                  <span className="text-sm text-gray-500">{job.location}</span>
                </div>
                <p className="text-gray-700 text-sm mb-3">{job.description}</p>
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p><span className="font-medium text-gray-800">Company:</span> {company.name}</p>
                  <p>💰 <span className="font-medium text-gray-800">Salary:</span> NPR {job.salary}</p>
                </div>
                <button
                  onClick={() => handleApplyNow(job)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl transition-colors duration-200"
                >
                  Apply Now
                </button>
                {isOwner && (
                  <button
                    onClick={() => handleDeleteJob(job._id, job.createdBy)}
                    className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition-colors duration-200"
                  >
                    Delete Job
                  </button>
                )}
              </div>
            );
          })}
        </div>

      

        {/* Modal for Questions & Answers */}
        {modalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div
              className="bg-white rounded-lg max-w-lg w-full p-6 shadow-lg max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h2 id="modal-title" className="text-xl font-bold mb-4">
                Interview Questions for: <span className="text-indigo-600">{selectedJobTitle}</span>
              </h2>

              {questions.length === 0 ? (
                <p>No questions generated.</p>
              ) : (
                <form onSubmit={e => { e.preventDefault(); handleSubmitAnswers(); }}>
                  <ol className="list-decimal list-inside space-y-6 text-gray-800">
                    {questions.map((q, i) => (
                      <li key={i} className="space-y-2">
                        <p className="font-semibold">{q}</p>
                        <textarea
                          rows={3}
                          className="w-full p-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          placeholder="Write your answer here..."
                          value={answers[i] || ''}
                          onChange={e => handleAnswerChange(i, e.target.value)}
                        />
                        {evaluationResults[i] && (
                          <p className="mt-1 text-sm text-green-700 font-medium">
                            Feedback: {evaluationResults[i]}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                  <button
                    type="submit"
                    disabled={evaluating}
                    className={`mt-6 w-full py-2 rounded-xl text-white transition-colors duration-200 ${
                      evaluating ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {evaluating ? 'Evaluating...' : 'Submit Answers'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="mt-3 w-full bg-gray-300 hover:bg-gray-400 text-gray-900 py-2 rounded-xl transition-colors duration-200"
                  >
                    Close
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsList;
