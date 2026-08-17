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
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required')
});

// ========== HARDCODED SVG ICONS ==========

const WaterPumpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={28} height={28} color={"#ffffff"} fill={"none"}>
    <path d="M12.5 5.5H10.5C9.55719 5.5 9.08579 5.5 8.79289 5.79289C8.5 6.08579 8.5 6.55719 8.5 7.5V9.5C8.5 10.4428 8.5 10.9142 8.79289 11.2071C9.08579 11.5 9.55719 11.5 10.5 11.5H12.5C13.4428 11.5 13.9142 11.5 14.2071 11.2071C14.5 10.9142 14.5 10.4428 14.5 9.5V7.5C14.5 6.55719 14.5 6.08579 14.2071 5.79289C13.9142 5.5 13.4428 5.5 12.5 5.5Z" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round"></path>
    <path d="M13 11.5H10V21.5H13V11.5Z" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M7.5 21.5H15.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M14.5 7H18.5C20.1569 7 21.5 8.34315 21.5 10V12.5H18.5V10H14.5V7Z" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round"></path>
    <path d="M14.5 2.5H9.09949C7.83781 2.5 7.20696 2.5 6.70992 2.82302C6.21288 3.14603 5.95667 3.7225 5.44425 4.87545L2.5 11.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M20 15.5L20.5582 14.9991C20.4159 14.8406 20.213 14.75 20 14.75C19.787 14.75 19.5841 14.8406 19.4418 14.9991L20 15.5ZM20.75 18C20.75 18.4142 20.4142 18.75 20 18.75V20.25C21.2426 20.25 22.25 19.2426 22.25 18H20.75ZM20 18.75C19.5858 18.75 19.25 18.4142 19.25 18H17.75C17.75 19.2426 18.7574 20.25 20 20.25V18.75ZM19.25 18C19.25 18.003 19.2507 17.969 19.2771 17.8886C19.3022 17.8119 19.343 17.7162 19.4012 17.6031C19.5182 17.3759 19.6824 17.1227 19.8589 16.8772C20.0335 16.6345 20.2097 16.4137 20.3431 16.2528C20.4094 16.1727 20.4644 16.1084 20.5023 16.0646C20.5212 16.0428 20.5358 16.0262 20.5454 16.0153C20.5502 16.0099 20.5537 16.0059 20.5559 16.0035C20.557 16.0023 20.5577 16.0015 20.5581 16.001C20.5583 16.0008 20.5584 16.0007 20.5584 16.0007C20.5584 16.0007 20.5584 16.0007 20.5584 16.0007C20.5584 16.0007 20.5583 16.0008 20.5583 16.0008C20.5583 16.0008 20.5582 16.0009 20 15.5C19.4418 14.9991 19.4417 14.9992 19.4417 14.9992C19.4416 14.9993 19.4415 14.9994 19.4415 14.9994C19.4414 14.9996 19.4412 14.9997 19.441 14.9999C19.4407 15.0003 19.4403 15.0008 19.4397 15.0014C19.4387 15.0026 19.4373 15.0042 19.4355 15.0061C19.432 15.0101 19.4271 15.0156 19.4209 15.0226C19.4085 15.0367 19.3909 15.0568 19.3688 15.0822C19.3246 15.1332 19.2625 15.2059 19.1882 15.2955C19.0403 15.4739 18.8415 15.7228 18.6411 16.0015C18.4426 16.2774 18.2318 16.5975 18.0675 16.9166C17.9157 17.2115 17.75 17.6053 17.75 18H19.25ZM20 15.5C19.4418 16.0009 19.4417 16.0008 19.4417 16.0008C19.4417 16.0008 19.4416 16.0007 19.4416 16.0007C19.4416 16.0007 19.4416 16.0007 19.4416 16.0007C19.4416 16.0007 19.4417 16.0008 19.4419 16.001C19.4423 16.0015 19.443 16.0023 19.4441 16.0035C19.4463 16.0059 19.4498 16.0099 19.4546 16.0153C19.4642 16.0262 19.4788 16.0428 19.4977 16.0646C19.5356 16.1084 19.5906 16.1727 19.6569 16.2528C19.7903 16.4137 19.9665 16.6345 20.1411 16.8772C20.3176 17.1227 20.4818 17.3759 20.5988 17.6031C20.657 17.7162 20.6978 17.8119 20.7229 17.8886C20.7493 17.969 20.75 18.003 20.75 18H22.25C22.25 17.6053 22.0843 17.2115 21.9325 16.9166C21.7682 16.5975 21.5574 16.2774 21.3589 16.0015C21.1585 15.7228 20.9597 15.4739 20.8118 15.2955C20.7375 15.2059 20.6754 15.1332 20.6312 15.0822C20.6091 15.0568 20.5915 15.0367 20.5791 15.0226C20.5729 15.0156 20.568 15.0101 20.5645 15.0061C20.5627 15.0042 20.5613 15.0026 20.5603 15.0014C20.5597 15.0008 20.5593 15.0003 20.559 14.9999C20.5588 14.9997 20.5586 14.9996 20.5585 14.9994C20.5585 14.9994 20.5584 14.9993 20.5583 14.9992C20.5583 14.9992 20.5582 14.9991 20 15.5Z" fill="#ffffff"></path>
    <path d="M11.5 2.5V5.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#a0aec0"} fill={"none"}>
    <path d="M2 8C2 8 6.47715 3 12 3C17.5228 3 22 8 22 8" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round"></path>
    <path d="M21.544 13.045C21.848 13.4713 22 13.6845 22 14C22 14.3155 21.848 14.5287 21.544 14.955C20.1779 16.8706 16.6892 21 12 21C7.31078 21 3.8221 16.8706 2.45604 14.955C2.15201 14.5287 2 14.3155 2 14C2 13.6845 2.15201 13.4713 2.45604 13.045C3.8221 11.1294 7.31078 7 12 7C16.6892 7 20.1779 11.1294 21.544 13.045Z" stroke="#a0aec0" strokeWidth="1.5"></path>
    <path d="M15 14C15 12.3431 13.6569 11 12 11C10.3431 11 9 12.3431 9 14C9 15.6569 10.3431 17 12 17C13.6569 17 15 15.6569 15 14Z" stroke="#a0aec0" strokeWidth="1.5"></path>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#a0aec0"} fill={"none"}>
    <path d="M6.43385 6.51953C4.22009 7.89049 2.93281 9.86457 2.31858 11.0339C2.10621 11.4382 2.00003 11.6403 2 12.0082C1.99997 12.3761 2.10584 12.5777 2.3176 12.981C3.32862 14.9066 6.16702 19.0195 11.9669 19.0195C14.2454 19.0195 16.0669 18.3848 17.5 17.4972" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M9.87868 9.87868C9.33579 10.4216 9 11.1716 9 12C9 13.6569 10.3431 15 12 15C12.8284 15 13.5784 14.6642 14.1213 14.1213" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round"></path>
    <path d="M2 2L22 22" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M10 5.14847C10.5934 5.05255 11.224 5 11.8936 5C17.7747 5 20.6528 9.05385 21.6779 10.9517C21.8927 11.3492 22 11.548 22 11.9106C22 12.2733 21.8921 12.4727 21.6765 12.8717C21.3678 13.4428 20.8916 14.2085 20.2167 15" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

