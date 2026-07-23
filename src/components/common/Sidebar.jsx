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
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      toast.success('Logged out successfully');
      navigate('/login');
    } else {
      toast.error(result.error);
    }
  };

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => isMobile && setIsOpen(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/bills', label: 'Bill History', icon: '📋' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">💧</span>
          <div>
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
            </Link>
          ))}
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {userData?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              {userData?.displayName || 'User'}
            </div>
            <div className="sidebar-user-email">{user?.email}</div>
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