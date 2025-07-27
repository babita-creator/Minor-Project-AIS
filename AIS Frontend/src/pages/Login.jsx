import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, loginCompany } from "../api";
import Cookies from "js-cookie";
import fwu from "/fwu.jpg";

import { FaEnvelope, FaLock, FaUserShield } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError("Passwords do not match!");
    }

    try {
      let response;
      if (role === "company") {
        response = await loginCompany({ email, password });
      } else {
        response = await loginUser({ email, password });
      }

      if (response?.token) {
        Cookies.set("token", response.token, { expires: 7, path: "/" });
        navigate(role === "company" ? "/company-dashboard" : "/user-dashboard");
        window.location.reload();
      } else {
        setError("Login failed: Token missing or invalid.");
      }
    } catch (err) {
      setError(err.message || "Login error occurred.");
    }
  };

  return (
    <div
      className="h-screen w-full bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${fwu})` }}
    >
      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md">
        <h1 className="text-4xl font-extrabold mb-6 text-center text-surface drop-shadow-md">
          Login
        </h1>

        {error && (
          <p className="text-error text-sm text-center mb-4 bg-red-100 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-3 text-secondary" />
            <input
              type="email"
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white/60 backdrop-blur text-text placeholder-muted"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <FaLock className="absolute left-3 top-3 text-secondary" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full pl-10 pr-16 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white/60 backdrop-blur text-text placeholder-muted"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="absolute right-3 top-3 text-sm text-secondary cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <FaLock className="absolute left-3 top-3 text-secondary" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full pl-10 pr-16 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white/60 backdrop-blur text-text placeholder-muted"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span
              className="absolute right-3 top-3 text-sm text-secondary cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </span>
          </div>

          {/* Role Selection */}
          <div className="relative">
            <FaUserShield className="absolute left-3 top-3 text-secondary" />
            <select
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white/60 backdrop-blur text-text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">Login as User</option>
              <option value="company">Login as Company</option>
            </select>
          </div>

          {/* Forgot Password Link */}
          {/* Forgot Password Link */}
<div className="text-center">
  <Link
    to="/forgot-password"
    className="text-sm text-secondary hover:underline font-bold"
  >
    Forgot Password?
  </Link>
</div>


          {/* Submit Button */}
          <button
            type="submit"
            className="bg-primary text-surface py-2 px-4 rounded-lg w-full hover:bg-secondary transition-all font-semibold shadow-lg"
          >
            Login
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-muted">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-secondary hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
