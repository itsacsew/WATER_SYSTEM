// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, writeBatch, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import BillForm from '../bills/BillForm';
import ReceiptPrinter from '../bills/ReceiptPrinter';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import '../bills/BillStyles.css';
import './AdminStyles.css';

const EXCEL_PASSWORD = 'Water_2026';

// ============================================================
// HARD-CODED SVG ICONS (Reused from BillDashboard)
// ============================================================

const SummationCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M14.9998 14.4986C14.9981 15.0266 14.983 15.3137 14.8502 15.5299C14.5236 16.0612 13.8736 15.9976 13.3241 15.9976H10.7994C9.69158 15.9976 9.13766 15.9976 9.01957 15.6713C8.90149 15.345 9.32205 14.9765 10.1632 14.2394L11.8529 12.7588C12.2554 12.4062 12.4566 12.2298 12.4566 12C12.4566 11.7702 12.2554 11.5938 11.8529 11.2412L10.1632 9.76058C9.32205 9.02355 8.90149 8.65503 9.01957 8.3287C9.13766 8.00237 9.69158 8.00237 10.7994 8.00237H13.3241C13.8736 8.00237 14.5236 7.93885 14.8502 8.47006C14.983 8.68627 14.9981 8.97338 14.9998 9.50144" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"></circle>
  </svg>
);

const PhilippinePesoIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M7 15V4C7 3.44772 7.44772 3 8 3H12C15.3137 3 18 5.68629 18 9C18 12.3137 15.3137 15 12 15H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M4 7H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M4 11H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M7 15V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const CalendarClockIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M15.5 2V6M7.5 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M20.3985 8C20.2706 6.69989 19.9816 5.82475 19.3284 5.17157C18.1569 4 16.2712 4 12.5 4H10.5C6.72876 4 4.84315 4 3.67157 5.17157C2.5 6.34315 2.5 8.22876 2.5 12V14C2.5 17.7712 2.5 19.6569 3.67157 20.8284C4.47975 21.6366 5.6277 21.8873 7.5 21.965" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M2.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M15.5 22C18.8137 22 21.5 19.3137 21.5 16C21.5 12.6863 18.8137 10 15.5 10C12.1863 10 9.5 12.6863 9.5 16C9.5 19.3137 12.1863 22 15.5 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M15.5 13V16L17.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const SecurityWarningIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M18.7088 3.49534C16.8165 2.55382 14.5009 2 12 2C9.4991 2 7.1835 2.55382 5.29116 3.49534C4.36318 3.95706 3.89919 4.18792 3.4496 4.91378C3 5.63965 3 6.34248 3 7.74814V11.2371C3 16.9205 7.54236 20.0804 10.173 21.4338C10.9067 21.8113 11.2735 22 12 22C12.7265 22 13.0933 21.8113 13.8269 21.4338C16.4576 20.0804 21 16.9205 21 11.2371L21 7.74814C21 6.34249 21 5.63966 20.5504 4.91378C20.1008 4.18791 19.6368 3.95706 18.7088 3.49534Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M12 11V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M12.125 14.75H12M12.25 14.75C12.25 14.8881 12.1381 15 12 15C11.8619 15 11.75 14.8881 11.75 14.75C11.75 14.6119 11.8619 14.5 12 14.5C12.1381 14.5 12.25 14.6119 12.25 14.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const User02Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
    <path d="M12 14C7 14 4 16.5 4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19C20 16.5 17 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const Location03Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" stroke="currentColor" strokeWidth="1.5"></path>
    <path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" stroke="currentColor" strokeWidth="1.5"></path>
  </svg>
);

const DuplexIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M18.5 6L12.916 2.27735C12.6448 2.0965 12.326 2 12 2C11.674 2 11.3552 2.0965 11.084 2.27735L5.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M20 14L12.916 9.27735C12.6448 9.0965 12.326 9 12 9C11.674 9 11.3552 9.0965 11.084 9.27735L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M18.5 13.5V18C18.5 19.8856 18.5 20.8284 17.9142 21.4142C17.3284 22 16.3856 22 14.5 22H9.5C7.61438 22 6.67157 22 6.08579 21.4142C5.5 20.8284 5.5 19.8856 5.5 18V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M17 5V12M7 5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M14 22V18C14 16.8954 13.1046 16 12 16C10.8954 16 10 16.8954 10 18V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const ApartmentIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M9.5 2.5H6.5C4.61438 2.5 3.67157 2.5 3.08579 3.08579C2.5 3.67157 2.5 4.61438 2.5 6.5V17.5C2.5 19.3856 2.5 20.3284 3.08579 20.9142C3.67157 21.5 4.61438 21.5 6.5 21.5H13.5V6.5C13.5 4.61438 13.5 3.67157 12.9142 3.08579C12.3284 2.5 11.3856 2.5 9.5 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M5.5 5.5H6.5M9.5 5.5H10.5M5.5 8.5H6.5M9.5 8.5H10.5M5.5 11.5H6.5M9.5 11.5H10.5M5.5 14.5H6.5M9.5 14.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M8 21.5V18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M17.5 7.5H13.5V21.5H17.5C19.3856 21.5 20.3284 21.5 20.9142 20.9142C21.5 20.3284 21.5 19.3856 21.5 17.5V11.5C21.5 9.61438 21.5 8.67157 20.9142 8.08579C20.3284 7.5 19.3856 7.5 17.5 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M17 10.5H18M17 13.5H18M17 16.5H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

