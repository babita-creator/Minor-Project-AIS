import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiX } from 'react-icons/fi';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

const CreateJobForm = () => {
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    location: '',
    salary: '',
    expiresInDays: '',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJobData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = getCookie('token');
      if (!token) {
        setError('Authentication token is missing.');
        setLoading(false);
        return;
      }

      const API_URL = 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...jobData,
          salary: Number(jobData.salary),
          expiresInDays: Number(jobData.expiresInDays),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to create job');
        return;
      }

      navigate('/company-dashboard');
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating open button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition z-40"
      >
        <FiPlus className="text-3xl" />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="relative bg-white w-full max-w-2xl p-8 rounded-2xl shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition"
            >
              <FiX className="text-4xl" />
            </button>

            <h2 className="text-4xl font-bold mb-6 text-center text-gray-900">Create Job</h2>

            {error && (
              <p className="text-red-700 mb-4 bg-red-100 p-3 rounded-lg text-center font-medium">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { id: 'title', label: 'Job Title', type: 'text' },
                { id: 'description', label: 'Job Description', type: 'textarea' },
                { id: 'location', label: 'Job Location', type: 'text' },
                { id: 'salary', label: 'Salary (NPR)', type: 'number' },
                { id: 'expiresInDays', label: 'Expires In (Days)', type: 'number', min: 1 },
              ].map(({ id, label, type, min }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  {type === 'textarea' ? (
                    <textarea
                      id={id}
                      name={id}
                      rows="4"
                      value={jobData[id]}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <input
                      type={type}
                      id={id}
                      name={id}
                      min={min}
                      value={jobData[id]}
                      onChange={handleChange}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition duration-300 shadow-md ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Creating Job...' : 'Create Job'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateJobForm;
