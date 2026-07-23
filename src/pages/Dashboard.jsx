// src/pages/Dashboard.jsx
import React from 'react';
import BillDashboard from '../components/bills/BillDashboard';
import './Pages.css';

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <BillDashboard />
    </div>
  );
};

export default Dashboard;