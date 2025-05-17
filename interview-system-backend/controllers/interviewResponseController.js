const jwt = require('jsonwebtoken');
const InterviewResponse = require('../models/InterviewResponse');
const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User'); // make sure you have this

// JWT secret from your env
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

// --- Save an interview response (with user from cookie token) ---
exports.saveInterviewResponse = async (req, res) => {
  try {
    console.log('Cookies:', req.cookies);
    const token = req.cookies?.token;
    if (!token) {
      console.log('❌ No token in cookies');
      return res.status(401).json({ error: 'Unauthorized: No token found' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Decoded token:', decoded);
    } catch (err) {
      console.log('❌ Token invalid:', err.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const userId = decoded._id || decoded.id;
    console.log('➡️ UserID:', userId);
    if (!userId) {
      console.log('❌ No userId in token payload');
      return res.status(401).json({ error: 'Unauthorized: User ID not found in token' });
    }

    const { jobId, question, answer, evaluation } = req.body;
    console.log('📝 Request body:', req.body);

    if (!jobId || !question || !answer || !evaluation || evaluation.score == null || !evaluation.feedback) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: jobId, question, answer, evaluation.score, evaluation.feedback' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      console.log('❌ Job not found:', jobId);
      return res.status(404).json({ error: 'Job not found' });
    }

    const interviewResponse = new InterviewResponse({
      user: userId,
      job: job._id,
      company: job.company,
      question,
      answer,
      evaluation,
    });

    const saved = await interviewResponse.save();
    console.log('💾 Saved response raw:', saved.toObject());
    return res.status(201).json(saved);
  } catch (err) {
    console.error('🔥 Error in saveInterviewResponse:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// --- Get interview responses with full populate + logging ---
exports.getInterviewResponses = async (req, res) => {
  try {
    const { jobId, companyName, scoreMin, scoreMax } = req.query;
    const filter = {};

    if (jobId) filter.job = jobId;

    if (companyName) {
      const companies = await Company.find({
        name: { $regex: companyName, $options: 'i' }
      }).select('_id');
      if (companies.length === 0) {
        console.log('🔍 No companies match:', companyName);
        return res.status(200).json([]);
      }
      filter.company = { $in: companies.map(c => c._id) };
    }

    if (scoreMin != null || scoreMax != null) {
      filter['evaluation.score'] = {};
      if (scoreMin != null) filter['evaluation.score'].$gte = Number(scoreMin);
      if (scoreMax != null) filter['evaluation.score'].$lte = Number(scoreMax);
    }

    // Fetch and populate everything
    let responses = await InterviewResponse.find(filter)
      .populate('user', 'name email')
      .populate('job', 'title description location')
      .populate('company', 'name email');

    console.log('📦 Raw responses from DB:', responses.map(r => r.toObject()));
    // Now send them
    return res.status(200).json(responses);
  } catch (err) {
    console.error('🔥 Error in getInterviewResponses:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
