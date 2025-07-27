import os
import streamlit as st
from dotenv import load_dotenv
import fitz  # PyMuPDF
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai
import speech_recognition as sr

# Load environment variables
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    st.error("GOOGLE_API_KEY is not set in the environment variables.")
    st.stop()

# Configure Gemini API
genai.configure(api_key=api_key)

# Initialize LangChain LLM
try:
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
except Exception as e:
    st.error(f"Failed to initialize language model: {e}")
    st.stop()

# Initialize session state variables
if 'questions' not in st.session_state:
    st.session_state['questions'] = []
    st.session_state['current_question'] = 0
    st.session_state['responses'] = []
    st.session_state['feedback'] = []
    st.session_state['quit'] = False

def extract_text_from_pdf(uploaded_file):
    try:
        doc = fitz.open(stream=uploaded_file.read(), filetype="pdf")
        return "\n".join(page.get_text() for page in doc)
    except Exception as e:
        st.error(f"Error reading PDF: {e}")
        return ""

# Prompt templates
question_prompt = PromptTemplate(
    input_variables=["job_title", "resume", "job_desc", "past_responses"],
    template="""
You are an AI interviewer conducting a behavioral mock interview for the position of {job_title}.
The candidate's resume is as follows:
{resume}

Job description:
{job_desc}

Here are the candidate's previous answers:
{past_responses}

Now, ask the next behavioral interview question (1 question only). Start with an introduction question if this is the first.
"""
)
question_chain = question_prompt | llm

feedback_prompt = PromptTemplate(
    input_variables=["question", "answer"],
    template="""
You are an expert interview coach. Given the following interview question and candidate's answer, provide constructive feedback focusing on clarity, relevance, depth, and communication.

Question: {question}
Answer: {answer}

Feedback:
"""
)
feedback_chain = feedback_prompt | llm

# UI
st.title("🧠 AI-Powered Mock Interview")
st.write("Start with an introduction and answer behavioral questions one by one.")

job_title = st.text_input("Enter the job title:")
resume_option = st.radio("How would you like to provide your resume?", ["Paste Text", "Upload PDF"])

resume_text = ""
if resume_option == "Paste Text":
    resume_text = st.text_area("Paste your resume text here:")
else:
    uploaded_file = st.file_uploader("Upload your resume (PDF)", type="pdf")
    if uploaded_file:
        resume_text = extract_text_from_pdf(uploaded_file)

include_job_desc = st.checkbox("Add a job description?")
job_desc = st.text_area("Paste the job description:") if include_job_desc else "Not provided"

if st.button("Start Mock Interview"):
    if not job_title.strip() or not resume_text.strip():
        st.warning("Please provide both the job title and your resume.")
    else:
        st.session_state['questions'] = []
        st.session_state['responses'] = []
        st.session_state['feedback'] = []
        st.session_state['current_question'] = 0
        st.session_state['quit'] = False
        try:
            output = question_chain.invoke({
                "job_title": job_title,
                "resume": resume_text,
                "job_desc": job_desc,
                "past_responses": ""
            })
            st.session_state['questions'].append(output.content.strip())
            st.rerun()
        except Exception as e:
            st.error(f"Error generating question: {e}")
            st.stop()

if not st.session_state.get('quit', False) and st.session_state['questions']:
    idx = st.session_state['current_question']
    if idx < len(st.session_state['questions']):
        question = st.session_state['questions'][idx]
        st.subheader(f"Question {idx + 1}:")
        st.markdown(question)

        answer_key = f"response_{idx}"
        voice_key = f"voice_response_{idx}"

        if answer_key not in st.session_state:
            st.session_state[answer_key] = ""

        if st.button("Record Answer"):
            recognizer = sr.Recognizer()
            try:
                with sr.Microphone() as source:
                    st.info("Listening... Please speak now.")
                    audio = recognizer.listen(source)
                    st.info("Processing audio...")
                    try:
                        transcription = recognizer.recognize_google(audio)
                        st.session_state[voice_key] = transcription
                        st.session_state[answer_key] = transcription
                        st.success("Audio transcribed! You can edit your answer now.")
                        st.rerun()
                    except sr.UnknownValueError:
                        st.error("Could not understand audio.")
                    except sr.RequestError as e:
                        st.error(f"Speech Recognition API error: {e}")
            except Exception as e:
                st.error(f"Microphone access error: {e}")

        user_response = st.text_area(
            "Your answer (you can type or edit the transcribed text):",
            value=st.session_state[answer_key],
            key=answer_key
        )

        if st.button("Submit Response"):
            final_response = st.session_state[answer_key].strip()
            if final_response.lower() in ["quit", "exit"]:
                st.session_state['quit'] = True
            elif final_response:
                st.session_state['responses'].append(final_response)
                try:
                    feedback = feedback_chain.invoke({
                        "question": question,
                        "answer": final_response
                    })
                    st.session_state['feedback'].append(feedback.content.strip())
                except Exception as e:
                    st.session_state['feedback'].append("Feedback generation failed.")
                    st.error(f"Error generating feedback: {e}")

                past_responses = "\n\n".join([
                    f"Q{i+1}: {st.session_state['questions'][i]}\nA{i+1}: {st.session_state['responses'][i]}"
                    for i in range(len(st.session_state['responses']))
                ])
                try:
                    next_question = question_chain.invoke({
                        "job_title": job_title,
                        "resume": resume_text,
                        "job_desc": job_desc,
                        "past_responses": past_responses
                    })
                    st.session_state['questions'].append(next_question.content.strip())
                    st.session_state['current_question'] += 1
                except Exception as e:
                    st.error(f"Error generating next question: {e}")
                    st.session_state['quit'] = True
            st.rerun()

if st.session_state.get('quit', False) or (
    st.session_state['questions'] and st.session_state['current_question'] >= len(st.session_state['questions'])
):
    st.success("✅ Mock interview completed!")
    for i, (q, a, f) in enumerate(zip(
        st.session_state['questions'], st.session_state['responses'], st.session_state['feedback']), 1):
        st.markdown(f"**Q{i}:** {q}")
        st.markdown(f"**A{i}:** {a}")
        st.markdown(f"**Feedback {i}:** {f}")

    full_log = "\n\n".join([
        f"Q{i}: {q}\nA{i}: {a}\nFeedback: {f}"
        for i, (q, a, f) in enumerate(zip(
            st.session_state['questions'],
            st.session_state['responses'],
            st.session_state['feedback']), 1)
    ])
    st.download_button("Download Full Report", full_log, file_name="interview_behavioral_log.txt")

if st.button("End Interview Early"):
    st.session_state['quit'] = True
    st.rerun()     
