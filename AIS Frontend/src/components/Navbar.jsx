  import { Link, useLocation, useNavigate } from "react-router-dom";
  import Cookies from "js-cookie";
  import { jwtDecode } from "jwt-decode";
  import {
    FaHome,
    FaSignInAlt,
    FaUserAlt,
    FaUserTie,
    FaSignOutAlt,
  } from "react-icons/fa";

  const Navbar = () => {
    const location = useLocation();

    const token = Cookies.get("token");
    let role = null;
    let userName = null;

    if (token) {
      try {
        const decoded = jwtDecode(token);
        role = decoded?.role;
        
        userName = decoded?.name || decoded?.username;
        // console.log("Decoded token:", decoded);
        // console.log("Role:", role);
        // console.log("User Name:", userName);
        
        
      } catch (err) {
        console.error("Invalid token", err);
      }
  }

  const handleLogout = () => {
    Cookies.remove("token");
    window.location.reload(); // Refresh the page on logout
  };

  const isActive = (path) =>
    location.pathname === path ? "text-primary underline" : "";

  return (
    <nav className="bg-surface shadow-md px-6 py-3 flex justify-between items-center fixed w-full top-0 left-0 z-50 h-16">
      {/* Brand Logo */}
      <div className="text-xl font-bold text-primary flex items-center space-x-2">
        <FaHome size={26} />
        <span>InterviewSystem</span>
      </div>

{/* Right-Aligned Nav Links with Increased Height */}
<div className="flex items-center space-x-6 ml-auto h-16 py-4 px-5">
  <Link
    to="/"
    className={`text-muted hover:text-primary transition-all ${isActive("/")}`}
  >
    <FaHome size={24} />
  </Link>

  {token && role === "company" && (
    <Link
      to="/company-dashboard"
      className={`text-muted hover:text-primary transition-all ${isActive("/company-dashboard")}`}
    >
      <FaUserTie size={24} />
    </Link>
  )}

  {!token && (
    <>
      <Link
        to="/login"
        className={`text-muted hover:text-primary transition-all ${isActive("/login")}`}
      >
        <FaSignInAlt size={24} />
      </Link>
      <Link
        to="/register"
        className={`text-muted hover:text-primary transition-all ${isActive("/register")}`}
      >
        <FaUserAlt size={24} />
      </Link>
    </>
  )}

  {token && role === "user" && (
    <Link
      to="/user-dashboard"
      className={`text-muted hover:text-primary transition-all ${isActive("/user-dashboard")}`}
    >
      <FaUserAlt size={24} />
    </Link>
  )}

  {token && role === "admin" && (
    <Link
      to="/company-dashboard"
      className={`text-muted hover:text-primary transition-all ${isActive("/company-dashboard")}`}
    >
      <FaUserTie size={24} />
    </Link>
  )}
</div>


      {/* Right Side User Info + Logout */}
      {token && (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-text font-medium">Hi, {userName}</span>
          <button
            onClick={handleLogout}
            className="text-error hover:text-error-dark transition-all"
            title="Logout"
          >
            <FaSignOutAlt size={20} />
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
