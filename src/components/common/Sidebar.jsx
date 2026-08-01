// src/components/common/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../firebase/auth';
import toast from 'react-hot-toast';
import './Sidebar.css';

const Sidebar = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  // src/components/common/Navbar.jsx (update handleLogout)
const handleLogout = async () => {
  const result = await logoutUser();
  if (result.success) {
    // Clear saved credentials
    localStorage.removeItem('autoLoginEmail');
    localStorage.removeItem('autoLoginPassword');
    localStorage.removeItem('rememberMe');
    toast.success('Logged out successfully 👋');
    navigate('/login');
  } else {
    toast.error(result.error);
  }
};

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
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

  // Navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/bills', label: 'Bill History', icon: '📋' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  // Guest navigation items
  const guestItems = [
    { path: '/login', label: 'Login', icon: '🔐' },
    { path: '/register', label: 'Register', icon: '📝' },
  ];

  // Guest sidebar
  if (!user) {
    return (
      <>
        <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
          ☰
        </button>
        <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
          <div className="sidebar-glass"></div>
          
          <div className="sidebar-brand">
            <span className="sidebar-brand-icon">💧</span>
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-name">WaterBill</div>
              <div className="sidebar-brand-sub">Management System</div>
            </div>
          </div>
          
          <div className="sidebar-nav">
            <div className="sidebar-nav-label">Navigation</div>
            {guestItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
          
          <div className="sidebar-divider"></div>
          
          <div className="sidebar-user">
            <div className="sidebar-user-avatar-wrapper">
              <div className="sidebar-user-avatar">
                ?
              </div>
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Guest</div>
              <div className="sidebar-user-email">Not signed in</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Authenticated sidebar
  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
        ☰
      </button>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-glass"></div>
        
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">💧</span>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">WaterBill</div>
            <div className="sidebar-brand-sub">Management System</div>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-nav-label">Main Menu</div>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
              {item.path === '/bills' && (
                <span className="sidebar-link-badge">NEW</span>
              )}
            </Link>
          ))}
        </div>

        <div className="sidebar-divider"></div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar-wrapper">
            <div className="sidebar-user-avatar">
              {getInitials()}
              <span className="online-dot"></span>
            </div>
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {userData?.displayName || 'User'}
            </div>
            <div className="sidebar-user-email">{user?.email}</div>
            <div className="sidebar-user-role">
              {getRoleLabel(userData?.role)}
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;