import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiX, FiDollarSign, FiMapPin, FiCalendar, FiBriefcase } from 'react-icons/fi';

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
    setJobData((prev) => ({ ...prev, [name]: value }));
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
      {/* Floating action button */}
      <button
        onClick={() => setIsModalOpen(true)}
        aria-label="Open Create Job Modal"
        className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-5 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 z-50"
      >
        <FiPlus size={28} className="transform transition-transform group-hover:rotate-90" />
        <span className="sr-only">Create Job</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          aria-modal="true"
          role="dialog"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        >
          <div className="relative bg-white w-full max-w-2xl p-8 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              aria-label="Close Create Job Modal"
              className="absolute top-6 right-6 text-gray-500 hover:text-red-500 focus:outline-none transition-colors duration-200"
            >
              <FiX size={28} />
            </button>

            <div className="text-center mb-8">
              <h2
                id="modal-title"
                className="text-3xl font-bold text-gray-800 mb-2"
              >
                Create New Job Posting
              </h2>
              <p className="text-gray-500">Fill in the details to list your job opportunity</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Job Title */}
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Job Title
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiBriefcase className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={jobData.title}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                </div>

                {/* Job Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Job Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={jobData.description}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Describe the job responsibilities, requirements, etc."
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={jobData.location}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="e.g. Kathmandu, Nepal"
                    />
                  </div>
                </div>

                {/* Salary and Expiry Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Salary */}
                  <div className="space-y-2">
                    <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                      Salary (NPR)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiDollarSign className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="salary"
                        name="salary"
                        value={jobData.salary}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="e.g. 50000"
                      />
                    </div>
                  </div>

                  {/* Expires In */}
                  <div className="space-y-2">
                    <label htmlFor="expiresInDays" className="block text-sm font-medium text-gray-700">
                      Expires In (Days)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiCalendar className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="expiresInDays"
                        name="expiresInDays"
                        min="1"
                        value={jobData.expiresInDays}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="e.g. 30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md transition-all duration-300 ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Job...
                    </span>
                  ) : (
                    'Create Job Posting'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateJobForm;