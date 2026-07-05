// src/components/auth/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { registerUser } from '../../firebase/auth';
import './Auth.css';

const schema = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().required('Email is required').email('Invalid email'),
  password: yup.string().required('Password required').min(6, 'Minimum 6 characters'),
  confirmPassword: yup.string()
    .required('Confirm password')
    .oneOf([yup.ref('password')], 'Passwords must match')
});

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await registerUser(data.email, data.password, data.fullName);
    if (result.success) {
      toast.success('Account created! Welcome!');
      navigate('/dashboard');
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
          <h2>Create Account</h2>
          <p>Sign up to manage your water bills</p>
        </div>

        <div className="auth-divider">
          <span>Or</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              {...register('fullName')}
              type="text"
              placeholder="Enter your full name"
              className={errors.fullName ? 'error' : ''}
            />
            {errors.fullName && <span className="error-message">{errors.fullName.message}</span>}
          </div>

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
              placeholder="Create a password"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Confirm your password"
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword.message}</span>}
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;