// src/components/common/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../firebase/auth';
import toast from 'react-hot-toast';
import './Navbar.css';

const Navbar = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      
      navigate('/login');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#14652B"/>
            <path d="M20 8L28 14V26L20 32L12 26V14L20 8Z" stroke="white" strokeWidth="2"/>
            <path d="M20 15V25M15 20H25" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>WaterBill</span>
        </Link>

        <div className="nav-menu">
          {user ? (
            <>
              
              <div className="nav-user">
                <span className="user-name">WELCOME, {userData?.displayName || user.email}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link register-link">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;