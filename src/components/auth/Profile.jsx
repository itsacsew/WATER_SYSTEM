// src/components/auth/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateUserData } from '../../firebase/auth';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    preferences: {
      theme: userData?.preferences?.theme || 'light',
      notifications: userData?.preferences?.notifications ?? true
    }
  });

  useEffect(() => {
    const elements = document.querySelectorAll('.profile-fade-in');
    elements.forEach((el, index) => {
      el.style.animationDelay = `${0.1 * (index + 1)}s`;
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await updateUserData(user.uid, formData);
    
    if (result.success) {
      toast.success('Profile updated successfully! ✨');
      setIsEditing(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const getInitials = () => {
    const name = userData?.displayName || user?.email || 'User';
    return name.charAt(0).toUpperCase();
  };

  const getRoleBadge = (role) => {
    const roles = {
      admin: { label: 'Administrator', class: 'role-admin' },
      user: { label: 'User', class: 'role-user' },
      staff: { label: 'Staff', class: 'role-staff' }
    };
    return roles[role] || roles.user;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return new Date(timestamp).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const role = getRoleBadge(userData?.role || 'user');

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header profile-fade-in">
          <div className="profile-header-content">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {getInitials()}
              </div>
              <div className="profile-status-dot"></div>
            </div>
            <div className="profile-header-info">
              <h2>{userData?.displayName || 'User'}</h2>
              <p className="profile-email">{user?.email}</p>
              <span className={`profile-role-badge ${role.class}`}>
                {role.label}
              </span>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="profile-edit-btn"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Content */}
        <div className="profile-body">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form profile-fade-in">
              <div className="profile-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="profile-input"
                />
              </div>

              <div className="profile-form-group">
                <label>Theme Preference</label>
                <select
                  name="preferences.theme"
                  value={formData.preferences.theme}
                  onChange={handleChange}
                  className="profile-input"
                >
                  <option value="light">☀️ Light</option>
                  <option value="dark">🌙 Dark</option>
                </select>
              </div>

              <div className="profile-form-group checkbox-group">
                <input
                  type="checkbox"
                  name="preferences.notifications"
                  checked={formData.preferences.notifications}
                  onChange={handleChange}
                  id="notifications"
                />
                <label htmlFor="notifications">🔔 Enable notifications</label>
              </div>

              <div className="profile-form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="profile-save-btn"
                >
                  {loading ? (
                    <>
                      <span className="btn-spinner-small"></span>
                      Saving...
                    </>
                  ) : (
                    '💾 Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      displayName: userData?.displayName || '',
                      preferences: {
                        theme: userData?.preferences?.theme || 'light',
                        notifications: userData?.preferences?.notifications ?? true
                      }
                    });
                  }}
                  className="profile-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details profile-fade-in">
              <div className="profile-details-grid">
                <div className="profile-detail-item">
                  <span className="profile-detail-label">📧 Email</span>
                  <span className="profile-detail-value">{user?.email}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">📅 Member Since</span>
                  <span className="profile-detail-value">{formatDate(userData?.createdAt)}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">🛡️ Role</span>
                  <span className={`profile-detail-role-badge ${role.class}`}>
                    {role.label}
                  </span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">🎨 Theme</span>
                  <span className="profile-detail-value">
                    {formData.preferences.theme === 'light' ? '☀️ Light' : '🌙 Dark'}
                  </span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">🔔 Notifications</span>
                  <span className="profile-detail-value">
                    {formData.preferences.notifications ? '✅ Enabled' : '❌ Disabled'}
                  </span>
                </div>
                {userData?.lastLogin && (
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">🕐 Last Login</span>
                    <span className="profile-detail-value">{formatDate(userData.lastLogin)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;