// ========== LOGIN COMPONENT ==========

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

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('autoLoginEmail');
    const savedPassword = localStorage.getItem('autoLoginPassword');
    const remember = localStorage.getItem('rememberMe') === 'true';
    
    if (remember && savedEmail) {
      setValue('username', savedEmail);
      setValue('password', savedPassword || '');
      setRememberMe(true);
    }
  }, [setValue]);

  const onSubmit = async (data) => {
    setLoadingSubmit(true);
    const result = await loginUser(data.username, data.password);
    if (result.success) {
      toast.success('Welcome back! 👋');
      
      if (rememberMe) {
        localStorage.setItem('autoLoginEmail', data.username);
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

  if (loading) {
    return (
      <div className="auth-loader">
        <div className="spinner"></div>
        <p>Checking session...</p>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="auth-container">
      {/* Main Card */}
      <div className="auth-card">
        {/* Left Side - Gradient Panel */}
        <div className="auth-card-left">
          <div className="auth-card-left-content">
            <div className="auth-brand">
              
              <h1>WATERBILL</h1>
              <h2>Management System</h2>
            </div>

            <div className="auth-center-text">
              <div className="auth-logo-container">
                <img 
                  src={logo} 
                  alt="Municipality of Liloan Official Seal" 
                  className="auth-logo-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/180x180?text=LILOAN+SEAL';
                  }}
                />
              </div>
            </div>

            <div className="auth-bottom-text">
              <p className="auth-office">Municipality of Liloan, Southern Leyte</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-card-right">
          <div className="auth-form-container">
            <div className="auth-form-header">
              <h2>SIGN IN</h2>
              <p>Enter your credentials to access your account.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label>Username</label>
                <input
                  {...register('username')}
                  type="text"
                  placeholder="Enter your username"
                  className={errors.username ? 'error' : ''}
                />
                {errors.username && <span className="error-message">{errors.username.message}</span>}
              </div>

              <div className="form-group">
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
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password.message}</span>}
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loadingSubmit}>
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

            <div className="auth-form-footer">
              <p>
                Don't have an account? <Link to="/register">Sign up</Link>
              </p>
              <p className="auth-help-text">
                Trouble signing in? Contact your system administrator.
              </p>
            </div>
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