import React, { useState, useEffect } from 'react';
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
    expiresInDays: '30', // Default to 30 days
    jobType: 'full-time' // Added job type field
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setJobData({
        title: '',
        description: '',
        location: '',
        salary: '',
        expiresInDays: '30',
        jobType: 'full-time'
      });
      setError(null);
      setSuccess(null);
      setTouched({});
    }
  }, [isModalOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJobData((prevData) => ({ ...prevData, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!jobData.title.trim()) errors.title = 'Job title is required';
    if (!jobData.description.trim()) errors.description = 'Description is required';
    if (!jobData.location.trim()) errors.location = 'Location is required';
    if (!jobData.salary || Number(jobData.salary) <= 0) errors.salary = 'Valid salary is required';
    if (!jobData.expiresInDays || Number(jobData.expiresInDays) <= 0) {
      errors.expiresInDays = 'Valid expiration days is required';
    }
    
    return Object.keys(errors).length === 0 ? null : errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formErrors = validateForm();
    if (formErrors) {
      setError(formErrors);
      setLoading(false);
      return;
    }

    try {
      const token = getCookie('token');
      if (!token) {
        setError({ form: 'Authentication token is missing. Please log in again.' });
        setLoading(false);
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...jobData,
          salary: Number(jobData.salary),
          expiresInDays: Number(jobData.expiresInDays),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError({ form: data.message || 'Failed to create job' });
        return;
      }

      setSuccess('Job created successfully!');
      setTimeout(() => {
        setIsModalOpen(false);
        navigate('/company-dashboard');
      }, 1500);
    } catch (err) {
      setError({ form: err.message || 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const jobTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'remote', label: 'Remote' },
  ];

  const hasError = (field) => touched[field] && error?.[field];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-5 rounded-full shadow-2xl hover:bg-blue-700 transition-all z-40 flex items-center justify-center group"
        aria-label="Create new job"
      >
        <FiPlus className="text-2xl group-hover:rotate-90 transition-transform" />
        <span className="ml-2 font-medium hidden sm:inline-block">Post Job</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative bg-white w-full max-w-2xl p-6 sm:p-8 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition p-1 rounded-full hover:bg-gray-100"
              aria-label="Close modal"
            >
              <FiX className="text-2xl" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Create Job Posting</h2>
              <p className="text-gray-600 mt-2">Fill in the details to post a new job opportunity</p>
            </div>

            {error?.form && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-center font-medium">
                {error.form}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-center font-medium">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Job Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiBriefcase className="mr-2 text-gray-500" />
                  Job Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={jobData.title}
                  onChange={handleChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                  required
                  className={`w-full p-3 border ${hasError('title') ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  placeholder="e.g. Senior Frontend Developer"
                />
                {hasError('title') && <p className="mt-1 text-sm text-red-600">{error.title}</p>}
              </div>

              {/* Job Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="5"
                  value={jobData.description}
                  onChange={handleChange}
                  onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                  required
                  className={`w-full p-3 border ${hasError('description') ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  placeholder="Describe the job responsibilities, requirements, etc."
                />
                {hasError('description') && <p className="mt-1 text-sm text-red-600">{error.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FiMapPin className="mr-2 text-gray-500" />
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={jobData.location}
                    onChange={handleChange}
                    onBlur={() => setTouched((prev) => ({ ...prev, location: true }))}
                    required
                    className={`w-full p-3 border ${hasError('location') ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                    placeholder="e.g. Kathmandu, Nepal"
                  />
                  {hasError('location') && <p className="mt-1 text-sm text-red-600">{error.location}</p>}
                </div>

                {/* Job Type */}
                <div>
                  <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type
                  </label>
                  <select
                    id="jobType"
                    name="jobType"
                    value={jobData.jobType}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {jobTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Salary */}
                <div>
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FiDollarSign className="mr-2 text-gray-500" />
                    Salary (NPR)
                  </label>
                  <input
                    type="number"
                    id="salary"
                    name="salary"
                    min="0"
                    value={jobData.salary}
                    onChange={handleChange}
                    onBlur={() => setTouched((prev) => ({ ...prev, salary: true }))}
                    required
                    className={`w-full p-3 border ${hasError('salary') ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                    placeholder="e.g. 50000"
                  />
                  {hasError('salary') && <p className="mt-1 text-sm text-red-600">{error.salary}</p>}
                </div>

                {/* Expires In */}
                <div>
                  <label htmlFor="expiresInDays" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FiCalendar className="mr-2 text-gray-500" />
                    Expires In (Days)
                  </label>
                  <input
                    type="number"
                    id="expiresInDays"
                    name="expiresInDays"
                    min="1"
                    value={jobData.expiresInDays}
                    onChange={handleChange}
                    onBlur={() => setTouched((prev) => ({ ...prev, expiresInDays: true }))}
                    required
                    className={`w-full p-3 border ${hasError('expiresInDays') ? 'border-red-300' : 'border-gray-300'} rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  />
                  {hasError('expiresInDays') && <p className="mt-1 text-sm text-red-600">{error.expiresInDays}</p>}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 shadow-md flex items-center justify-center ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Post Job Now'
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