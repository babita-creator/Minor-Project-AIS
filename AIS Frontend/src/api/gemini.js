export const generateQuestions = async (jobDescription) => {
  const apiKey = 'AIzaSyBnB_CoT7Bm4NT0_tOQTJ_JgH2_OKAxoKA';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const prompt = `
Create 10 interview questions for this job description. Return only the questions as a JSON array of strings.

Job Description:
${jobDescription}
    `.trim();

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error('No questions returned by Gemini API');

    // Remove markdown code block wrappers if present
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/^```/, '').replace(/```$/, '').trim();
    }

    // Parse JSON array from cleaned text
    const questions = JSON.parse(text);
    return questions;

  } catch (error) {
    console.error('[gemini] Error generating questions:', error);
    throw error;
  }
};

export const evaluateAnswer = async (question, answer) => {
  const apiKey = 'AIzaSyBnB_CoT7Bm4NT0_tOQTJ_JgH2_OKAxoKA';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const prompt = `
Evaluate this answer to the interview question.

Question:
${question}

Answer:
${answer}

Provide a concise evaluation of the answer's quality, highlighting strengths or areas for improvement. Also, give a numeric score out of 10 for the answer quality.

Return ONLY a short text feedback in this format:
"Score: X/10. Feedback: <your feedback>"
    `.trim();

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) throw new Error('No feedback returned by Gemini API');

    // Remove markdown code block wrappers if present
    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```/, '').replace(/```$/, '').trim();
    }

    return text;

  } catch (error) {
    console.error('[gemini] Error evaluating answer:', error);
    return 'Error evaluating this answer.';
  }
};
