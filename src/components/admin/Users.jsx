// src/components/admin/Users.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminStyles.css';
import './Users.css';

// ============================================================
// HARD-CODED SVG ICONS
// ============================================================

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"}>
    <circle cx="12" cy="7" r="4" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14C7 14 4 16.5 4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19C20 16.5 17 14 12 14Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"}>
    <circle cx="12" cy="7" r="4" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14C7 14 4 16.5 4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19C20 16.5 17 14 12 14Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.5 10.5L19.5 13L24 8" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UserXIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"}>
    <circle cx="12" cy="7" r="4" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14C7 14 4 16.5 4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19C20 16.5 17 14 12 14Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 16L17.5 18.5M17.5 18.5L20 21M17.5 18.5L20 16M17.5 18.5L15 21" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={16} height={16} color={"#194752"} fill={"none"}>
    <path d="M15.5 2V6M7.5 2V6" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.3985 8C20.2706 6.69989 19.9816 5.82475 19.3284 5.17157C18.1569 4 16.2712 4 12.5 4H10.5C6.72876 4 4.84315 4 3.67157 5.17157C2.5 6.34315 2.5 8.22876 2.5 12V14C2.5 17.7712 2.5 19.6569 3.67157 20.8284C4.47975 21.6366 5.6277 21.8873 7.5 21.965" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.5 10H7.5" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PhilippinePesoIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={16} height={16} color={"#194752"} fill={"none"}>
    <path d="M7 15V4C7 3.44772 7.44772 3 8 3H12C15.3137 3 18 5.68629 18 9C18 12.3137 15.3137 15 12 15H7Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 7H20" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 11H20" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 15V21" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================================
// USERS COMPONENT
// ============================================================

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [billsCount, setBillsCount] = useState({});
  const [paidBillsCount, setPaidBillsCount] = useState({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminCount: 0,
    userCount: 0,
    staffCount: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const usersData = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      
      // Get bills for each user
      await fetchBillsCount(usersData);
      
      // Calculate stats
      const totalUsers = usersData.length;
      const adminCount = usersData.filter(u => u.role === 'admin').length;
      const userCount = usersData.filter(u => u.role === 'user' || !u.role).length;
      const staffCount = usersData.filter(u => u.role === 'staff').length;
      
      setStats({ totalUsers, adminCount, userCount, staffCount });
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    }
    setLoading(false);
  };

  const fetchBillsCount = async (usersData) => {
    try {
      const billsRef = collection(db, 'bills');
      const querySnapshot = await getDocs(billsRef);
      const billsData = [];
      querySnapshot.forEach((doc) => {
        billsData.push({ id: doc.id, ...doc.data() });
      });
      
      const countMap = {};
      const paidMap = {};
      
      usersData.forEach(user => {
        const userBills = billsData.filter(bill => bill.userId === user.uid);
        countMap[user.uid] = userBills.length;
        paidMap[user.uid] = userBills.filter(bill => bill.status === 'paid').length;
      });
      
      setBillsCount(countMap);
      setPaidBillsCount(paidMap);
      
    } catch (error) {
      console.error('Error fetching bills count:', error);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.displayName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    }
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => 
        (user.role || 'user') === filterRole
      );
    }
    
    setFilteredUsers(filtered);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(timestamp).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role) => {
    const roles = {
      admin: { label: 'Administrator', class: 'role-admin' },
      user: { label: 'User', class: 'role-user' },
      staff: { label: 'Staff', class: 'role-staff' }
    };
    return roles[role] || roles.user;
  };

  const getInitials = (displayName, email) => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const getStatusDot = (lastLogin) => {
    if (!lastLogin) return 'offline';
    const now = new Date();
    let lastDate;
    if (lastLogin.toDate) {
      lastDate = lastLogin.toDate();
    } else if (lastLogin.seconds) {
      lastDate = new Date(lastLogin.seconds * 1000);
    } else {
      lastDate = new Date(lastLogin);
    }
    const diffHours = (now - lastDate) / (1000 * 60 * 60);
    if (diffHours < 2) return 'online';
    if (diffHours < 24) return 'recent';
    return 'offline';
  };

  const getStatusLabel = (status) => {
    const labels = {
      online: '🟢 Online',
      recent: '🟡 Recently Active',
      offline: '⚫ Offline'
    };
    return labels[status] || '⚫ Offline';
  };

  const activeFilterCount = filterRole !== 'all' ? 1 : 0;

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-3d"></div>
        <p style={{ color: '#ffffff', marginTop: '16px', fontFamily: 'Inter, sans-serif' }}>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div className="header-left">
          <h1>👥 USERS</h1>
          <p>Manage all registered users</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchUsers}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="users-stats-grid">
        <div className="user-stat-card">
          <div className="user-stat-icon">
            <UserIcon />
          </div>
          <div>
            <p className="user-stat-label">Total Users</p>
            <p className="user-stat-number">{stats.totalUsers}</p>
          </div>
        </div>
        <div className="user-stat-card stat-admin">
          <div className="user-stat-icon">
            <UserCheckIcon />
          </div>
          <div>
            <p className="user-stat-label">Admins</p>
            <p className="user-stat-number">{stats.adminCount}</p>
          </div>
        </div>
        <div className="user-stat-card stat-user">
          <div className="user-stat-icon">
            <UserIcon />
          </div>
          <div>
            <p className="user-stat-label">Users</p>
            <p className="user-stat-number">{stats.userCount}</p>
          </div>
        </div>
        <div className="user-stat-card stat-staff">
          <div className="user-stat-icon">
            <UserXIcon />
          </div>
          <div>
            <p className="user-stat-label">Staff</p>
            <p className="user-stat-number">{stats.staffCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-container">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="user">User</option>
            <option value="staff">Staff</option>
          </select>
          <span className="result-count">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
          </span>
        </div>
        <div className="filter-actions">
          {activeFilterCount > 0 && (
            <button className="btn-clear" onClick={() => setFilterRole('all')}>
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p>No users found. {searchTerm ? 'Try adjusting your search.' : 'No registered users yet.'}</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Total Bills</th>
                <th>Paid Bills</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((userData) => {
                const role = getRoleBadge(userData.role || 'user');
                const status = getStatusDot(userData.lastLogin);
                const totalBills = billsCount[userData.uid] || 0;
                const paidBills = paidBillsCount[userData.uid] || 0;
                
                return (
                  <tr key={userData.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {getInitials(userData.displayName, userData.email)}
                        </div>
                        <span className="user-name">{userData.displayName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="user-email">{userData.email || 'N/A'}</td>
                    <td>
                      <span className={`role-badge ${role.class}`}>
                        {role.label}
                      </span>
                    </td>
                    <td>
                      <span className={`status-dot ${status}`}>
                        {getStatusLabel(status)}
                      </span>
                    </td>
                    <td>
                      <span className="bill-count">
                        <CalendarIcon />
                        {totalBills}
                      </span>
                    </td>
                    <td>
                      <span className="paid-count">
                        <PhilippinePesoIconSmall />
                        {paidBills}
                      </span>
                    </td>
                    <td className="last-login">
                      {formatDate(userData.lastLogin)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Users;