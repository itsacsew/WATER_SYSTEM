// src/components/bills/BillDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, writeBatch, updateDoc, addDoc, limit, getDoc, setDoc } from 'firebase/firestore';
import { db, db2, db3, db4, db5, getDbByServer, getServerLabel, getServerColor, SERVER_CONFIGS } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import BillForm from './BillForm';
import ReceiptPrinter from './ReceiptPrinter';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import './BillStyles.css';
import ApplicationForm from './ApplicationForm';

const EXCEL_PASSWORD = 'Water_2026';
const DISCOUNT_RATE = 0.05;

// ============================================================
// SERVER 4 = OR NUMBER STORAGE + PAID BILLS ARCHIVE
// ============================================================
const OR_SERVER_KEY = 'server4';
const OR_COLLECTION = 'or_numbers';
const USED_OR_COLLECTION = 'used_or_numbers';
const ARCHIVE_COLLECTION = 'bills';

// ============================================================
// PHILIPPINE TIME HELPERS
// ============================================================
const getPhilippineTime = () => {
  const now = new Date();
  // Convert to Philippine Time (UTC+8)
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcMs + (8 * 3600000));
};

const formatPhilippineTime = (date = getPhilippineTime()) => {
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  return `${String(hours12).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
};

const formatPhilippineDate = (date = getPhilippineTime()) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const formatPaidDateTimePhilippine = (dateString) => {
  if (!dateString) return { date: 'N/A', time: 'N/A' };
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { date: 'N/A', time: 'N/A' };

    // Convert to Philippine Time
    const utcMs = d.getTime() + (d.getTimezoneOffset() * 60000);
    const phDate = new Date(utcMs + (8 * 3600000));

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[phDate.getMonth()];
    const day = phDate.getDate();
    const year = phDate.getFullYear();
    const dateStr = `${month} ${day}, ${year}`;

    const hours24 = phDate.getHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = String(phDate.getMinutes()).padStart(2, '0');
    const seconds = String(phDate.getSeconds()).padStart(2, '0');
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    const timeStr = `${String(hours12).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;

    return { date: dateStr, time: timeStr };
  } catch (e) {
    return { date: 'N/A', time: 'N/A' };
  }
};

// ============================================================
// HARD-CODED SVG ICONS
// ============================================================

const SummationCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M14.9998 14.4986C14.9981 15.0266 14.983 15.3137 14.8502 15.5299C14.5236 16.0612 13.8736 15.9976 13.3241 15.9976H10.7994C9.69158 15.9976 9.13766 15.9976 9.01957 15.6713C8.90149 15.345 9.32205 14.9765 10.1632 14.2394L11.8529 12.7588C12.2554 12.4062 12.4566 12.2298 12.4566 12C12.4566 11.7702 12.2554 11.5938 11.8529 11.2412L10.1632 9.76058C9.32205 9.02355 8.90149 8.65503 9.01957 8.3287C9.13766 8.00237 9.69158 8.00237 10.7994 8.00237H13.3241C13.8736 8.00237 14.5236 7.93885 14.8502 8.47006C14.983 8.68627 14.9981 8.97338 14.9998 9.50144" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"></circle>
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
    <path d="M14 22V18C14 16.8954 13.1046 16 12 16C10.8954 16 10 15.6569 10 18V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
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

const CalendarClockIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M15.5 2V6M7.5 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M20.3985 8C20.2706 6.69989 19.9816 5.82475 19.3284 5.17157C18.1569 4 16.2712 4 12.5 4H10.5C6.72876 4 4.84315 4 3.67157 5.17157C2.5 6.34315 2.5 8.22876 2.5 12V14C2.5 17.7712 2.5 19.6569 3.67157 20.8284C4.47975 21.6366 5.6277 21.8873 7.5 21.965" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M2.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M15.5 22C18.8137 22 21.5 19.3137 21.5 16C21.5 12.6863 18.8137 10 15.5 10C12.1863 10 9.5 12.6863 9.5 16C9.5 19.3137 12.1863 22 15.5 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M15.5 13V16L17.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
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

const User02Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
    <path d="M12 14C7 14 4 16.5 4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19C20 16.5 17 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const SecurityWarningIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M18.7088 3.49534C16.8165 2.55382 14.5009 2 12 2C9.4991 2 7.1835 2.55382 5.29116 3.49534C4.36318 3.95706 3.89919 4.18792 3.4496 4.91378C3 5.63965 3 6.34248 3 7.74814V11.2371C3 16.9205 7.54236 20.0804 10.173 21.4338C10.9067 21.8113 11.2735 22 12 22C12.7265 22 13.0933 21.8113 13.8269 21.4338C16.4576 20.0804 21 16.9205 21 11.2371L21 7.74814C21 6.34249 21 5.63966 20.5504 4.91378C20.1008 4.18791 19.6368 3.95706 18.7088 3.49534Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M12 11V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M12.125 14.75H12M12.25 14.75C12.25 14.8881 12.1381 15 12 15C11.8619 15 11.75 14.8881 11.75 14.75C11.75 14.6119 11.8619 14.5 12 14.5C12.1381 14.5 12.25 14.6119 12.25 14.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const PayAllIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M6.5 12L9.5 15L17.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
  </svg>
);

const ChevronLeftIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RegularTableIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} color="currentColor" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 15H21" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 3V21" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const CutoffTableIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} color="currentColor" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 15H21" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M15 3V21" stroke="currentColor" strokeWidth="1.5"/>
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

const SeniorIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color="currentColor" fill="none" {...props}>
    <circle cx="12" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 21V18M10 21V18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M21 10L20 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const PWDIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color="currentColor" fill="none" {...props}>
    <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 22L10.5 15L8 12L10 9L12 10L14 9L16 12L13.5 15L15 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 8L18 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const FilterIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} color="currentColor" fill="none" {...props}>
    <path d="M4 4H20L14 12V18L10 20V12L4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================================
// REALTIME PHILIPPINE TIME HOOK
// ============================================================
const usePhilippineTime = () => {
  const [now, setNow] = useState(getPhilippineTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(getPhilippineTime());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return now;
};

// ============================================================
// BILL CALCULATION FUNCTIONS
// ============================================================

const calculateBillAmount = (consumerType, consumption) => {
  const type = consumerType?.toUpperCase() || 'RESIDENTIAL';
  const consumptionNum = Number(consumption) || 0;

  if (type === 'RESIDENTIAL') {
    const FIRST_5_RATE = 62.50;
    const EXCESS_RATE = 12.50;
    if (consumptionNum <= 5) return FIRST_5_RATE;
    const excess = consumptionNum - 5;
    return FIRST_5_RATE + (excess * EXCESS_RATE);
  } else if (type === 'COMMERCIAL') {
    const TIER1_RATE = 15;
    const TIER2_RATE = 20;
    const TIER3_RATE = 30;
    const TIER1_LIMIT = 10;
    const TIER2_LIMIT = 20;
    if (consumptionNum <= TIER1_LIMIT) return 150;
    if (consumptionNum <= TIER2_LIMIT) {
      return (TIER1_LIMIT * TIER1_RATE) + ((consumptionNum - TIER1_LIMIT) * TIER2_RATE);
    }
    return (TIER1_LIMIT * TIER1_RATE) + ((TIER2_LIMIT - TIER1_LIMIT) * TIER2_RATE) + ((consumptionNum - TIER2_LIMIT) * TIER3_RATE);
  }
  return 0;
};

const calculateConsumption = (presentReading, previousReading) => {
  const present = Number(presentReading) || 0;
  const previous = Number(previousReading) || 0;
  return Math.max(0, present - previous);
};

const isDefective = (reading) => {
  if (!reading && reading !== 0) return false;
  const str = String(reading).toUpperCase().trim();
  return str === 'DEFECTIVE' || str === 'D' || str === 'DEF' || str.includes('DEFECTIVE');
};

const isNAReading = (reading) => {
  if (!reading && reading !== 0) return false;
  const str = String(reading).toUpperCase().trim();
  return str === 'N/A' || str === 'NA' || str === 'N\\A' || str === 'NULL' || str === '-';
};

const isCutoffBill = (bill) => {
  const statusStr = String(bill.status || '').toUpperCase().trim();
  if (statusStr === 'CUTOFF' || statusStr === 'CUT-OFF' || statusStr === 'CUT OFF') return true;
  const presentNA = isNAReading(bill.presentReading);
  const previousNA = isNAReading(bill.previousReading);
  if (presentNA && previousNA) return true;
  return false;
};

const calculateWithDefective = (presentReading, previousReading, consumerType) => {
  const isPresentDefective = isDefective(presentReading);
  const isPreviousDefective = isDefective(previousReading);
  const isDefectiveReading = isPresentDefective || isPreviousDefective;
  let consumption = 0;
  if (isDefectiveReading) {
    consumption = 0;
  } else {
    const present = Number(presentReading) || 0;
    const previous = Number(previousReading) || 0;
    consumption = Math.max(0, present - previous);
  }
  let amount = 0;
  const type = consumerType?.toUpperCase() || 'RESIDENTIAL';
  if (isDefectiveReading) {
    amount = type === 'RESIDENTIAL' ? 75 : 150;
  } else {
    amount = calculateBillAmount(consumerType, consumption);
  }
  return { consumption, isDefective: isDefectiveReading, amount, isPresentDefective, isPreviousDefective };
};

const getCurrentPeriod = () => {
  const now = getPhilippineTime();
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  return {
    currentMonth: months[now.getMonth()],
    currentMonthIndex: now.getMonth(),
    currentYear: now.getFullYear()
  };
};

const MONTH_ORDER = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                     'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

const getMonthIndex = (monthName) => {
  if (!monthName) return -1;
  const idx = MONTH_ORDER.indexOf(monthName.toUpperCase());
  return idx !== -1 ? idx : -1;
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
  if (isCutoffBill(bill)) return 'cutoff';
  const isOverdue = isBillOverdue(bill.month, bill.year);
  if (isOverdue) return 'overdue';
  return 'unpaid';
};

const processBillsWithStatus = (billsData) => {
  return billsData.map(bill => {
    if (bill.status === 'paid') return bill;
    if (isCutoffBill(bill)) {
      return { ...bill, status: 'cutoff' };
    }
    const computedStatus = determineBillStatus(bill);
    return { ...bill, status: computedStatus };
  });
};

const sortByConsumerPeriod = (data) => {
  return [...data].sort((a, b) => {
    const nameA = (a.consumerName || '').toUpperCase().trim();
    const nameB = (b.consumerName || '').toUpperCase().trim();
    if (nameA !== nameB) return nameA.localeCompare(nameB);
    const yearA = parseInt(a.year) || 0;
    const yearB = parseInt(b.year) || 0;
    if (yearA !== yearB) return yearA - yearB;
    const monthA = getMonthIndex(a.month);
    const monthB = getMonthIndex(b.month);
    if (monthA !== monthB) return monthA - monthB;
    const numA = Number(a.billNumber) || 0;
    const numB = Number(b.billNumber) || 0;
    return numA - numB;
  });
};

const getConsumerPeriodOptions = (billsData) => {
  const periodSet = new Set();
  billsData.forEach(bill => {
    if (bill.consumerName && bill.month && bill.year) {
      const key = `${bill.consumerName.toUpperCase()}|${bill.month.toUpperCase()}|${bill.year}`;
      periodSet.add(key);
    }
  });
  const periods = Array.from(periodSet).map(key => {
    const [consumerName, month, year] = key.split('|');
    return { consumerName, month, year, key };
  });
  periods.sort((a, b) => {
    if (a.consumerName !== b.consumerName) return a.consumerName.localeCompare(b.consumerName);
    if (a.year !== b.year) return Number(a.year) - Number(b.year);
    return MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month);
  });
  return periods;
};

