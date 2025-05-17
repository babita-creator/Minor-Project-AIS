const express = require('express');
const router = express.Router();
const interviewResponseController = require('../controllers/interviewResponseController');

// POST /api/interview-responses
router.post('/', interviewResponseController.saveInterviewResponse);
router.get('/', interviewResponseController.getInterviewResponses);

module.exports = router;
