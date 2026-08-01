// src/components/auth/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { loginUser, resetPassword } from '../../firebase/auth';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

import logo from '../../assets/logo.png';

const schema = yup.object().shape({
  email: yup.string().required('Email is required').email('Invalid email'),
  password: yup.string().required('Password is required')
});

const Login = () => {
  const { user, loading } = useAuth();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true';
  });
  const navigate = useNavigate();
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Auto-fill saved credentials if remember me is checked
    const savedEmail = localStorage.getItem('autoLoginEmail');
    const savedPassword = localStorage.getItem('autoLoginPassword');
    const remember = localStorage.getItem('rememberMe') === 'true';
    
    if (remember && savedEmail) {
      setValue('email', savedEmail);
      setValue('password', savedPassword || '');
      setRememberMe(true);
    }

    const elements = document.querySelectorAll('.fade-in-down, .fade-in-up, .fade-in-scale');
    elements.forEach((el, index) => {
      el.style.animationDelay = `${0.08 * (index + 1)}s`;
    });
  }, [setValue]);

  const onSubmit = async (data) => {
    setLoadingSubmit(true);
    const result = await loginUser(data.email, data.password);
    if (result.success) {
      toast.success('Welcome back! 👋');
      
      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem('autoLoginEmail', data.email);
        localStorage.setItem('autoLoginPassword', data.password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('autoLoginEmail');
        localStorage.removeItem('autoLoginPassword');
        localStorage.removeItem('rememberMe');
      }
      
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    setLoadingSubmit(false);
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error('Please enter your email');
      return;
    }
    setLoadingSubmit(true);
    const result = await resetPassword(resetEmail);
    if (result.success) {
      toast.success('Reset link sent to your email 📧');
      setShowReset(false);
      setResetEmail('');
    } else {
      toast.error(result.error);
    }
    setLoadingSubmit(false);
  };

  const generateBubbles = () => {
    const bubbles = [];
    for (let i = 0; i < 12; i++) {
      const size = 8 + Math.random() * 24;
      const left = 5 + Math.random() * 90;
      const duration = 12 + Math.random() * 18;
      const delay = Math.random() * 20;
      const drift = (Math.random() - 0.5) * 60;
      bubbles.push(
        <div
          key={i}
          className="water-bubble"
          style={{
            width: size,
            height: size,
            left: `${left}%`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            '--drift': `${drift}px`
          }}
        />
      );
    }
    return bubbles;
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#F8F3E1'
      }}>
        <div className="spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(55, 53, 62, 0.08)',
          borderTopColor: '#37353E',
          borderRadius: '50%',
          animation: 'spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite'
        }}></div>
        <p style={{ marginTop: '16px', color: '#44444E', fontFamily: 'Inter, sans-serif' }}>
          Checking session...
        </p>
      </div>
    );
  }

  // If user is logged in, don't render login form (will redirect via useEffect)
  if (user) {
    return null;
  }

  return (
    <div className="auth-layout">
      
      {/* LEFT PANEL */}
      <div className="auth-left-panel">
        <div className="bubbles-field">{generateBubbles()}</div>

        <div className="wave-wrap">
          <svg className="wave-svg wave-back" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0,40 C200,10 400,70 600,40 C800,10 1000,70 1200,40 L1200,100 L0,100 Z" />
          </svg>
          <svg className="wave-svg wave-front" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0,60 C200,30 400,90 600,60 C800,30 1000,90 1200,60 L1200,100 L0,100 Z" />
          </svg>
        </div>
        
        <div className="auth-left-top fade-in-down delay-1">
          <div className="auth-brand-line">
            <span className="line"></span>
            <span className="auth-brand-icon">💧</span>
            <span className="line"></span>
          </div>
          <h1>WATERBILL</h1>
          <h2>Management System</h2>
        </div>

        <div className="auth-left-middle fade-in-scale delay-2">
          <div className="logo-ripple-wrap">
            <div className="auth-logo-container live-logo">
              <img 
                src={logo} 
                alt="Municipality of Liloan Official Seal" 
                className="live-logo-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/240x240?text=LILOAN+SEAL';
                }}
              />
            </div>
            <div className="logo-ripple-ring ring-1"></div>
            <div className="logo-ripple-ring ring-2"></div>
            <div className="logo-ripple-ring ring-3"></div>
          </div>
        </div>

        <div className="auth-left-bottom fade-in-up delay-3">
          <p className="auth-powered-by">
            Powered by <strong>MTO LILOAN</strong>
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right-panel">
        <div className="auth-right-header fade-in-down delay-1">
          <span>
            Don't have an account? <Link to="/register">Sign up</Link>
          </span>
        </div>
        
        <div className="auth-right-content">
          <h2 className="fade-in-down delay-2">Welcome Back</h2>
          <p className="fade-in-down delay-3">Sign in to access your water billing dashboard.</p>

          <form className="auth-form-remote" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group-remote fade-in-up delay-3">
              <label>Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="name@company.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email.message}</span>}
            </div>

            <div className="form-group-remote fade-in-up delay-4">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password.message}</span>}
            </div>

            {/* REMEMBER ME CHECKBOX */}
            <div className="form-group-remote fade-in-up delay-4" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#37353E', cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>
                🔒 Remember me (auto-login next time)
              </label>
            </div>

            <div className="forgot-row fade-in-up delay-4">
              <button
                type="button"
                className="forgot-link-btn"
                onClick={() => setShowReset(true)}
              >
                Forgot password?
              </button>
            </div>

            <button 
              type="submit" 
              className="auth-submit-btn fade-in-up delay-5" 
              disabled={loadingSubmit}
            >
              {loadingSubmit ? (
                <>
                  <span className="btn-spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer-remote fade-in-up delay-5">
            <p>
              By signing in, you agree to our{' '}
              <a href="#">Terms of Service</a> and{' '}
              <a href="#">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showReset && (
        <div className="modal-overlay">
          <div className="modal-content modal-pop">
            <div className="modal-header-3d">
              <h3>🔐 Reset Password</h3>
              <button className="close-btn-3d" onClick={() => setShowReset(false)}>×</button>
            </div>
            <p>Enter your email to receive a password reset link</p>
            <input
              type="email"
              className="modal-input"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              autoFocus
            />
            <div className="modal-actions">
              <button
                onClick={handleResetPassword}
                className="modal-btn primary"
                disabled={loadingSubmit}
              >
                {loadingSubmit ? '⏳ Sending...' : '📧 Send Link'}
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="modal-btn secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;