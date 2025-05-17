import { FaFacebook, FaTwitter, FaLinkedin, FaGithub, FaEnvelope, FaPhone } from 'react-icons/fa';
import { IoMdMail } from 'react-icons/io';
import { RiCustomerService2Fill } from 'react-icons/ri';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const companyInfo = [
    { icon: <FaEnvelope className="mr-2" />, text: 'support@interviewsystem.com' },
    { icon: <FaPhone className="mr-2" />, text: '+1 (555) 123-4567' },
    { icon: <RiCustomerService2Fill className="mr-2" />, text: '24/7 Customer Support' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span className="ml-2 text-2xl font-bold text-white">InterviewSystem</span>
            </div>
            <p className="text-sm">
              Revolutionizing the hiring process with AI-powered interviews that connect top talent with leading companies worldwide.
            </p>
            <div className="flex space-x-4 pt-2">
              {[
                { icon: <FaFacebook size={18} />, url: 'https://facebook.com' },
                { icon: <FaTwitter size={18} />, url: 'https://twitter.com' },
                { icon: <FaLinkedin size={18} />, url: 'https://linkedin.com' },
                { icon: <FaGithub size={18} />, url: 'https://github.com' },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-300"
                  aria-label={social.url.split('//')[1].split('.')[0]}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.path}
                    className="text-gray-400 hover:text-white transition-colors duration-300 text-sm flex items-center"
                  >
                    <span className="w-1 h-1 bg-gray-500 rounded-full mr-2"></span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              {companyInfo.map((info, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-400 mt-0.5">{info.icon}</span>
                  <span className="text-gray-400 text-sm ml-1">{info.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to our newsletter for the latest updates and job postings.
            </p>
            <form className="flex flex-col space-y-3">
              <input
                type="email"
                placeholder="Your email address"
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors duration-300 text-sm font-medium"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} InterviewSystem. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="/privacy" className="text-gray-500 hover:text-gray-300 text-sm">
              Privacy Policy
            </a>
            <a href="/terms" className="text-gray-500 hover:text-gray-300 text-sm">
              Terms of Service
            </a>
            <a href="/cookies" className="text-gray-500 hover:text-gray-300 text-sm">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;