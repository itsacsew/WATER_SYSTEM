// src/components/admin/Users.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, doc, writeBatch, deleteDoc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db, db2, db3, db4, db5, getDbByServer, getServerLabel, getServerColor, SERVER_CONFIGS } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
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

const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={16} height={16} color={"currentColor"} fill={"none"}>
    <path d="M12 3V12M12 12L9.5 9.5M12 12L14.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 17.5C3.5 16.5 2 14.5 2 12C2 7.02944 6.02944 3 11 3C15.9706 3 20 7.02944 20 12C20 14.5 18.5 16.5 17 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 21V13M12 21L9.5 18.5M12 21L14.5 18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={16} height={16} color={"currentColor"} fill={"none"}>
    <path d="M12 21V12M12 12L9.5 14.5M12 12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 6.5C3.5 7.5 2 9.5 2 12C2 16.9706 6.02944 21 11 21C15.9706 21 20 16.9706 20 12C20 9.5 18.5 7.5 17 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3V11M12 11L9.5 8.5M12 11L14.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 7L6 4L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"}>
    <path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" stroke="#194752" strokeWidth="1.5"/>
    <path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" stroke="#194752" strokeWidth="1.5"/>
  </svg>
);

const MonthIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"}>
    <path d="M16 2V6M8 2V6" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 10H21" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const YearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"}>
    <path d="M16 2V6M8 2V6" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 10H21" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 15L10 17.5L16 14" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AddUserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"}>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14C7 14 4 16.5 4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19C20 16.5 17 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 12V17M16.5 14.5H21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ServerIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color="currentColor" fill="none" {...props}>
    <rect x="2" y="3" width="20" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="14" width="20" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6" cy="6.5" r="1" fill="currentColor"/>
    <circle cx="6" cy="17.5" r="1" fill="currentColor"/>
    <circle cx="10" cy="6.5" r="1" fill="currentColor"/>
    <circle cx="10" cy="17.5" r="1" fill="currentColor"/>
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#a0aec0"} fill={"none"}>
    <path d="M2 8C2 8 6.47715 3 12 3C17.5228 3 22 8 22 8" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M21.544 13.045C21.848 13.4713 22 13.6845 22 14C22 14.3155 21.848 14.5287 21.544 14.955C20.1779 16.8706 16.6892 21 12 21C7.31078 21 3.8221 16.8706 2.45604 14.955C2.15201 14.5287 2 14.3155 2 14C2 13.6845 2.15201 13.4713 2.45604 13.045C3.8221 11.1294 7.31078 7 12 7C16.6892 7 20.1779 11.1294 21.544 13.045Z" stroke="#a0aec0" strokeWidth="1.5"/>
    <path d="M15 14C15 12.3431 13.6569 11 12 11C10.3431 11 9 12.3431 9 14C9 15.6569 10.3431 17 12 17C13.6569 17 15 15.6569 15 14Z" stroke="#a0aec0" strokeWidth="1.5"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#a0aec0"} fill={"none"}>
    <path d="M6.43385 6.51953C4.22009 7.89049 2.93281 9.86457 2.31858 11.0339C2.10621 11.4382 2.00003 11.6403 2 12.0082C1.99997 12.3761 2.10584 12.5777 2.3176 12.981C3.32862 14.9066 6.16702 19.0195 11.9669 19.0195C14.2454 19.0195 16.0669 18.3848 17.5 17.4972" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.87868 9.87868C9.33579 10.4216 9 11.1716 9 12C9 13.6569 10.3431 15 12 15C12.8284 15 13.5784 14.6642 14.1213 14.1213" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M2 2L22 22" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 5.14847C10.5934 5.05255 11.224 5 11.8936 5C17.7747 5 20.6528 9.05385 21.6779 10.9517C21.8927 11.3492 22 11.548 22 11.9106C22 12.2733 21.8921 12.4727 21.6765 12.8717C21.3678 13.4428 20.8916 14.2085 20.2167 15" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================================
// USERS COMPONENT
// ============================================================

