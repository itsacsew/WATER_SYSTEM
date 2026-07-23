// src/pages/BillHistory.jsx
import React from 'react';
import BillDashboard from '../components/bills/BillDashboard';
import './Pages.css';

const BillHistory = () => {
  return (
    <div className="bill-history-page">
      <BillDashboard />
    </div>
  );
};

export default BillHistory;