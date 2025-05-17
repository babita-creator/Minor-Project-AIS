import React, { useState, useEffect, useReducer } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobDetails } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { saveApplication, getApplication } from '../api/applications';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiCheck, FiAlertCircle, FiThumbsUp, FiAward } from 'react-icons/fi';

// State management reducer
function applicationReducer(state, action) {
  switch (action.type) {
    case 'FETCH_JOB_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_JOB_SUCCESS':
      return { ...state, loading: false, job: action.payload };
    case 'FETCH_JOB_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'GENERATE_QUESTIONS':
      return { 
        ...state, 
        questions: action.payload,
        progress: 100 / (action.payload.length || 1)
      };
    case 'SET_ANSWER':
      return { ...state, currentAnswer: action.payload };
    case 'SUBMIT_ANSWER':
      return {
        ...state,
        answers: [...state.answers, {
          question: state.questions[state.currentIndex],
          answer: state.currentAnswer
        }],
        currentAnswer: '',
        currentIndex: state.currentIndex + 1,
        progress: ((state.currentIndex + 1) * (100 / state.questions.length))
      };
    case 'PREVIOUS_QUESTION':
      return {
        ...state,
        currentIndex: state.currentIndex - 1,
        currentAnswer: state.answers[state.currentIndex - 1]?.answer || ''
      };
    case 'EVALUATION_START':
      return { ...state, isSubmitting: true, error: null };
    case 'EVALUATION_SUCCESS':
      return { 
        ...state, 
        isSubmitting: false, 
        result: action.payload,
        completed: true
      };
    case 'EVALUATION_ERROR':
      return { ...state, isSubmitting: false, error: action.payload };
    case 'RESUME_APPLICATION':
      return {
        ...state,
        currentIndex: action.payload.currentIndex,
        answers: action.payload.answers,
        questions: action.payload.questions,
        progress: action.payload.progress,
        job: action.payload.job
      };
    case 'SAVE_DRAFT_SUCCESS':
      return { ...state, lastSaved: new Date().toISOString() };
    default:
      return state;
  }
}

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.0-flash:generateMessage';

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(applicationReducer, {
    job: null,
    loading: true,
    error: null,
    questions: [],
    currentIndex: 0,
    currentAnswer: '',
    answers: [],
    result: null,
    isSubmitting: false,
    progress: 0,
    completed: false,
    lastSaved: null
  });

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser && state.questions.length > 0 && !state.completed) {
        saveDraft();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser, state.questions, state.answers, state.currentIndex, state.completed]);

  // Load job details and check for existing application
  useEffect(() => {
    const loadApplication = async () => {
      dispatch({ type: 'FETCH_JOB_START' });
      
      try {
        const job = await getJobDetails(jobId);
        dispatch({ type: 'FETCH_JOB_SUCCESS', payload: job });

        if (currentUser) {
          const existingApp = await getApplication(currentUser.uid, jobId);
          if (existingApp) {
            if (existingApp.completed) {
              dispatch({ type: 'EVALUATION_SUCCESS', payload: existingApp.result });
            } else {
              dispatch({ type: 'RESUME_APPLICATION', payload: existingApp });
              return;
            }
          }
        }

        await generateQuestions(job.description);
      } catch (err) {
        dispatch({ type: 'FETCH_JOB_ERROR', payload: err.message || 'Failed to load job details' });
      }
    };

    if (!API_KEY) {
      dispatch({ type: 'FETCH_JOB_ERROR', payload: 'API key not configured' });
      return;
    }

    loadApplication();
  }, [jobId, currentUser]);

  const generateQuestions = async (desc) => {
    try {
      const prompt = `Generate 5-10 relevant interview questions for a ${state.job.title} position.
        Focus on:
        - Role-specific technical questions (30%)
        - Behavioral questions (40%)
        - Situational questions (30%)
        Return ONLY a valid JSON array of questions.`;

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

      dispatch({ type: 'GENERATE_QUESTIONS', payload: parsedQuestions });
    } catch (err) {
      console.error('Question generation error:', err);
      dispatch({ type: 'FETCH_JOB_ERROR', payload: 'Failed to generate questions. Please try again later.' });
    }
  };

  const handleAnswerChange = (e) => {
    dispatch({ type: 'SET_ANSWER', payload: e.target.value });
  };

  const saveDraft = async () => {
    if (!currentUser) return;
    
    try {
      await saveApplication(currentUser.uid, jobId, {
        job: state.job,
        questions: state.questions,
        answers: state.answers,
        currentIndex: state.currentIndex,
        progress: state.progress,
        completed: false
      });
      dispatch({ type: 'SAVE_DRAFT_SUCCESS' });
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  const submitAnswer = async () => {
    if (!state.currentAnswer.trim()) {
      dispatch({ type: 'FETCH_JOB_ERROR', payload: 'Please provide an answer before submitting' });
      return;
    }

    dispatch({ type: 'SUBMIT_ANSWER' });
    
    if (state.currentIndex >= state.questions.length - 1) {
      await evaluateAnswers([...state.answers, {
        question: state.questions[state.currentIndex],
        answer: state.currentAnswer
      }]);
    } else {
      if (currentUser) {
        await saveDraft();
      }
    }
  };

  const evaluateAnswers = async (allAnswers) => {
    dispatch({ type: 'EVALUATION_START' });

    try {
      const content = allAnswers.map((a, i) => 
        `Question ${i+1}: ${a.question}\nAnswer: ${a.answer}`
      ).join('\n\n');

      const prompt = `Evaluate these interview answers for a ${state.job.title} position at ${state.job.company}.
        Consider:
        - Technical accuracy (30%)
        - Communication skills (20%)
        - Problem-solving approach (25%)
        - Cultural fit (25%)
        
        Return ONLY a valid JSON object with:
        - feedback: array of strings (specific feedback for each answer)
        - score: number (1-10 overall rating)
        - recommendation: string (one paragraph summary)
        - strengths: array of strings (3-5 key strengths)
        - areasForImprovement: array of strings (3-5 areas)
        - suggestedResources: array of strings (learning resources)
        
        Answers:
        ${content}`;

      const resp = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
        }),
      });

      if (!resp.ok) throw new Error(`Evaluation failed with status ${resp.status}`);

      const data = await resp.json();
      const resultText = data.candidates?.[0]?.message?.content;
      
      if (!resultText) throw new Error('No evaluation content received');
      
      const result = JSON.parse(resultText);
      
      if (currentUser) {
        await saveApplication(currentUser.uid, jobId, {
          job: state.job,
          questions: state.questions,
          answers: allAnswers,
          currentIndex: state.currentIndex,
          progress: 100,
          completed: true,
          result,
          evaluatedAt: new Date().toISOString()
        });
      }

      dispatch({ type: 'EVALUATION_SUCCESS', payload: result });
    } catch (err) {
      console.error('Evaluation error:', err);
      dispatch({ type: 'EVALUATION_ERROR', payload: 'Failed to evaluate answers. Please try again.' });
    }
  };

  const handlePrevious = () => {
    dispatch({ type: 'PREVIOUS_QUESTION' });
  };

  if (state.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="animate-pulse h-10 bg-gray-200 rounded w-3/4 mx-auto"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-5/6"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
          <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg"
        >
          <div className="text-red-600 mb-6 flex items-start">
            <FiAlertCircle className="mt-1 mr-2 flex-shrink-0" />
            <div>{state.error}</div>
          </div>
          <button
            onClick={() => navigate('/jobs')}
            className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center"
          >
            Back to Jobs
          </button>
        </motion.div>
      </div>
    );
  }

  if (state.result) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">Interview Results</h2>
            <p className="text-indigo-100">{state.job.title} at {state.job.company}</p>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8 mb-12">
              <div className="md:w-1/3">
                <div className="bg-indigo-50 rounded-lg p-6 h-full">
                  <div className="flex flex-col items-center">
                    <div className="relative w-40 h-40 mb-4">
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
                        <span className="text-4xl font-bold text-indigo-600">
                          {state.result.score}/10
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Overall Score</h3>
                    <p className="text-center text-gray-600 mb-4">
                      {state.result.score >= 8 ? 'Excellent!' : 
                       state.result.score >= 6 ? 'Good job!' : 
                       'Keep practicing!'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:w-2/3">
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FiAward className="mr-2 text-indigo-600" />
                    Recommendation
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{state.result.recommendation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <FiThumbsUp className="mr-2 text-green-600" />
                      Strengths
                    </h3>
                    <ul className="space-y-3">
                      {state.result.strengths?.map((strength, i) => (
                        <motion.li 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start bg-green-50 p-3 rounded-lg"
                        >
                          <FiCheck className="mt-1 mr-2 flex-shrink-0 text-green-600" />
                          <span>{strength}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <FiAlertCircle className="mr-2 text-yellow-600" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-3">
                      {state.result.areasForImprovement?.map((area, i) => (
                        <motion.li 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start bg-yellow-50 p-3 rounded-lg"
                        >
                          <span className="text-yellow-600 mr-2">•</span>
                          <span>{area}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 border-b pb-2">
                Detailed Feedback
              </h3>
              <div className="space-y-8">
                {state.answers.map((answer, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-l-4 border-indigo-200 pl-5 py-3"
                  >
                    <h4 className="font-medium text-gray-900 text-lg mb-1">
                      Question {i + 1}: {answer.question}
                    </h4>
                    <p className="text-gray-600 mb-3 bg-gray-50 p-3 rounded">
                      <span className="font-medium">Your answer:</span> {answer.answer}
                    </p>
                    {state.result.feedback?.[i] && (
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-gray-700">
                          <span className="font-medium text-indigo-700">Feedback:</span> {state.result.feedback[i]}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {state.result.suggestedResources && state.result.suggestedResources.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Suggested Learning Resources
                </h3>
                <ul className="space-y-2">
                  {state.result.suggestedResources.map((resource, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-indigo-600 mr-2">•</span>
                      <span>{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between items-center mt-12">
              <button
                onClick={() => navigate(`/jobs/${jobId}`)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition flex items-center"
              >
                <FiChevronLeft className="mr-2" />
                View Job
              </button>
              <button
                onClick={() => navigate('/jobs')}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center"
              >
                Back to Jobs
                <FiChevronRight className="ml-2" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold mb-1">{state.job.title}</h2>
          <p className="text-indigo-100">{state.job.company}</p>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">
                Question {state.currentIndex + 1} of {state.questions.length}
              </span>
              <span className="text-sm font-medium text-indigo-600">
                {Math.round(state.progress)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              ></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-6">
                {state.questions[state.currentIndex]}
              </h3>
              <textarea
                value={state.currentAnswer}
                onChange={handleAnswerChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                placeholder="Type your answer here..."
                autoFocus
              />
            </motion.div>
          </AnimatePresence>

          {state.error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 text-red-600 text-sm flex items-start"
            >
              <FiAlertCircle className="mt-0.5 mr-2 flex-shrink-0" />
              <span>{state.error}</span>
            </motion.div>
          )}

          <div className="flex justify-between items-center">
            <div>
              {state.currentIndex > 0 && (
                <button
                  onClick={handlePrevious}
                  disabled={state.isSubmitting}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center"
                >
                  <FiChevronLeft className="mr-1" />
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {currentUser && state.lastSaved && (
                <span className="text-sm text-gray-500 hidden md:block">
                  Last saved: {new Date(state.lastSaved).toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={submitAnswer}
                disabled={state.isSubmitting}
                className={`px-6 py-3 rounded-lg text-white ${state.isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} flex items-center transition`}
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
                  <>
                    Next Question
                    <FiChevronRight className="ml-1" />
                  </>
                ) : (
                  'Submit Answers'
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JobApplication;