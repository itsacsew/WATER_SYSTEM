// src/pages/Dashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../firebase/auth';
import toast from 'react-hot-toast';
import BillDashboard from '../components/bills/BillDashboard';
import './Pages.css';

const Dashboard = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      toast.success('Logged out successfully');
      navigate('/login');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-topbar">
        <div className="dashboard-user">
          <div className="user-avatar-3d">
            {userData?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="user-greeting">
            Hello, <span>{userData?.displayName || 'User'}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-top-btn">
          Logout
        </button>
      </div>
      <BillDashboard />
    </div>
  );
};

export default Dashboard;