const InterviewSchedule = require('../models/InterviewSchedule');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Job = require('../models/Job');

// Schedule an interview
const scheduleInterview = async (req, res) => {
  const { job_id, scheduled_at, questions } = req.body;

  try {
    const interviewSchedule = new InterviewSchedule({
      job_id,
      scheduled_at,
    });

    await interviewSchedule.save();

    // Create questions for the interview
    for (let question of questions) {
      const newQuestion = new Question({
        schedule_id: interviewSchedule._id,
        question_text: question.text,
        question_type: question.type,
        options: question.options || [],
        correct_answer: question.correct_answer || '',
      });
      await newQuestion.save();
    }

    res.status(201).json(interviewSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get interview details by job ID
const getInterviewByJob = async (req, res) => {
  try {
    const interviewSchedule = await InterviewSchedule.findOne({ job_id: req.params.jobId })
      .populate('questions'); // This will populate the 'questions' field with the full Question documents

    if (!interviewSchedule) {
      return res.status(404).json({ message: 'Interview not found for this job' });
    }

    res.status(200).json(interviewSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Submit an answer to a question
const submitAnswer = async (req, res) => {
  const { question_id, answer_text } = req.body;

  try {
    const answer = new Answer({
      user_id: req.user._id, // The user submitting the answer (retrieved from the cookie)
      question_id,
      answer_text,
    });

    await answer.save();
    res.status(201).json(answer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get questions by schedule ID
const getQuestionsByScheduleId = async (req, res) => {
  try {
    const questions = await Question.find({ schedule_id: req.params.scheduleId });

    if (!questions || questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this schedule' });
    }

    res.status(200).json(questions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Get results for a specific job's interview
const getInterviewResults = async (req, res) => {
  try {
    // Find answers related to the job_id
    const answers = await Answer.find({ job_id: req.params.jobId }).populate('question_id');

    if (!answers || answers.length === 0) {
      return res.status(404).json({ message: 'No answers found for this job interview' });
    }

    res.status(200).json(answers);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { scheduleInterview, getInterviewByJob, submitAnswer, getInterviewResults, getQuestionsByScheduleId };  