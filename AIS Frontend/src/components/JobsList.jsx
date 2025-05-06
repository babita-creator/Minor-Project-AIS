import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getAllJobs, getCompanyDetails, deleteJob } from '../api/index'; // Ensure deleteJob is imported
import Cookies from 'js-cookie';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [companyDetailsMap, setCompanyDetailsMap] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await getAllJobs();
        if (Array.isArray(response)) {
          setJobs(response);
        } else {
          setError('Failed to load jobs.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded?.role || '');
        setUserId(decoded?.id || '');
      } catch (err) {
        console.error('Invalid token', err);
      }
    }
  }, []);

  const fetchCompanyDetails = async (companyId) => {
    if (!companyId || companyDetailsMap[companyId]) return;

    try {
      const response = await getCompanyDetails(companyId);
      if (!response) {
        setCompanyDetailsMap((prev) => ({
          ...prev,
          [companyId]: { name: 'Company not found', email: 'N/A' },
        }));
      } else {
        setCompanyDetailsMap((prev) => ({
          ...prev,
          [companyId]: response,
        }));
      }
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn(`Company not found: ${companyId}`);
        setCompanyDetailsMap((prev) => ({
          ...prev,
          [companyId]: { name: 'Company not found', email: 'N/A' },
        }));
      } else {
        console.error(`Error fetching company ${companyId}:`, err);
        setCompanyDetailsMap((prev) => ({
          ...prev,
          [companyId]: { name: 'Error fetching details', email: 'N/A' },
        }));
      }
    }
  };

  useEffect(() => {
    jobs.forEach((job) => {
      if (job.company && !companyDetailsMap[job.company]) {
        fetchCompanyDetails(job.company);
      }
    });
  }, [jobs, companyDetailsMap]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleScheduleNow = (jobId, createdBy) => {
    if (userRole !== 'company' || userId !== createdBy) {
      setErrorMessage("You haven't created this job, so you cannot schedule an interview.");
      return;
    }
    Cookies.set('jobid', jobId);
    navigate('/schedule_interview');
  };

  const handleApplyNow = (jobId) => {
    Cookies.set('jobid', jobId);
    navigate(`/interview-questions/${jobId}`);
  };

  const handleDeleteJob = async (jobId, createdBy) => {
    if (userRole !== 'company' || userId !== createdBy) {
      console.warn('Unauthorized delete attempt');
      setErrorMessage("You can't delete this job because you didn’t create it.");
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this job?');
    if (!confirmed) return;

    try {
      console.log(`Attempting to delete job: ${jobId}`);
      await deleteJob(jobId);
      console.log('Job deleted successfully');

      // Remove job from UI
      setJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));
    } catch (err) {
      console.error('Error deleting job:', err);
      setErrorMessage('Failed to delete the job. Please try again.');
    }
  };

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-gray-700 p-4">Loading jobs...</div>;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  return (
    <div className="p-4 md:p-8 min-h-screen pt-6 pb-12" style={{ backgroundColor: '#eef2ff' }}>
      <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-6 sticky top-20 m-10 z-10 bg-white p-4 rounded-xl shadow-md border border-gray-200">
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
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          {filteredJobs.map((job) => {
            const company = companyDetailsMap[job.company];
            const isOwner = userRole === 'company' && userId === job.createdBy;
            return (
              <div
                key={job._id}
                className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-indigo-700">{job.title}</h3>
                  <span className="text-sm text-gray-500">{job.location}</span>
                </div>

                <p className="text-gray-700 text-sm mb-3">{job.description}</p>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  {company && (
                    <>
                      <p><span className="font-medium text-gray-800">Company Name:</span> {company.name}</p>
                      <p><span className="font-medium text-gray-800">Company Email:</span> {company.email}</p>
                    </>
                  )}
                  <p>💰 <span className="font-medium text-gray-800">Salary:</span> NPR {job.salary}</p>
                  {job.expiresAt && (
                    <p>📅 <span className="font-medium text-gray-800">Expires On:</span>{' '}
                      {new Date(job.expiresAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>

                {userRole === 'company' && userId === job.createdBy && (
                  <>
                    <button
                      onClick={() => handleScheduleNow(job._id, job.createdBy)}
                      className={`w-full mb-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl transition-colors duration-200 ${!isOwner && 'cursor-not-allowed opacity-50'}`}
                      disabled={!isOwner}
                    >
                      {isOwner ? 'Schedule Now' : 'You didn’t create this job'}
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job._id, job.createdBy)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition-colors duration-200"
                    >
                      Delete Job
                    </button>
                  </>
                )}

                {userRole !== 'company' && (
                  <button
                    onClick={() => handleApplyNow(job._id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl transition-colors duration-200"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JobsList;