// ============================================================
// BILL CALCULATION FUNCTIONS
// ============================================================

/**
 * Calculate bill amount based on consumer type and consumption
 * @param {string} consumerType - 'RESIDENTIAL' or 'COMMERCIAL'
 * @param {number} consumption - Total cubic meters consumed
 * @returns {number} Calculated amount
 */
const calculateBillAmount = (consumerType, consumption) => {
  const type = consumerType?.toUpperCase() || 'RESIDENTIAL';
  
  if (type === 'RESIDENTIAL') {
    // Residential: First 5 m³ = ₱62.50, Excess = ₱12.50 per m³
    const FIRST_5_RATE = 62.50;
    const EXCESS_RATE = 12.50;
    
    if (consumption <= 0) return 0;
    if (consumption <= 5) return FIRST_5_RATE;
    
    const excess = consumption - 5;
    return FIRST_5_RATE + (excess * EXCESS_RATE);
    
  } else if (type === 'COMMERCIAL') {
    // Commercial: 
    // 0-10 m³ = ₱15 per m³
    // 11-20 m³ = ₱20 per m³
    // 21+ m³ = ₱30 per m³
    const TIER1_RATE = 15;
    const TIER2_RATE = 20;
    const TIER3_RATE = 30;
    const TIER1_LIMIT = 10;
    const TIER2_LIMIT = 20;
    
    if (consumption <= 0) return 0;
    
    if (consumption <= TIER1_LIMIT) {
      return consumption * TIER1_RATE;
    } else if (consumption <= TIER2_LIMIT) {
      const tier1Amount = TIER1_LIMIT * TIER1_RATE;
      const tier2Consumption = consumption - TIER1_LIMIT;
      return tier1Amount + (tier2Consumption * TIER2_RATE);
    } else {
      const tier1Amount = TIER1_LIMIT * TIER1_RATE;
      const tier2Amount = (TIER2_LIMIT - TIER1_LIMIT) * TIER2_RATE;
      const tier3Consumption = consumption - TIER2_LIMIT;
      return tier1Amount + tier2Amount + (tier3Consumption * TIER3_RATE);
    }
  }
  
  // Default fallback
  return consumption * 15;
};

/**
 * Calculate consumption from readings
 * @param {number} presentReading - Current meter reading
 * @param {number} previousReading - Previous meter reading
 * @returns {number} Consumption in cubic meters
 */
const calculateConsumption = (presentReading, previousReading) => {
  const present = Number(presentReading) || 0;
  const previous = Number(previousReading) || 0;
  return Math.max(0, present - previous);
};

// ============================================================
// OVERDUE CHECKING HELPER FUNCTIONS
// ============================================================

const getCurrentPeriod = () => {
  const now = new Date();
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  return {
    currentMonth: months[now.getMonth()],
    currentMonthIndex: now.getMonth(),
    currentYear: now.getFullYear()
  };
};

const getMonthIndex = (monthName) => {
  if (!monthName) return -1;
  const months = {
    'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3,
    'MAY': 4, 'JUNE': 5, 'JULY': 6, 'AUGUST': 7,
    'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
  };
  return months[monthName.toUpperCase()] !== undefined ? months[monthName.toUpperCase()] : -1;
};

const isBillOverdue = (billMonth, billYear) => {
  const { currentMonthIndex, currentYear } = getCurrentPeriod();
  const billMonthIndex = getMonthIndex(billMonth);
  
  if (billMonthIndex === -1) return false;
  
  const billYearNum = parseInt(billYear);
  if (isNaN(billYearNum)) return false;
  
  if (billYearNum < currentYear) return true;
  if (billYearNum > currentYear) return false;
  
  return billMonthIndex < currentMonthIndex;
};

const determineBillStatus = (bill) => {
  if (bill.status === 'paid') return 'paid';
  const isOverdue = isBillOverdue(bill.month, bill.year);
  if (isOverdue) return 'overdue';
  return 'unpaid';
};

const processBillsWithStatus = (billsData) => {
  return billsData.map(bill => {
    if (bill.status === 'paid') return bill;
    const computedStatus = determineBillStatus(bill);
    return { ...bill, status: computedStatus };
  });
};

const sortByBillNumber = (data) => {
  return [...data].sort((a, b) => {
    const numA = Number(a.billNumber) || 0;
    const numB = Number(b.billNumber) || 0;
    return numA - numB;
  });
};

// ============================================================
// ADMIN DASHBOARD COMPONENT
// ============================================================

