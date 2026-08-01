// src/components/auth/Register.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { registerUser } from '../../firebase/auth';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

import logo from '../../assets/logo.png';

const schema = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().required('Email is required').email('Invalid email'),
  password: yup.string()
    .required('Password is required')
    .min(14, 'Password must be at least 14 characters')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: yup.string()
    .required('Confirm password')
    .oneOf([yup.ref('password')], 'Passwords must match')
});

const Register = () => {
  const { user, loading } = useAuth();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const watchPassword = watch('password', '');

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    setPassword(watchPassword || '');
  }, [watchPassword]);

  useEffect(() => {
    const elements = document.querySelectorAll('.fade-in-down, .fade-in-up, .fade-in-scale');
    elements.forEach((el, index) => {
      el.style.animationDelay = `${0.08 * (index + 1)}s`;
    });
  }, []);

  const onSubmit = async (data) => {
    setLoadingSubmit(true);
    const result = await registerUser(data.email, data.password, data.fullName);
    if (result.success) {
      toast.success('Account created successfully! 🎉');
      
      // Auto-login: Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem('autoLoginEmail', data.email);
        localStorage.setItem('autoLoginPassword', data.password);
        localStorage.setItem('rememberMe', 'true');
      }
      
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    setLoadingSubmit(false);
  };

  const checkRequirement = (regex) => {
    return regex.test(password);
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
          Loading...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.05); }
            100% { transform: rotate(360deg) scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // If user is logged in, don't render register form (will redirect via useEffect)
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
            Already have an account? <Link to="/login">Log in</Link>
          </span>
        </div>
        
        <div className="auth-right-content">
          <h2 className="fade-in-down delay-2">Create Account</h2>
          <p className="fade-in-down delay-3">Join the WaterBill management system today.</p>

          <form className="auth-form-remote" onSubmit={handleSubmit(onSubmit)}>
            {/* TWO-COLUMN LAYOUT START */}
            <div className="auth-form-grid">
              {/* LEFT COLUMN */}
              <div className="auth-form-col">
                {/* Full Name */}
                <div className="form-group-remote fade-in-up delay-3">
                  <label>Full Name</label>
                  <input
                    {...register('fullName')}
                    type="text"
                    placeholder="Enter your full name"
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName.message}</span>}
                </div>

                {/* Email Address */}
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
              </div>

              {/* RIGHT COLUMN */}
              <div className="auth-form-col">
                {/* Password */}
                <div className="form-group-remote fade-in-up delay-4">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      className={errors.password ? 'error' : ''}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
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
                  
                  <div className={`password-requirements ${isPasswordFocused || password.length > 0 ? 'visible' : ''}`}>
                    <div className={`requirement ${checkRequirement(/[a-z]/) ? 'met' : ''}`}>
                      <span className="dot"></span>
                      Lowercase characters
                    </div>
                    <div className={`requirement ${checkRequirement(/[A-Z]/) ? 'met' : ''}`}>
                      <span className="dot"></span>
                      Uppercase characters
                    </div>
                    <div className={`requirement ${checkRequirement(/[0-9]/) ? 'met' : ''}`}>
                      <span className="dot"></span>
                      Numbers
                    </div>
                    <div className={`requirement ${password.length >= 14 ? 'met' : ''}`}>
                      <span className="dot"></span>
                      14 characters minimum
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="form-group-remote fade-in-up delay-4">
                  <label>Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword.message}</span>}
                </div>
              </div>
            </div>
            {/* TWO-COLUMN LAYOUT END */}

            {/* REMEMBER ME CHECKBOX */}
            <div className="form-group-remote fade-in-up delay-5" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="rememberMeRegister"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#37353E', cursor: 'pointer' }}
              />
              <label htmlFor="rememberMeRegister" style={{ cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>
                🔒 Stay logged in (auto-login next time)
              </label>
            </div>

            <button type="submit" className="auth-submit-btn fade-in-up delay-5" disabled={loadingSubmit}>
              {loadingSubmit ? (
                <>
                  <span className="btn-spinner"></span>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer-remote fade-in-up delay-5">
            <p>
              By signing up, you agree to our{' '}
              <a href="#">Privacy Policy</a> and{' '}
              <a href="#">Terms of Service</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;