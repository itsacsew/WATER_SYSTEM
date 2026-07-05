// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { loginUser, resetPassword } from '../../firebase/auth';
import './Auth.css';

const schema = yup.object().shape({
  email: yup.string().required('Email is required').email('Invalid email'),
  password: yup.string().required('Password is required')
});

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await loginUser(data.email, data.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleResetPassword = async (email) => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    const result = await resetPassword(email);
    if (result.success) {
      toast.success('Reset link sent to your email');
      setShowReset(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon">💧</span>
          <span className="brand-name">WaterBill</span>
        </div>

        <div className="auth-header">
          <h2>Hello Again</h2>
          <p>Welcome back, you've been missed</p>
        </div>

        <div className="auth-divider">
          <span>Or</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="name@example.com"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Your password"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password.message}</span>}
          </div>

          <div className="form-options">
            <button 
              type="button" 
              className="forgot-link"
              onClick={() => setShowReset(true)}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>

      {showReset && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reset Password</h3>
            <p>Enter your email to receive a password reset link</p>
            <input
              type="email"
              id="resetEmail"
              placeholder="Enter your email"
              className="modal-input"
            />
            <div className="modal-actions">
              <button 
                onClick={() => {
                  const email = document.getElementById('resetEmail').value;
                  handleResetPassword(email);
                }}
                className="modal-btn primary"
              >
                Send Link
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