const AdminDashboard = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showProgress, setShowProgress] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentCode, setPaymentCode] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  
  // Export Modal States
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportLocation, setSelectedExportLocation] = useState('all');
  const [exportLocations, setExportLocations] = useState([]);
  
  const [locations, setLocations] = useState([]);
  const [months, setMonths] = useState([]);
  const [years, setYears] = useState([]);
  
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
    totalConsumers: 0,
    residential: 0,
    commercial: 0,
    location: ''
  });

  useEffect(() => {
    fetchBills();
  }, [user]);

  useEffect(() => {
    filterBills();
  }, [bills, searchTerm, filterType, filterLocation, filterMonth, filterYear]);

  useEffect(() => {
    if (showPayModal) {
      setPaymentCode('');
      setPaymentError('');
    }
  }, [showPayModal]);

  useEffect(() => {
    const locationSet = new Set();
    bills.forEach(bill => {
      if (bill.location && bill.location !== 'N/A') {
        locationSet.add(bill.location);
      }
    });
    setExportLocations(Array.from(locationSet).sort());
  }, [bills]);

  const extractFilterOptions = (billsData) => {
    const locationSet = new Set();
    const monthSet = new Set();
    const yearSet = new Set();
    
    billsData.forEach(bill => {
      if (bill.location && bill.location !== 'N/A') {
        locationSet.add(bill.location);
      }
      if (bill.month && bill.month !== 'N/A') {
        monthSet.add(bill.month);
      }
      if (bill.year && bill.year !== 'N/A') {
        yearSet.add(bill.year);
      }
    });
    
    setLocations(Array.from(locationSet).sort());
    
    const monthOrder = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    setMonths(Array.from(monthSet).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)));
    
    setYears(Array.from(yearSet).sort((a, b) => Number(b) - Number(a)));
  };

  const fetchBills = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const billsRef = collection(db, 'bills');
      const q = query(billsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const billsData = [];
      querySnapshot.forEach((doc) => {
        billsData.push({ id: doc.id, ...doc.data() });
      });
      
      const processedBills = processBillsWithStatus(billsData);
      const sortedBills = sortByBillNumber(processedBills);
      
      setBills(sortedBills);
      setFilteredBills(sortedBills);
      calculateStats(sortedBills);
      extractFilterOptions(sortedBills);
      
    } catch (error) {
      console.error('Error fetching bills from Firebase:', error);
      toast.error('Error loading bills from database');
    }
    setLoading(false);
  };

  const filterBills = () => {
    let filtered = [...bills];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(bill => 
        bill.consumerName?.toLowerCase().includes(term) ||
        bill.billNumber?.toString().includes(term)
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(bill => 
        bill.consumerType?.toUpperCase() === filterType.toUpperCase()
      );
    }
    
    if (filterLocation !== 'all') {
      filtered = filtered.filter(bill => 
        bill.location === filterLocation
      );
    }
    
    if (filterMonth !== 'all') {
      filtered = filtered.filter(bill => 
        bill.month?.toUpperCase() === filterMonth.toUpperCase()
      );
    }
    
    if (filterYear !== 'all') {
      filtered = filtered.filter(bill => 
        bill.year === filterYear
      );
    }
    
    filtered = processBillsWithStatus(filtered);
    filtered = sortByBillNumber(filtered);
    setFilteredBills(filtered);
  };

  const calculateStats = (billsData) => {
    const processed = processBillsWithStatus(billsData);
    
    const total = processed.length;
    const paid = processed.filter(b => b.status === 'paid').length;
    const unpaid = processed.filter(b => b.status === 'unpaid').length;
    const overdue = processed.filter(b => b.status === 'overdue').length;
    
    const uniqueConsumers = new Set();
    const residentialCount = processed.filter(b => b.consumerType?.toUpperCase() === 'RESIDENTIAL').length;
    const commercialCount = processed.filter(b => b.consumerType?.toUpperCase() === 'COMMERCIAL').length;
    
    processed.forEach(b => {
      if (b.consumerName) {
        uniqueConsumers.add(b.consumerName);
      }
    });
    
    const locationSet = new Set();
    processed.forEach(b => {
      if (b.location) {
        locationSet.add(b.location);
      }
    });
    const locationString = Array.from(locationSet).join(', ') || 'N/A';
    
    setStats({ 
      total, 
      paid, 
      unpaid, 
      overdue,
      totalConsumers: uniqueConsumers.size || total,
      residential: residentialCount,
      commercial: commercialCount,
      location: locationString
    });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterLocation('all');
    setFilterMonth('all');
    setFilterYear('all');
  };

  const handleDelete = async (billId) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    
    try {
      await deleteDoc(doc(db, 'bills', billId));
      toast.success('Bill deleted successfully');
      fetchBills();
    } catch (error) {
      toast.error('Error deleting bill');
    }
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBill(null);
    fetchBills();
  };

  const handlePayBill = (bill) => {
    setSelectedBill(bill);
    setPaymentCode('');
    setPaymentError('');
    setShowPayModal(true);
  };

  const handlePaymentCodeChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setPaymentCode(value);
      setPaymentError('');
    }
  };

  // ============================================================
  // PAYMENT CONFIRMATION WITH AUTO-CALCULATION
  // ============================================================

  const confirmPayBill = async () => {
    if (!paymentCode || paymentCode.length < 7) {
      setPaymentError('Please enter a valid 7-digit payment code.');
      return;
    }

    if (paymentCode.length !== 7) {
      setPaymentError('Payment code must be exactly 7 digits.');
      return;
    }

    if (!selectedBill) return;

    setIsPaying(true);

    try {
      const referenceNumber = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // ✅ Calculate consumption and amount based on readings
      const consumption = calculateConsumption(
        selectedBill.presentReading,
        selectedBill.previousReading
      );
      
      const calculatedAmount = calculateBillAmount(
        selectedBill.consumerType,
        consumption
      );

      console.log('📊 Bill Calculation:');
      console.log(`   Consumer: ${selectedBill.consumerName}`);
      console.log(`   Type: ${selectedBill.consumerType}`);
      console.log(`   Previous Reading: ${selectedBill.previousReading}`);
      console.log(`   Present Reading: ${selectedBill.presentReading}`);
      console.log(`   Consumption: ${consumption} m³`);
      console.log(`   Calculated Amount: ₱${calculatedAmount.toFixed(2)}`);

      const billRef = doc(db, 'bills', selectedBill.id);
      await updateDoc(billRef, {
        status: 'paid',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentCode: paymentCode,
        referenceNumber: referenceNumber,
        paidBy: user?.email || 'Unknown',
        consumption: consumption,
        amount: calculatedAmount,
        amountCalculated: true,
        calculationDetails: {
          consumerType: selectedBill.consumerType || 'RESIDENTIAL',
          previousReading: selectedBill.previousReading || 0,
          presentReading: selectedBill.presentReading || 0,
          consumption: consumption,
          calculatedAmount: calculatedAmount,
          calculatedAt: new Date().toISOString()
        }
      });

      console.log('✅ Bill updated to paid successfully');

      // ✅ Step 2: Auto-create next month's bill
      await createNextMonthBill({
        ...selectedBill,
        consumption: consumption,
        amount: calculatedAmount
      });

      toast.success(`✅ Bill ${selectedBill.billNumber} marked as paid!`);
      toast.success(`💰 Amount: ₱${calculatedAmount.toFixed(2)}`);

      setShowPayModal(false);

      setReceiptData({
        bill: {
          ...selectedBill,
          consumption: consumption,
          amount: calculatedAmount
        },
        paymentCode: paymentCode,
        referenceNumber: referenceNumber
      });
      setShowReceipt(true);

      setSelectedBill(null);
      setPaymentCode('');
      setPaymentError('');
      fetchBills();
    } catch (error) {
      console.error('❌ Payment error details:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check your Firestore rules.');
      } else {
        toast.error('Error updating bill status: ' + error.message);
      }
    } finally {
      setIsPaying(false);
    }
  };

  // ============================================================
  // AUTO-CREATE NEXT MONTH BILL
  // ============================================================

  const createNextMonthBill = async (paidBill) => {
    try {
      console.log('🔄 Creating next month bill for:', paidBill.consumerName);
      
      const currentMonth = paidBill.month;
      const currentYear = parseInt(paidBill.year);

      const monthOrder = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                          'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
      const currentIndex = monthOrder.indexOf(currentMonth?.toUpperCase());
      if (currentIndex === -1) {
        console.warn('Invalid month:', currentMonth);
        return;
      }

      const nextIndex = (currentIndex + 1) % 12;
      const nextMonth = monthOrder[nextIndex];
      const nextYear = nextIndex === 0 ? currentYear + 1 : currentYear;

      console.log(`📅 Next month: ${nextMonth} ${nextYear}`);

      const billsRef = collection(db, 'bills');
      const q = query(
        billsRef,
        where('month', '==', nextMonth),
        where('year', '==', nextYear.toString()),
        where('consumerName', '==', paidBill.consumerName),
        where('location', '==', paidBill.location)
      );
      const querySnapshot = await getDocs(q);

      // If bill already exists, just update the previous reading
      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();
        
        if (!existingData.previousReading || existingData.previousReading === 0) {
          const existingRef = doc(db, 'bills', existingDoc.id);
          await updateDoc(existingRef, {
            previousReading: paidBill.presentReading || 0,
            updatedAt: new Date().toISOString()
          });
          console.log(`✅ Updated existing ${nextMonth} ${nextYear} bill previousReading to: ${paidBill.presentReading}`);
        }
        return;
      }

      // ✅ CREATE NEW BILL FOR NEXT MONTH
      const nextBillNumber = paidBill.billNumber || `WB-${nextYear}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

      const newBillData = {
        billNumber: nextBillNumber,
        consumerName: paidBill.consumerName || 'N/A',
        location: paidBill.location || 'N/A',
        consumerType: paidBill.consumerType || 'RESIDENTIAL',
        month: nextMonth,
        year: nextYear.toString(),
        previousReading: paidBill.presentReading || 0,
        presentReading: 0, // Waiting for new reading
        consumption: 0,
        amount: 0, // Will be calculated when paid
        dueDate: `${nextYear}-${String(nextIndex + 1).padStart(2, '0')}-15`,
        status: 'unpaid',
        notes: `Auto-created from ${currentMonth} ${currentYear} payment`,
        userId: user?.uid || paidBill.userId || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAutoGenerated: true,
        generatedFrom: paidBill.id,
        generatedFromBillNumber: paidBill.billNumber,
        // Store previous calculation for reference
        previousAmount: paidBill.amount || 0,
        previousConsumption: paidBill.consumption || 0
      };

      console.log('📝 New bill data:', newBillData);

      const docRef = await addDoc(collection(db, 'bills'), newBillData);
      console.log(`✅ Auto-created ${nextMonth} ${nextYear} bill with ID: ${docRef.id}`);
      console.log(`   Previous Reading: ${newBillData.previousReading}`);
      console.log(`   Present Reading: ${newBillData.presentReading}`);

      toast.success(`📋 Auto-created bill for ${nextMonth} ${nextYear}`);

      return docRef.id;

    } catch (error) {
      console.error('Error creating next month bill:', error);
      console.error('Error details:', error.code, error.message);
      toast.error('Error creating next month bill: ' + error.message);
    }
  };

  // ============================================================
  // EXPORT FUNCTIONS
  // ============================================================
  
  const openExportModal = () => {
    if (bills.length === 0) {
      toast.error('No bills to export!');
      return;
    }
    setSelectedExportLocation('all');
    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setSelectedExportLocation('all');
  };

  const handleExportWithLocationFilter = async () => {
    let billsToExport = [];
    
    if (selectedExportLocation === 'all') {
      billsToExport = [...bills];
    } else {
      billsToExport = bills.filter(bill => bill.location === selectedExportLocation);
    }
    
    if (billsToExport.length === 0) {
      toast.error(`No bills found for location: ${selectedExportLocation}`);
      return;
    }
    
    setIsExporting(true);
    closeExportModal();

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Water Bills');

      worksheet.columns = [
        { header: 'WSIN', key: 'wsin', width: 15 },
        { header: 'Consumer Name', key: 'consumerName', width: 25 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Period', key: 'period', width: 15 },
        { header: 'Consumer Type', key: 'consumerType', width: 18 },
        { header: 'Previous Reading', key: 'previousReading', width: 18 },
        { header: 'Present Reading', key: 'presentReading', width: 18 },
        { header: 'Consumption', key: 'consumption', width: 15 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Status', key: 'status', width: 12 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 25;

      const sortedForExport = sortByBillNumber(billsToExport);
      
      sortedForExport.forEach((bill) => {
        const period = `${bill.month || 'N/A'} ${bill.year || ''}`;
        worksheet.addRow({
          wsin: bill.billNumber || 'N/A',
          consumerName: bill.consumerName || 'N/A',
          location: bill.location || 'N/A',
          period: period.trim() || 'N/A',
          consumerType: bill.consumerType || 'N/A',
          previousReading: bill.previousReading || '0',
          presentReading: bill.presentReading || '0',
          consumption: bill.consumption || '0',
          amount: bill.amount || '0',
          status: bill.status?.toUpperCase() || 'UNPAID'
        });
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.height = 22;
          row.alignment = { vertical: 'middle' };
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFFFF' }
            };
            cell.font = { color: { argb: 'FF1E293B' }, size: 11 };
          });
          
          const statusCell = row.getCell(10);
          const statusValue = statusCell.value?.toString().toLowerCase() || '';
          if (statusValue === 'paid') {
            statusCell.font = { color: { argb: 'FF059669' }, bold: true };
          } else if (statusValue === 'unpaid') {
            statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
          } else if (statusValue === 'overdue') {
            statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
          }
        }
      });

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
        });
      });

      await worksheet.protect(EXCEL_PASSWORD, {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false
      });

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.protection = { locked: true };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const locationSuffix = selectedExportLocation !== 'all' ? `_${selectedExportLocation}` : '';
      const defaultFileName = `Water_Bills${locationSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;

      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: defaultFileName,
            types: [{
              description: 'Excel Workbook',
              accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
            }]
          });

          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();

          const savedFileName = fileHandle.name || defaultFileName;
          
          toast.success(`✅ Exported ${billsToExport.length} bills to "${savedFileName}"!`);
          toast.success(`🔒 Password: ${EXCEL_PASSWORD}`);
          
        } catch (pickError) {
          if (pickError.name === 'AbortError' || pickError.name === 'SecurityError') {
            toast.error('Export cancelled');
          } else {
            console.error('File picker error:', pickError);
            fallbackDownload(blob, defaultFileName, billsToExport.length);
          }
        }
      } else {
        fallbackDownload(blob, defaultFileName, billsToExport.length);
      }
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting file: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const fallbackDownload = (blob, fileName, count) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`✅ Exported ${count} bills!`);
    toast.success(`🔒 Password: ${EXCEL_PASSWORD}`);
  };

  // ============================================================
  // IMPORT FUNCTIONS - DIRECT TO FIREBASE (NO LOCAL BACKUP)
  // ============================================================

  const parseExcelData = (jsonData) => {
    const parsedData = [];
    
    jsonData.forEach((row, index) => {
      const wsin = row['WSIN']?.toString().trim() || '';
      const consumerName = row['Consumer Name']?.toString().trim() || '';
      const location = row['Location']?.toString().trim() || '';
      const type = row['Type']?.toString().trim() || 'OLD';
      const consumerType = row['Consumer Type']?.toString().trim()?.toUpperCase() || '';
      const year = row['Year']?.toString() || '2026';
      const month = row['Month']?.toString()?.toUpperCase() || 'APRIL';
      const status = row['Status']?.toString().trim() || '';
      const presentReading = row['Present Reading']?.toString().trim() || '0';
      const previousReading = row['Previous Reading']?.toString().trim() || '0';
      const consumption = row['Consumption']?.toString().trim() || '0';
      const waterCharge = row['Water Charge']?.toString().trim() || '0';
      const surcharge = row['Surcharge']?.toString().trim() || '0';
      const overallTotal = row['Overall Total']?.toString().trim() || '0';
      const paymentStatus = row['Payment Status']?.toString().trim()?.toLowerCase() || 'unpaid';
      const officialReceipt = row['Official Receipt']?.toString().trim() || '';
      const processedBy = row['Processed By']?.toString().trim() || '';
      
      if (!consumerName || consumerName === '') {
        return;
      }
      
      let billStatus = 'unpaid';
      if (paymentStatus === 'paid' || status === 'paid') {
        billStatus = 'paid';
      } else if (paymentStatus === 'overdue' || status === 'overdue') {
        billStatus = 'overdue';
      } else if (status === 'PAID') {
        billStatus = 'paid';
      }
      
      const billNumber = wsin || `WB-${year}-${String(index + 1).padStart(3, '0')}`;
      
      const parseAmount = (value) => {
        if (!value || value === '') return 0;
        const cleaned = value.toString().replace(/,/g, '').trim();
        return parseFloat(cleaned) || 0;
      };
      
      parsedData.push({
        billNumber,
        consumerName,
        location: location || 'N/A',
        type: type || 'OLD',
        consumerType: consumerType || 'RESIDENTIAL',
        year: year || '2026',
        month: month || 'APRIL',
        status: billStatus,
        presentReading: parseAmount(presentReading),
        previousReading: parseAmount(previousReading),
        consumption: parseAmount(consumption),
        waterCharge: parseAmount(waterCharge),
        surcharge: parseAmount(surcharge),
        amount: parseAmount(overallTotal) || parseAmount(waterCharge) || 0,
        dueDate: `${year || '2026'}-${getMonthNumber(month || 'APRIL')}-15`,
        officialReceipt: officialReceipt || '',
        processedBy: processedBy || '',
        notes: '',
        isImported: true,
        importDate: new Date().toISOString()
      });
    });
    
    return parsedData;
  };

  const getMonthNumber = (month) => {
    const months = {
      'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04',
      'MAY': '05', 'JUNE': '06', 'JULY': '07', 'AUGUST': '08',
      'SEPTEMBER': '09', 'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12'
    };
    return months[month] || '04';
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please upload a valid Excel file (.xlsx or .xls)');
      event.target.value = '';
      return;
    }

    setUploading(true);
    setShowProgress(true);
    setUploadProgress({ current: 0, total: 0 });

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
            defval: '',
            blankrows: false
          });
          
          const parsedBills = parseExcelData(jsonData);
          
          if (parsedBills.length === 0) {
            toast.error('No valid data found in the Excel file.');
            setUploading(false);
            setShowProgress(false);
            event.target.value = '';
            return;
          }

          setUploadProgress({ current: 0, total: parsedBills.length });

          const batch = writeBatch(db);
          const billsRef = collection(db, 'bills');
          let successCount = 0;
          let errorCount = 0;

          for (let i = 0; i < parsedBills.length; i++) {
            try {
              const billData = {
                ...parsedBills[i],
                userId: user.uid,
                importedBy: user?.email || user?.uid || 'Unknown User',
                importedByName: user?.displayName || 'Unknown',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              const docRef = doc(billsRef);
              batch.set(docRef, billData);
              successCount++;
              
              setUploadProgress({ current: i + 1, total: parsedBills.length });
              
              // Commit in batches of 500 for performance
              if (i % 500 === 499) {
                await batch.commit();
              }
            } catch (error) {
              console.error('Error adding bill:', error);
              errorCount++;
            }
          }

          // Commit any remaining documents
          if (successCount > 0) {
            await batch.commit();
          }

          toast.success(`✅ Successfully imported ${successCount} bills to Firebase! ${errorCount > 0 ? `${errorCount} failed.` : ''}`);
          fetchBills();
          
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          toast.error('Error parsing Excel file. Please check the format.');
        } finally {
          setUploading(false);
          setShowProgress(false);
          setUploadProgress({ current: 0, total: 0 });
          event.target.value = '';
        }
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        toast.error('Error reading file');
        setUploading(false);
        setShowProgress(false);
        event.target.value = '';
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file');
      setUploading(false);
      setShowProgress(false);
      event.target.value = '';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { label: 'Paid', class: 'status-paid' },
      unpaid: { label: 'Unpaid', class: 'status-unpaid' },
      overdue: { label: 'Overdue', class: 'status-overdue' }
    };
    return statusMap[status] || statusMap.unpaid;
  };

  const activeFilterCount = [
    filterType !== 'all',
    filterLocation !== 'all',
    filterMonth !== 'all',
    filterYear !== 'all'
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-3d"></div>
        <p style={{ color: '#ffffff', marginTop: '16px', fontFamily: 'Inter, sans-serif' }}>Loading bills...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-dashboard-header">
        <div className="header-left">
          <h1>ADMIN DASHBOARD</h1>
          <p>Manage all water bill records</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            ADD BILL
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => document.getElementById('fileInput').click()}
            disabled={uploading}
          >
            IMPORT
          </button>
          <button 
            className="btn btn-secondary"
            onClick={openExportModal}
            disabled={bills.length === 0 || isExporting}
          >
            {isExporting ? '⏳ Exporting...' : 'EXPORT'}
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        id="fileInput"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Export Location Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={closeExportModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📤 Export Bills by Location</h2>
              <button className="close-btn" onClick={closeExportModal}>✕</button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
                Select a location to export. Only bills from the selected location will be included.
              </p>
              
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A' }}>
                  Select Location <span className="required" style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={selectedExportLocation}
                  onChange={(e) => setSelectedExportLocation(e.target.value)}
                  className="modal-input"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#F8FAFC',
                    border: '2px solid #E2E8F0',
                    borderRadius: '8px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '15px',
                    color: '#0F172A',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <option value="all">🌍 All Locations ({bills.length} bills)</option>
                  {exportLocations.map(location => {
                    const count = bills.filter(b => b.location === location).length;
                    return (
                      <option key={location} value={location}>
                        📍 {location} ({count} bills)
                      </option>
                    );
                  })}
                </select>
              </div>
              
              {selectedExportLocation !== 'all' && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '10px 14px', 
                  background: '#EFF6FF', 
                  borderRadius: '8px',
                  border: '1px solid #BFDBFE',
                  fontSize: '14px',
                  color: '#1E40AF'
                }}>
                  ℹ️ Exporting <strong>{bills.filter(b => b.location === selectedExportLocation).length}</strong> bills from <strong>{selectedExportLocation}</strong>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-outline" 
                onClick={closeExportModal}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleExportWithLocationFilter}
                disabled={isExporting}
                style={{ flex: 1 }}
              >
                {isExporting ? '⏳ Exporting...' : '📥 Export Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">
            <SummationCircleIcon width={28} height={28} color="#194752" />
          </span>
          <div>
            <p className="stat-label">Total Bills</p>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card stat-paid">
          <span className="stat-icon">
            <PhilippinePesoIcon width={28} height={28} color="#194752" />
          </span>
          <div>
            <p className="stat-label">Paid</p>
            <p className="stat-number">{stats.paid}</p>
          </div>
        </div>
        <div className="stat-card stat-unpaid">
          <span className="stat-icon">
            <CalendarClockIcon width={28} height={28} color="#194752" />
          </span>
          <div>
            <p className="stat-label">Unpaid</p>
            <p className="stat-number">{stats.unpaid}</p>
          </div>
        </div>
        <div className="stat-card stat-overdue">
          <span className="stat-icon">
            <SecurityWarningIcon width={28} height={28} color="#194752" />
          </span>
          <div>
            <p className="stat-label">Overdue</p>
            <p className="stat-number">{stats.overdue}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <User02Icon width={28} height={28} color="#194752" />
          </span>
          <div>
            <p className="stat-label">Consumers</p>
            <p className="stat-number">{stats.totalConsumers}</p>
          </div>
        </div>
        <div className="stat-card stat-residential">
          <span className="stat-icon">
            <ApartmentIcon width={28} height={28} color="#194752" />
          </span>
          <div>
            <p className="stat-label">Residential</p>
            <p className="stat-number">{stats.residential}</p>
          </div>
        </div>
        <div className="stat-card stat-commercial">
          <span className="stat-icon">
            <DuplexIcon width={28} height={28} color="#194752" />
          </span>
          <div>
            <p className="stat-label">Commercial</p>
            <p className="stat-number">{stats.commercial}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">
            <Location03Icon width={28} height={28} color="#194752" />
          </span>
          <div>
            <p className="stat-label">Location</p>
            <p className="stat-number stat-location">{stats.location || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-container">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or WSIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>
          <select 
            className="filter-select"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          <select 
            className="filter-select"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="all">All Months</option>
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <select 
            className="filter-select"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="filter-actions">
          {activeFilterCount > 0 && (
            <button className="btn-clear" onClick={resetFilters}>
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Progress Modal */}
      {showProgress && (
        <div className="modal-overlay">
          <div className="modal-content progress-modal">
            <h3>Importing Bills to Firebase</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` 
                }}
              />
            </div>
            <p className="progress-text">
              {uploadProgress.current} / {uploadProgress.total} bills
            </p>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Payment</h2>
              <button className="close-btn" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <div className="pay-details">
              <div className="pay-row">
                <span className="pay-label">Bill Number</span>
                <span className="pay-value">{selectedBill.billNumber || 'N/A'}</span>
              </div>
              <div className="pay-row">
                <span className="pay-label">Consumer</span>
                <span className="pay-value">{selectedBill.consumerName || 'N/A'}</span>
              </div>
              <div className="pay-row">
                <span className="pay-label">Type</span>
                <span className="pay-value">{selectedBill.consumerType || 'RESIDENTIAL'}</span>
              </div>
              <div className="pay-row">
                <span className="pay-label">Previous Reading</span>
                <span className="pay-value">{selectedBill.previousReading || '0'}</span>
              </div>
              <div className="pay-row">
                <span className="pay-label">Present Reading</span>
                <span className="pay-value">{selectedBill.presentReading || '0'}</span>
              </div>
              <div className="pay-row" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '8px', marginTop: '4px' }}>
                <span className="pay-label" style={{ fontWeight: 'bold' }}>Consumption</span>
                <span className="pay-value" style={{ fontWeight: 'bold' }}>
                  {calculateConsumption(selectedBill.presentReading, selectedBill.previousReading)} m³
                </span>
              </div>
              <div className="pay-row" style={{ borderTop: '2px solid #194752', paddingTop: '8px', marginTop: '4px' }}>
                <span className="pay-label" style={{ fontWeight: 'bold', fontSize: '16px' }}>Amount Due</span>
                <span className="pay-value amount" style={{ fontSize: '22px' }}>
                  {formatCurrency(
                    calculateBillAmount(
                      selectedBill.consumerType,
                      calculateConsumption(selectedBill.presentReading, selectedBill.previousReading)
                    )
                  )}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Payment Code <span className="required">*</span></label>
              <input
                type="text"
                className={`payment-input ${paymentError ? 'error' : ''}`}
                placeholder="Enter 7-digit code"
                value={paymentCode}
                onChange={handlePaymentCodeChange}
                maxLength="7"
                autoFocus
              />
              {paymentError && <span className="error-text">{paymentError}</span>}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowPayModal(false)}>
                Cancel
              </button>
              <button 
                className={`btn btn-primary ${(!paymentCode || paymentCode.length !== 7) ? 'disabled' : ''}`}
                onClick={confirmPayBill}
                disabled={!paymentCode || paymentCode.length !== 7 || isPaying}
              >
                {isPaying ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt */}
      {showReceipt && receiptData && (
        <ReceiptPrinter
          bill={receiptData.bill}
          paymentCode={receiptData.paymentCode}
          referenceNumber={receiptData.referenceNumber}
          onClose={() => {
            setShowReceipt(false);
            setReceiptData(null);
          }}
        />
      )}

      {/* Table */}
      <div className="table-container">
        {filteredBills.length === 0 ? (
          <div className="empty-state">
            <p>No bills found. {searchTerm || activeFilterCount > 0 ? 'Try adjusting your filters.' : 'Add your first bill or import from Excel!'}</p>
          </div>
        ) : (
          <table className="bills-table">
            <thead>
              <tr>
                <th>WSIN</th>
                <th>Consumer</th>
                <th>Location</th>
                <th>Period</th>
                <th>Type</th>
                <th>Previous</th>
                <th>Present</th>
                <th>Consumption</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => {
                let displayStatus;
                if (bill.status === 'paid') {
                  displayStatus = 'paid';
                } else {
                  displayStatus = determineBillStatus(bill);
                }
                
                const status = getStatusBadge(displayStatus);
                const period = `${bill.month || 'N/A'} ${bill.year || ''}`;
                const consumption = bill.consumption || calculateConsumption(bill.presentReading, bill.previousReading);
                const amount = bill.amount || calculateBillAmount(bill.consumerType, consumption);
                
                return (
                  <tr key={bill.id}>
                    <td className="wsin-cell">{bill.billNumber || 'N/A'}</td>
                    <td className="name-cell">{bill.consumerName || 'N/A'}</td>
                    <td className="name-cell">{bill.location || 'N/A'}</td>
                    <td className="name-cell">{period.trim() || 'N/A'}</td>
                    <td>
                      <span className={`type-badge ${bill.consumerType?.toUpperCase() === 'RESIDENTIAL' ? 'residential' : 'commercial'}`}>
                        {bill.consumerType || 'N/A'}
                      </span>
                    </td>
                    <td className="name-cell">{bill.previousReading || '0'}</td>
                    <td className="name-cell">{bill.presentReading || '0'}</td>
                    <td className="name-cell" style={{ fontWeight: '600' }}>{consumption} m³</td>
                    <td className="name-cell" style={{ fontWeight: '600' }}>{formatCurrency(amount)}</td>
                    <td>
                      <span className={`status-badge ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-buttons">
                        {displayStatus !== 'paid' && (
                          <button className="action-btn pay" onClick={() => handlePayBill(bill)}>
                            PAY
                          </button>
                        )}
                        <button className="action-btn edit" onClick={() => handleEdit(bill)}>
                          EDIT
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(bill.id)}>
                          DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bill Form */}
      {showForm && (
        <BillForm
          bill={editingBill}
          onClose={handleFormClose}
          onSave={fetchBills}
        />
      )}
    </div>
  );
};

export default AdminDashboard;