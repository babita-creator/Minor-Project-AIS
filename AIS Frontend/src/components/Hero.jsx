import React from 'react';
import { motion } from 'framer-motion';
import illustrationImage from '/hero1.png'; // Update the path to your image
import { FaSearch, FaCalendarAlt, FaVideo, FaChartLine } from 'react-icons/fa';

const Hero = () => {
  const features = [
    { icon: <FaSearch className="text-blue-500" />, text: 'Smart Job Matching' },
    { icon: <FaCalendarAlt className="text-blue-500" />, text: 'Automated Scheduling' },
    { icon: <FaVideo className="text-blue-500" />, text: 'Video Interviews' },
    { icon: <FaChartLine className="text-blue-500" />, text: 'Performance Analytics' },
  ];

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left space-y-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Revolutionize Your <span className="text-blue-600">Hiring Process</span> With AI
            </h1>
            
            <p className="text-lg text-gray-600">
              Our intelligent platform transforms traditional recruitment with automated interviews, 
              real-time analytics, and seamless candidate matching.
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -3 }}
                  className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm"
                >
                  <div className="text-xl">{feature.icon}</div>
                  <span className="text-gray-700 font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                href="#jobs"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 text-center font-semibold"
              >
                Find Jobs
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                href="#demo"
                className="px-8 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-colors duration-300 text-center font-semibold"
              >
                Watch Demo
              </motion.a>
            </div>
          </motion.div>

          {/* Right Column - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <img
              src={illustrationImage}
              alt="Modern recruitment platform illustration"
              className="w-full max-w-xl mx-auto rounded-xl shadow-xl"
            />
            
            {/* Floating elements (optional) */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -bottom-6 -left-6 bg-white p-3 rounded-lg shadow-md hidden lg:block"
            >
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">85% Success Rate</p>
                  <p className="text-xs text-gray-500">Candidate matches</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;