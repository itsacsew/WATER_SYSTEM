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
      
      <BillDashboard />
    </div>
  );
};

export default Dashboard;