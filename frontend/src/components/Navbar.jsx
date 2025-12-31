import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          Video App
        </Link>
        {isAuthenticated ? (
          <div className="navbar-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/videos">Videos</Link>
            {(user?.role === 'editor' || user?.role === 'admin') && (
              <Link to="/upload">Upload</Link>
            )}
            <div className="navbar-user">
              <div className="user-info">
                <span>{user?.username}</span>
                <span className="user-role">{user?.role}</span>
              </div>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