// ============================================================
// MARK OR AS USED + STORE IN USED_OR_COLLECTION
// ============================================================
const markORAsUsed = async (orNumber, orDocId, billInfo, paymentCode, userEmail) => {
  try {
    const orDb = getDbByServer(OR_SERVER_KEY);
    const usedRef = collection(orDb, USED_OR_COLLECTION);

    const usedAt = new Date().toISOString();

    if (orDocId) {
      try {
        const orRef = doc(orDb, OR_COLLECTION, orDocId);
        await updateDoc(orRef, {
          status: 'used',
          usedAt,
          usedBy: userEmail || 'Unknown',
          billId: billInfo?.id || null,
          billNumber: billInfo?.billNumber || null,
          consumerName: billInfo?.consumerName || null,
          paymentCode,
          serverSource: billInfo?.serverSource || null,
          referenceNumber: billInfo?.referenceNumber || null
        });
      } catch (e) {
        console.warn('⚠️ OR doc not found, skipping update:', e.message);
      }
    }

    const usedDocId = `${orNumber}_${Date.now()}`;
    await setDoc(doc(usedRef, usedDocId), {
      orNumber,
      originalOrDocId: orDocId || null,
      status: 'used',
      usedAt,
      usedBy: userEmail || 'Unknown',
      billId: billInfo?.id || null,
      billNumber: billInfo?.billNumber || null,
      consumerName: billInfo?.consumerName || null,
      consumerAddress: billInfo?.location || null,
      month: billInfo?.month || null,
      year: billInfo?.year || null,
      amount: billInfo?.amount || 0,
      paymentCode,
      referenceNumber: billInfo?.referenceNumber || null,
      serverSource: billInfo?.serverSource || null,
      archivedAt: usedAt
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error marking OR as used:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// AUTO-ARCHIVE PAID BILL TO SERVER 4
// ============================================================
const archivePaidBill = async (bill, paymentCode, referenceNumber, originalServer) => {
  try {
    const archiveDb = getDbByServer(OR_SERVER_KEY);
    const archiveRef = collection(archiveDb, ARCHIVE_COLLECTION);

    const archiveDocId = `${bill.id}_${Date.now()}`;

    const archiveData = {
      billNumber: bill.billNumber || 'N/A',
      consumerName: bill.consumerName || 'N/A',
      location: bill.location || 'N/A',
      consumerType: bill.consumerType || 'RESIDENTIAL',
      month: bill.month || 'N/A',
      year: bill.year || 'N/A',
      previousReading: bill.previousReading ?? 0,
      presentReading: bill.presentReading ?? 0,
      consumption: bill.consumption ?? 0,
      amount: bill.amount ?? 0,
      originalAmount: bill.originalAmount ?? bill.amount ?? 0,
      discountAmount: bill.discountAmount ?? 0,
      discountType: bill.discountType || null,
      hasDiscount: bill.hasDiscount ?? false,
      status: 'paid',
      type: bill.type || bill.consumerType || 'RESIDENTIAL',
      dueDate: bill.dueDate || null,
      notes: bill.notes || '',

      archived: true,
      archivedAt: new Date().toISOString(),
      archivedFrom: originalServer,
      archivedFromLabel: getServerLabel(originalServer),
      originalBillId: bill.id,

      paymentCode: paymentCode || 'N/A',
      referenceNumber: referenceNumber || 'N/A',
      paidAt: bill.paidAt || new Date().toISOString(),
      paidBy: bill.paidBy || 'Unknown',
      paidVia: bill.paidVia || 'PAY',

      createdAt: bill.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      userId: bill.userId || 'unknown',
      serverSource: originalServer
    };

    await setDoc(doc(archiveRef, archiveDocId), archiveData);
    return { success: true, archiveId: archiveDocId };
  } catch (error) {
    console.error('❌ Archive error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// PAID DATE TIME DISPLAY COMPONENT (Realtime)
// ============================================================
const PaidDateTimeDisplay = ({ paidAt }) => {
  const phTime = usePhilippineTime();

  if (!paidAt) {
    return (
      <div style={{
        fontSize: '9px',
        color: '#64748B',
        fontWeight: '600',
        marginTop: '4px',
        lineHeight: '1.4',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ color: '#94A3B8' }}>📅 N/A</div>
        <div style={{ color: '#94A3B8' }}>🕐 N/A</div>
      </div>
    );
  }

  const { date, time } = formatPaidDateTimePhilippine(paidAt);

  // Compute live elapsed time if paid today
  const paidDateObj = new Date(paidAt);
  const utcMs = paidDateObj.getTime() + (paidDateObj.getTimezoneOffset() * 60000);
  const paidPhDate = new Date(utcMs + (8 * 3600000));

  const isToday =
    paidPhDate.getDate() === phTime.getDate() &&
    paidPhDate.getMonth() === phTime.getMonth() &&
    paidPhDate.getFullYear() === phTime.getFullYear();

  let elapsedText = null;
  if (isToday) {
    const diffMs = phTime.getTime() - paidPhDate.getTime();
    if (diffMs >= 0) {
      const totalSecs = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      elapsedText = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  return (
    <div style={{
      fontSize: '9px',
      color: '#16A34A',
      fontWeight: '700',
      marginTop: '4px',
      lineHeight: '1.4',
      fontFamily: 'Inter, sans-serif',
      whiteSpace: 'nowrap'
    }}>
      <div style={{ color: '#15803D' }}>📅 {date}</div>
      <div style={{ color: '#15803D' }}>🕐 {time}</div>
      {elapsedText && (
        <div style={{
          color: '#0D9488',
          fontSize: '8px',
          marginTop: '1px',
          fontWeight: '600'
        }}>
          ⏱️ {elapsedText} ago
        </div>
      )}
    </div>
  );
};

// ============================================================
// BILL DASHBOARD COMPONENT
// ============================================================

const BillDashboard = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedServer, setSelectedServer] = useState('server1');
  const [selectedBillIds, setSelectedBillIds] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterConsumerPeriod, setFilterConsumerPeriod] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentCode, setPaymentCode] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [isSeniorCitizen, setIsSeniorCitizen] = useState(false);
  const [isPWD, setIsPWD] = useState(false);

  const [tableType, setTableType] = useState('regular');

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [showPayAllModal, setShowPayAllModal] = useState(false);
  const [payAllBills, setPayAllBills] = useState([]);
  const [payAllConsumerName, setPayAllConsumerName] = useState('');
  const [payAllPaymentCode, setPayAllPaymentCode] = useState('');
  const [payAllPaymentError, setPayAllPaymentError] = useState('');
  const [isPayingAll, setIsPayingAll] = useState(false);

  const [showCutoffPayModal, setShowCutoffPayModal] = useState(false);
  const [cutoffBillToPay, setCutoffBillToPay] = useState(null);
  const [cutoffPaymentCode, setCutoffPaymentCode] = useState('');
  const [cutoffPaymentError, setCutoffPaymentError] = useState('');
  const [isPayingCutoff, setIsPayingCutoff] = useState(false);

  const [showCutoffPayAllModal, setShowCutoffPayAllModal] = useState(false);
  const [cutoffPayAllBills, setCutoffPayAllBills] = useState([]);
  const [cutoffPayAllConsumerName, setCutoffPayAllConsumerName] = useState('');
  const [cutoffPayAllPaymentCode, setCutoffPayAllPaymentCode] = useState('');
  const [cutoffPayAllPaymentError, setCutoffPayAllPaymentError] = useState('');
  const [isPayingCutoffAll, setIsPayingCutoffAll] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportLocation, setSelectedExportLocation] = useState('all');
  const [exportLocations, setExportLocations] = useState([]);

  const [locations, setLocations] = useState([]);
  const [months, setMonths] = useState([]);
  const [years, setYears] = useState([]);
  const [consumerPeriods, setConsumerPeriods] = useState([]);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const [stats, setStats] = useState({
    total: 0, paid: 0, unpaid: 0, overdue: 0,
    totalConsumers: 0, residential: 0, commercial: 0, location: ''
  });

  // Realtime PH time for the header clock
  const phNow = usePhilippineTime();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterLocation, filterMonth, filterYear, filterConsumerPeriod, selectedServer, tableType]);

  const fetchBills = useCallback(async (serverKey) => {
    if (!user) return;

    setLoading(true);

    try {
      const allBills = [];

      if (serverKey === 'all') {
        for (const serverConfig of SERVER_CONFIGS) {
          try {
            const billsRef = collection(serverConfig.db, 'bills');
            const q = query(billsRef, orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            snap.forEach((docSnap) => {
              allBills.push({
                id: docSnap.id,
                ...docSnap.data(),
                serverSource: serverConfig.key,
                _server: serverConfig.key
              });
            });
          } catch (e) {
            console.error(`❌ Error fetching from ${serverConfig.label}:`, e);
          }
        }
      } else {
        const serverConfig = SERVER_CONFIGS.find(s => s.key === serverKey);
        if (!serverConfig) {
          toast.error(`Server not found: ${serverKey}`);
          setLoading(false);
          return;
        }

        try {
          const billsRef = collection(serverConfig.db, 'bills');
          const q = query(billsRef, orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          snap.forEach((docSnap) => {
            allBills.push({
              id: docSnap.id,
              ...docSnap.data(),
              serverSource: serverConfig.key,
              _server: serverConfig.key
            });
          });
        } catch (e) {
          console.error(`❌ Error fetching from ${serverConfig.label}:`, e);
          toast.error(`Error loading from ${serverConfig.label}`);
        }
      }

      const processedBills = processBillsWithStatus(allBills);
      const sortedBills = sortByConsumerPeriod(processedBills);

      setBills(sortedBills);
      setFilteredBills(sortedBills);
      calculateStats(sortedBills);
      extractFilterOptions(sortedBills);

      setSelectedBillIds([]);

    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Error loading bills from database');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBills(selectedServer);
    }
  }, [user, selectedServer, fetchBills]);

  useEffect(() => {
    filterBills();
  }, [bills, searchTerm, filterType, filterLocation, filterMonth, filterYear, filterConsumerPeriod, tableType]);

  useEffect(() => {
    if (showPayModal) {
      setPaymentCode('');
      setPaymentError('');
      setIsSeniorCitizen(false);
      setIsPWD(false);
    }
  }, [showPayModal]);

  useEffect(() => {
    if (showPayAllModal) {
      setPayAllPaymentCode('');
      setPayAllPaymentError('');
      setIsSeniorCitizen(false);
      setIsPWD(false);
    }
  }, [showPayAllModal]);

  useEffect(() => {
    if (showCutoffPayModal) {
      setCutoffPaymentCode('');
      setCutoffPaymentError('');
    }
  }, [showCutoffPayModal]);

  useEffect(() => {
    if (showCutoffPayAllModal) {
      setCutoffPayAllPaymentCode('');
      setCutoffPayAllPaymentError('');
    }
  }, [showCutoffPayAllModal]);

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
      if (bill.location && bill.location !== 'N/A') locationSet.add(bill.location);
      if (bill.month && bill.month !== 'N/A') monthSet.add(bill.month);
      if (bill.year && bill.year !== 'N/A') yearSet.add(bill.year);
    });

    setLocations(Array.from(locationSet).sort());
    setMonths(Array.from(monthSet).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)));
    setYears(Array.from(yearSet).sort((a, b) => Number(b) - Number(a)));
    setConsumerPeriods(getConsumerPeriodOptions(billsData));
  };

  const filterBills = () => {
    let filtered = [...bills];

    if (tableType === 'regular') {
      filtered = filtered.filter(bill => !isCutoffBill(bill));
    } else {
      filtered = filtered.filter(bill => isCutoffBill(bill));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(bill =>
        bill.consumerName?.toLowerCase().includes(term) ||
        bill.billNumber?.toString().includes(term)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(bill => bill.consumerType?.toUpperCase() === filterType.toUpperCase());
    }

    if (filterLocation !== 'all') {
      filtered = filtered.filter(bill => bill.location === filterLocation);
    }

    if (filterMonth !== 'all') {
      filtered = filtered.filter(bill => bill.month?.toUpperCase() === filterMonth.toUpperCase());
    }

    if (filterYear !== 'all') {
      filtered = filtered.filter(bill => bill.year === filterYear);
    }

    if (filterConsumerPeriod !== 'all') {
      const [consumerName, month, year] = filterConsumerPeriod.split('|');
      filtered = filtered.filter(bill =>
        bill.consumerName?.toUpperCase() === consumerName?.toUpperCase() &&
        bill.month?.toUpperCase() === month?.toUpperCase() &&
        bill.year === year
      );
    }

    if (tableType === 'regular') {
      filtered = processBillsWithStatus(filtered);
    }
    filtered = sortByConsumerPeriod(filtered);
    setFilteredBills(filtered);
  };

  const calculateStats = (billsData) => {
    const regularBills = billsData.filter(b => !isCutoffBill(b));
    const processed = processBillsWithStatus(regularBills);

    const total = processed.length;
    const paid = processed.filter(b => b.status === 'paid').length;
    const unpaid = processed.filter(b => b.status === 'unpaid').length;
    const overdue = processed.filter(b => b.status === 'overdue').length;

    const uniqueConsumers = new Set();
    const residentialCount = processed.filter(b => b.consumerType?.toUpperCase() === 'RESIDENTIAL').length;
    const commercialCount = processed.filter(b => b.consumerType?.toUpperCase() === 'COMMERCIAL').length;

    processed.forEach(b => {
      if (b.consumerName) uniqueConsumers.add(b.consumerName);
    });

    const locationSet = new Set();
    processed.forEach(b => {
      if (b.location) locationSet.add(b.location);
    });
    const locationString = Array.from(locationSet).join(', ') || 'N/A';

    setStats({
      total, paid, unpaid, overdue,
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
    setFilterConsumerPeriod('all');
    setSelectedBillIds([]);
  };

  const handleServerChange = (e) => {
    const newServer = e.target.value;
    setSelectedServer(newServer);
    setCurrentPage(1);

    setSearchTerm('');
    setFilterType('all');
    setFilterLocation('all');
    setFilterMonth('all');
    setFilterYear('all');
    setFilterConsumerPeriod('all');
    setSelectedBillIds([]);

    if (newServer === 'all') {
      toast.loading('Loading all servers...', { duration: 2000 });
    }
  };

  const handleToggleBillSelection = (billId) => {
    setSelectedBillIds(prev => {
      if (prev.includes(billId)) {
        return prev.filter(id => id !== billId);
      } else {
        return [...prev, billId];
      }
    });
  };

  const handleSelectAllOnPage = () => {
    const currentPageBills = getCurrentPageData()
      .filter(bill => bill.status !== 'paid' && !isCutoffBill(bill))
      .map(b => b.id);

    const allSelected = currentPageBills.every(id => selectedBillIds.includes(id));

    if (allSelected) {
      setSelectedBillIds(prev => prev.filter(id => !currentPageBills.includes(id)));
    } else {
      setSelectedBillIds(prev => {
        const newIds = new Set([...prev, ...currentPageBills]);
        return Array.from(newIds);
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedBillIds([]);
  };

  const handleSelectedPay = () => {
    if (selectedBillIds.length === 0) {
      toast.error('Please select at least one bill to pay');
      return;
    }

    const selectedBills = filteredBills.filter(b => selectedBillIds.includes(b.id));

    if (selectedBills.length === 0) {
      toast.error('No bills found for selected IDs');
      return;
    }

    const uniqueConsumers = new Set(selectedBills.map(b => b.consumerName?.toUpperCase()));
    if (uniqueConsumers.size > 1) {
      toast.error('Please select bills from the same consumer only');
      return;
    }

    const consumerName = selectedBills[0].consumerName;

    const sortedSelected = [...selectedBills].sort((a, b) => {
      const aIndex = MONTH_ORDER.indexOf(a.month?.toUpperCase());
      const bIndex = MONTH_ORDER.indexOf(b.month?.toUpperCase());
      if (a.year !== b.year) return Number(a.year) - Number(b.year);
      return aIndex - bIndex;
    });

    setPayAllBills(sortedSelected);
    setPayAllConsumerName(consumerName);
    setShowPayAllModal(true);
  };

  const handleDelete = async (billId) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    const bill = bills.find(b => b.id === billId);
    const targetDb = getDbByServer(bill?.serverSource || selectedServer);

    try {
      await deleteDoc(doc(targetDb, 'bills', billId));
      toast.success(`Bill deleted from ${getServerLabel(bill?.serverSource)}`);
      fetchBills(selectedServer);
    } catch (error) {
      console.error('Delete error:', error);
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
    fetchBills(selectedServer);
  };

  const handlePayBill = (bill) => {
    setSelectedBill(bill);
    setShowPayModal(true);
  };

  const handleCutoffPay = (bill) => {
    setCutoffBillToPay(bill);
    setShowCutoffPayModal(true);
  };

  const handleCutoffPayAll = (consumerName) => {
    const unpaidCutoffBills = bills.filter(bill =>
      bill.consumerName?.toLowerCase() === consumerName.toLowerCase() &&
      isCutoffBill(bill) &&
      bill.status !== 'paid'
    );

    if (unpaidCutoffBills.length === 0) {
      toast.error(`No unpaid cut-off bills found for ${consumerName}`);
      return;
    }

    const sortedUnpaid = [...unpaidCutoffBills].sort((a, b) => {
      const aIndex = MONTH_ORDER.indexOf(a.month?.toUpperCase());
      const bIndex = MONTH_ORDER.indexOf(b.month?.toUpperCase());
      if (a.year !== b.year) return Number(a.year) - Number(b.year);
      return aIndex - bIndex;
    });

    setCutoffPayAllBills(sortedUnpaid);
    setCutoffPayAllConsumerName(consumerName);
    setShowCutoffPayAllModal(true);
  };

  const handlePaymentCodeChange = (e) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '').slice(0, 7);
    setPaymentCode(digitsOnly);
    setPaymentError('');
  };

  const handleCutoffPaymentCodeChange = (e) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '').slice(0, 7);
    setCutoffPaymentCode(digitsOnly);
    setCutoffPaymentError('');
  };

  const handleCutoffPayAllPaymentCodeChange = (e) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '').slice(0, 7);
    setCutoffPayAllPaymentCode(digitsOnly);
    setCutoffPayAllPaymentError('');
  };

  const handlePayAllPaymentCodeChange = (e) => {
    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '').slice(0, 7);
    setPayAllPaymentCode(digitsOnly);
    setPayAllPaymentError('');
  };

  const confirmCutoffPay = async () => {
    if (!cutoffPaymentCode || cutoffPaymentCode.length !== 7) {
      setCutoffPaymentError('Please enter a valid 7-digit OR number.');
      return;
    }
    if (!cutoffBillToPay) return;

    setIsPayingCutoff(true);

    try {
      const referenceNumber = `CUTOFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const amountToPay = cutoffBillToPay.amount || cutoffBillToPay.collectableAmount || 0;
      const originalServer = cutoffBillToPay.serverSource || selectedServer;
      const targetDb = getDbByServer(originalServer);
      const billRef = doc(targetDb, 'bills', cutoffBillToPay.id);

      const paidBillData = {
        status: 'paid',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentCode: cutoffPaymentCode,
        referenceNumber,
        paidBy: user?.email || 'Unknown',
        amount: amountToPay,
        amountCalculated: true,
        isCutoff: true,
        paidVia: 'CUTOFF_PAY',
        calculationDetails: {
          consumerType: cutoffBillToPay.consumerType || cutoffBillToPay.type || 'RESIDENTIAL',
          collectableAmount: amountToPay,
          calculatedAmount: amountToPay,
          calculatedAt: new Date().toISOString(),
          isCutoff: true
        }
      };

      await updateDoc(billRef, paidBillData);

      await archivePaidBill(
        { ...cutoffBillToPay, ...paidBillData },
        cutoffPaymentCode,
        referenceNumber,
        originalServer
      );

      await markORAsUsed(
        cutoffPaymentCode,
        null,
        {
          id: cutoffBillToPay.id,
          billNumber: cutoffBillToPay.billNumber,
          consumerName: cutoffBillToPay.consumerName,
          location: cutoffBillToPay.location,
          month: cutoffBillToPay.month,
          year: cutoffBillToPay.year,
          amount: amountToPay,
          serverSource: originalServer,
          referenceNumber
        },
        cutoffPaymentCode,
        user?.email || 'Unknown'
      );

      toast.success(`✅ Cut-off bill ${cutoffBillToPay.billNumber} marked as paid!`);
      toast.success(`💰 Amount: ₱${amountToPay.toFixed(2)}`);
      toast.success(`📋 OR Number: ${cutoffPaymentCode}`);
      toast.success(`📦 Archived to Server 4`, { duration: 4000, icon: '🗄️' });

      setShowCutoffPayModal(false);

      setReceiptData({
        bill: { ...cutoffBillToPay, ...paidBillData, consumption: 'CUT-OFF', amount: amountToPay, isDefective: false, isCutoff: true },
        paymentCode: cutoffPaymentCode,
        referenceNumber
      });
      setShowReceipt(true);

      setCutoffBillToPay(null);
      setCutoffPaymentCode('');
      setCutoffPaymentError('');
      fetchBills(selectedServer);
    } catch (error) {
      console.error('❌ Cutoff payment error:', error);
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check your Firestore rules.');
      } else {
        toast.error('Error updating bill status: ' + error.message);
      }
    } finally {
      setIsPayingCutoff(false);
    }
  };

  const confirmCutoffPayAll = async () => {
    if (!cutoffPayAllPaymentCode || cutoffPayAllPaymentCode.length !== 7) {
      setCutoffPayAllPaymentError('Please enter a valid 7-digit OR number.');
      return;
    }
    if (cutoffPayAllBills.length === 0) {
      toast.error('No cut-off bills to pay');
      return;
    }

    setIsPayingCutoffAll(true);

    try {
      const referenceNumber = `CUTOFF-ALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      let successCount = 0;
      let errorCount = 0;
      let totalAmount = 0;
      let paymentDetails = [];

      for (const bill of cutoffPayAllBills) {
        try {
          const amountToPay = bill.amount || bill.collectableAmount || 0;
          const originalServer = bill.serverSource || selectedServer;
          const targetDb = getDbByServer(originalServer);
          const billRef = doc(targetDb, 'bills', bill.id);

          const paidBillData = {
            status: 'paid',
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            paymentCode: cutoffPayAllPaymentCode,
            referenceNumber,
            paidBy: user?.email || 'Unknown',
            amount: amountToPay,
            amountCalculated: true,
            isCutoff: true,
            paidVia: 'CUTOFF_PAY_ALL',
            calculationDetails: {
              consumerType: bill.consumerType || bill.type || 'RESIDENTIAL',
              collectableAmount: amountToPay,
              calculatedAmount: amountToPay,
              calculatedAt: new Date().toISOString(),
              isCutoff: true
            }
          };

          await updateDoc(billRef, paidBillData);

          await archivePaidBill(
            { ...bill, ...paidBillData },
            cutoffPayAllPaymentCode,
            referenceNumber,
            originalServer
          );

          totalAmount += amountToPay;
          successCount++;

          paymentDetails.push({
            month: bill.month, year: bill.year, billNumber: bill.billNumber,
            amount: amountToPay, consumption: 0, isCutoff: true
          });
        } catch (error) {
          console.error('Error processing cut-off bill:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        await markORAsUsed(
          cutoffPayAllPaymentCode,
          null,
          {
            id: 'CUTOFF_PAY_ALL',
            billNumber: cutoffPayAllBills[0]?.billNumber || 'MULTIPLE',
            consumerName: cutoffPayAllConsumerName,
            month: 'MULTIPLE',
            year: 'MULTIPLE',
            amount: totalAmount,
            serverSource: cutoffPayAllBills[0]?.serverSource || selectedServer,
            referenceNumber
          },
          cutoffPayAllPaymentCode,
          user?.email || 'Unknown'
        );

        toast.success(`✅ Successfully paid ${successCount} cut-off bills for ${cutoffPayAllConsumerName}!`);
        toast.success(`💰 Total Amount: ₱${totalAmount.toFixed(2)}`);
        toast.success(`📋 OR Number: ${cutoffPayAllPaymentCode}`);
        toast.success(`📦 Archived ${successCount} bills to Server 4`, { duration: 4000, icon: '🗄️' });

        setReceiptData({
          bill: {
            ...cutoffPayAllBills[0],
            consumerName: cutoffPayAllConsumerName,
            consumption: 'CUT-OFF Multiple Bills',
            amount: totalAmount,
            isDefective: false,
            isPayAll: true,
            isCutoff: true,
            payAllCount: successCount,
            payAllDetails: paymentDetails,
            paymentCode: cutoffPayAllPaymentCode,
            referenceNumber
          },
          paymentCode: cutoffPayAllPaymentCode,
          referenceNumber,
          isPayAll: true,
          isCutoff: true,
          payAllDetails: paymentDetails
        });
        setShowReceipt(true);
      }

      if (errorCount > 0) toast.error(`⚠️ ${errorCount} cut-off bills failed to process`);

      setShowCutoffPayAllModal(false);
      setCutoffPayAllBills([]);
      setCutoffPayAllPaymentCode('');
      setCutoffPayAllPaymentError('');
      fetchBills(selectedServer);
    } catch (error) {
      console.error('❌ Cutoff Pay All error:', error);
      toast.error('Error processing payment: ' + error.message);
    } finally {
      setIsPayingCutoffAll(false);
    }
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredBills.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredBills.length / rowsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getPaginationInfo = () => {
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, filteredBills.length);
    return `Showing ${start} - ${end} of ${filteredBills.length} bills`;
  };

  const handlePayAll = (consumerName) => {
    const unpaidBills = bills.filter(bill =>
      bill.consumerName?.toLowerCase() === consumerName.toLowerCase() &&
      bill.status !== 'paid' &&
      !isCutoffBill(bill)
    );

    if (unpaidBills.length === 0) {
      toast.error(`No unpaid bills found for ${consumerName}`);
      return;
    }

    const sortedUnpaid = [...unpaidBills].sort((a, b) => {
      const aIndex = MONTH_ORDER.indexOf(a.month?.toUpperCase());
      const bIndex = MONTH_ORDER.indexOf(b.month?.toUpperCase());
      if (a.year !== b.year) return Number(a.year) - Number(b.year);
      return aIndex - bIndex;
    });

    setPayAllBills(sortedUnpaid);
    setPayAllConsumerName(consumerName);
    setShowPayAllModal(true);
  };

  const confirmPayAll = async () => {
    if (!payAllPaymentCode || payAllPaymentCode.length !== 7) {
      setPayAllPaymentError('Please enter a valid 7-digit OR number.');
      return;
    }
    if (payAllBills.length === 0) {
      toast.error('No bills to pay');
      return;
    }

    const hasDiscount = isSeniorCitizen || isPWD;
    const discountType = isSeniorCitizen && isPWD
      ? 'SENIOR & PWD'
      : isSeniorCitizen
        ? 'SENIOR CITIZEN'
        : isPWD
          ? 'PWD'
          : null;

    setIsPayingAll(true);

    try {
      const referenceNumber = `PAYALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      let successCount = 0;
      let errorCount = 0;
      let totalAmount = 0;
      let totalDiscount = 0;
      let totalOriginalAmount = 0;
      let paymentDetails = [];

      for (const bill of payAllBills) {
        try {
          const isPresentDefective = isDefective(bill.presentReading);
          const isPreviousDefective = isDefective(bill.previousReading);
          const isDefectiveReading = isPresentDefective || isPreviousDefective;

          let consumption = 0;
          let originalAmount = 0;

          if (isDefectiveReading) {
            consumption = 0;
            originalAmount = bill.consumerType?.toUpperCase() === 'COMMERCIAL' ? 150 : 75;
          } else {
            consumption = calculateConsumption(bill.presentReading, bill.previousReading);
            originalAmount = calculateBillAmount(bill.consumerType, consumption);
          }

          const discountAmount = hasDiscount ? originalAmount * DISCOUNT_RATE : 0;
          const finalAmount = originalAmount - discountAmount;

          const originalServer = bill.serverSource || selectedServer;
          const targetDb = getDbByServer(originalServer);
          const billRef = doc(targetDb, 'bills', bill.id);

          const paidBillData = {
            status: 'paid',
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            paymentCode: payAllPaymentCode,
            referenceNumber,
            paidBy: user?.email || 'Unknown',
            consumption,
            amount: finalAmount,
            originalAmount: originalAmount,
            discountAmount: discountAmount,
            discountType: discountType,
            hasDiscount: hasDiscount,
            discountRate: hasDiscount ? DISCOUNT_RATE : 0,
            amountCalculated: true,
            isDefective: isDefectiveReading,
            isPresentDefective,
            isPreviousDefective,
            paidVia: 'PAY_ALL',
            calculationDetails: {
              consumerType: bill.consumerType || 'RESIDENTIAL',
              previousReading: bill.previousReading || 0,
              presentReading: bill.presentReading || 0,
              consumption,
              originalAmount,
              discountAmount,
              finalAmount,
              hasDiscount,
              discountType,
              calculatedAt: new Date().toISOString(),
              isDefective: isDefectiveReading
            }
          };

          await updateDoc(billRef, paidBillData);

          await archivePaidBill(
            { ...bill, ...paidBillData },
            payAllPaymentCode,
            referenceNumber,
            originalServer
          );

          totalOriginalAmount += originalAmount;
          totalDiscount += discountAmount;
          totalAmount += finalAmount;
          successCount++;

          paymentDetails.push({
            month: bill.month, year: bill.year, billNumber: bill.billNumber,
            amount: finalAmount,
            originalAmount,
            discountAmount,
            consumption,
            isDefective: isDefectiveReading,
            hasDiscount,
            discountType
          });
        } catch (error) {
          console.error('Error processing bill:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        await markORAsUsed(
          payAllPaymentCode,
          null,
          {
            id: 'PAY_ALL',
            billNumber: payAllBills[0]?.billNumber || 'MULTIPLE',
            consumerName: payAllConsumerName,
            month: 'MULTIPLE',
            year: 'MULTIPLE',
            amount: totalAmount,
            serverSource: payAllBills[0]?.serverSource || selectedServer,
            referenceNumber
          },
          payAllPaymentCode,
          user?.email || 'Unknown'
        );

        toast.success(`✅ Successfully paid ${successCount} bills for ${payAllConsumerName}!`);
        toast.success(`💰 Total Amount: ₱${totalAmount.toFixed(2)}`);
        if (hasDiscount) {
          toast.success(`🎉 ${discountType} Discount (5%): -₱${totalDiscount.toFixed(2)}`, {
            duration: 5000,
            style: {
              background: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #F59E0B'
            }
          });
        }
        toast.success(`📋 OR Number: ${payAllPaymentCode}`);
        toast.success(`📦 Archived ${successCount} bills to Server 4`, { duration: 4000, icon: '🗄️' });

        setReceiptData({
          bill: {
            ...payAllBills[0],
            consumerName: payAllConsumerName,
            consumption: 'Multiple Bills',
            amount: totalAmount,
            originalAmount: totalOriginalAmount,
            discountAmount: totalDiscount,
            discountType: discountType,
            hasDiscount: hasDiscount,
            isDefective: false,
            isPayAll: true,
            payAllCount: successCount,
            payAllDetails: paymentDetails,
            paymentCode: payAllPaymentCode,
            referenceNumber
          },
          paymentCode: payAllPaymentCode,
          referenceNumber,
          isPayAll: true,
          payAllDetails: paymentDetails,
          discount: {
            type: discountType,
            rate: DISCOUNT_RATE,
            amount: totalDiscount
          }
        });
        setShowReceipt(true);
      }

      if (errorCount > 0) toast.error(`⚠️ ${errorCount} bills failed to process`);

      setShowPayAllModal(false);
      setPayAllBills([]);
      setPayAllPaymentCode('');
      setPayAllPaymentError('');
      setSelectedBillIds([]);
      setIsSeniorCitizen(false);
      setIsPWD(false);
      fetchBills(selectedServer);
    } catch (error) {
      console.error('❌ Pay All error:', error);
      toast.error('Error processing payment: ' + error.message);
    } finally {
      setIsPayingAll(false);
    }
  };

  const confirmPayBill = async () => {
    if (!paymentCode || paymentCode.length !== 7) {
      setPaymentError('Please enter a valid 7-digit OR number.');
      return;
    }
    if (!selectedBill) return;

    const hasDiscount = isSeniorCitizen || isPWD;
    const discountType = isSeniorCitizen && isPWD
      ? 'SENIOR & PWD'
      : isSeniorCitizen
        ? 'SENIOR CITIZEN'
        : isPWD
          ? 'PWD'
          : null;

    setIsPaying(true);

    try {
      const referenceNumber = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const isPresentDefective = isDefective(selectedBill.presentReading);
      const isPreviousDefective = isDefective(selectedBill.previousReading);
      const isDefectiveReading = isPresentDefective || isPreviousDefective;

      let consumption = 0;
      let originalAmount = 0;

      if (isDefectiveReading) {
        consumption = 0;
        originalAmount = selectedBill.consumerType?.toUpperCase() === 'COMMERCIAL' ? 150 : 75;
      } else {
        consumption = calculateConsumption(selectedBill.presentReading, selectedBill.previousReading);
        originalAmount = calculateBillAmount(selectedBill.consumerType, consumption);
      }

      const discountAmount = hasDiscount ? originalAmount * DISCOUNT_RATE : 0;
      const finalAmount = originalAmount - discountAmount;

      const originalServer = selectedBill.serverSource || selectedServer;
      const targetDb = getDbByServer(originalServer);
      const billRef = doc(targetDb, 'bills', selectedBill.id);

      const paidBillData = {
        status: 'paid',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentCode,
        referenceNumber,
        paidBy: user?.email || 'Unknown',
        consumption,
        amount: finalAmount,
        originalAmount: originalAmount,
        discountAmount: discountAmount,
        discountType: discountType,
        hasDiscount: hasDiscount,
        discountRate: hasDiscount ? DISCOUNT_RATE : 0,
        amountCalculated: true,
        isDefective: isDefectiveReading,
        isPresentDefective,
        isPreviousDefective,
        calculationDetails: {
          consumerType: selectedBill.consumerType || 'RESIDENTIAL',
          previousReading: selectedBill.previousReading || 0,
          presentReading: selectedBill.presentReading || 0,
          consumption,
          originalAmount,
          discountAmount,
          finalAmount,
          hasDiscount,
          discountType,
          calculatedAt: new Date().toISOString(),
          isDefective: isDefectiveReading
        }
      };

      await updateDoc(billRef, paidBillData);

      await archivePaidBill(
        { ...selectedBill, ...paidBillData },
        paymentCode,
        referenceNumber,
        originalServer
      );

      await markORAsUsed(
        paymentCode,
        null,
        {
          id: selectedBill.id,
          billNumber: selectedBill.billNumber,
          consumerName: selectedBill.consumerName,
          location: selectedBill.location,
          month: selectedBill.month,
          year: selectedBill.year,
          amount: finalAmount,
          serverSource: originalServer,
          referenceNumber
        },
        paymentCode,
        user?.email || 'Unknown'
      );

      toast.success(`✅ Bill ${selectedBill.billNumber} marked as paid!`);
      toast.success(`💰 Amount: ₱${finalAmount.toFixed(2)}`);
      if (hasDiscount) {
        toast.success(`🎉 ${discountType} Discount (5%): -₱${discountAmount.toFixed(2)}`, {
          duration: 5000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B'
          }
        });
      }
      toast.success(`📋 OR Number: ${paymentCode}`);
      toast.success(`📦 Archived to Server 4`, { duration: 4000, icon: '🗄️' });

      setShowPayModal(false);

      setReceiptData({
        bill: {
          ...selectedBill,
          ...paidBillData,
          consumption,
          amount: finalAmount,
          originalAmount,
          discountAmount,
          discountType,
          hasDiscount,
          isDefective: isDefectiveReading
        },
        paymentCode,
        referenceNumber,
        discount: hasDiscount ? {
          type: discountType,
          rate: DISCOUNT_RATE,
          amount: discountAmount
        } : null
      });
      setShowReceipt(true);

      setSelectedBill(null);
      setPaymentCode('');
      setPaymentError('');
      setIsSeniorCitizen(false);
      setIsPWD(false);
      fetchBills(selectedServer);
    } catch (error) {
      console.error('❌ Payment error details:', error);
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check your Firestore rules.');
      } else {
        toast.error('Error updating bill status: ' + error.message);
      }
    } finally {
      setIsPaying(false);
    }
  };

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
        { header: 'Server', key: 'server', width: 12 },
        { header: 'Consumer Name', key: 'consumerName', width: 25 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Period', key: 'period', width: 15 },
        { header: 'Consumer Type', key: 'consumerType', width: 18 },
        { header: 'Previous Reading', key: 'previousReading', width: 18 },
        { header: 'Present Reading', key: 'presentReading', width: 18 },
        { header: 'Consumption', key: 'consumption', width: 15 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Discount', key: 'discount', width: 15 },
        { header: 'Discount Type', key: 'discountType', width: 18 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'OR Number', key: 'orNumber', width: 15 },
        { header: 'Defective', key: 'defective', width: 12 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF194752' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 25;

      const sortedForExport = sortByConsumerPeriod(billsToExport);

      sortedForExport.forEach((bill) => {
        const period = `${bill.month || 'N/A'} ${bill.year || ''}`;
        const isDefectiveReading = isDefective(bill.presentReading) || isDefective(bill.previousReading);
        const isCutoff = isCutoffBill(bill);
        worksheet.addRow({
          wsin: bill.billNumber || 'N/A',
          server: getServerLabel(bill.serverSource),
          consumerName: bill.consumerName || 'N/A',
          location: bill.location || 'N/A',
          period: period.trim() || 'N/A',
          consumerType: bill.consumerType || 'N/A',
          previousReading: isCutoff ? 'N/A' : (isDefective(bill.previousReading) ? 'DEFECTIVE' : (bill.previousReading || '0')),
          presentReading: isCutoff ? 'N/A' : (isDefective(bill.presentReading) ? 'DEFECTIVE' : (bill.presentReading || '0')),
          consumption: isCutoff ? 'N/A' : (bill.consumption || '0'),
          amount: bill.amount || '0',
          discount: bill.discountAmount ? `₱${bill.discountAmount.toFixed(2)}` : 'N/A',
          discountType: bill.discountType || 'N/A',
          status: isCutoff ? 'CUT-OFF' : (bill.status?.toUpperCase() || 'UNPAID'),
          orNumber: bill.paymentCode || 'N/A',
          defective: isDefectiveReading ? 'YES' : 'NO'
        });
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

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const locationSuffix = selectedExportLocation !== 'all' ? `_${selectedExportLocation}` : '';
      const serverSuffix = selectedServer !== 'all' ? `_${getServerLabel(selectedServer).replace(' ', '_')}` : '_AllServers';
      const defaultFileName = `Water_Bills${serverSuffix}${locationSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`✅ Exported ${billsToExport.length} bills!`);
      toast.success(`🔒 Password: ${EXCEL_PASSWORD}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting file: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { label: 'Paid', class: 'status-paid' },
      unpaid: { label: 'Unpaid', class: 'status-unpaid' },
      overdue: { label: 'Overdue', class: 'status-overdue' },
      cutoff: { label: 'Cut-off', class: 'status-cutoff' }
    };
    return statusMap[status] || statusMap.unpaid;
  };

  const activeFilterCount = [
    filterType !== 'all',
    filterLocation !== 'all',
    filterMonth !== 'all',
    filterYear !== 'all',
    filterConsumerPeriod !== 'all'
  ].filter(Boolean).length;

  const getConsumersWithUnpaid = () => {
    const consumerMap = new Map();
    filteredBills.forEach(bill => {
      if (bill.status !== 'paid' && !isCutoffBill(bill) && bill.consumerName) {
        if (!consumerMap.has(bill.consumerName)) consumerMap.set(bill.consumerName, []);
        consumerMap.get(bill.consumerName).push(bill);
      }
    });
    return consumerMap;
  };

  const consumersWithUnpaid = getConsumersWithUnpaid();

  const getCutoffConsumersWithUnpaid = () => {
    const consumerMap = new Map();
    filteredBills.forEach(bill => {
      if (bill.status !== 'paid' && isCutoffBill(bill) && bill.consumerName) {
        if (!consumerMap.has(bill.consumerName)) consumerMap.set(bill.consumerName, []);
        consumerMap.get(bill.consumerName).push(bill);
      }
    });
    return consumerMap;
  };

  const cutoffConsumersWithUnpaid = getCutoffConsumersWithUnpaid();

  const currentServerConfig = SERVER_CONFIGS.find(s => s.key === selectedServer);

  const shouldShowCheckboxes = (() => {
    if (!searchTerm.trim()) return false;

    const unpaidRegularBills = filteredBills.filter(
      b => b.status !== 'paid' && !isCutoffBill(b)
    );

    if (unpaidRegularBills.length < 2) return false;

    const uniqueConsumers = new Set(
      unpaidRegularBills.map(b => (b.consumerName || '').toUpperCase().trim())
    );

    if (uniqueConsumers.size !== 1) return false;

    return true;
  })();

  const selectedBillsData = filteredBills.filter(b => selectedBillIds.includes(b.id));
  const selectedTotalAmount = selectedBillsData.reduce((sum, bill) => {
    const { amount } = calculateWithDefective(bill.presentReading, bill.previousReading, bill.consumerType);
    return sum + amount;
  }, 0);

  const getDiscountPreview = () => {
    const hasDiscount = isSeniorCitizen || isPWD;
    if (!hasDiscount) return null;

    const discountType = isSeniorCitizen && isPWD
      ? 'Senior Citizen & PWD'
      : isSeniorCitizen
        ? 'Senior Citizen'
        : 'PWD';

    return {
      type: discountType,
      rate: DISCOUNT_RATE,
      ratePercent: (DISCOUNT_RATE * 100).toFixed(0)
    };
  };

  const discountPreview = getDiscountPreview();

  return (
    <div className="bill-dashboard">

      {/* ========== HEADER ========== */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <h1>Water Bill Records</h1>
          <p>Manage and track all water bill records</p>
        </div>
        <div className="dashboard-header-right">
          {/* ✅ REALTIME PHILIPPINE TIME CLOCK */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            padding: '6px 14px',
            background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
            border: '1px solid #86EFAC',
            borderRadius: '10px',
            fontFamily: 'Inter, sans-serif'
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              color: '#166534',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              🇵🇭 Philippine Time
            </span>
            <span style={{
              fontSize: '14px',
              fontWeight: '800',
              color: '#15803D',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.5px'
            }}>
              {formatPhilippineTime(phNow)}
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#166534'
            }}>
              {formatPhilippineDate(phNow)}
            </span>
          </div>

          <div className="server-selector">
            <ServerIcon width={16} height={16} color="#64748B" />
            <select
              value={selectedServer}
              onChange={handleServerChange}
              disabled={loading}
            >
              <option value="server1">CADUCAN</option>
              <option value="server2">LUYO</option>
              <option value="server3">SAN ISIDRO</option>
              <option value="server4">MORYO-MORYO</option>
              <option value="server5">CALIAN</option>
              <option value="server6">SAN ROQUE/ANILAO</option>
            </select>
          </div>

          <div className="table-type-toggle">
            <button
              className={`table-type-btn regular-btn ${tableType === 'regular' ? 'active' : ''}`}
              onClick={() => {
                setTableType('regular');
                setSelectedBillIds([]);
              }}
            >
              <RegularTableIcon />
              REGULAR
            </button>
            <button
              className={`table-type-btn cutoff-btn ${tableType === 'cutoff' ? 'active' : ''}`}
              onClick={() => {
                setTableType('cutoff');
                setSelectedBillIds([]);
              }}
            >
              <CutoffTableIcon />
              CUT-OFF
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            ADD BILL
          </button>

          <button
            className="btn btn-purple"
            onClick={() => setShowApplicationForm(true)}
          >
            APPLICATION
          </button>
        </div>
      </header>

      {/* ========== 2-COLUMN LAYOUT ========== */}
      <div className="dashboard-layout">

        {/* LEFT SIDEBAR - STATS */}
        <aside className="left-sidebar">
          <div className="sidebar-title">Statistics</div>

          {tableType === 'regular' ? (
            <>
              <div className="sidebar-stat-card">
                <div className="sidebar-stat-icon sidebar-icon-blue">
                  <SummationCircleIcon width={18} height={18} color="#111827" />
                </div>
                <div className="sidebar-stat-content">
                  <span className="sidebar-stat-label">Total Bills</span>
                  <span className="sidebar-stat-value">{stats.total}</span>
                </div>
              </div>

              <div className="sidebar-stat-card">
                <div className="sidebar-stat-icon sidebar-icon-green">
                  <PhilippinePesoIcon width={18} height={18} color="#111827" />
                </div>
                <div className="sidebar-stat-content">
                  <span className="sidebar-stat-label">Paid</span>
                  <span className="sidebar-stat-value">{stats.paid}</span>
                </div>
              </div>

              <div className="sidebar-stat-card">
                <div className="sidebar-stat-icon sidebar-icon-amber">
                  <CalendarClockIcon width={18} height={18} color="#111827" />
                </div>
                <div className="sidebar-stat-content">
                  <span className="sidebar-stat-label">Unpaid</span>
                  <span className="sidebar-stat-value">{stats.unpaid}</span>
                </div>
              </div>

              <div className="sidebar-stat-card">
                <div className="sidebar-stat-icon sidebar-icon-red">
                  <SecurityWarningIcon width={18} height={18} color="#111827" />
                </div>
                <div className="sidebar-stat-content">
                  <span className="sidebar-stat-label">Overdue</span>
                  <span className="sidebar-stat-value">{stats.overdue}</span>
                </div>
              </div>

              <div className="sidebar-stat-card">
                <div className="sidebar-stat-icon sidebar-icon-slate">
                  <User02Icon width={18} height={18} color="#111827" />
                </div>
                <div className="sidebar-stat-content">
                  <span className="sidebar-stat-label">Consumers</span>
                  <span className="sidebar-stat-value">{stats.totalConsumers}</span>
                </div>
              </div>

              <div className="sidebar-stat-card">
                <div className="sidebar-stat-icon sidebar-icon-teal">
                  <ApartmentIcon width={18} height={18} color="#111827" />
                </div>
                <div className="sidebar-stat-content">
                  <span className="sidebar-stat-label">Residential</span>
                  <span className="sidebar-stat-value">{stats.residential}</span>
                </div>
              </div>

              <div className="sidebar-stat-card">
                <div className="sidebar-stat-icon sidebar-icon-indigo">
                  <DuplexIcon width={18} height={18} color="#111827" />
                </div>
                <div className="sidebar-stat-content">
                  <span className="sidebar-stat-label">Commercial</span>
                  <span className="sidebar-stat-value">{stats.commercial}</span>
                </div>
              </div>

              <div className="sidebar-stat-card">
                <div className="sidebar-stat-icon sidebar-icon-rose">
                  <Location03Icon width={18} height={18} color="#111827" />
                </div>
                <div className="sidebar-stat-content">
                  <span className="sidebar-stat-label">Location</span>
                  <span className="sidebar-stat-value sidebar-stat-location">{stats.location || 'N/A'}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="sidebar-stat-card">
                <div className="sidebar-stat-icon sidebar-icon-red">
                  <SummationCircleIcon width={18} height={18} color="#DC2626" />
                </div>
                <div className="sidebar-stat-content">
                  <span className="sidebar-stat-label">Cut-off Accounts</span>
                  <span className="sidebar-stat-value">{filteredBills.length}</span>
                </div>
              </div>

              <div className="sidebar-stat-card">
                <div className="sidebar-stat-icon sidebar-icon-slate">
                  <User02Icon width={18} height={18} color="#64748B" />
                </div>
                <div className="sidebar-stat-content">
                  <span className="sidebar-stat-label">Consumers</span>
                  <span className="sidebar-stat-value">{new Set(filteredBills.map(b => b.consumerName)).size}</span>
                </div>
              </div>

              <div className="sidebar-stat-card">
                <div className="sidebar-stat-icon sidebar-icon-amber">
                  <PhilippinePesoIcon width={18} height={18} color="#D97706" />
                </div>
                <div className="sidebar-stat-content">
                  <span className="sidebar-stat-label">Total Collectable</span>
                  <span className="sidebar-stat-value sidebar-stat-location">
                    {formatCurrency(filteredBills.reduce((sum, b) => sum + (b.amount || b.collectableAmount || 0), 0))}
                  </span>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* CENTER CONTENT - FILTERS + TABLE (Combined) */}
        <main className="center-content">

          {/* ========== FILTER SECTION ========== */}
          <div className="filter-section">
            <div className="filter-section-header">
              <div className="filter-section-title">
                <FilterIcon width={16} height={16} color="#64748B" />
                <span>Filters</span>
              </div>
              {(searchTerm || activeFilterCount > 0) && (
                <button className="btn-clear-filters" onClick={resetFilters}>
                  ✕ Clear Filters
                </button>
              )}
            </div>

            <div className="filter-grid">
              <div className="filter-group filter-group-search">
                <label className="filter-label">Search</label>
                <div className="search-wrapper">
                  <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={16} height={16} fill="none">
                    <circle cx="11" cy="11" r="7" stroke="#94A3B8" strokeWidth="2"/>
                    <path d="M16.5 16.5L21 21" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name or WSIN..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedBillIds([]);
                    }}
                  />
                </div>
              </div>

              {tableType === 'regular' && (
                <div className="filter-group">
                  <label className="filter-label">Type</label>
                  <select
                    className="filter-select"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                  </select>
                </div>
              )}

              <div className="filter-group">
                <label className="filter-label">Location</label>
                <select
                  className="filter-select"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                >
                  <option value="all">All Locations</option>
                  {locations.map(location => <option key={location} value={location}>{location}</option>)}
                </select>
              </div>

              {tableType === 'regular' && (
                <div className="filter-group">
                  <label className="filter-label">Month</label>
                  <select
                    className="filter-select"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    <option value="all">All Months</option>
                    {months.map(month => <option key={month} value={month}>{month}</option>)}
                  </select>
                </div>
              )}

              {tableType === 'regular' && (
                <div className="filter-group">
                  <label className="filter-label">Year</label>
                  <select
                    className="filter-select"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="all">All Years</option>
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="filter-info-row">
              <div className="filter-info-item">
                <span className="filter-info-label">Showing:</span>
                <span className="filter-info-value">{filteredBills.length}</span>
              </div>
              <div className="filter-info-item">
                <span className="filter-info-label">Server:</span>
                <span className="filter-info-value">{getServerLabel(selectedServer)}</span>
              </div>
              {activeFilterCount > 0 && (
                <div className="filter-info-item">
                  <span className="filter-info-label">Active Filters:</span>
                  <span className="filter-info-value">{activeFilterCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* ========== SELECTION BAR ========== */}
          {shouldShowCheckboxes && consumersWithUnpaid.size === 1 && (
            <div className={`selection-bar ${selectedBillIds.length > 0 ? 'has-selection' : ''}`}>
              <div className="selection-info">
                {selectedBillIds.length > 0 ? (
                  <>
                    <span className="selection-count">{selectedBillIds.length}</span>
                    <span>bill{selectedBillIds.length > 1 ? 's' : ''} selected</span>
                    <span className="selection-amount">({formatCurrency(selectedTotalAmount)})</span>
                  </>
                ) : (
                  <>
                    <span className="selection-name">{Array.from(consumersWithUnpaid.keys())[0]}</span>
                    <span>has {Array.from(consumersWithUnpaid.values())[0].length} unpaid bills</span>
                  </>
                )}
              </div>
              <div className="selection-actions">
                {selectedBillIds.length > 0 && (
                  <button className="btn-clear-selection" onClick={handleClearSelection}>
                    Clear
                  </button>
                )}
                <button
                  className="btn-pay-all"
                  onClick={selectedBillIds.length > 0
                    ? handleSelectedPay
                    : () => handlePayAll(Array.from(consumersWithUnpaid.keys())[0])
                  }
                >
                  <PayAllIcon width={16} height={16} color="#FFFFFF" />
                  {selectedBillIds.length > 0 ? `Pay Selected (${selectedBillIds.length})` : 'Pay All'}
                </button>
              </div>
            </div>
          )}

          {tableType === 'cutoff' && searchTerm.trim() && cutoffConsumersWithUnpaid.size === 1 && (
            <div className="selection-bar cutoff-selection">
              <div className="selection-info">
                <span className="selection-name">{Array.from(cutoffConsumersWithUnpaid.keys())[0]}</span>
                <span>has {Array.from(cutoffConsumersWithUnpaid.values())[0].length} unpaid cut-off bills</span>
              </div>
              <button
                className="btn-pay-all cutoff"
                onClick={() => handleCutoffPayAll(Array.from(cutoffConsumersWithUnpaid.keys())[0])}
              >
                <PayAllIcon width={16} height={16} color="#FFFFFF" />
                Pay All
              </button>
            </div>
          )}

          {/* ========== TABLE ========== */}
          <div className="table-container">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading {selectedServer === 'all' ? 'all servers' : getServerLabel(selectedServer)}...</p>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="empty-state">
                <p>No bills found in {selectedServer === 'all' ? 'any server' : getServerLabel(selectedServer)}.</p>
                <p className="empty-subtext">{searchTerm || activeFilterCount > 0 ? 'Try adjusting your filters.' : 'Add your first bill!'}</p>
              </div>
            ) : (
              <>
                <table className="bills-table">
                  <thead>
                    <tr>
                      {shouldShowCheckboxes && (
                        <th className="checkbox-col">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const currentPageUnpaid = getCurrentPageData().filter(
                                bill => bill.status !== 'paid' && !isCutoffBill(bill)
                              );
                              return currentPageUnpaid.length > 0 &&
                                currentPageUnpaid.every(b => selectedBillIds.includes(b.id));
                            })()}
                            onChange={handleSelectAllOnPage}
                          />
                        </th>
                      )}
                      <th>WSIN</th>
                      <th>Consumer</th>
                      <th>Location</th>
                      <th>Period</th>
                      <th>Type</th>
                      <th>Previous</th>
                      <th>Present</th>
                      <th>Consumption</th>
                      <th className="text-right">Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentPageData().map((bill) => {
                      let displayStatus = bill.status === 'paid' ? 'paid' : determineBillStatus(bill);
                      const status = getStatusBadge(displayStatus);
                      const period = `${bill.month || 'N/A'} ${bill.year || ''}`;

                      const isPresentDefective = isDefective(bill.presentReading);
                      const isPreviousDefective = isDefective(bill.previousReading);
                      const isDefectiveReading = isPresentDefective || isPreviousDefective;

                      const displayPresent = isPresentDefective ? 'DEFECTIVE' : (bill.presentReading || '0');
                      const displayPrevious = isPreviousDefective ? 'DEFECTIVE' : (bill.previousReading || '0');

                      const { consumption, amount } = calculateWithDefective(bill.presentReading, bill.previousReading, bill.consumerType);

                      const displayAmount = bill.status === 'paid' && bill.amount !== undefined && bill.amount !== null
                        ? bill.amount
                        : amount;

                      const isSelectable = displayStatus !== 'paid' && !isCutoffBill(bill);
                      const isChecked = selectedBillIds.includes(bill.id);

                      return (
                        <tr
                          key={`${bill.serverSource || 's1'}-${bill.id}`}
                          className={isChecked ? 'row-selected' : ''}
                        >
                          {shouldShowCheckboxes && (
                            <td className="checkbox-col">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={!isSelectable}
                                onChange={() => handleToggleBillSelection(bill.id)}
                              />
                            </td>
                          )}
                          <td className="wsin-cell">{bill.billNumber || 'N/A'}</td>
                          <td className="name-cell">{bill.consumerName || 'N/A'}</td>
                          <td className="name-cell">{bill.location || 'N/A'}</td>
                          <td className="name-cell">{period.trim() || 'N/A'}</td>
                          <td>
                            <span className={`type-badge ${bill.consumerType?.toUpperCase() === 'RESIDENTIAL' ? 'residential' : 'commercial'}`}>
                              {bill.consumerType || 'N/A'}
                            </span>
                          </td>
                          <td className="name-cell">{displayPrevious}</td>
                          <td className="name-cell">{displayPresent}</td>
                          <td className="name-cell" style={{ fontWeight: '600' }}>
                            {consumption} m³
                            {isDefectiveReading && <span className="defective-badge"> DEF</span>}
                          </td>
                          <td className="name-cell text-right" style={{ fontWeight: '600' }}>
                            {formatCurrency(displayAmount)}
                            {bill.hasDiscount && (
                              <div className="discount-note">🎉 {bill.discountType}</div>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${status.class}`}>{status.label}</span>
                            {/* ✅ REALTIME PAID DATE & TIME — PHILIPPINE TIME */}
                            {displayStatus === 'paid' && (
                              <PaidDateTimeDisplay paidAt={bill.paidAt} />
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              {displayStatus !== 'paid' ? (
                                <button className="action-btn pay" onClick={() => handlePayBill(bill)}>PAY</button>
                              ) : (
                                <span className="or-badge">{bill.paymentCode || '—'}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredBills.length > rowsPerPage && (
                  <div className="pagination-container">
                    <div className="pagination-info">
                      {getPaginationInfo()}
                    </div>

                    <div className="pagination-controls">
                      <button
                        className="pagination-btn"
                        onClick={prevPage}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeftIcon width={16} height={16} color={currentPage === 1 ? '#94A3B8' : '#0F172A'} />
                        Previous
                      </button>

                      <div className="pagination-pages">
                        {(() => {
                          const pages = [];
                          const total = totalPages;
                          const current = currentPage;

                          if (total <= 7) {
                            for (let i = 1; i <= total; i++) pages.push(i);
                          } else {
                            pages.push(1);
                            if (current > 3) pages.push('...');
                            const start = Math.max(2, current - 1);
                            const end = Math.min(total - 1, current + 1);
                            for (let i = start; i <= end; i++) pages.push(i);
                            if (current < total - 2) pages.push('...');
                            pages.push(total);
                          }

                          return pages.map((page, index) => {
                            if (page === '...') {
                              return <span key={`ellipsis-${index}`} className="pagination-ellipsis">…</span>;
                            }

                            const isActive = page === current;
                            return (
                              <button
                                key={page}
                                className={`pagination-page ${isActive ? 'active' : ''}`}
                                onClick={() => goToPage(page)}
                              >
                                {page}
                              </button>
                            );
                          });
                        })()}
                      </div>

                      <button
                        className="pagination-btn"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRightIcon width={16} height={16} color={currentPage === totalPages ? '#94A3B8' : '#0F172A'} />
                      </button>
                    </div>

                    <div className="pagination-rows">
                      <span>Rows per page: <strong>10</strong></span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* ========== FOOTER ========== */}
      <footer className="dashboard-footer">
        <div className="footer-left">
          © {new Date().getFullYear()} Waterbill Management System — Municipality of Liloan
        </div>
        <div className="footer-right">
          <span>v1.0.0</span>
          <span className="footer-separator">•</span>
          <span>All rights reserved</span>
        </div>
      </footer>

      {/* ==================== ALL MODALS ==================== */}

      {/* Export Location Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={closeExportModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📤 Export Bills by Location</h2>
              <button className="close-btn" onClick={closeExportModal}>✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
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
                    outline: 'none'
                  }}
                >
                  <option value="all">🌍 All Locations ({bills.length} bills)</option>
                  {exportLocations.map(location => {
                    const count = bills.filter(b => b.location === location).length;
                    return <option key={location} value={location}>📍 {location} ({count} bills)</option>;
                  })}
                </select>
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={closeExportModal} style={{ flex: 1 }}>Cancel</button>
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

      {/* Cutoff Pay Modal - Single */}
      {showCutoffPayModal && cutoffBillToPay && (
        <div className="modal-overlay" onClick={() => setShowCutoffPayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CutoffTableIcon />
                Cut-off Payment
              </h2>
              <button className="close-btn" onClick={() => setShowCutoffPayModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
                Confirm payment for this cut-off account.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <span style={{
                  padding: '4px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  background: `${getServerColor(cutoffBillToPay.serverSource)}22`,
                  color: getServerColor(cutoffBillToPay.serverSource)
                }}>
                  🗄️ FROM {getServerLabel(cutoffBillToPay.serverSource).toUpperCase()}
                </span>
              </div>

              <div style={{ border: '2px solid #DC2626', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ background: '#DC2626' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ffffff' }}>Bill Number (WSIN)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ffffff' }}>Consumer Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', color: '#ffffff' }}>Collectable Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#FFF5F5' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#194752' }}>{cutoffBillToPay.billNumber || 'N/A'}</td>
                      <td style={{ padding: '14px 16px', fontWeight: '500', color: '#0F172A' }}>{cutoffBillToPay.consumerName || 'N/A'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', fontSize: '18px', color: '#DC2626' }}>
                        {formatCurrency(cutoffBillToPay.amount || cutoffBillToPay.collectableAmount || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="form-group">
                <label>OR Number <span className="required">*</span></label>
                <input
                  type="text"
                  className="payment-input"
                  placeholder="0000000"
                  value={cutoffPaymentCode}
                  onChange={handleCutoffPaymentCodeChange}
                  maxLength={7}
                  inputMode="numeric"
                  autoFocus
                />
                {cutoffPaymentError && (
                  <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>
                    ⚠️ {cutoffPaymentError}
                  </p>
                )}
                <p style={{ color: '#64748B', fontSize: '11px', marginTop: '6px' }}>
                  Enter the 7-digit OR number from the receipt booklet.
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setShowCutoffPayModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={confirmCutoffPay}
                disabled={!cutoffPaymentCode || cutoffPaymentCode.length !== 7 || isPayingCutoff}
                style={{
                  flex: 1,
                  background: '#DC2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: (!cutoffPaymentCode || cutoffPaymentCode.length !== 7 || isPayingCutoff) ? '0.5' : '1'
                }}
              >
                {isPayingCutoff ? '⏳ Processing...' : '✅ Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cutoff Pay All Modal */}
      {showCutoffPayAllModal && cutoffPayAllBills.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowCutoffPayAllModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PayAllIcon width={28} height={28} color="#DC2626" />
                Pay All Cut-off - {cutoffPayAllConsumerName}
              </h2>
              <button className="close-btn" onClick={() => setShowCutoffPayAllModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '12px' }}>
                You are about to pay <strong>{cutoffPayAllBills.length}</strong> unpaid cut-off accounts for <strong>{cutoffPayAllConsumerName}</strong>.
              </p>

              <div style={{
                border: '2px solid #DC2626',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '16px',
                maxHeight: '320px',
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr style={{ background: '#DC2626' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#ffffff' }}>WSIN</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', color: '#ffffff' }}>Period</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', color: '#ffffff' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cutoffPayAllBills.map((bill, index) => {
                      const amount = bill.amount || bill.collectableAmount || 0;
                      return (
                        <tr key={`${bill.serverSource || 's1'}-${bill.id}`} style={{
                          background: index % 2 === 0 ? '#FFF5F5' : '#FFFFFF',
                          borderBottom: '1px solid #FEE2E2'
                        }}>
                          <td style={{ padding: '10px 14px', fontWeight: '600', color: '#194752' }}>{bill.billNumber || 'N/A'}</td>
                          <td style={{ padding: '10px 14px', color: '#64748B' }}>{bill.month || 'N/A'} {bill.year || ''}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: '#DC2626' }}>
                            {formatCurrency(amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{
                padding: '14px 20px',
                background: '#FEF2F2',
                border: '2px solid #DC2626',
                borderRadius: '12px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: '700', fontSize: '15px', color: '#991B1B' }}>OVERALL TOTAL:</span>
                <span style={{ fontWeight: '800', fontSize: '22px', color: '#DC2626' }}>
                  {formatCurrency(cutoffPayAllBills.reduce((sum, bill) => sum + (bill.amount || bill.collectableAmount || 0), 0))}
                </span>
              </div>

              <div className="form-group">
                <label>OR Number <span className="required">*</span></label>
                <input
                  type="text"
                  className="payment-input"
                  placeholder="0000000"
                  value={cutoffPayAllPaymentCode}
                  onChange={handleCutoffPayAllPaymentCodeChange}
                  maxLength={7}
                  inputMode="numeric"
                  autoFocus
                />
                {cutoffPayAllPaymentError && (
                  <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>
                    ⚠️ {cutoffPayAllPaymentError}
                  </p>
                )}
                <p style={{ color: '#64748B', fontSize: '11px', marginTop: '6px' }}>
                  Enter the 7-digit OR number from the receipt booklet.
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setShowCutoffPayAllModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={confirmCutoffPayAll}
                disabled={!cutoffPayAllPaymentCode || cutoffPayAllPaymentCode.length !== 7 || isPayingCutoffAll}
                style={{
                  flex: 1,
                  background: '#DC2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: (!cutoffPayAllPaymentCode || cutoffPayAllPaymentCode.length !== 7 || isPayingCutoffAll) ? '0.5' : '1'
                }}
              >
                {isPayingCutoffAll ? '⏳ Processing...' : `✅ Pay All (${cutoffPayAllBills.length} Bills)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay All / Pay Selected Modal */}
      {showPayAllModal && payAllBills.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowPayAllModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PayAllIcon width={28} height={28} color="#16A34A" />
                {selectedBillIds.length > 0 ? 'Pay Selected' : 'Pay All'} - {payAllConsumerName}
              </h2>
              <button className="close-btn" onClick={() => setShowPayAllModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '12px' }}>
                You are about to pay <strong>{payAllBills.length}</strong> {selectedBillIds.length > 0 ? 'selected' : 'unpaid'} bill{payAllBills.length > 1 ? 's' : ''} for <strong>{payAllConsumerName}</strong>.
              </p>

              <div style={{
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '16px',
                maxHeight: '280px',
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>Period</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>WSIN</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid #E2E8F0' }}>Consumption</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid #E2E8F0' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payAllBills.map((bill, index) => {
                      const { consumption, amount, isDefective: isDef } = calculateWithDefective(bill.presentReading, bill.previousReading, bill.consumerType);
                      const period = `${bill.month || 'N/A'} ${bill.year || ''}`;
                      const finalAmount = (isSeniorCitizen || isPWD) ? amount * (1 - DISCOUNT_RATE) : amount;
                      return (
                        <tr key={`${bill.serverSource || 's1'}-${bill.id}`} style={{ borderBottom: index < payAllBills.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <td style={{ padding: '8px 14px' }}>{period.trim()}</td>
                          <td style={{ padding: '8px 14px', fontWeight: '500' }}>{bill.billNumber || 'N/A'}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                            {consumption} m³
                            {isDef && <span style={{ color: '#DC2626', fontSize: '10px', marginLeft: '4px' }}>⚠️</span>}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600' }}>
                            {formatCurrency(amount)}
                            {(isSeniorCitizen || isPWD) && (
                              <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: '700' }}>
                                → {formatCurrency(finalAmount)}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{
                padding: '14px 18px',
                background: 'linear-gradient(135deg, #F8FAFC, #EFF6FF)',
                border: '2px solid #BFDBFE',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <p style={{
                  margin: '0 0 12px 0',
                  fontWeight: '700',
                  fontSize: '14px',
                  color: '#1E40AF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎉 Discount (5%)
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: isSeniorCitizen ? '#DBEAFE' : '#FFFFFF',
                    border: isSeniorCitizen ? '2px solid #2563EB' : '2px solid #E2E8F0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSeniorCitizen ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
                  }}>
                    <input
                      type="checkbox"
                      checked={isSeniorCitizen}
                      onChange={(e) => setIsSeniorCitizen(e.target.checked)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#2563EB',
                        flexShrink: 0
                      }}
                    />
                    <SeniorIcon width={22} height={22} color={isSeniorCitizen ? '#2563EB' : '#64748B'} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: '700',
                        color: isSeniorCitizen ? '#1E40AF' : '#0F172A'
                      }}>
                        SENIOR CITIZEN
                      </span>
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: isSeniorCitizen ? '#2563EB' : '#64748B'
                      }}>
                        5% discount
                      </span>
                    </div>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: isPWD ? '#DBEAFE' : '#FFFFFF',
                    border: isPWD ? '2px solid #2563EB' : '2px solid #E2E8F0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isPWD ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
                  }}>
                    <input
                      type="checkbox"
                      checked={isPWD}
                      onChange={(e) => setIsPWD(e.target.checked)}
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#2563EB',
                        flexShrink: 0
                      }}
                    />
                    <PWDIcon width={22} height={22} color={isPWD ? '#2563EB' : '#64748B'} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: '700',
                        color: isPWD ? '#1E40AF' : '#0F172A'
                      }}>
                        PWD
                      </span>
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '11px',
                        color: isPWD ? '#2563EB' : '#64748B'
                      }}>
                        5% discount
                      </span>
                    </div>
                  </label>
                </div>

                {discountPreview && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    background: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>✅</span>
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#166534'
                    }}>
                      {discountPreview.type} discount applied ({discountPreview.ratePercent}% off)
                    </span>
                  </div>
                )}
              </div>

              <div style={{
                padding: '16px 20px',
                background: (isSeniorCitizen || isPWD)
                  ? 'linear-gradient(135deg, #F0FDF4, #DCFCE7)'
                  : 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
                border: (isSeniorCitizen || isPWD)
                  ? '2px solid #86EFAC'
                  : '2px solid #E2E8F0',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '600' }}>Subtotal:</span>
                  <span style={{ fontSize: '16px', color: '#0F172A', fontWeight: '700' }}>
                    {formatCurrency(payAllBills.reduce((sum, bill) => {
                      const { amount } = calculateWithDefective(bill.presentReading, bill.previousReading, bill.consumerType);
                      return sum + amount;
                    }, 0))}
                  </span>
                </div>

                {(isSeniorCitizen || isPWD) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#16A34A', fontWeight: '600' }}>
                      Discount ({discountPreview?.type}):
                    </span>
                    <span style={{ fontSize: '16px', color: '#16A34A', fontWeight: '700' }}>
                      -{formatCurrency(payAllBills.reduce((sum, bill) => {
                        const { amount } = calculateWithDefective(bill.presentReading, bill.previousReading, bill.consumerType);
                        return sum + (amount * DISCOUNT_RATE);
                      }, 0))}
                    </span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '2px solid #E2E8F0',
                  marginTop: '8px'
                }}>
                  <span style={{ fontSize: '16px', color: '#0F172A', fontWeight: '800' }}>TOTAL:</span>
                  <span style={{
                    fontSize: '22px',
                    color: (isSeniorCitizen || isPWD) ? '#16A34A' : '#194752',
                    fontWeight: '800'
                  }}>
                    {formatCurrency(payAllBills.reduce((sum, bill) => {
                      const { amount } = calculateWithDefective(bill.presentReading, bill.previousReading, bill.consumerType);
                      const finalAmount = (isSeniorCitizen || isPWD) ? amount * (1 - DISCOUNT_RATE) : amount;
                      return sum + finalAmount;
                    }, 0))}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>OR Number <span className="required">*</span></label>
                <input
                  type="text"
                  className="payment-input"
                  placeholder="0000000"
                  value={payAllPaymentCode}
                  onChange={handlePayAllPaymentCodeChange}
                  maxLength={7}
                  inputMode="numeric"
                  autoFocus
                />
                {payAllPaymentError && (
                  <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>
                    ⚠️ {payAllPaymentError}
                  </p>
                )}
                <p style={{ color: '#64748B', fontSize: '11px', marginTop: '6px' }}>
                  Enter the 7-digit OR number from the receipt booklet.
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setShowPayAllModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={confirmPayAll}
                disabled={!payAllPaymentCode || payAllPaymentCode.length !== 7 || isPayingAll}
                style={{
                  flex: 1,
                  background: '#16A34A',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: (!payAllPaymentCode || payAllPaymentCode.length !== 7 || isPayingAll) ? '0.5' : '1'
                }}
              >
                {isPayingAll ? '⏳ Processing...' : `✅ Pay (${payAllBills.length} Bill${payAllBills.length > 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Pay Modal */}
      {showPayModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Payment</h2>
              <button className="close-btn" onClick={() => setShowPayModal(false)}>✕</button>
            </div>

            <div className="pay-details">
              <div className="pay-row"><span className="pay-label">Bill Number</span><span className="pay-value">{selectedBill.billNumber || 'N/A'}</span></div>
              <div className="pay-row"><span className="pay-label">Consumer</span><span className="pay-value">{selectedBill.consumerName || 'N/A'}</span></div>
              <div className="pay-row"><span className="pay-label">Type</span><span className="pay-value">{selectedBill.consumerType || 'RESIDENTIAL'}</span></div>
            </div>

            <div style={{
              padding: '5px 18px',
              background: 'linear-gradient(135deg, #F8FAFC, #EFF6FF)',
              border: '2px solid #BFDBFE',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <p style={{
                margin: '0 0 5px 0',
                fontWeight: '700',
                fontSize: '14px',
                color: '#1E40AF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                Discount (5%)
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: isSeniorCitizen ? '#DBEAFE' : '#FFFFFF',
                  border: isSeniorCitizen ? '2px solid #2563EB' : '2px solid #E2E8F0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={isSeniorCitizen}
                    onChange={(e) => setIsSeniorCitizen(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#2563EB',
                      flexShrink: 0
                    }}
                  />
                  <SeniorIcon width={20} height={20} color={isSeniorCitizen ? '#2563EB' : '#64748B'} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: isSeniorCitizen ? '#1E40AF' : '#0F172A'
                    }}>
                      SENIOR CITIZEN
                    </span>
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '10px',
                      color: isSeniorCitizen ? '#2563EB' : '#64748B'
                    }}>
                      5% discount
                    </span>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: isPWD ? '#DBEAFE' : '#FFFFFF',
                  border: isPWD ? '2px solid #2563EB' : '2px solid #E2E8F0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={isPWD}
                    onChange={(e) => setIsPWD(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#2563EB',
                      flexShrink: 0
                    }}
                  />
                  <PWDIcon width={20} height={20} color={isPWD ? '#2563EB' : '#64748B'} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: isPWD ? '#1E40AF' : '#0F172A'
                    }}>
                      PWD
                    </span>
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '10px',
                      color: isPWD ? '#2563EB' : '#64748B'
                    }}>
                      5% discount
                    </span>
                  </div>
                </label>
              </div>

              {discountPreview && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  background: '#F0FDF4',
                  border: '1px solid #86EFAC',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '14px' }}>✅</span>
                  <span style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#166534'
                  }}>
                    {discountPreview.type} discount applied ({discountPreview.ratePercent}% off)
                  </span>
                </div>
              )}
            </div>

            <div style={{
              padding: '14px 18px',
              background: (isSeniorCitizen || isPWD)
                ? 'linear-gradient(135deg, #F0FDF4, #DCFCE7)'
                : 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
              border: (isSeniorCitizen || isPWD)
                ? '2px solid #86EFAC'
                : '2px solid #E2E8F0',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              {(() => {
                const { amount } = calculateWithDefective(selectedBill.presentReading, selectedBill.previousReading, selectedBill.consumerType);
                const hasDiscount = isSeniorCitizen || isPWD;
                const discountAmt = hasDiscount ? amount * DISCOUNT_RATE : 0;
                const finalAmt = amount - discountAmt;

                return (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Subtotal:</span>
                      <span style={{ fontSize: '15px', color: '#0F172A', fontWeight: '700' }}>
                        {formatCurrency(amount)}
                      </span>
                    </div>

                    {hasDiscount && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#16A34A', fontWeight: '600' }}>
                          Discount ({discountPreview?.type}):
                        </span>
                        <span style={{ fontSize: '15px', color: '#16A34A', fontWeight: '700' }}>
                          -{formatCurrency(discountAmt)}
                        </span>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '2px solid #E2E8F0',
                      marginTop: '6px'
                    }}>
                      <span style={{ fontSize: '15px', color: '#0F172A', fontWeight: '800' }}>AMOUNT TO PAY:</span>
                      <span style={{
                        fontSize: '22px',
                        color: hasDiscount ? '#16A34A' : '#194752',
                        fontWeight: '800'
                      }}>
                        {formatCurrency(finalAmt)}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="form-group">
              <label>OR Number <span className="required">*</span></label>
              <input
                type="text"
                className="payment-input"
                placeholder="0000000"
                value={paymentCode}
                onChange={handlePaymentCodeChange}
                maxLength={7}
                inputMode="numeric"
                autoFocus
              />
              {paymentError && (
                <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '6px', fontWeight: '600' }}>
                  ⚠️ {paymentError}
                </p>
              )}
              <p style={{ color: '#64748B', fontSize: '11px', marginTop: '6px' }}>
                Enter the 7-digit OR number from the receipt booklet.
              </p>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
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

      {/* Bill Form */}
      {showForm && (
        <BillForm
          bill={editingBill}
          onClose={handleFormClose}
          onSave={() => fetchBills(selectedServer)}
          serverKey={editingBill?.serverSource || selectedServer}
        />
      )}

      {/* Application Form */}
      {showApplicationForm && (
        <ApplicationForm onClose={() => setShowApplicationForm(false)} />
      )}
    </div>
  );
};

export default BillDashboard;