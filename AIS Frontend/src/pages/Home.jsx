import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import illustration from '/img1.png';
import SplashScreen from './SplashScreen';
import { jwtDecode} from 'jwt-decode';
import Footer from '../components/Footer';

const Home = () => {
  const navigate = useNavigate();

const handleGetStarted = () => {
  try {
    const cookies = document.cookie;
    const tokenMatch = cookies.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      console.error('No token found');
      navigate('/login');
      return;
    }

    const decoded = jwtDecode(token);
    const role = decoded?.role;

    if (role === 'company') {
      navigate('/company-dashboard');
    } else {
      navigate('/user-dashboard');
    }
  } catch (err) {
    console.error('Error decoding token:', err);
    navigate('/login');
  }
};
 
  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row items-center justify-center px-6 md:px-20 bg-gradient-to-br from-indigo-50 to-white">
        {/* Left Column - Text */}
        <div className="w-full md:w-1/2 text-center md:text-left space-y-6 mb-10 md:mb-0">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-indigo-700"
          >
            Revolutionize Your Hiring with AI Interviews
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-gray-700"
          >
            Say goodbye to manual scheduling, biased decisions, and time-consuming processes.
            Our AI-driven system conducts and analyzes interviews, making hiring faster, smarter, and more fair.
          </motion.p>
           <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleGetStarted}
      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
    >
      Get Started
    </motion.button>
        </div>

        {/* Right Column - Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full md:w-1/2 flex justify-center"
        >
          <img
            src={illustration}
            alt="AI Interview Illustration"
            className="max-w-full h-auto object-contain"
          />
        </motion.div>
      </div>
     <Footer/>
    </>
  );
};

export default Home;
