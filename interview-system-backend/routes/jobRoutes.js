const express = require('express');
const router = express.Router();

const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');

const { protect, isCompany } = require('../middlewares/authMiddleware');
const Job = require('../models/Job'); // Assuming you have a Job model

// Create a job
router.post('/', protect, isCompany, createJob);

// Get all jobs
router.get('/', getJobs);

// Get job by ID
router.get('/:id', getJobById);

// Update job
router.put('/:id', protect, isCompany, updateJob);

// Delete job (only the creator can delete)
router.delete('/:id', deleteJob);  // Use the deleteJob function from the controller

module.exports = router;
