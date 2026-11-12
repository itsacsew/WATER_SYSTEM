// src/components/common/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../firebase/auth';
import toast from 'react-hot-toast';
import './Navbar.css';
import logo from '../../assets/LOGO.png';

const Navbar = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      localStorage.removeItem('autoLoginEmail');
      localStorage.removeItem('autoLoginPassword');
      localStorage.removeItem('rememberMe');
      toast.success('Logged out successfully');
      navigate('/login');
    } else {
      toast.error(result.error);
    }
  };

  const getInitials = () => {
    if (userData?.displayName) {
      return userData.displayName.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Administrator',
      user: 'User',
      staff: 'Staff'
    };
    return roles[role] || 'User';
  };

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  const isAdmin = userData?.role === 'admin';

  let navItems = [];

  if (isAdmin) {
    navItems = [
      { path: '/admin', label: 'Dashboard' },
      { path: '/users', label: 'Users' },
      { path: '/paid', label: 'Paid' },
      { path: '/profile', label: 'Profile' },
    ];
  } else {
    navItems = [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/profile', label: 'Profile' },
    ];
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Brand */}
        <Link
          to={isAdmin ? '/admin' : '/dashboard'}
          className="nav-brand"
          onClick={closeMobileMenu}
        >
          <img
            src={logo}
            alt="Municipality of Liloan Official Seal"
            className="auth-logo-img1"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/180x180?text=LILOAN+SEAL';
            }}
          />
          <div className="nav-brand-text">
            <span className="nav-brand-name">WATERBILL</span>
            <span className="nav-brand-sub">MANAGEMENT SYSTEM</span>
          </div>
        </Link>

        {/* Mobile Toggle */}
        <button className="nav-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
          {isMobileOpen ? '✕' : '☰'}
        </button>

        {/* Navigation Links */}
        <div className={`nav-links ${isMobileOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Section */}
        <div className="nav-user">
          <div className="nav-user-info">
            <div className="nav-avatar-wrapper">
              <div className="nav-avatar">
                {getInitials()}
                <span className="online-dot"></span>
              </div>
            </div>
            <div className="nav-user-details">
              <span className="nav-user-name">
                {userData?.displayName || 'User'}
              </span>
              <span className="nav-user-role">
                {getRoleLabel(userData?.role)}
              </span>
            </div>
          </div>
          <button className="nav-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;