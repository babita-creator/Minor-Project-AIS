import React from 'react'
import CreateJobForm from '../components/CreateJobForm.jsx'
import JobsList from '../components/JobsList.jsx'
import ScheduleInterviewForm from './ScheduleInterviewForm.jsx'
import InterviewResponsesList from '../components/InterviewResponsesList.jsx'

function AdminDashboard() {
  return (
    <>
    <div>Company Dashboard</div>
    <CreateJobForm />
    <JobsList/>
    <InterviewResponsesList/>
    </>
    
  )
}

export default AdminDashboard