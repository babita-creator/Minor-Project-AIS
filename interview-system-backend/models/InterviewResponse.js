const mongoose = require('mongoose');

const InterviewResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',      // assuming your user model is called 'User'
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  question: { type: String, required: true },
  answer:   { type: String, required: true },
  evaluation: {
    score:    { type: Number, min: 0, max: 10, required: true },
    feedback: { type: String, required: true }
  },
}, { timestamps: true });

module.exports = mongoose.model('InterviewResponse', InterviewResponseSchema);