const MONTH_ORDER = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                     'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [billsCount, setBillsCount] = useState({});
  const [paidBillsCount, setPaidBillsCount] = useState({});

  // ========== SERVER SELECTION STATE ==========
  const [selectedServer, setSelectedServer] = useState('server1');
  const [serverBills, setServerBills] = useState([]);
  const [serverBillsLoading, setServerBillsLoading] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    adminCount: 0,
    userCount: 0,
    staffCount: 0
  });

  // ========== IMPORT MODAL STATE ==========
  const [showImportModal, setShowImportModal] = useState(false);
  const [importServer, setImportServer] = useState('server1');
  const [importMonth, setImportMonth] = useState('');
  const [importYear, setImportYear] = useState('');
  const [importLocation, setImportLocation] = useState('');
  const [availableImportLocations, setAvailableImportLocations] = useState([]);
  const [availableImportMonths, setAvailableImportMonths] = useState([]);
  const [availableImportYears, setAvailableImportYears] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [showImportProgress, setShowImportProgress] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importOptionsLoading, setImportOptionsLoading] = useState(false);

  // ========== EXPORT/REPLACE MODAL STATE ==========
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportServer, setExportServer] = useState('server1'); // ✅ Set by button
  const [exportMonth, setExportMonth] = useState('');
  const [exportLocation, setExportLocation] = useState('');
  const [availableExportLocations, setAvailableExportLocations] = useState([]);
  const [availableExportMonths, setAvailableExportMonths] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [exportPreviewData, setExportPreviewData] = useState([]);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportOptionsLoading, setExportOptionsLoading] = useState(false); // ✅ NEW

  // ========== ADD USER MODAL STATE ==========
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [addUserErrors, setAddUserErrors] = useState({});
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showAddConfirmPassword, setShowAddConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ Re-fetch server-specific bills inig change sa selectedServer
  useEffect(() => {
    fetchServerBills(selectedServer);
  }, [selectedServer]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole]);

  // ============================================================
  // ✅ COMPUTE COUNTS BASE SA SERVER-SPECIFIC BILLS
  // ============================================================
  useEffect(() => {
    if (users.length > 0) {
      const countMap = {};
      const paidMap = {};

      users.forEach(u => {
        const userBills = serverBills.filter(bill => bill.userId === u.uid);
        countMap[u.uid] = userBills.length;
        paidMap[u.uid] = userBills.filter(bill => bill.status === 'paid').length;
      });

      setBillsCount(countMap);
      setPaidBillsCount(paidMap);
    }
  }, [serverBills, users]);

  // ============================================================
  // ✅ FETCH SERVER-SPECIFIC BILLS
  // ============================================================
  const fetchServerBills = async (serverKey) => {
    setServerBillsLoading(true);
    try {
      const targetDb = getDbByServer(serverKey);
      const billsRef = collection(targetDb, 'bills');
      const querySnapshot = await getDocs(billsRef);
      const billsData = [];
      querySnapshot.forEach((doc) => {
        billsData.push({ id: doc.id, ...doc.data() });
      });
      setServerBills(billsData);
      console.log(`✅ Loaded ${billsData.length} bills from ${getServerLabel(serverKey)}`);
    } catch (error) {
      console.error(`Error loading bills from ${getServerLabel(serverKey)}:`, error);
      setServerBills([]);
    }
    setServerBillsLoading(false);
  };

  // ============================================================
  // ✅ EXTRACT FILTER OPTIONS PER SERVER (for import)
  // ============================================================
  const extractImportOptionsFromBills = (billsData) => {
    const locations = new Set();
    const months = new Set();
    const years = new Set();

    billsData.forEach((bill) => {
      if (bill.location && bill.location !== 'N/A') locations.add(bill.location);
      if (bill.month && bill.month !== 'N/A') months.add(bill.month);
      if (bill.year && bill.year !== 'N/A') years.add(bill.year.toString());
    });

    return {
      locations: Array.from(locations).sort(),
      months: Array.from(months).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)),
      years: Array.from(years).sort((a, b) => Number(b) - Number(a)),
    };
  };

  // ============================================================
  // ✅ EXTRACT FILTER OPTIONS PER SERVER (for export/replace)
  // ============================================================
  const extractExportOptionsFromImport = (importData) => {
    const locations = new Set();
    const months = new Set();

    importData.forEach((item) => {
      if (item.location && item.location !== 'N/A') locations.add(item.location);
      if (item.month && item.month !== 'N/A') months.add(item.month);
    });

    return {
      locations: Array.from(locations).sort(),
      months: Array.from(months).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)),
    };
  };

  // ============================================================
  // ✅ HANDLE SERVER BUTTON CLICK (load data)
  // ============================================================
  const handleServerClick = (serverKey) => {
    setSelectedServer(serverKey);
    toast.success(`Loading data from ${getServerLabel(serverKey)}...`, {
      icon: '🗄️',
      duration: 2000,
      style: {
        background: SERVER_CONFIGS.find(s => s.key === serverKey)?.color + '15',
        color: SERVER_CONFIGS.find(s => s.key === serverKey)?.color,
        border: `1px solid ${SERVER_CONFIGS.find(s => s.key === serverKey)?.color}`
      }
    });
  };

  // ============================================================
  // FETCH USERS
  // ============================================================
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

  // ============================================================
  // ADD USER FUNCTIONS
  // ============================================================
  const openAddUserModal = () => {
    setAddUserForm({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    });
    setAddUserErrors({});
    setShowAddPassword(false);
    setShowAddConfirmPassword(false);
    setIsPasswordFocused(false);
    setShowAddUserModal(true);
  };

  const closeAddUserModal = () => {
    setShowAddUserModal(false);
    setAddUserForm({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user'
    });
    setAddUserErrors({});
    setShowAddPassword(false);
    setShowAddConfirmPassword(false);
    setIsPasswordFocused(false);
  };

  const validateAddUserForm = () => {
    const errors = {};

    if (!addUserForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!addUserForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(addUserForm.email)) {
      errors.email = 'Invalid email address';
    }

    if (!addUserForm.password) {
      errors.password = 'Password is required';
    } else if (addUserForm.password.length < 14) {
      errors.password = 'Password must be at least 14 characters';
    } else if (!/[a-z]/.test(addUserForm.password)) {
      errors.password = 'Must contain at least one lowercase letter';
    } else if (!/[A-Z]/.test(addUserForm.password)) {
      errors.password = 'Must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(addUserForm.password)) {
      errors.password = 'Must contain at least one number';
    }

    if (!addUserForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (addUserForm.password !== addUserForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setAddUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    if (!validateAddUserForm()) {
      return;
    }

    setAddUserLoading(true);

    try {
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', addUserForm.email));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        toast.error('User with this email already exists!');
        setAddUserLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        addUserForm.email,
        addUserForm.password
      );

      const uid = userCredential.user.uid;

      const now = new Date();
      const timestamp = now.toISOString();

      const userData = {
        createdAt: timestamp,
        displayName: addUserForm.fullName,
        email: addUserForm.email,
        lastLogin: timestamp,
        preferences: {
          notifications: true,
          theme: "light"
        },
        role: addUserForm.role,
        uid: uid,
        updatedAt: timestamp
      };

      await setDoc(doc(db, 'users', uid), userData);

      toast.success(`✅ User "${addUserForm.fullName}" created successfully!`);
      toast.success(`🔑 User can now login with their email and password`);

      await fetchUsers();
      closeAddUserModal();
    } catch (error) {
      console.error('Error creating user:', error);

      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use! Please use a different email.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak! Please use a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address!');
      } else {
        toast.error('Error creating user: ' + error.message);
      }
    }

    setAddUserLoading(false);
  };

  const checkRequirement = (regex) => {
    return regex.test(addUserForm.password);
  };

  // ============================================================
  // ✅ IMPORT FUNCTIONS - SERVER-SPECIFIC WITH SMART DROPDOWNS
  // ============================================================
  const openImportModalForServer = async (serverKey) => {
    setImportServer(serverKey);
    setImportMonth('');
    setImportYear('');
    setImportLocation('');
    setImportPreviewData([]);
    setShowImportPreview(false);
    setAvailableImportLocations([]);
    setAvailableImportMonths([]);
    setAvailableImportYears([]);

    setImportOptionsLoading(true);

    try {
      const targetDb = getDbByServer(serverKey);
      const billsRef = collection(targetDb, 'bills');
      const querySnapshot = await getDocs(billsRef);
      const billsData = [];
      querySnapshot.forEach((doc) => {
        billsData.push({ id: doc.id, ...doc.data() });
      });

      const options = extractImportOptionsFromBills(billsData);
      setAvailableImportLocations(options.locations);
      setAvailableImportMonths(options.months);
      setAvailableImportYears(options.years);
    } catch (error) {
      console.error(`Error fetching import options from ${getServerLabel(serverKey)}:`, error);
      toast.error(`Error loading filter options from ${getServerLabel(serverKey)}`);
    } finally {
      setImportOptionsLoading(false);
    }

    setShowImportModal(true);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportMonth('');
    setImportYear('');
    setImportLocation('');
    setImportPreviewData([]);
    setShowImportPreview(false);
    setAvailableImportLocations([]);
    setAvailableImportMonths([]);
    setAvailableImportYears([]);
  };

  const previewImport = async () => {
    if (!importMonth || !importYear || !importLocation) {
      toast.error('Please select Month, Year, and Location');
      return;
    }

    setImportLoading(true);

    try {
      const targetDb = getDbByServer(importServer);
      const serverLabel = getServerLabel(importServer);

      const billsRef = collection(targetDb, 'bills');
      const q = query(
        billsRef,
        where('month', '==', importMonth),
        where('year', '==', importYear),
        where('location', '==', importLocation)
      );
      const querySnapshot = await getDocs(q);

      const billsData = [];
      querySnapshot.forEach((doc) => {
        billsData.push({ id: doc.id, ...doc.data() });
      });

      if (billsData.length === 0) {
        toast.error(`No bills found for ${importMonth} ${importYear} in ${importLocation} on ${serverLabel}`);
        setImportLoading(false);
        return;
      }

      setImportPreviewData(billsData);
      setShowImportPreview(true);
      toast.success(`Found ${billsData.length} bills from ${serverLabel}`);
    } catch (error) {
      console.error('Error previewing import:', error);
      toast.error('Error fetching bills: ' + error.message);
    }

    setImportLoading(false);
  };

  const confirmImport = async () => {
    if (importPreviewData.length === 0) {
      toast.error('No data to import');
      return;
    }

    setImportLoading(true);
    setShowImportProgress(true);
    setImportProgress({ current: 0, total: importPreviewData.length });

    try {
      const targetDb = getDbByServer(importServer);
      const serverLabel = getServerLabel(importServer);

      const importCollectionRef = collection(targetDb, 'import');
      let successCount = 0;
      let errorCount = 0;

      let batch = writeBatch(targetDb);
      let batchCount = 0;

      for (let i = 0; i < importPreviewData.length; i++) {
        try {
          const bill = importPreviewData[i];
          const { id, ...billData } = bill;

          const importData = {
            ...billData,
            importedAt: new Date().toISOString(),
            importedBy: user?.email || 'Unknown',
            importedByUid: user?.uid || 'unknown',
            originalBillId: id,
            importBatch: `${importMonth}_${importYear}_${importLocation}_${Date.now()}`,
            importMonth: importMonth,
            importYear: importYear,
            importLocation: importLocation,
            sourceCollection: 'bills',
            sourceServer: importServer
          };

          const docRef = doc(importCollectionRef);
          batch.set(docRef, importData);
          successCount++;
          batchCount++;

          setImportProgress({ current: i + 1, total: importPreviewData.length });

          if (batchCount >= 500) {
            await batch.commit();
            batch = writeBatch(targetDb);
            batchCount = 0;
          }
        } catch (error) {
          console.error('Error adding import document:', error);
          errorCount++;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      if (successCount > 0) {
        toast.success(`✅ Imported ${successCount} bills to "${serverLabel} → import" collection!`);
        closeImportModal();
      }

      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} bills failed to import`);
      }
    } catch (error) {
      console.error('Error during import:', error);
      toast.error('Error importing data: ' + error.message);
    } finally {
      setImportLoading(false);
      setShowImportProgress(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  // ============================================================
  // ✅ EXPORT/REPLACE FUNCTIONS - SERVER-SPECIFIC
  // ============================================================
  const openExportModalForServer = async (serverKey) => {
    setExportServer(serverKey); // ✅ Set by which button clicked
    setExportMonth('');
    setExportLocation('');
    setExportPreviewData([]);
    setShowExportPreview(false);
    setAvailableExportLocations([]);
    setAvailableExportMonths([]);

    setExportOptionsLoading(true);

    try {
      const targetDb = getDbByServer(serverKey);
      const importRef = collection(targetDb, 'import');
      const querySnapshot = await getDocs(importRef);
      const importData = [];
      querySnapshot.forEach((doc) => {
        importData.push({ id: doc.id, ...doc.data() });
      });

      const options = extractExportOptionsFromImport(importData);
      setAvailableExportLocations(options.locations);
      setAvailableExportMonths(options.months);

      console.log(`✅ Loaded export options from ${getServerLabel(serverKey)}:`, options);
    } catch (error) {
      console.error(`Error fetching export options from ${getServerLabel(serverKey)}:`, error);
      toast.error(`Error loading export options from ${getServerLabel(serverKey)}`);
    } finally {
      setExportOptionsLoading(false);
    }

    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportMonth('');
    setExportLocation('');
    setExportPreviewData([]);
    setShowExportPreview(false);
    setAvailableExportLocations([]);
    setAvailableExportMonths([]);
  };

  const previewExport = async () => {
    if (!exportMonth || !exportLocation) {
      toast.error('Please select both Month and Location');
      return;
    }

    setExportLoading(true);

    try {
      const targetDb = getDbByServer(exportServer);
      const serverLabel = getServerLabel(exportServer);

      const importRef = collection(targetDb, 'import');
      const q = query(
        importRef,
        where('month', '==', exportMonth),
        where('location', '==', exportLocation)
      );
      const querySnapshot = await getDocs(q);

      const importData = [];
      querySnapshot.forEach((doc) => {
        importData.push({ id: doc.id, ...doc.data() });
      });

      if (importData.length === 0) {
        toast.error(`No imported bills found for ${exportMonth} in ${exportLocation} on ${serverLabel}`);
        setExportLoading(false);
        return;
      }

      setExportPreviewData(importData);
      setShowExportPreview(true);
      toast.success(`Found ${importData.length} imported bills from ${serverLabel}`);
    } catch (error) {
      console.error('Error previewing export:', error);
      toast.error('Error fetching imported bills: ' + error.message);
    }

    setExportLoading(false);
  };

  const confirmExport = async () => {
    if (exportPreviewData.length === 0) {
      toast.error('No data to export');
      return;
    }

    setExportLoading(true);
    setShowExportProgress(true);
    setExportProgress({ current: 0, total: exportPreviewData.length * 3 });

    try {
      const targetDb = getDbByServer(exportServer);
      const serverLabel = getServerLabel(exportServer);

      const billsCollectionRef = collection(targetDb, 'bills');
      let successCount = 0;
      let errorCount = 0;
      let deleteCount = 0;
      let deleteErrorCount = 0;

      const exportYear = exportPreviewData[0]?.year || new Date().getFullYear().toString();

      const existingBillsQuery = query(
        billsCollectionRef,
        where('month', '==', exportMonth),
        where('year', '==', exportYear),
        where('location', '==', exportLocation)
      );
      const existingSnapshot = await getDocs(existingBillsQuery);

      const existingBillIds = [];
      existingSnapshot.forEach((doc) => {
        existingBillIds.push(doc.id);
      });

      const existingCount = existingBillIds.length;

      if (existingCount > 0) {
        toast(`🗑️ Found ${existingCount} existing bills in "${exportLocation}" on ${serverLabel}. Replacing...`, {
          icon: '🔄',
          duration: 4000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B'
          }
        });

        let deleteBatch = writeBatch(targetDb);
        let deleteBatchCount = 0;

        for (let i = 0; i < existingBillIds.length; i++) {
          try {
            const docRef = doc(targetDb, 'bills', existingBillIds[i]);
            deleteBatch.delete(docRef);
            deleteCount++;
            deleteBatchCount++;

            if (deleteBatchCount >= 500) {
              await deleteBatch.commit();
              deleteBatch = writeBatch(targetDb);
              deleteBatchCount = 0;
            }
          } catch (error) {
            console.error('Error deleting existing bill:', error);
            deleteErrorCount++;
          }
        }

        if (deleteBatchCount > 0) {
          await deleteBatch.commit();
        }

        toast.success(`🗑️ Deleted ${deleteCount} existing bills from ${serverLabel}`);
      }

      let exportBatch = writeBatch(targetDb);
      let exportBatchCount = 0;
      const importDocIds = [];

      for (let i = 0; i < exportPreviewData.length; i++) {
        try {
          const importDoc = exportPreviewData[i];
          const { id, ...importData } = importDoc;

          importDocIds.push(id);

          const {
            importedAt,
            importedBy,
            importedByUid,
            originalBillId,
            importBatch,
            importMonth: impMonth,
            importYear: impYear,
            importLocation: impLocation,
            sourceCollection,
            sourceServer,
            ...cleanBillData
          } = importData;

          const billData = {
            ...cleanBillData,
            exportedAt: new Date().toISOString(),
            exportedFrom: id,
            exportedFromCollection: 'import',
            exportedBy: user?.email || 'Unknown',
            exportedByUid: user?.uid || 'unknown',
            exportBatch: `${exportMonth}_${exportLocation}_${Date.now()}`,
            exportMonth: exportMonth,
            exportLocation: exportLocation,
            createdAt: importData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isReplacement: true,
            replacedAt: new Date().toISOString(),
            replacedFrom: id,
            replacedMonth: exportMonth,
            replacedYear: exportYear,
            replacedLocation: exportLocation,
            serverSource: exportServer
          };

          const docRef = doc(billsCollectionRef);
          exportBatch.set(docRef, billData);
          successCount++;
          exportBatchCount++;

          setExportProgress({ current: i + 1, total: exportPreviewData.length * 3 });

          if (exportBatchCount >= 500) {
            await exportBatch.commit();
            exportBatch = writeBatch(targetDb);
            exportBatchCount = 0;
          }
        } catch (error) {
          console.error('Error exporting bill:', error);
          errorCount++;
        }
      }

      if (exportBatchCount > 0) {
        await exportBatch.commit();
      }

      if (successCount > 0) {
        setExportProgress({ current: exportPreviewData.length, total: exportPreviewData.length * 3 });

        let deleteImportBatch = writeBatch(targetDb);
        let deleteImportBatchCount = 0;

        for (let i = 0; i < importDocIds.length; i++) {
          try {
            const docId = importDocIds[i];
            const docRef = doc(targetDb, 'import', docId);
            deleteImportBatch.delete(docRef);
            deleteImportBatchCount++;

            setExportProgress({
              current: exportPreviewData.length + i + 1,
              total: exportPreviewData.length * 3
            });

            if (deleteImportBatchCount >= 500) {
              await deleteImportBatch.commit();
              deleteImportBatch = writeBatch(targetDb);
              deleteImportBatchCount = 0;
            }
          } catch (error) {
            console.error('Error deleting import document:', error);
            deleteErrorCount++;
          }
        }

        if (deleteImportBatchCount > 0) {
          await deleteImportBatch.commit();
        }
      }

      if (successCount > 0) {
        let message = `✅ Successfully exported ${successCount} bills to "${serverLabel} → bills"!`;
        if (deleteCount > 0) {
          message += ` 🔄 Replaced ${deleteCount} existing bills.`;
        }
        toast.success(message);
        toast.success(`🗑️ Cleaned up ${importDocIds.length} bills from import collection`);
        closeExportModal();
        // Re-fetch server bills para ma-update ang counts
        fetchServerBills(selectedServer);
      }

      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} bills failed to export`);
      }

      if (deleteErrorCount > 0) {
        toast.error(`⚠️ ${deleteErrorCount} bills failed to delete`);
      }
    } catch (error) {
      console.error('Error during export:', error);
      toast.error('Error exporting data: ' + error.message);
    } finally {
      setExportLoading(false);
      setShowExportProgress(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
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

  const importServerConfig = SERVER_CONFIGS.find(s => s.key === importServer);
  const exportServerConfig = SERVER_CONFIGS.find(s => s.key === exportServer);
  const currentServerConfig = SERVER_CONFIGS.find(s => s.key === selectedServer);

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div className="header-left">
          <h1>👥 USERS</h1>
          <p>Manage all registered users</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={openAddUserModal}
            style={{
              background: '#194752',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AddUserIcon />
            ADD USER
          </button>

          <button className="btn btn-secondary" onClick={fetchUsers}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ✅ SERVER SELECTOR BUTTONS (Load Data) */}
      {/* ============================================================ */}
      <div style={{
        marginBottom: '20px',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
        border: '2px solid #E2E8F0',
        borderRadius: '14px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '14px'
        }}>
          <ServerIcon width={22} height={22} color="#194752" />
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            fontWeight: '700',
            color: '#0F172A'
          }}>
            SELECT SERVER:
          </span>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#64748B',
            fontStyle: 'italic'
          }}>
            (Click to load data)
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {SERVER_CONFIGS.map((server) => {
            const isActive = selectedServer === server.key;
            return (
              <button
                key={server.key}
                onClick={() => handleServerClick(server.key)}
                disabled={serverBillsLoading}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '14px 12px',
                  background: isActive
                    ? `linear-gradient(135deg, ${server.color}, ${server.color}dd)`
                    : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : server.color,
                  border: `3px solid ${isActive ? server.color : server.color + '40'}`,
                  borderRadius: '12px',
                  cursor: serverBillsLoading ? 'wait' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.25s ease',
                  boxShadow: isActive
                    ? `0 8px 24px ${server.color}50`
                    : '0 2px 8px rgba(0,0,0,0.05)',
                  transform: isActive ? 'translateY(-3px) scale(1.02)' : 'none',
                  position: 'relative',
                  opacity: serverBillsLoading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !serverBillsLoading) {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${server.color}30`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !serverBillsLoading) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ServerIcon width={20} height={20} color={isActive ? '#FFFFFF' : server.color} />
                  <span style={{
                    fontSize: '15px',
                    fontWeight: '800',
                    letterSpacing: '0.5px'
                  }}>
                    {server.label.toUpperCase()}
                  </span>
                </div>
                <span style={{
                  fontSize: '10px',
                  opacity: 0.8,
                  fontWeight: '600',
                  textAlign: 'center',
                  wordBreak: 'break-all'
                }}>
                  {server.project}
                </span>

                {isActive && (
                  <span style={{
                    position: 'absolute',
                    top: '6px',
                    right: '10px',
                    fontSize: '10px',
                    fontWeight: '800',
                    background: 'rgba(255,255,255,0.25)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    letterSpacing: '0.5px'
                  }}>
                    ✓ ACTIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ✅ ACTIVE SERVER INFO BANNER */}
        <div style={{
          marginTop: '14px',
          padding: '10px 16px',
          background: `${currentServerConfig?.color}15`,
          border: `1.5px solid ${currentServerConfig?.color}60`,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🗄️</span>
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: '700',
              color: currentServerConfig?.color
            }}>
              Currently viewing data from: <strong>{getServerLabel(selectedServer)}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {serverBillsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: `2px solid ${currentServerConfig?.color}40`,
                  borderTop: `2px solid ${currentServerConfig?.color}`,
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: currentServerConfig?.color,
                  fontWeight: '600'
                }}>
                  Loading...
                </span>
              </div>
            ) : (
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                background: currentServerConfig?.color,
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: '12px',
                fontWeight: '700'
              }}>
                📊 {serverBills.length} bills loaded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ✅ ACTION BUTTONS: IMPORT + REPLACE PER SERVER */}
      {/* ============================================================ */}
      <div style={{
        marginBottom: '20px',
        padding: '16px 20px',
        background: '#FFFFFF',
        border: '2px solid #E2E8F0',
        borderRadius: '14px'
      }}>
        {/* IMPORT SECTION */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px'
          }}>
            <ImportIcon width={18} height={18} color="#194752" />
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: '700',
              color: '#194752',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📥 Import Data (per server)
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px'
          }}>
            {SERVER_CONFIGS.map((server) => (
              <button
                key={`import-${server.key}`}
                onClick={() => openImportModalForServer(server.key)}
                style={{
                  padding: '10px 12px',
                  background: server.color,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: `0 2px 8px ${server.color}40`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 16px ${server.color}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = `0 2px 8px ${server.color}40`;
                }}
              >
                <ImportIcon width={14} height={14} color="#FFFFFF" />
                IMPORT {server.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{
          height: '1px',
          background: '#E2E8F0',
          margin: '16px 0'
        }} />

        {/* REPLACE BILLS SECTION */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px'
          }}>
            <ExportIcon width={18} height={18} color="#DC2626" />
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: '700',
              color: '#DC2626',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🔄 Replace Bills (per server)
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px'
          }}>
            {SERVER_CONFIGS.map((server) => (
              <button
                key={`replace-${server.key}`}
                onClick={() => openExportModalForServer(server.key)}
                style={{
                  padding: '10px 12px',
                  background: `linear-gradient(135deg, #DC2626, ${server.color})`,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: `0 2px 8px #DC262640`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 16px #DC262660`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = `0 2px 8px #DC262640`;
                }}
              >
                <ExportIcon width={14} height={14} color="#FFFFFF" />
                REPLACE {server.label.toUpperCase()}
              </button>
            ))}
          </div>
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
                <th>
                  Total Bills
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: currentServerConfig?.color || '#194752',
                    textTransform: 'none',
                    marginTop: '2px'
                  }}>
                    ({getServerLabel(selectedServer)})
                  </div>
                </th>
                <th>
                  Paid Bills
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: currentServerConfig?.color || '#194752',
                    textTransform: 'none',
                    marginTop: '2px'
                  }}>
                    ({getServerLabel(selectedServer)})
                  </div>
                </th>
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

      {/* ============================================================
          ADD USER MODAL
          ============================================================ */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={closeAddUserModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AddUserIcon width={28} height={28} color="#194752" />
                Create New User Account
              </h2>
              <button className="close-btn" onClick={closeAddUserModal}>✕</button>
            </div>

            <form onSubmit={handleAddUserSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#0F172A', fontSize: '13px' }}>
                      Full Name <span className="required" style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={addUserForm.fullName}
                      onChange={(e) => setAddUserForm({ ...addUserForm, fullName: e.target.value })}
                      className={`modal-input ${addUserErrors.fullName ? 'error' : ''}`}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: '#F8FAFC',
                        border: `2px solid ${addUserErrors.fullName ? '#DC2626' : '#E2E8F0'}`,
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#0F172A',
                        outline: 'none',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                    />
                    {addUserErrors.fullName && (
                      <span className="error-message" style={{ color: '#DC2626', fontSize: '12px', marginTop: '2px', display: 'block' }}>
                        {addUserErrors.fullName}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#0F172A', fontSize: '13px' }}>
                      Email Address <span className="required" style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                      className={`modal-input ${addUserErrors.email ? 'error' : ''}`}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: '#F8FAFC',
                        border: `2px solid ${addUserErrors.email ? '#DC2626' : '#E2E8F0'}`,
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#0F172A',
                        outline: 'none',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box'
                      }}
                    />
                    {addUserErrors.email && (
                      <span className="error-message" style={{ color: '#DC2626', fontSize: '12px', marginTop: '2px', display: 'block' }}>
                        {addUserErrors.email}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#0F172A', fontSize: '13px' }}>
                      Role <span className="required" style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select
                      value={addUserForm.role}
                      onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}
                      className="modal-input"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: '#F8FAFC',
                        border: '2px solid #E2E8F0',
                        borderRadius: '8px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#0F172A',
                        outline: 'none',
                        transition: 'all 0.2s',
                        boxSizing: 'border-box',
                        appearance: 'auto'
                      }}
                    >
                      <option value="user">👤 User</option>
                      <option value="admin">👑 Administrator</option>
                      <option value="staff">👔 Staff</option>
                    </select>
                    <p style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                      Select the role for this user. Admin has full access.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#0F172A', fontSize: '13px' }}>
                      Password <span className="required" style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div className="password-input-wrapper" style={{ position: 'relative' }}>
                      <input
                        type={showAddPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={addUserForm.password}
                        onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        className={`modal-input ${addUserErrors.password ? 'error' : ''}`}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          paddingRight: '44px',
                          background: '#F8FAFC',
                          border: `2px solid ${addUserErrors.password ? '#DC2626' : '#E2E8F0'}`,
                          borderRadius: '8px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#0F172A',
                          outline: 'none',
                          transition: 'all 0.2s',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: '#94A3B8'
                        }}
                      >
                        {showAddPassword ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                    </div>
                    {addUserErrors.password && (
                      <span className="error-message" style={{ color: '#DC2626', fontSize: '12px', marginTop: '2px', display: 'block' }}>
                        {addUserErrors.password}
                      </span>
                    )}

                    <div className={`password-requirements ${isPasswordFocused || addUserForm.password.length > 0 ? 'visible' : ''}`} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '2px 16px',
                      marginTop: '4px',
                      maxHeight: (isPasswordFocused || addUserForm.password.length > 0) ? '100px' : '0',
                      overflow: 'hidden',
                      opacity: (isPasswordFocused || addUserForm.password.length > 0) ? '1' : '0',
                      transition: 'all 0.3s ease'
                    }}>
                      <div className={`requirement ${checkRequirement(/[a-z]/) ? 'met' : ''}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: checkRequirement(/[a-z]/) ? '#194752' : '#94A3B8',
                        transition: 'all 0.3s'
                      }}>
                        <span className="dot" style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: checkRequirement(/[a-z]/) ? '#194752' : '#E2E8F0',
                          flexShrink: 0,
                          transition: 'all 0.3s'
                        }}></span>
                        Lowercase
                      </div>
                      <div className={`requirement ${checkRequirement(/[A-Z]/) ? 'met' : ''}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: checkRequirement(/[A-Z]/) ? '#194752' : '#94A3B8',
                        transition: 'all 0.3s'
                      }}>
                        <span className="dot" style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: checkRequirement(/[A-Z]/) ? '#194752' : '#E2E8F0',
                          flexShrink: 0,
                          transition: 'all 0.3s'
                        }}></span>
                        Uppercase
                      </div>
                      <div className={`requirement ${checkRequirement(/[0-9]/) ? 'met' : ''}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: checkRequirement(/[0-9]/) ? '#194752' : '#94A3B8',
                        transition: 'all 0.3s'
                      }}>
                        <span className="dot" style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: checkRequirement(/[0-9]/) ? '#194752' : '#E2E8F0',
                          flexShrink: 0,
                          transition: 'all 0.3s'
                        }}></span>
                        Number
                      </div>
                      <div className={`requirement ${addUserForm.password.length >= 14 ? 'met' : ''}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: addUserForm.password.length >= 14 ? '#194752' : '#94A3B8',
                        transition: 'all 0.3s'
                      }}>
                        <span className="dot" style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: addUserForm.password.length >= 14 ? '#194752' : '#E2E8F0',
                          flexShrink: 0,
                          transition: 'all 0.3s'
                        }}></span>
                        14+ characters
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#0F172A', fontSize: '13px' }}>
                      Confirm Password <span className="required" style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div className="password-input-wrapper" style={{ position: 'relative' }}>
                      <input
                        type={showAddConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={addUserForm.confirmPassword}
                        onChange={(e) => setAddUserForm({ ...addUserForm, confirmPassword: e.target.value })}
                        className={`modal-input ${addUserErrors.confirmPassword ? 'error' : ''}`}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          paddingRight: '44px',
                          background: '#F8FAFC',
                          border: `2px solid ${addUserErrors.confirmPassword ? '#DC2626' : '#E2E8F0'}`,
                          borderRadius: '8px',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '14px',
                          color: '#0F172A',
                          outline: 'none',
                          transition: 'all 0.2s',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowAddConfirmPassword(!showAddConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: '#94A3B8'
                        }}
                      >
                        {showAddConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                    </div>
                    {addUserErrors.confirmPassword && (
                      <span className="error-message" style={{ color: '#DC2626', fontSize: '12px', marginTop: '2px', display: 'block' }}>
                        {addUserErrors.confirmPassword}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeAddUserModal}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addUserLoading}
                  style={{
                    flex: 1,
                    background: '#194752',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {addUserLoading ? (
                    <>
                      <span className="btn-spinner-small" style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#FFFFFF',
                        borderRadius: '50%',
                        animation: 'spin 0.6s linear infinite'
                      }}></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <AddUserIcon width={18} height={18} color="#ffffff" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          IMPORT MODAL - SERVER-SPECIFIC WITH SMART DROPDOWNS
          ============================================================ */}
      {showImportModal && (
        <div className="modal-overlay" onClick={closeImportModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: importServerConfig?.color || '#194752'
              }}>
                <ImportIcon width={28} height={28} color={importServerConfig?.color || '#194752'} />
                Import Data — {getServerLabel(importServer)}
              </h2>
              <button className="close-btn" onClick={closeImportModal}>✕</button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 20px',
                background: `${importServerConfig?.color || '#194752'}15`,
                border: `2px solid ${importServerConfig?.color || '#194752'}`,
                borderRadius: '12px'
              }}>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: importServerConfig?.color || '#194752',
                  letterSpacing: '1px'
                }}>
                  🗄️ {getServerLabel(importServer).toUpperCase()}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: importServerConfig?.color || '#194752',
                  opacity: 0.8,
                  fontWeight: '600'
                }}>
                  {importServerConfig?.project}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
                Pilia ang <strong>Month</strong>, <strong>Year</strong>, ug <strong>Location</strong> para
                i-import ang bills gikan sa <strong>"{getServerLabel(importServer)} → bills"</strong> ngadto sa
                <strong> "{getServerLabel(importServer)} → import"</strong> collection.
              </p>

              {importOptionsLoading ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: `4px solid ${importServerConfig?.color || '#194752'}20`,
                    borderTop: `4px solid ${importServerConfig?.color || '#194752'}`,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: importServerConfig?.color || '#194752',
                    fontWeight: '600'
                  }}>
                    Loading available months, years, and locations from {getServerLabel(importServer)}...
                  </span>
                </div>
              ) : (
                <>
                  {availableImportMonths.length === 0 && availableImportYears.length === 0 && availableImportLocations.length === 0 ? (
                    <div style={{
                      padding: '30px 20px',
                      background: '#FEF3C7',
                      border: '2px solid #F59E0B',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                      <p style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#92400E',
                        fontWeight: '600',
                        margin: 0
                      }}>
                        ⚠️ Walang naka-store na data sa {getServerLabel(importServer)}
                      </p>
                      <p style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        color: '#92400E',
                        marginTop: '8px'
                      }}>
                        Please import data first sa Bills collection sa {getServerLabel(importServer)}.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A', fontSize: '13px' }}>
                          <MonthIcon width={16} height={16} style={{ display: 'inline', marginRight: '6px' }} />
                          Month <span className="required" style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <select
                          value={importMonth}
                          onChange={(e) => {
                            setImportMonth(e.target.value);
                            setImportPreviewData([]);
                            setShowImportPreview(false);
                          }}
                          className="modal-input"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: '#F8FAFC',
                            border: `2px solid ${importServerConfig?.color || '#E2E8F0'}40`,
                            borderRadius: '8px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            color: '#0F172A',
                            outline: 'none'
                          }}
                        >
                          <option value="">Select Month...</option>
                          {availableImportMonths.map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A', fontSize: '13px' }}>
                          <YearIcon width={16} height={16} style={{ display: 'inline', marginRight: '6px' }} />
                          Year <span className="required" style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <select
                          value={importYear}
                          onChange={(e) => {
                            setImportYear(e.target.value);
                            setImportPreviewData([]);
                            setShowImportPreview(false);
                          }}
                          className="modal-input"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: '#F8FAFC',
                            border: `2px solid ${importServerConfig?.color || '#E2E8F0'}40`,
                            borderRadius: '8px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            color: '#0F172A',
                            outline: 'none'
                          }}
                        >
                          <option value="">Select Year...</option>
                          {availableImportYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A', fontSize: '13px' }}>
                          <LocationIcon width={16} height={16} style={{ display: 'inline', marginRight: '6px' }} />
                          Location <span className="required" style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <select
                          value={importLocation}
                          onChange={(e) => {
                            setImportLocation(e.target.value);
                            setImportPreviewData([]);
                            setShowImportPreview(false);
                          }}
                          className="modal-input"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: '#F8FAFC',
                            border: `2px solid ${importServerConfig?.color || '#E2E8F0'}40`,
                            borderRadius: '8px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            color: '#0F172A',
                            outline: 'none'
                          }}
                        >
                          <option value="">Select Location...</option>
                          {availableImportLocations.map(location => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {availableImportMonths.length > 0 && availableImportYears.length > 0 && availableImportLocations.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={previewImport}
                        disabled={!importMonth || !importYear || !importLocation || importLoading}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: importServerConfig?.color || '#194752',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          opacity: (!importMonth || !importYear || !importLocation || importLoading) ? '0.5' : '1'
                        }}
                      >
                        {importLoading ? '⏳ Loading...' : `🔍 Preview Bills from ${getServerLabel(importServer)}`}
                      </button>
                    </div>
                  )}

                  {showImportPreview && importPreviewData.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontWeight: '600', color: '#0F172A' }}>
                          📋 Found {importPreviewData.length} bills
                        </span>
                        <span style={{ fontSize: '12px', color: importServerConfig?.color }}>
                          {getServerLabel(importServer)} | {importMonth} {importYear}
                        </span>
                      </div>

                      <div style={{
                        maxHeight: '200px',
                        overflow: 'auto',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px'
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead style={{ background: '#F1F5F9', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>WSIN</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Consumer</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Amount</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importPreviewData.slice(0, 50).map((bill) => (
                              <tr key={bill.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '6px 12px', fontWeight: '600' }}>{bill.billNumber || 'N/A'}</td>
                                <td style={{ padding: '6px 12px' }}>{bill.consumerName || 'N/A'}</td>
                                <td style={{ padding: '6px 12px', fontWeight: '600' }}>₱{(bill.amount || 0).toFixed(2)}</td>
                                <td style={{ padding: '6px 12px' }}>
                                  <span style={{
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    background: bill.status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                                    color: bill.status === 'paid' ? '#065F46' : '#92400E'
                                  }}>
                                    {bill.status || 'UNPAID'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={closeImportModal} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmImport}
                disabled={importPreviewData.length === 0 || importLoading}
                style={{
                  flex: 1,
                  background: importServerConfig?.color || '#194752',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: (importPreviewData.length === 0 || importLoading) ? '0.5' : '1'
                }}
              >
                {importLoading ? '⏳ Importing...' : `📥 Import ${importPreviewData.length} Bills to ${getServerLabel(importServer)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Progress Modal */}
      {showImportProgress && (
        <div className="modal-overlay">
          <div className="modal-content progress-modal">
            <h3>📤 Importing Bills to "{getServerLabel(importServer)} → import"</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                  background: `linear-gradient(135deg, ${importServerConfig?.color || '#194752'}, ${importServerConfig?.color || '#124451'}dd)`
                }}
              />
            </div>
            <p className="progress-text">
              {importProgress.current} / {importProgress.total} bills imported
            </p>
          </div>
        </div>
      )}

      {/* ============================================================
          EXPORT / REPLACE MODAL - SERVER-SPECIFIC
          ============================================================ */}
      {showExportModal && (
        <div className="modal-overlay" onClick={closeExportModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h2 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: exportServerConfig?.color || '#DC2626'
              }}>
                <ExportIcon width={28} height={28} color={exportServerConfig?.color || '#DC2626'} />
                Replace Bills — {getServerLabel(exportServer)}
              </h2>
              <button className="close-btn" onClick={closeExportModal}>✕</button>
            </div>

            {/* Server Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 20px',
                background: `${exportServerConfig?.color || '#DC2626'}15`,
                border: `2px solid ${exportServerConfig?.color || '#DC2626'}`,
                borderRadius: '12px'
              }}>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '800',
                  color: exportServerConfig?.color || '#DC2626',
                  letterSpacing: '1px'
                }}>
                  🗄️ {getServerLabel(exportServer).toUpperCase()}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: exportServerConfig?.color || '#DC2626',
                  opacity: 0.8,
                  fontWeight: '600'
                }}>
                  {exportServerConfig?.project}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
                Pilia ang <strong>Month</strong> ug <strong>Location</strong> para i-<strong>REPLACE</strong>
                ang bills sa <strong>"{getServerLabel(exportServer)} → bills"</strong> gamit ang data gikan sa
                <strong> "{getServerLabel(exportServer)} → import"</strong>.
              </p>

              {exportOptionsLoading ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: `4px solid ${exportServerConfig?.color || '#DC2626'}20`,
                    borderTop: `4px solid ${exportServerConfig?.color || '#DC2626'}`,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: exportServerConfig?.color || '#DC2626',
                    fontWeight: '600'
                  }}>
                    Loading available months and locations from {getServerLabel(exportServer)}...
                  </span>
                </div>
              ) : (
                <>
                  {availableExportMonths.length === 0 && availableExportLocations.length === 0 ? (
                    <div style={{
                      padding: '30px 20px',
                      background: '#FEF3C7',
                      border: '2px solid #F59E0B',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                      <p style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        color: '#92400E',
                        fontWeight: '600',
                        margin: 0
                      }}>
                        ⚠️ Walang data sa "{getServerLabel(exportServer)} → import" collection
                      </p>
                      <p style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        color: '#92400E',
                        marginTop: '8px'
                      }}>
                        Please Import Data first sa {getServerLabel(exportServer)}.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A' }}>
                          <MonthIcon width={18} height={18} style={{ display: 'inline', marginRight: '6px' }} />
                          Month <span className="required" style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <select
                          value={exportMonth}
                          onChange={(e) => {
                            setExportMonth(e.target.value);
                            setExportPreviewData([]);
                            setShowExportPreview(false);
                          }}
                          className="modal-input"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: '#F8FAFC',
                            border: `2px solid ${exportServerConfig?.color || '#E2E8F0'}40`,
                            borderRadius: '8px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '15px',
                            color: '#0F172A',
                            outline: 'none'
                          }}
                        >
                          <option value="">Select Month...</option>
                          {availableExportMonths.map(month => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A' }}>
                          <LocationIcon width={18} height={18} style={{ display: 'inline', marginRight: '6px' }} />
                          Location <span className="required" style={{ color: '#DC2626' }}>*</span>
                        </label>
                        <select
                          value={exportLocation}
                          onChange={(e) => {
                            setExportLocation(e.target.value);
                            setExportPreviewData([]);
                            setShowExportPreview(false);
                          }}
                          className="modal-input"
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: '#F8FAFC',
                            border: `2px solid ${exportServerConfig?.color || '#E2E8F0'}40`,
                            borderRadius: '8px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '15px',
                            color: '#0F172A',
                            outline: 'none'
                          }}
                        >
                          <option value="">Select Location...</option>
                          {availableExportLocations.map(location => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {availableExportMonths.length > 0 && availableExportLocations.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={previewExport}
                        disabled={!exportMonth || !exportLocation || exportLoading}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: exportServerConfig?.color || '#DC2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          opacity: (!exportMonth || !exportLocation || exportLoading) ? '0.5' : '1'
                        }}
                      >
                        {exportLoading ? '⏳ Loading...' : `🔍 Preview Imported Bills from ${getServerLabel(exportServer)}`}
                      </button>
                    </div>
                  )}

                  {showExportPreview && exportPreviewData.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontWeight: '600', color: '#0F172A' }}>
                          📋 Found {exportPreviewData.length} imported bills
                        </span>
                        <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '600' }}>
                          Will REPLACE existing bills
                        </span>
                      </div>

                      <div style={{
                        maxHeight: '200px',
                        overflow: 'auto',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px'
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead style={{ background: '#F1F5F9', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>WSIN</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Consumer</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exportPreviewData.slice(0, 50).map((bill) => (
                              <tr key={bill.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '6px 12px', fontWeight: '600' }}>{bill.billNumber || 'N/A'}</td>
                                <td style={{ padding: '6px 12px' }}>{bill.consumerName || 'N/A'}</td>
                                <td style={{ padding: '6px 12px', fontWeight: '600' }}>₱{(bill.amount || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={closeExportModal} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmExport}
                disabled={exportPreviewData.length === 0 || exportLoading}
                style={{
                  flex: 1,
                  background: exportServerConfig?.color || '#DC2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: (exportPreviewData.length === 0 || exportLoading) ? '0.5' : '1'
                }}
              >
                {exportLoading ? '⏳ Replacing...' : `🔄 REPLACE ${exportPreviewData.length} Bills on ${getServerLabel(exportServer)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Progress Modal */}
      {showExportProgress && (
        <div className="modal-overlay">
          <div className="modal-content progress-modal">
            <h3>🔄 Replacing Bills on {getServerLabel(exportServer)}</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${exportProgress.total > 0 ? (exportProgress.current / exportProgress.total) * 100 : 0}%`,
                  background: `linear-gradient(135deg, ${exportServerConfig?.color || '#DC2626'}, ${exportServerConfig?.color || '#991B1B'}dd)`
                }}
              />
            </div>
            <p className="progress-text">
              {exportProgress.current} / {exportProgress.total} bills processed
            </p>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
              ⏳ Step 1: Deleting existing bills | Step 2: Exporting new bills | Step 3: Cleaning up import
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;