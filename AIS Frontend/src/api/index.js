import Cookies from "js-cookie";  // Import js-cookie
import axios from 'axios';

const API_URL = "http://localhost:5000/api";

// Helper function for handling fetch requests and errors
const fetchData = async (url, options = {}) => {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const data = await response.json();
    console.error("Error response:", data);  // Log error response
    throw new Error(data.message || "An error occurred");
  }

  const data = await response.json();
  // console.log(`Response from ${url}:`, data);  // Log successful response
  return data;
};

// Register APIs
export const registerUser = async (userData) => {
  return await fetchData(`${API_URL}/auth/register/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
};

export const registerCompany = async (companyData) => {
  return await fetchData(`${API_URL}/auth/register/company`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(companyData),
  });
};

// Login APIs
export const loginUser = async (credentials) => {
  const response = await fetchData(`${API_URL}/auth/login/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  Cookies.set("token", response.token, { expires: 7, path: "/" });

  return response;
};

export const loginCompany = async (credentials) => {
  const response = await fetchData(`${API_URL}/auth/login/company`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (response.token) {
    Cookies.set("token", response.token, { expires: 7, path: "/" });
    console.log("Token stored in cookies:", response.token); // Log token for debugging
    
  }

  return response;
};


// Example of creating and exporting the createJob function in /src/api/index.js

export const createJob = async (jobData) => {
  const token = Cookies.get("token");  // Get token from cookies
  console.log("Token from cookies:", token);  // Log token for debugging

  if (!token) {
    console.error("No authentication token found");
    throw new Error("No authentication token found");
  }

  try {
    const response = await fetch(`${API_URL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,  // Pass the token in the Authorization header
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error("Failed to create job:", data); // Log failure data
      throw new Error(data.message || "Failed to create job");
    }

    const data = await response.json();
    console.log("Job created successfully:", data);  // Log successful job creation
    return data;

  } catch (error) {
    console.error("Error occurred while creating job:", error);
    throw new Error(error.message || "Something went wrong while creating the job.");
  }
};

export const deleteJob = async (jobId) => {
  try {
    // Proceed with the delete request without checking the user's role
    const response = await axios.delete(`${API_URL}/jobs/${jobId}`);
    return response.data;

  } catch (error) {
    // Handle error, e.g., display an error message to the user
    throw new Error(error.message || 'Error deleting job');
  }
};

// Get all jobs using the token stored in cookies
export const getAllJobs = async () => {
  const token = Cookies.get("token");
  if (!token) {
    console.error("No authentication token found");
    throw new Error("No authentication token found");
  }

  const response = await fetchData(`${API_URL}/jobs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`, // Authorization header with token
    },
    credentials: 'include',
  });

  return response;
};

// Submit answers for an interview
export const submitAnswers = async (answersData) => {
  const token = Cookies.get("token");
  if (!token) {
    console.error("No authentication token found");
    throw new Error("No authentication token found");
  }

  const response = await fetchData(`${API_URL}/interviews/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify(answersData),
  });

  return response;
};

export const getInterviewQuestions = async (jobId) => {
  const token = Cookies.get("token");
  const res = await fetch(`${API_URL}/interviews/questions/${jobId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error("Failed to fetch interview questions");
  }

  return await res.json();
};

// Fetch company details by companyId
export const getCompanyDetails = async (companyId) => {
  const token = Cookies.get("token"); // Get token from cookies
  if (!token) {
    console.error("No authentication token found");
    throw new Error("No authentication token found");
  }

  try {
    const response = await fetch(`${API_URL}/auth/company/${companyId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // Pass the token in the Authorization header
      },
    });

    if (!response.ok) {
      const data = await response.json();
      console.error("Failed to fetch company details:", data);
      throw new Error(data.message || "Failed to fetch company details");
    }

    const data = await response.json();
    // console.log("Company details fetched successfully:", data);
    return data;

  } catch (error) {
    console.error("Error occurred while fetching company details:", error);
  }
};


export { API_URL };
