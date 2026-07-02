// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Pages.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>💧 Water Bill Management</h1>
        <p>Track, manage, and pay your water bills effortlessly</p>
        
        {!user ? (
          <div className="cta-buttons">
            <Link to="/login" className="btn-primary">Login</Link>
            <Link to="/register" className="btn-secondary">Get Started</Link>
          </div>
        ) : (
          <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
        )}
      </div>

      <div className="features-section">
        <div className="feature">
          <div className="feature-icon">📊</div>
          <h3>Track Bills</h3>
          <p>View all your water bills in one place</p>
        </div>
        <div className="feature">
          <div className="feature-icon">💳</div>
          <h3>Manage Payments</h3>
          <p>Mark bills as paid and track your spending</p>
        </div>
        <div className="feature">
          <div className="feature-icon">📈</div>
          <h3>View Statistics</h3>
          <p>See your bill history and payment trends</p>
        </div>
      </div>
    </div>
  );
};

export default Home;