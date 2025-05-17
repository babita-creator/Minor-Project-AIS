import React, { useEffect, useState } from 'react';

const InterviewResponsesList = ({ initialJobId = '' }) => {
  const [responses, setResponses] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawResponse, setRawResponse] = useState('');
  const [filters, setFilters] = useState({
    companyName: '',
    jobId: initialJobId,
    scoreMin: '',
    scoreMax: ''
  });

  useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);
      setError('');
      setRawResponse('');
      try {
        const params = new URLSearchParams();
        if (filters.jobId) params.append('jobId', filters.jobId);
        if (filters.companyName) params.append('companyName', filters.companyName);
        if (filters.scoreMin) params.append('scoreMin', filters.scoreMin);
        if (filters.scoreMax) params.append('scoreMax', filters.scoreMax);

        const url = `http://localhost:5000/api/interview-responses?${params.toString()}`;

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const text = await res.text();
        setRawResponse(text);

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const data = JSON.parse(text);
        setResponses(data);

        const companies = [...new Set(data.map(resp => resp.company?.name).filter(Boolean))];
        setAllCompanies(companies);
      } catch (err) {
        setError(err.message || 'Failed to fetch interview responses');
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [filters, initialJobId]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      companyName: '',
      jobId: initialJobId,
      scoreMin: '',
      scoreMax: ''
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-blue-700 text-lg font-semibold">Loading interview responses...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-red-100 border border-red-400 rounded-lg shadow-md">
      <h4 className="text-xl font-bold text-red-700 mb-2">Error loading responses</h4>
      <p className="text-red-600">{error}</p>
      {rawResponse && (
        <details className="mt-4 bg-red-50 p-4 rounded-md">
          <summary className="cursor-pointer font-semibold text-red-700">Server response</summary>
          <pre className="whitespace-pre-wrap mt-2 text-sm text-red-800">{rawResponse}</pre>
        </details>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-800">Interview Responses</h2>

      {/* Filters */}
      <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-10">
        <h5 className="text-xl font-semibold mb-5 text-gray-700">Filters</h5>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div>
            <label htmlFor="companyFilter" className="block mb-2 font-medium text-gray-700">Company</label>
            <select
              id="companyFilter"
              name="companyName"
              value={filters.companyName}
              onChange={handleFilterChange}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Companies</option>
              {allCompanies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="jobIdFilter" className="block mb-2 font-medium text-gray-700">Job ID</label>
            <input
              type="text"
              id="jobIdFilter"
              name="jobId"
              value={filters.jobId}
              onChange={handleFilterChange}
              placeholder="Filter by Job ID"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="scoreMinFilter" className="block mb-2 font-medium text-gray-700">Min Score</label>
            <input
              type="number"
              id="scoreMinFilter"
              name="scoreMin"
              min="0"
              max="10"
              value={filters.scoreMin}
              onChange={handleFilterChange}
              placeholder="0"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="scoreMaxFilter" className="block mb-2 font-medium text-gray-700">Max Score</label>
            <input
              type="number"
              id="scoreMaxFilter"
              name="scoreMax"
              min="0"
              max="10"
              value={filters.scoreMax}
              onChange={handleFilterChange}
              placeholder="10"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-white border border-gray-400 rounded px-4 py-2 font-semibold text-gray-700 hover:bg-gray-200 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Responses List */}
      {responses.length === 0 ? (
        <div className="text-center text-gray-600 text-lg font-medium bg-blue-50 py-8 rounded-lg">
          No interview responses found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {responses.map((resp) => (
            <div key={resp._id} className="bg-white shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition p-6 flex flex-col justify-between">
              <div>
                <h5 className="text-xl font-semibold text-gray-800 mb-1">
                  {resp.job?.title || 'Untitled Position'}
                </h5>
                <div className="flex flex-col mb-3">
                  <span className="text-gray-500">{resp.company?.name || 'Unknown Company'}</span>
                  {resp.user && (
                    <span className="text-gray-400 text-sm">
                      Submitted by: {resp.user.name} ({resp.user.email})
                    </span>
                  )}
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="inline-block bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                    Score: {resp.evaluation?.score ?? 'N/A'}/10
                  </span>
                  {resp.evaluation?.recommendation && (
                    <span className="inline-block bg-green-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                      {resp.evaluation.recommendation}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <h6 className="font-bold text-gray-700 mb-1">Question:</h6>
                  <p className="text-gray-800">{resp.question}</p>
                </div>

                <div className="mb-4">
                  <h6 className="font-bold text-gray-700 mb-1">Answer:</h6>
                  <p className="text-gray-800">{resp.answer}</p>
                </div>

                {resp.evaluation?.feedback && (
                  <div className="mb-4">
                    <h6 className="font-bold text-gray-700 mb-1">Feedback:</h6>
                    <p className="text-gray-800">{resp.evaluation.feedback}</p>
                  </div>
                )}
              </div>
              <div className="text-gray-500 text-sm mt-4 border-t pt-3">
                Submitted on {new Date(resp.createdAt).toLocaleDateString()} at{' '}
                {new Date(resp.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewResponsesList;
