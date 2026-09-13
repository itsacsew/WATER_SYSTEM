// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, writeBatch, updateDoc, addDoc } from 'firebase/firestore';
import { db, db2, db3, db4, db5, getDbByServer, getServerLabel, SERVER_CONFIGS } from '../../firebase/config';
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
// HARD-CODED SVG ICONS
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

const CalendarAddIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M15.5 2V6M7.5 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M20.3985 8C20.2706 6.69989 19.9816 5.82475 19.3284 5.17157C18.1569 4 16.2712 4 12.5 4H10.5C6.72876 4 4.84315 4 3.67157 5.17157C2.5 6.34315 2.5 8.22876 2.5 12V14C2.5 17.7712 2.5 19.6569 3.67157 20.8284C4.47975 21.6366 5.6277 21.8873 7.5 21.965" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M2.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M15.5 15H19.5M17.5 13V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M13 18C13 20.2091 14.7909 22 17 22C19.2091 22 21 20.2091 21 18C21 15.7909 19.2091 14 17 14C14.7909 14 13 15.7909 13 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const ExportPaidIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"} {...props}>
    <path d="M12 21V12M12 12L9.5 14.5M12 12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 6.5C3.5 7.5 2 9.5 2 12C2 16.9706 6.02944 21 11 21C15.9706 21 20 16.9706 20 12C20 9.5 18.5 7.5 17 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3V11M12 11L9.5 8.5M12 11L14.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 7L6 4L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="16" cy="17" r="4" stroke="#22C55E" strokeWidth="2" fill="none"/>
    <path d="M14.5 17L15.5 18L17.5 16" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"} {...props}>
    <path d="M20 8L19.1584 19.2274C19.0492 20.7389 18.9946 21.4947 18.4698 21.977C18.1128 22.3077 17.6413 22.4934 17.1491 22.4953C16.5165 22.4977 15.7711 22.0834 14.2805 21.2549L12.4459 20.2399C11.8618 19.9208 11.5698 19.7612 11.2527 19.6707C10.9025 19.5708 10.536 19.537 10.1725 19.5715C9.84932 19.602 9.53378 19.7137 9.04753 19.9174L7.24729 20.6283C5.71823 21.2098 4.9537 21.5005 4.32281 21.3513C3.76215 21.2176 3.2939 20.8436 3.03622 20.3345C2.75 19.7698 2.90181 18.9988 3.20543 18.4568L3.98777 17.0655C4.24623 16.6064 4.37545 16.3768 4.44201 16.1302C4.50629 15.8913 4.52636 15.6421 4.50086 15.3952C4.47476 15.1429 4.38029 14.904 4.20274 14.4658L3.95429 13.8566C3.66088 13.1254 3.51417 12.7598 3.51584 12.3885C3.51751 12.0368 3.63388 11.6945 3.8446 11.416C4.07491 11.1126 4.42257 10.908 4.77449 10.6485L6.47063 9.39165C7.21043 8.82534 7.58033 8.54218 8.00109 8.3821C8.38478 8.23548 8.79376 8.15675 9.20673 8.15033C9.66179 8.14322 10.1125 8.23682 10.8937 8.38049L11.1435 8.42676C11.6198 8.50923 11.858 8.55047 12.093 8.55647C12.3061 8.56188 12.5189 8.53464 12.7242 8.47578C12.9527 8.41021 13.1657 8.30407 13.5554 8.12455L14.3671 7.72842C15.1346 7.35074 15.5184 7.1619 15.9338 7.07343C16.3096 6.9933 16.6978 6.97986 17.0792 7.03388C17.5009 7.09409 17.9043 7.27698 18.6479 7.61053L19.9469 8.18449C20.6312 8.48393 20.9733 8.63365 21.134 8.8914C21.3165 9.18287 21.3469 9.54928 21.2153 9.86603" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.5 12.5L14.5 15.5M14.5 12.5L11.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PayAllIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M6.5 12L9.5 15L17.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
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

// ============================================================
// BILL CALCULATION FUNCTIONS
// ============================================================

const calculateBillAmount = (consumerType, consumption) => {
  const type = consumerType?.toUpperCase() || 'RESIDENTIAL';
  const consumptionNum = Number(consumption) || 0;
  
  if (type === 'RESIDENTIAL') {
    const FIRST_5_RATE = 62.50;
    const EXCESS_RATE = 12.50;
    
    if (consumptionNum <= 5) {
      return FIRST_5_RATE;
    }
    
    const excess = consumptionNum - 5;
    return FIRST_5_RATE + (excess * EXCESS_RATE);
    
  } else if (type === 'COMMERCIAL') {
    const TIER1_RATE = 15;
    const TIER2_RATE = 20;
    const TIER3_RATE = 30;
    const TIER1_LIMIT = 10;
    const TIER2_LIMIT = 20;
    
    if (consumptionNum <= TIER1_LIMIT) {
      return 150;
    } else if (consumptionNum <= TIER2_LIMIT) {
      const tier1Amount = TIER1_LIMIT * TIER1_RATE;
      const tier2Consumption = consumptionNum - TIER1_LIMIT;
      return tier1Amount + (tier2Consumption * TIER2_RATE);
    } else {
      const tier1Amount = TIER1_LIMIT * TIER1_RATE;
      const tier2Amount = (TIER2_LIMIT - TIER1_LIMIT) * TIER2_RATE;
      const tier3Consumption = consumptionNum - TIER2_LIMIT;
      return tier1Amount + tier2Amount + (tier3Consumption * TIER3_RATE);
    }
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
  if (statusStr === 'CUTOFF' || statusStr === 'CUT-OFF' || statusStr === 'CUT OFF') {
    return true;
  }
  
  const presentNA = isNAReading(bill.presentReading);
  const previousNA = isNAReading(bill.previousReading);
  
  if (presentNA && previousNA) {
    return true;
  }
  
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
  
  return {
    consumption,
    isDefective: isDefectiveReading,
    amount,
    isPresentDefective,
    isPreviousDefective
  };
};

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
    if (nameA !== nameB) {
      return nameA.localeCompare(nameB);
    }

    const yearA = parseInt(a.year) || 0;
    const yearB = parseInt(b.year) || 0;
    if (yearA !== yearB) {
      return yearA - yearB;
    }

    const monthA = getMonthIndex(a.month);
    const monthB = getMonthIndex(b.month);
    if (monthA !== monthB) {
      return monthA - monthB;
    }

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
    if (a.consumerName !== b.consumerName) {
      return a.consumerName.localeCompare(b.consumerName);
    }
    if (a.year !== b.year) {
      return Number(a.year) - Number(b.year);
    }
    return MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month);
  });
  
  return periods;
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
  const [filterConsumerPeriod, setFilterConsumerPeriod] = useState('all');
  const [filterServer, setFilterServer] = useState('all');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentCode, setPaymentCode] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPaid, setIsExportingPaid] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  
  const [tableType, setTableType] = useState('regular');
  
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
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportLocation, setSelectedExportLocation] = useState('all');
  const [exportLocations, setExportLocations] = useState([]);
  
  const [locations, setLocations] = useState([]);
  const [months, setMonths] = useState([]);
  const [years, setYears] = useState([]);
  const [consumerPeriods, setConsumerPeriods] = useState([]);
  
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

  const [showNewMonthModal, setShowNewMonthModal] = useState(false);
  const [newMonthLocation, setNewMonthLocation] = useState('');
  const [newMonthMonth, setNewMonthMonth] = useState('');
  const [newMonthYear, setNewMonthYear] = useState('');
  const [newMonthLoading, setNewMonthLoading] = useState(false);
  const [newMonthPreview, setNewMonthPreview] = useState([]);
  const [showNewMonthPreview, setShowNewMonthPreview] = useState(false);
  const [availableLocationsForNewMonth, setAvailableLocationsForNewMonth] = useState([]);

  const [showExportPaidConfirm, setShowExportPaidConfirm] = useState(false);
  const [paidBillsToDelete, setPaidBillsToDelete] = useState([]);

  // ========== SERVER SELECTION FOR IMPORT ==========
  const [showServerSelectModal, setShowServerSelectModal] = useState(false);
  const [selectedImportServer, setSelectedImportServer] = useState(null);

  useEffect(() => {
    fetchBills();
  }, [user]);

  useEffect(() => {
    filterBills();
  }, [bills, searchTerm, filterType, filterLocation, filterMonth, filterYear, filterConsumerPeriod, filterServer, tableType]);

  useEffect(() => {
    if (showPayModal) {
      setPaymentCode('');
      setPaymentError('');
    }
  }, [showPayModal]);

  useEffect(() => {
    if (showPayAllModal) {
      setPayAllPaymentCode('');
      setPayAllPaymentError('');
    }
  }, [showPayAllModal]);

  useEffect(() => {
    if (showCutoffPayModal) {
      setCutoffPaymentCode('');
      setCutoffPaymentError('');
    }
  }, [showCutoffPayModal]);

  useEffect(() => {
    const locationSet = new Set();
    bills.forEach(bill => {
      if (bill.location && bill.location !== 'N/A') {
        locationSet.add(bill.location);
      }
    });
    setExportLocations(Array.from(locationSet).sort());
    setAvailableLocationsForNewMonth(Array.from(locationSet).sort());
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
    setMonths(Array.from(monthSet).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)));
    setYears(Array.from(yearSet).sort((a, b) => Number(b) - Number(a)));
    
    setConsumerPeriods(getConsumerPeriodOptions(billsData));
  };

  // ============================================================
  // FETCH BILLS FROM ALL 5 FIRESTORES
  // ============================================================
  const fetchBills = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const allBills = [];

      // Loop through all 5 servers
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
          console.log(`✅ Fetched from ${serverConfig.label}`);
        } catch (e) {
          console.error(`❌ Error fetching from ${serverConfig.label}:`, e);
        }
      }
      
      const processedBills = processBillsWithStatus(allBills);
      const sortedBills = sortByConsumerPeriod(processedBills);
      
      setBills(sortedBills);
      setFilteredBills(sortedBills);
      calculateStats(sortedBills);
      extractFilterOptions(sortedBills);
      
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Error loading bills from database');
    }
    setLoading(false);
  };

  const filterBills = () => {
    let filtered = [...bills];
    
    if (tableType === 'regular') {
      filtered = filtered.filter(bill => !isCutoffBill(bill));
    } else {
      filtered = filtered.filter(bill => isCutoffBill(bill));
    }

    if (filterServer !== 'all') {
      filtered = filtered.filter(bill => 
        (bill.serverSource || 'server1') === filterServer
      );
    }
    
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
    setFilterConsumerPeriod('all');
    setFilterServer('all');
  };

  const handleDelete = async (billId) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    
    const bill = bills.find(b => b.id === billId);
    const targetDb = getDbByServer(bill?.serverSource || 'server1');
    
    try {
      await deleteDoc(doc(targetDb, 'bills', billId));
      toast.success(`Bill deleted from ${getServerLabel(bill?.serverSource)}`);
      fetchBills();
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
    fetchBills();
  };

  const handlePayBill = (bill) => {
    setSelectedBill(bill);
    setPaymentCode('');
    setPaymentError('');
    setShowPayModal(true);
  };

  const handleCutoffPay = (bill) => {
    setCutoffBillToPay(bill);
    setCutoffPaymentCode('');
    setCutoffPaymentError('');
    setShowCutoffPayModal(true);
  };

  const handlePaymentCodeChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setPaymentCode(value);
      setPaymentError('');
    }
  };

  const handleCutoffPaymentCodeChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setCutoffPaymentCode(value);
      setCutoffPaymentError('');
    }
  };

  // ============================================================
  // CUTOFF PAYMENT CONFIRMATION - WITH SERVER TARGETING
  // ============================================================
  const confirmCutoffPay = async () => {
    if (!cutoffPaymentCode || cutoffPaymentCode.length !== 7) {
      setCutoffPaymentError('Please enter a valid 7-digit payment code.');
      return;
    }

    if (!cutoffBillToPay) return;

    setIsPayingCutoff(true);

    try {
      const referenceNumber = `CUTOFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const amountToPay = cutoffBillToPay.amount || cutoffBillToPay.collectableAmount || 0;

      const targetDb = getDbByServer(cutoffBillToPay.serverSource || 'server1');
      const billRef = doc(targetDb, 'bills', cutoffBillToPay.id);
      
      await updateDoc(billRef, {
        status: 'paid',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentCode: cutoffPaymentCode,
        referenceNumber: referenceNumber,
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
      });

      toast.success(`✅ Cut-off bill ${cutoffBillToPay.billNumber} marked as paid!`);
      toast.success(`💰 Amount: ₱${amountToPay.toFixed(2)}`);

      setShowCutoffPayModal(false);

      setReceiptData({
        bill: {
          ...cutoffBillToPay,
          consumption: 'CUT-OFF',
          amount: amountToPay,
          isDefective: false,
          isCutoff: true
        },
        paymentCode: cutoffPaymentCode,
        referenceNumber: referenceNumber
      });
      setShowReceipt(true);

      setCutoffBillToPay(null);
      setCutoffPaymentCode('');
      setCutoffPaymentError('');
      fetchBills();
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
    setPayAllPaymentCode('');
    setPayAllPaymentError('');
    setShowPayAllModal(true);
  };

  const handlePayAllPaymentCodeChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setPayAllPaymentCode(value);
      setPayAllPaymentError('');
    }
  };

  // ============================================================
  // PAY ALL CONFIRMATION - WITH SERVER TARGETING
  // ============================================================
  const confirmPayAll = async () => {
    if (!payAllPaymentCode || payAllPaymentCode.length !== 7) {
      setPayAllPaymentError('Please enter a valid 7-digit payment code.');
      return;
    }

    if (payAllBills.length === 0) {
      toast.error('No bills to pay');
      return;
    }

    setIsPayingAll(true);

    try {
      const referenceNumber = `PAYALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      let successCount = 0;
      let errorCount = 0;
      let totalAmount = 0;
      let paymentDetails = [];

      for (const bill of payAllBills) {
        try {
          const isPresentDefective = isDefective(bill.presentReading);
          const isPreviousDefective = isDefective(bill.previousReading);
          const isDefectiveReading = isPresentDefective || isPreviousDefective;
          
          let consumption = 0;
          let calculatedAmount = 0;
          
          if (isDefectiveReading) {
            consumption = 0;
            calculatedAmount = bill.consumerType?.toUpperCase() === 'COMMERCIAL' ? 150 : 75;
          } else {
            consumption = calculateConsumption(
              bill.presentReading,
              bill.previousReading
            );
            calculatedAmount = calculateBillAmount(
              bill.consumerType,
              consumption
            );
          }

          const targetDb = getDbByServer(bill.serverSource || 'server1');
          const billRef = doc(targetDb, 'bills', bill.id);
          
          await updateDoc(billRef, {
            status: 'paid',
            paidAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            paymentCode: payAllPaymentCode,
            referenceNumber: referenceNumber,
            paidBy: user?.email || 'Unknown',
            consumption: consumption,
            amount: calculatedAmount,
            amountCalculated: true,
            isDefective: isDefectiveReading,
            isPresentDefective,
            isPreviousDefective,
            paidVia: 'PAY_ALL',
            calculationDetails: {
              consumerType: bill.consumerType || 'RESIDENTIAL',
              previousReading: bill.previousReading || 0,
              presentReading: bill.presentReading || 0,
              consumption: consumption,
              calculatedAmount: calculatedAmount,
              calculatedAt: new Date().toISOString(),
              isDefective: isDefectiveReading
            }
          });

          totalAmount += calculatedAmount;
          successCount++;
          
          paymentDetails.push({
            month: bill.month,
            year: bill.year,
            billNumber: bill.billNumber,
            amount: calculatedAmount,
            consumption: consumption,
            isDefective: isDefectiveReading
          });

        } catch (error) {
          console.error('Error processing bill:', error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Successfully paid ${successCount} bills for ${payAllConsumerName}!`);
        toast.success(`💰 Total Amount: ₱${totalAmount.toFixed(2)}`);
        toast.success(`📋 OR Number: ${payAllPaymentCode}`);
        
        setReceiptData({
          bill: {
            ...payAllBills[0],
            consumerName: payAllConsumerName,
            consumption: 'Multiple Bills',
            amount: totalAmount,
            isDefective: false,
            isPayAll: true,
            payAllCount: successCount,
            payAllDetails: paymentDetails,
            paymentCode: payAllPaymentCode,
            referenceNumber: referenceNumber
          },
          paymentCode: payAllPaymentCode,
          referenceNumber: referenceNumber,
          isPayAll: true,
          payAllDetails: paymentDetails
        });
        setShowReceipt(true);
      }

      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} bills failed to process`);
      }

      setShowPayAllModal(false);
      setPayAllBills([]);
      setPayAllPaymentCode('');
      setPayAllPaymentError('');
      fetchBills();

    } catch (error) {
      console.error('❌ Pay All error:', error);
      toast.error('Error processing payment: ' + error.message);
    } finally {
      setIsPayingAll(false);
    }
  };

  // ============================================================
  // SINGLE PAY CONFIRMATION - WITH SERVER TARGETING
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

      const isPresentDefective = isDefective(selectedBill.presentReading);
      const isPreviousDefective = isDefective(selectedBill.previousReading);
      const isDefectiveReading = isPresentDefective || isPreviousDefective;
      
      let consumption = 0;
      let calculatedAmount = 0;
      
      if (isDefectiveReading) {
        consumption = 0;
        calculatedAmount = selectedBill.consumerType?.toUpperCase() === 'COMMERCIAL' ? 150 : 75;
      } else {
        consumption = calculateConsumption(
          selectedBill.presentReading,
          selectedBill.previousReading
        );
        calculatedAmount = calculateBillAmount(
          selectedBill.consumerType,
          consumption
        );
      }

      const targetDb = getDbByServer(selectedBill.serverSource || 'server1');
      const billRef = doc(targetDb, 'bills', selectedBill.id);
      
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
        isDefective: isDefectiveReading,
        isPresentDefective,
        isPreviousDefective,
        calculationDetails: {
          consumerType: selectedBill.consumerType || 'RESIDENTIAL',
          previousReading: selectedBill.previousReading || 0,
          presentReading: selectedBill.presentReading || 0,
          consumption: consumption,
          calculatedAmount: calculatedAmount,
          calculatedAt: new Date().toISOString(),
          isDefective: isDefectiveReading
        }
      });

      await createNextMonthBill({
        ...selectedBill,
        consumption: consumption,
        amount: calculatedAmount,
        isDefective: isDefectiveReading,
        isPresentDefective,
        isPreviousDefective
      });

      toast.success(`✅ Bill ${selectedBill.billNumber} marked as paid!`);
      toast.success(`💰 Amount: ₱${calculatedAmount.toFixed(2)}`);

      setShowPayModal(false);

      setReceiptData({
        bill: {
          ...selectedBill,
          consumption: consumption,
          amount: calculatedAmount,
          isDefective: isDefectiveReading
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
  // CREATE NEXT MONTH BILL - WITH SERVER TARGETING
  // ============================================================
  const createNextMonthBill = async (paidBill) => {
    try {
      const currentMonth = paidBill.month;
      const currentYear = parseInt(paidBill.year);

      const currentIndex = MONTH_ORDER.indexOf(currentMonth?.toUpperCase());
      if (currentIndex === -1) return;

      const nextIndex = (currentIndex + 1) % 12;
      const nextMonth = MONTH_ORDER[nextIndex];
      const nextYear = nextIndex === 0 ? currentYear + 1 : currentYear;

      const targetDb = getDbByServer(paidBill.serverSource || 'server1');

      const billsRef = collection(targetDb, 'bills');
      const q = query(
        billsRef,
        where('month', '==', nextMonth),
        where('year', '==', nextYear.toString()),
        where('consumerName', '==', paidBill.consumerName),
        where('location', '==', paidBill.location)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();
        
        if (!existingData.previousReading || existingData.previousReading === 0 || existingData.previousReading === '0') {
          const existingRef = doc(targetDb, 'bills', existingDoc.id);
          await updateDoc(existingRef, {
            previousReading: paidBill.presentReading || 0,
            updatedAt: new Date().toISOString()
          });
        }
        return;
      }

      const nextBillNumber = paidBill.billNumber || `WB-${nextYear}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

      const newBillData = {
        billNumber: nextBillNumber,
        consumerName: paidBill.consumerName || 'N/A',
        location: paidBill.location || 'N/A',
        consumerType: paidBill.consumerType || 'RESIDENTIAL',
        month: nextMonth,
        year: nextYear.toString(),
        previousReading: paidBill.presentReading || 0,
        presentReading: 0,
        consumption: 0,
        amount: 0,
        dueDate: `${nextYear}-${String(nextIndex + 1).padStart(2, '0')}-15`,
        status: 'unpaid',
        notes: `Auto-created from ${currentMonth} ${currentYear} payment`,
        userId: user?.uid || paidBill.userId || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAutoGenerated: true,
        generatedFrom: paidBill.id,
        generatedFromBillNumber: paidBill.billNumber,
        previousAmount: paidBill.amount || 0,
        previousConsumption: paidBill.consumption || 0,
        serverSource: paidBill.serverSource || 'server1'
      };

      const docRef = await addDoc(collection(targetDb, 'bills'), newBillData);
      toast.success(`📋 Auto-created bill for ${nextMonth} ${nextYear}`);

      return docRef.id;

    } catch (error) {
      console.error('Error creating next month bill:', error);
    }
  };

  const openNewMonthModal = () => {
    setNewMonthLocation('');
    setNewMonthMonth('');
    setNewMonthYear(new Date().getFullYear().toString());
    setNewMonthPreview([]);
    setShowNewMonthPreview(false);
    setShowNewMonthModal(true);
  };

  const closeNewMonthModal = () => {
    setShowNewMonthModal(false);
    setNewMonthLocation('');
    setNewMonthMonth('');
    setNewMonthPreview([]);
    setShowNewMonthPreview(false);
    setNewMonthLoading(false);
  };

  const previewNewMonth = async () => {
    if (!newMonthLocation || !newMonthMonth || !newMonthYear) {
      toast.error('Please select Location, Month, and Year');
      return;
    }

    setNewMonthLoading(true);

    try {
      const allBills = [];

      for (const serverConfig of SERVER_CONFIGS) {
        try {
          const billsRef = collection(serverConfig.db, 'bills');
          const q = query(
            billsRef,
            where('location', '==', newMonthLocation),
            where('month', '==', newMonthMonth),
            where('year', '==', newMonthYear)
          );
          const snap = await getDocs(q);
          snap.forEach((doc) => {
            allBills.push({ id: doc.id, ...doc.data(), serverSource: serverConfig.key });
          });
        } catch (e) {
          console.error(`Error previewing from ${serverConfig.label}:`, e);
        }
      }

      if (allBills.length === 0) {
        toast.error(`No bills found for ${newMonthMonth} ${newMonthYear} in ${newMonthLocation}`);
        setNewMonthLoading(false);
        return;
      }

      setNewMonthPreview(allBills);
      setShowNewMonthPreview(true);
      toast.success(`Found ${allBills.length} bills for ${newMonthMonth} ${newMonthYear} in ${newMonthLocation}`);

    } catch (error) {
      console.error('Error previewing new month:', error);
      toast.error('Error fetching bills: ' + error.message);
    }

    setNewMonthLoading(false);
  };

  const confirmNewMonth = async () => {
    if (newMonthPreview.length === 0) {
      toast.error('No data to process');
      return;
    }

    const currentIndex = MONTH_ORDER.indexOf(newMonthMonth.toUpperCase());
    const nextIndex = (currentIndex + 1) % 12;
    const nextMonth = MONTH_ORDER[nextIndex];
    const nextYear = nextIndex === 0 ? parseInt(newMonthYear) + 1 : parseInt(newMonthYear);

    setNewMonthLoading(true);
    setShowNewMonthPreview(false);

    try {
      let successCount = 0;
      let errorCount = 0;

      // Group by server
      const groupedByServer = {};
      for (const bill of newMonthPreview) {
        const serverKey = bill.serverSource || 'server1';
        if (!groupedByServer[serverKey]) {
          groupedByServer[serverKey] = [];
        }
        groupedByServer[serverKey].push(bill);
      }

      // Process each server group
      for (const [serverKey, serverBills] of Object.entries(groupedByServer)) {
        const targetDb = getDbByServer(serverKey);
        const billsCollectionRef = collection(targetDb, 'bills');
        let batch = writeBatch(targetDb);
        let batchCount = 0;

        for (let i = 0; i < serverBills.length; i++) {
          try {
            const bill = serverBills[i];
            const { id, ...billData } = bill;

            const presentReading = billData.presentReading || 0;

            const newBillData = {
              ...billData,
              month: nextMonth,
              year: nextYear.toString(),
              previousReading: presentReading,
              presentReading: 0,
              consumption: 0,
              amount: 0,
              status: 'unpaid',
              dueDate: `${nextYear}-${String(nextIndex + 1).padStart(2, '0')}-15`,
              notes: `Created from ${newMonthMonth} ${newMonthYear} rollover`,
              userId: user?.uid || billData.userId || 'unknown',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isRollover: true,
              rolloverFrom: id,
              rolloverFromMonth: newMonthMonth,
              rolloverFromYear: newMonthYear,
              rolloverLocation: newMonthLocation,
              previousPresentReading: presentReading,
              serverSource: serverKey
            };

            const newBillNumber = `${nextYear}-${String(i + 1).padStart(3, '0')}`;
            newBillData.billNumber = newBillNumber;

            const docRef = doc(billsCollectionRef);
            batch.set(docRef, newBillData);
            successCount++;
            batchCount++;

            if (batchCount >= 500) {
              await batch.commit();
              batch = writeBatch(targetDb);
              batchCount = 0;
            }

          } catch (error) {
            console.error(`Error creating new month bill (${serverKey}):`, error);
            errorCount++;
          }
        }

        if (batchCount > 0) {
          await batch.commit();
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Created ${successCount} bills for ${nextMonth} ${nextYear} in ${newMonthLocation}!`);
        closeNewMonthModal();
        fetchBills();
      }

      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} bills failed to create`);
      }

    } catch (error) {
      console.error('Error during new month creation:', error);
      toast.error('Error creating new month: ' + error.message);
    } finally {
      setNewMonthLoading(false);
    }
  };

  const openExportPaidConfirm = () => {
    const paidBills = bills.filter(bill => bill.status === 'paid');
    
    if (paidBills.length === 0) {
      toast.error('No paid bills found to export!');
      return;
    }

    setPaidBillsToDelete(paidBills);
    setShowExportPaidConfirm(true);
  };

  const closeExportPaidConfirm = () => {
    setShowExportPaidConfirm(false);
    setPaidBillsToDelete([]);
  };

  // ============================================================
  // EXPORT PAID AND DELETE - WITH SERVER TARGETING
  // ============================================================
  const executeExportPaidAndDelete = async () => {
    const paidBills = paidBillsToDelete;
    
    if (paidBills.length === 0) {
      toast.error('No paid bills to process');
      return;
    }

    setIsExportingPaid(true);
    closeExportPaidConfirm();

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Paid Water Bills');

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
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Defective', key: 'defective', width: 12 },
        { header: 'Payment Code', key: 'paymentCode', width: 15 },
        { header: 'Paid At', key: 'paidAt', width: 20 },
        { header: 'Paid By', key: 'paidBy', width: 20 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF16A34A' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 25;

      const sortedForExport = sortByConsumerPeriod(paidBills);
      
      sortedForExport.forEach((bill) => {
        const period = `${bill.month || 'N/A'} ${bill.year || ''}`;
        const isDefectiveReading = isDefective(bill.presentReading) || isDefective(bill.previousReading);
        
        let paidAt = 'N/A';
        if (bill.paidAt) {
          try {
            const date = new Date(bill.paidAt);
            paidAt = date.toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch (e) {
            paidAt = bill.paidAt || 'N/A';
          }
        }

        worksheet.addRow({
          wsin: bill.billNumber || 'N/A',
          server: getServerLabel(bill.serverSource),
          consumerName: bill.consumerName || 'N/A',
          location: bill.location || 'N/A',
          period: period.trim() || 'N/A',
          consumerType: bill.consumerType || 'N/A',
          previousReading: isDefective(bill.previousReading) ? 'DEFECTIVE' : (bill.previousReading || '0'),
          presentReading: isDefective(bill.presentReading) ? 'DEFECTIVE' : (bill.presentReading || '0'),
          consumption: bill.consumption || '0',
          amount: bill.amount || '0',
          status: 'PAID',
          defective: isDefectiveReading ? 'YES' : 'NO',
          paymentCode: bill.paymentCode || 'N/A',
          paidAt: paidAt,
          paidBy: bill.paidBy || 'N/A'
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
          
          const statusCell = row.getCell(11);
          statusCell.font = { color: { argb: 'FF16A34A' }, bold: true };

          const defectiveCell = row.getCell(12);
          if (defectiveCell.value === 'YES') {
            defectiveCell.font = { color: { argb: 'FFDC2626' }, bold: true };
          }

          const paymentCell = row.getCell(13);
          paymentCell.font = { color: { argb: 'FF2563EB' }, bold: true };
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

      const defaultFileName = `Paid_Water_Bills_${new Date().toISOString().split('T')[0]}.xlsx`;

      let fileSaved = false;
      
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
          fileSaved = true;
          
        } catch (pickError) {
          if (pickError.name === 'AbortError' || pickError.name === 'SecurityError') {
            toast.error('Export cancelled');
            setIsExportingPaid(false);
            return;
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = defaultFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            fileSaved = true;
          }
        }
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = defaultFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        fileSaved = true;
      }

      if (!fileSaved) {
        toast.error('Failed to save file');
        setIsExportingPaid(false);
        return;
      }

      toast.success(`✅ Exported ${paidBills.length} paid bills!`);

      // ========== DELETE FROM RESPECTIVE SERVERS ==========
      const groupedByServer = {};
      for (const bill of paidBills) {
        const serverKey = bill.serverSource || 'server1';
        if (!groupedByServer[serverKey]) {
          groupedByServer[serverKey] = [];
        }
        groupedByServer[serverKey].push(bill);
      }

      let deleteSuccessCount = 0;
      let deleteErrorCount = 0;

      for (const [serverKey, serverBills] of Object.entries(groupedByServer)) {
        const targetDb = getDbByServer(serverKey);
        let deleteBatch = writeBatch(targetDb);
        let deleteBatchCount = 0;

        for (let i = 0; i < serverBills.length; i++) {
          try {
            const billRef = doc(targetDb, 'bills', serverBills[i].id);
            deleteBatch.delete(billRef);
            deleteSuccessCount++;
            deleteBatchCount++;

            if (deleteBatchCount >= 500) {
              await deleteBatch.commit();
              deleteBatch = writeBatch(targetDb);
              deleteBatchCount = 0;
            }
          } catch (error) {
            console.error(`Error deleting paid bill (${serverKey}):`, error);
            deleteErrorCount++;
          }
        }

        if (deleteBatchCount > 0) {
          await deleteBatch.commit();
        }
      }

      if (deleteSuccessCount > 0) {
        toast.success(`🗑️ Successfully deleted ${deleteSuccessCount} paid bills from Firebase!`);
      }

      if (deleteErrorCount > 0) {
        toast.error(`⚠️ ${deleteErrorCount} bills failed to delete`);
      }

      toast.success(`🔒 Excel Password: ${EXCEL_PASSWORD}`);

      await fetchBills();

    } catch (error) {
      console.error('Export paid bills error:', error);
      toast.error('Error processing paid bills: ' + error.message);
    } finally {
      setIsExportingPaid(false);
      setPaidBillsToDelete([]);
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
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Defective', key: 'defective', width: 12 }
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
          status: isCutoff ? 'CUT-OFF' : (bill.status?.toUpperCase() || 'UNPAID'),
          defective: isDefectiveReading ? 'YES' : 'NO'
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
          
          const statusCell = row.getCell(11);
          const statusValue = statusCell.value?.toString().toLowerCase() || '';
          if (statusValue === 'paid') {
            statusCell.font = { color: { argb: 'FF059669' }, bold: true };
          } else if (statusValue === 'unpaid') {
            statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
          } else if (statusValue === 'overdue') {
            statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
          } else if (statusValue === 'cut-off' || statusValue === 'cutoff') {
            statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
          }

          const defectiveCell = row.getCell(12);
          if (defectiveCell.value === 'YES') {
            defectiveCell.font = { color: { argb: 'FFDC2626' }, bold: true };
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

  const detectExcelFormat = (jsonData) => {
    if (!jsonData || jsonData.length === 0) return 'unknown';
    
    const firstRow = jsonData[0];
    const keys = Object.keys(firstRow).map(k => k.toLowerCase().trim());
    
    const hasCollectableAmount = keys.some(k => 
      k === 'collectable amount' || k === 'collectableamount' || k === 'collectable_amount'
    );
    
    const hasPresentReading = keys.some(k => k === 'present reading' || k === 'presentreading');
    const hasPreviousReading = keys.some(k => k === 'previous reading' || k === 'previousreading');
    
    if (hasCollectableAmount) {
      return 'cutoff_format';
    }
    
    if (hasPresentReading && hasPreviousReading) {
      return 'calian_format';
    }
    
    return 'unknown';
  };

  const getRowValue = (row, ...possibleKeys) => {
    for (const key of possibleKeys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key].toString().trim();
      }
    }
    const rowKeys = Object.keys(row);
    for (const key of possibleKeys) {
      const lowerKey = key.toLowerCase().trim();
      const matchedKey = rowKeys.find(k => k.toLowerCase().trim() === lowerKey);
      if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && row[matchedKey] !== '') {
        return row[matchedKey].toString().trim();
      }
    }
    return '';
  };

  const parseExcelData = (jsonData) => {
    const parsedData = [];
    const format = detectExcelFormat(jsonData);
    
    console.log('📊 Detected Excel format:', format);
    
    jsonData.forEach((row, index) => {
      const wsin = getRowValue(row, 'WSIN', 'wsin');
      const consumerName = getRowValue(row, 'Consumer Name', 'consumerName', 'Consumer');
      const location = getRowValue(row, 'Location', 'location');
      const month = getRowValue(row, 'month', 'Month').toUpperCase();
      const year = getRowValue(row, 'year', 'Year');
      const type = getRowValue(row, 'type', 'Type') || 'OLD';
      const consumerType = getRowValue(row, 'Consumer Type', 'consumerType', 'Type').toUpperCase() || 'RESIDENTIAL';
      const status = getRowValue(row, 'status', 'Status');
      const presentReading = getRowValue(row, 'Present Reading', 'presentReading');
      const previousReading = getRowValue(row, 'Previous Reading', 'previousReading');
      const collectableAmount = getRowValue(row, 'collectable amount', 'Collectable Amount', 'collectableAmount');
      
      if (!consumerName || consumerName === '') {
        return;
      }
      
      const statusUpper = status.toUpperCase().trim();
      const isStatusCutoff = statusUpper === 'CUTOFF' || statusUpper === 'CUT-OFF' || statusUpper === 'CUT OFF';
      
      const presentNA = isNAReading(presentReading);
      const previousNA = isNAReading(previousReading);
      const isReadingsNA = presentNA && previousNA;
      
      let isCutoff = false;
      
      if (format === 'cutoff_format') {
        isCutoff = isStatusCutoff || isReadingsNA;
      } else {
        isCutoff = isStatusCutoff;
      }
      
      let billStatus = 'unpaid';
      if (isCutoff) {
        billStatus = 'cutoff';
      } else if (statusUpper === 'PAID') {
        billStatus = 'paid';
      } else if (statusUpper === 'OVERDUE') {
        billStatus = 'overdue';
      }
      
      const billNumber = wsin || `WB-${year}-${String(index + 1).padStart(3, '0')}`;
      
      const parseAmount = (value) => {
        if (!value || value === '') return 0;
        const cleaned = value.toString().replace(/,/g, '').trim();
        return parseFloat(cleaned) || 0;
      };
      
      let consumptionValue = 0;
      let amountValue = 0;
      let finalPresentReading = presentReading;
      let finalPreviousReading = previousReading;
      
      if (isCutoff) {
        finalPresentReading = 'N/A';
        finalPreviousReading = 'N/A';
        consumptionValue = 0;
        amountValue = parseAmount(collectableAmount);
      } else {
        const isPresentDefective = isDefective(presentReading);
        const isPreviousDefective = isDefective(previousReading);
        const isDefectiveReading = isPresentDefective || isPreviousDefective;
        
        if (isDefectiveReading) {
          consumptionValue = 0;
          amountValue = consumerType === 'COMMERCIAL' ? 150 : 75;
        } else if (presentNA || previousNA) {
          consumptionValue = 0;
          amountValue = 0;
        } else {
          const presentNum = Number(presentReading) || 0;
          const previousNum = Number(previousReading) || 0;
          consumptionValue = Math.max(0, presentNum - previousNum);
          amountValue = calculateBillAmount(consumerType, consumptionValue);
        }
        
        if (amountValue === 0 && collectableAmount) {
          amountValue = parseAmount(collectableAmount);
        }
      }
      
      parsedData.push({
        billNumber,
        consumerName,
        location: location || 'N/A',
        type: type || 'OLD',
        consumerType: consumerType || 'RESIDENTIAL',
        year: year || new Date().getFullYear().toString(),
        month: month || 'JANUARY',
        status: billStatus,
        presentReading: finalPresentReading,
        previousReading: finalPreviousReading,
        consumption: consumptionValue,
        amount: amountValue,
        collectableAmount: parseAmount(collectableAmount),
        dueDate: `${year || new Date().getFullYear()}-${getMonthNumber(month || 'JANUARY')}-15`,
        notes: isCutoff ? 'CUT-OFF ACCOUNT' : '',
        isImported: true,
        importDate: new Date().toISOString(),
        isCutoff: isCutoff,
        excelFormat: format
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
    return months[month] || '01';
  };

  // ============================================================
  // FILE UPLOAD HANDLER - WITH SERVER CHOICE
  // ============================================================
  const handleFileUpload = async (event, serverChoice) => {
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

    const targetDb = getDbByServer(serverChoice);
    const serverLabel = getServerLabel(serverChoice);

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

          let batch = writeBatch(targetDb);
          const billsRef = collection(targetDb, 'bills');
          let successCount = 0;
          let errorCount = 0;
          let batchCount = 0;

          for (let i = 0; i < parsedBills.length; i++) {
            try {
              const billData = {
                ...parsedBills[i],
                userId: user.uid,
                importedBy: user?.email || user?.uid || 'Unknown User',
                importedByName: user?.displayName || 'Unknown',
                serverSource: serverChoice,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              const docRef = doc(billsRef);
              batch.set(docRef, billData);
              successCount++;
              batchCount++;
              
              setUploadProgress({ current: i + 1, total: parsedBills.length });
              
              if (batchCount >= 500) {
                await batch.commit();
                batch = writeBatch(targetDb);
                batchCount = 0;
              }
            } catch (error) {
              console.error('Error adding bill:', error);
              errorCount++;
            }
          }

          if (batchCount > 0) {
            await batch.commit();
          }

          const cutoffCount = parsedBills.filter(b => b.isCutoff).length;
          
          toast.success(`✅ Imported ${successCount} bills to ${serverLabel}! ${errorCount > 0 ? `${errorCount} failed.` : ''}`);
          if (cutoffCount > 0) {
            toast.success(`🔴 ${cutoffCount} cut-off accounts detected.`);
          }
          fetchBills();
          
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          
          let errorMsg = 'Error processing Excel file.';
          if (error?.code === 'permission-denied') {
            errorMsg = `❌ Permission denied sa ${serverLabel}. Check Firestore rules!`;
          } else if (error?.code === 'unavailable') {
            errorMsg = `❌ Cannot connect to ${serverLabel}. Check internet!`;
          } else if (error?.code === 'not-found') {
            errorMsg = `❌ Firestore sa ${serverLabel} wala pa na-setup!`;
          } else if (error?.message) {
            errorMsg = `Error: ${error.message}`;
          }
          
          toast.error(errorMsg, { duration: 8000 });
        } finally {
          setUploading(false);
          setShowProgress(false);
          setUploadProgress({ current: 0, total: 0 });
          event.target.value = '';
          setSelectedImportServer(null);
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
      overdue: { label: 'Overdue', class: 'status-overdue' },
      cutoff: { label: 'Cut-off', class: 'status-cutoff' }
    };
    return statusMap[status] || statusMap.unpaid;
  };

  // Helper function to get server color
  const getServerColor = (serverKey) => {
    const config = SERVER_CONFIGS.find(s => s.key === serverKey);
    return config ? config.color : '#194752';
  };

  const activeFilterCount = [
    filterType !== 'all',
    filterLocation !== 'all',
    filterMonth !== 'all',
    filterYear !== 'all',
    filterConsumerPeriod !== 'all',
    filterServer !== 'all'
  ].filter(Boolean).length;

  const getConsumersWithUnpaid = () => {
    const consumerMap = new Map();
    filteredBills.forEach(bill => {
      if (bill.status !== 'paid' && !isCutoffBill(bill) && bill.consumerName) {
        if (!consumerMap.has(bill.consumerName)) {
          consumerMap.set(bill.consumerName, []);
        }
        consumerMap.get(bill.consumerName).push(bill);
      }
    });
    return consumerMap;
  };

  const consumersWithUnpaid = getConsumersWithUnpaid();

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
          <div className="table-type-toggle">
            <button
              className={`table-type-btn ${tableType === 'regular' ? 'active' : ''}`}
              onClick={() => setTableType('regular')}
            >
              <RegularTableIcon />
              REGULAR
            </button>
            <button
              className={`table-type-btn cutoff-btn ${tableType === 'cutoff' ? 'active' : ''}`}
              onClick={() => setTableType('cutoff')}
            >
              <CutoffTableIcon />
              CUT-OFF
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            ADD BILL
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowServerSelectModal(true)}
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
          <button 
            className="btn btn-success" 
            onClick={openExportPaidConfirm}
            disabled={bills.filter(b => b.status === 'paid').length === 0 || isExportingPaid}
            style={{
              background: '#16A34A',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <ExportPaidIcon width={20} height={20} color="#ffffff" />
            {isExportingPaid ? '⏳ Processing...' : 'EXPORT PAID'}
          </button>
          <button 
            className="btn btn-success" 
            onClick={openNewMonthModal}
            style={{
              background: '#194752',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <CalendarAddIcon width={20} height={20} color="#ffffff" />
            ADD NEW MONTH
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        id="fileInput"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e, selectedImportServer)}
      />

      {/* ============================================================ */}
      {/* SERVER SELECTION MODAL FOR IMPORT - 5 SERVERS */}
      {/* ============================================================ */}
      {showServerSelectModal && (
        <div className="modal-overlay" onClick={() => setShowServerSelectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                🌐 Select Server
              </h2>
              <button className="close-btn" onClick={() => setShowServerSelectModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
                Pilia asa nga <strong>Firebase Firestore</strong> nimo e-store ang gi-import nga Excel data.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px'
              }}>
                {SERVER_CONFIGS.map((server) => (
                  <button
                    key={server.key}
                    onClick={() => {
                      setSelectedImportServer(server.key);
                      setShowServerSelectModal(false);
                      setTimeout(() => {
                        document.getElementById('fileInput').click();
                      }, 150);
                    }}
                    style={{
                      padding: '20px 12px',
                      background: `linear-gradient(135deg, ${server.color}, ${server.color}dd)`,
                      color: '#ffffff',
                      border: `3px solid ${server.color}`,
                      borderRadius: '14px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.25s ease',
                      boxShadow: `0 6px 20px ${server.color}40`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                      e.currentTarget.style.boxShadow = `0 12px 30px ${server.color}66`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = `0 6px 20px ${server.color}40`;
                    }}
                  >
                    <span style={{ fontSize: '30px' }}>🗄️</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '0.5px' }}>
                      {server.label.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '10px', opacity: 0.9, textAlign: 'center', wordBreak: 'break-all' }}>
                      {server.project}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowServerSelectModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CUTOFF PAY MODAL */}
      {/* ============================================================ */}
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
                Confirm payment for this cut-off account. The <strong>Collectable Amount</strong> will be used as the payment amount.
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

              <div style={{ 
                border: '2px solid #DC2626', 
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ background: '#DC2626' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>
                        Bill Number (WSIN)
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>
                        Consumer Name
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>
                        Type
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#ffffff', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>
                        Year
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', color: '#ffffff', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' }}>
                        Collectable Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ background: '#FFF5F5' }}>
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#194752' }}>
                        {cutoffBillToPay.billNumber || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: '500', color: '#0F172A' }}>
                        {cutoffBillToPay.consumerName || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={`type-badge ${cutoffBillToPay.type?.toUpperCase() === 'COMMERCIAL' ? 'commercial' : 'residential'}`}>
                          {cutoffBillToPay.type || cutoffBillToPay.consumerType || 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: '500', color: '#0F172A' }}>
                        {cutoffBillToPay.year || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', fontSize: '18px', color: '#DC2626' }}>
                        {formatCurrency(cutoffBillToPay.amount || cutoffBillToPay.collectableAmount || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ 
                background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                border: '2px solid #FECACA',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#991B1B', fontWeight: '500' }}>
                    AMOUNT TO PAY
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '28px', fontWeight: '800', color: '#DC2626' }}>
                    {formatCurrency(cutoffBillToPay.amount || cutoffBillToPay.collectableAmount || 0)}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#991B1B', fontWeight: '500' }}>
                    STATUS
                  </p>
                  <span className="status-badge status-cutoff" style={{ fontSize: '14px', padding: '6px 18px' }}>
                    CUT-OFF
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>OR Number <span className="required">*</span></label>
                <input
                  type="text"
                  className={`payment-input ${cutoffPaymentError ? 'error' : ''}`}
                  placeholder="Enter 7-digit code"
                  value={cutoffPaymentCode}
                  onChange={handleCutoffPaymentCodeChange}
                  maxLength="7"
                  autoFocus
                />
                {cutoffPaymentError && <span className="error-text">{cutoffPaymentError}</span>}
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowCutoffPayModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
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
                  transition: 'all 0.2s',
                  opacity: (!cutoffPaymentCode || cutoffPaymentCode.length !== 7 || isPayingCutoff) ? '0.5' : '1'
                }}
              >
                {isPayingCutoff ? '⏳ Processing...' : `✅ Confirm Payment`}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* PAY ALL MODAL */}
      {showPayAllModal && payAllBills.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowPayAllModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <PayAllIcon width={28} height={28} color="#16A34A" />
                Pay All - {payAllConsumerName}
              </h2>
              <button className="close-btn" onClick={() => setShowPayAllModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '12px' }}>
                You are about to pay <strong>{payAllBills.length}</strong> unpaid bills for <strong>{payAllConsumerName}</strong>.
              </p>

              <div style={{ 
                border: '1px solid #E2E8F0', 
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '13px'
                }}>
                  <thead style={{ background: '#F8FAFC' }}>
                    <tr>
                      <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>Period</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>WSIN</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', borderBottom: '1px solid #E2E8F0' }}>Server</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid #E2E8F0' }}>Consumption</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', borderBottom: '1px solid #E2E8F0' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payAllBills.map((bill, index) => {
                      const { consumption, amount, isDefective: isDef } = calculateWithDefective(
                        bill.presentReading,
                        bill.previousReading,
                        bill.consumerType
                      );
                      const period = `${bill.month || 'N/A'} ${bill.year || ''}`;
                      return (
                        <tr key={`${bill.serverSource || 's1'}-${bill.id}`} style={{ borderBottom: index < payAllBills.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <td style={{ padding: '8px 14px' }}>{period.trim()}</td>
                          <td style={{ padding: '8px 14px', fontWeight: '500' }}>{bill.billNumber || 'N/A'}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: '700',
                              background: `${getServerColor(bill.serverSource)}22`,
                              color: getServerColor(bill.serverSource)
                            }}>
                              {getServerLabel(bill.serverSource).replace('Server ', 'S')}
                            </span>
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                            {consumption} m³
                            {isDef && <span style={{ color: '#DC2626', fontSize: '10px', marginLeft: '4px' }}>⚠️</span>}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600' }}>
                            {formatCurrency(amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot style={{ background: '#F8FAFC', borderTop: '2px solid #194752' }}>
                    <tr>
                      <td colSpan="4" style={{ padding: '12px 14px', fontWeight: '700', fontSize: '15px', textAlign: 'right' }}>
                        OVERALL TOTAL:
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', fontSize: '18px', textAlign: 'right', color: '#194752' }}>
                        {formatCurrency(payAllBills.reduce((sum, bill) => {
                          const { amount } = calculateWithDefective(
                            bill.presentReading,
                            bill.previousReading,
                            bill.consumerType
                          );
                          return sum + amount;
                        }, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="form-group">
                <label>OR Number <span className="required">*</span></label>
                <input
                  type="text"
                  className={`payment-input ${payAllPaymentError ? 'error' : ''}`}
                  placeholder="Enter 7-digit code (will be used for all bills)"
                  value={payAllPaymentCode}
                  onChange={handlePayAllPaymentCodeChange}
                  maxLength="7"
                  autoFocus
                />
                {payAllPaymentError && <span className="error-text">{payAllPaymentError}</span>}
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowPayAllModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
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
                  transition: 'all 0.2s',
                  opacity: (!payAllPaymentCode || payAllPaymentCode.length !== 7 || isPayingAll) ? '0.5' : '1'
                }}
              >
                {isPayingAll ? '⏳ Processing...' : `✅ Pay All (${payAllBills.length} Bills)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT PAID CONFIRMATION MODAL */}
      {showExportPaidConfirm && (
        <div className="modal-overlay" onClick={closeExportPaidConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626' }}>
                <TrashIcon width={28} height={28} color="#DC2626" />
                Confirm Export & Delete
              </h2>
              <button className="close-btn" onClick={closeExportPaidConfirm}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#0F172A', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                ⚠️ This action will:
              </p>
              <ul style={{ 
                color: '#475569', 
                fontSize: '14px', 
                lineHeight: '2',
                paddingLeft: '20px',
                marginBottom: '16px'
              }}>
                <li>📤 Export <strong>{paidBillsToDelete.length}</strong> paid bills to Excel</li>
                <li>🗑️ <strong style={{ color: '#DC2626' }}>PERMANENTLY DELETE</strong> all paid bills from all servers</li>
                <li>🔒 File will be password protected with <strong>"Water_2026"</strong></li>
              </ul>
              
              <div style={{ 
                background: '#FEF2F2', 
                border: '1px solid #FECACA', 
                borderRadius: '8px',
                padding: '12px 16px',
                marginTop: '12px'
              }}>
                <p style={{ color: '#991B1B', fontSize: '13px', fontWeight: '500', margin: 0 }}>
                  ⚠️ This action cannot be undone! Please make sure you have a backup.
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-outline" 
                onClick={closeExportPaidConfirm}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={executeExportPaidAndDelete}
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
                  transition: 'all 0.2s'
                }}
              >
                <TrashIcon width={18} height={18} color="#ffffff" />
                Export & Delete {paidBillsToDelete.length} Bills
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW MONTH MODAL */}
      {showNewMonthModal && (
        <div className="modal-overlay" onClick={closeNewMonthModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CalendarAddIcon width={28} height={28} color="#16A34A" />
                Add New Month
              </h2>
              <button className="close-btn" onClick={closeNewMonthModal}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
                Select a <strong>Location</strong> and <strong>Month</strong> to rollover to the next month.
                All <strong>Present Readings</strong> will become <strong>Previous Readings</strong> for the new month.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A' }}>
                    <Location03Icon width={18} height={18} style={{ display: 'inline', marginRight: '6px' }} />
                    Location <span className="required" style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={newMonthLocation}
                    onChange={(e) => setNewMonthLocation(e.target.value)}
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
                    <option value="">Select Location...</option>
                    {availableLocationsForNewMonth.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A' }}>
                    <CalendarClockIcon width={18} height={18} style={{ display: 'inline', marginRight: '6px' }} />
                    Month <span className="required" style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={newMonthMonth}
                    onChange={(e) => setNewMonthMonth(e.target.value)}
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
                    <option value="">Select Month...</option>
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A' }}>
                    <CalendarClockIcon width={18} height={18} style={{ display: 'inline', marginRight: '6px' }} />
                    Year <span className="required" style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={newMonthYear}
                    onChange={(e) => setNewMonthYear(e.target.value)}
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
                    <option value="">Select Year...</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={previewNewMonth}
                  disabled={!newMonthLocation || !newMonthMonth || !newMonthYear || newMonthLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#16A34A',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: (!newMonthLocation || !newMonthMonth || !newMonthYear || newMonthLoading) ? '0.5' : '1'
                  }}
                >
                  {newMonthLoading ? '⏳ Loading...' : '🔍 Preview Bills'}
                </button>
              </div>

              {showNewMonthPreview && newMonthPreview.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#0F172A' }}>
                      📋 Found {newMonthPreview.length} bills
                    </span>
                  </div>
                  
                  <div style={{ 
                    maxHeight: '200px', 
                    overflow: 'auto',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ background: '#F1F5F9', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>WSIN</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Consumer</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Server</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Present</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newMonthPreview.slice(0, 50).map((bill) => (
                          <tr key={`${bill.serverSource}-${bill.id}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '6px 12px', fontWeight: '600' }}>{bill.billNumber || 'N/A'}</td>
                            <td style={{ padding: '6px 12px' }}>{bill.consumerName || 'N/A'}</td>
                            <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: '700',
                                background: `${getServerColor(bill.serverSource)}22`,
                                color: getServerColor(bill.serverSource)
                              }}>
                                {getServerLabel(bill.serverSource).replace('Server ', 'S')}
                              </span>
                            </td>
                            <td style={{ padding: '6px 12px', fontWeight: '600', color: '#16A34A' }}>
                              {bill.presentReading || '0'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-outline" 
                onClick={closeNewMonthModal}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={confirmNewMonth}
                disabled={newMonthPreview.length === 0 || newMonthLoading}
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
                  transition: 'all 0.2s',
                  opacity: (newMonthPreview.length === 0 || newMonthLoading) ? '0.5' : '1'
                }}
              >
                {newMonthLoading ? '⏳ Creating...' : `📋 Create ${getNextMonth(newMonthMonth)} ${getNextYear(newMonthMonth, newMonthYear)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* REGULAR TABLE VIEW */}
      {/* ============================================================ */}
      {tableType === 'regular' && (
        <>
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
                value={filterServer}
                onChange={(e) => setFilterServer(e.target.value)}
                style={{ minWidth: '130px', fontWeight: '600' }}
              >
                <option value="all">🌐 All Servers</option>
                {SERVER_CONFIGS.map(s => (
                  <option key={s.key} value={s.key}>🗄️ {s.label}</option>
                ))}
              </select>
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

          {searchTerm.trim() && consumersWithUnpaid.size === 1 && (
            <div style={{ 
              marginBottom: '16px',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
              borderRadius: '12px',
              border: '2px solid #86EFAC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontWeight: '600', color: '#166534' }}>
                  <PayAllIcon width={20} height={20} color="#16A34A" style={{ display: 'inline', marginRight: '8px' }} />
                  {Array.from(consumersWithUnpaid.keys())[0]} has {Array.from(consumersWithUnpaid.values())[0].length} unpaid bills
                </span>
                <span style={{ fontSize: '13px', color: '#15803D', marginLeft: '12px' }}>
                  Total: {formatCurrency(Array.from(consumersWithUnpaid.values())[0].reduce((sum, bill) => {
                    const { amount } = calculateWithDefective(
                      bill.presentReading,
                      bill.previousReading,
                      bill.consumerType
                    );
                    return sum + amount;
                  }, 0))}
                </span>
              </div>
              <button
                className="btn btn-success"
                onClick={() => handlePayAll(Array.from(consumersWithUnpaid.keys())[0])}
                style={{
                  background: '#16A34A',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '10px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <PayAllIcon width={20} height={20} color="#ffffff" />
                PAY ALL
              </button>
            </div>
          )}

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
                    <th>Server</th>
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
                    
                    const isPresentDefective = isDefective(bill.presentReading);
                    const isPreviousDefective = isDefective(bill.previousReading);
                    const isDefectiveReading = isPresentDefective || isPreviousDefective;
                    
                    const displayPresent = isPresentDefective ? 'DEFECTIVE' : (bill.presentReading || '0');
                    const displayPrevious = isPreviousDefective ? 'DEFECTIVE' : (bill.previousReading || '0');
                    
                    const { consumption, amount } = calculateWithDefective(
                      bill.presentReading,
                      bill.previousReading,
                      bill.consumerType
                    );
                    
                    return (
                      <tr key={`${bill.serverSource || 's1'}-${bill.id}`}>
                        <td className="wsin-cell">{bill.billNumber || 'N/A'}</td>
                        <td>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: '700',
                            background: `${getServerColor(bill.serverSource)}22`,
                            color: getServerColor(bill.serverSource),
                            whiteSpace: 'nowrap'
                          }}>
                            {getServerLabel(bill.serverSource).toUpperCase()}
                          </span>
                        </td>
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
                          {isDefectiveReading && <span className="defective-badge"> DEFECTIVE</span>}
                        </td>
                        <td className="name-cell" style={{ fontWeight: '600' }}>
                          {formatCurrency(amount)}
                        </td>
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
        </>
      )}

      {/* ============================================================ */}
      {/* CUT-OFF TABLE VIEW */}
      {/* ============================================================ */}
      {tableType === 'cutoff' && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card" style={{ borderColor: '#DC2626' }}>
              <span className="stat-icon">
                <SummationCircleIcon width={28} height={28} color="#DC2626" />
              </span>
              <div>
                <p className="stat-label">Cut-off Accounts</p>
                <p className="stat-number" style={{ color: '#DC2626' }}>{filteredBills.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">
                <User02Icon width={28} height={28} color="#194752" />
              </span>
              <div>
                <p className="stat-label">Consumers</p>
                <p className="stat-number">
                  {new Set(filteredBills.map(b => b.consumerName)).size}
                </p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">
                <PhilippinePesoIcon width={28} height={28} color="#194752" />
              </span>
              <div>
                <p className="stat-label">Total Collectable</p>
                <p className="stat-number" style={{ color: '#DC2626' }}>
                  {formatCurrency(filteredBills.reduce((sum, b) => sum + (b.amount || b.collectableAmount || 0), 0))}
                </p>
              </div>
            </div>
          </div>

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
                value={filterServer}
                onChange={(e) => setFilterServer(e.target.value)}
                style={{ minWidth: '130px', fontWeight: '600' }}
              >
                <option value="all">🌐 All Servers</option>
                {SERVER_CONFIGS.map(s => (
                  <option key={s.key} value={s.key}>🗄️ {s.label}</option>
                ))}
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
            </div>
            <div className="filter-actions">
              {activeFilterCount > 0 && (
                <button className="btn-clear" onClick={resetFilters}>
                  ✕ Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="table-container">
            {filteredBills.length === 0 ? (
              <div className="empty-state">
                <p>No cut-off accounts found.</p>
              </div>
            ) : (
              <table className="bills-table">
                <thead>
                  <tr>
                    <th>WSIN</th>
                    <th>Server</th>
                    <th>Consumer</th>
                    <th>Location</th>
                    <th>Period</th>
                    <th>Type</th>
                    <th>Collectable Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill) => {
                    const period = `${bill.month || 'N/A'} ${bill.year || ''}`;
                    const amount = bill.amount || bill.collectableAmount || 0;
                    const isPaid = bill.status === 'paid';
                    
                    return (
                      <tr key={`${bill.serverSource || 's1'}-${bill.id}`}>
                        <td className="wsin-cell">{bill.billNumber || 'N/A'}</td>
                        <td>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: '700',
                            background: `${getServerColor(bill.serverSource)}22`,
                            color: getServerColor(bill.serverSource),
                            whiteSpace: 'nowrap'
                          }}>
                            {getServerLabel(bill.serverSource).toUpperCase()}
                          </span>
                        </td>
                        <td className="name-cell">{bill.consumerName || 'N/A'}</td>
                        <td className="name-cell">{bill.location || 'N/A'}</td>
                        <td className="name-cell">{period.trim() || 'N/A'}</td>
                        <td>
                          <span className={`type-badge ${bill.type?.toUpperCase() === 'COMMERCIAL' ? 'commercial' : 'residential'}`}>
                            {bill.type || bill.consumerType || 'N/A'}
                          </span>
                        </td>
                        <td className="name-cell" style={{ fontWeight: '600', color: '#DC2626' }}>
                          {formatCurrency(amount)}
                        </td>
                        <td>
                          <span className={`status-badge ${isPaid ? 'status-paid' : 'status-cutoff'}`}>
                            {isPaid ? 'PAID' : 'CUT-OFF'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-action-buttons">
                            {!isPaid && (
                              <button className="action-btn pay" onClick={() => handleCutoffPay(bill)}>
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
        </>
      )}

      {/* Progress Modal */}
      {showProgress && (
        <div className="modal-overlay">
          <div className="modal-content progress-modal">
            <h3>Importing Bills to {getServerLabel(selectedImportServer)}</h3>
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

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <span style={{
                padding: '4px 16px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                background: `${getServerColor(selectedBill.serverSource)}22`,
                color: getServerColor(selectedBill.serverSource)
              }}>
                🗄️ FROM {getServerLabel(selectedBill.serverSource).toUpperCase()}
              </span>
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
              <div className="pay-row" style={{ borderTop: '1px solid #E2E8F0', paddingTop: '8px', marginTop: '4px' }}>
                <span className="pay-label" style={{ fontWeight: 'bold' }}>Consumption</span>
                <span className="pay-value" style={{ fontWeight: 'bold' }}>
                  {(() => {
                    const { consumption, isDefective: isDef } = calculateWithDefective(
                      selectedBill.presentReading,
                      selectedBill.previousReading,
                      selectedBill.consumerType
                    );
                    return (
                      <>
                        {consumption} m³
                        {isDef && <span className="defective-badge"> DEFECTIVE</span>}
                      </>
                    );
                  })()}
                </span>
              </div>
              <div className="pay-row" style={{ borderTop: '2px solid #194752', paddingTop: '8px', marginTop: '4px' }}>
                <span className="pay-label" style={{ fontWeight: 'bold', fontSize: '16px' }}>Amount Due</span>
                <span className="pay-value amount" style={{ fontSize: '22px' }}>
                  {(() => {
                    const { amount } = calculateWithDefective(
                      selectedBill.presentReading,
                      selectedBill.previousReading,
                      selectedBill.consumerType
                    );
                    return formatCurrency(amount);
                  })()}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>OR Number <span className="required">*</span></label>
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

// ============================================================
// HELPER FUNCTIONS FOR NEW MONTH
// ============================================================

const getNextMonth = (currentMonth) => {
  const currentIndex = MONTH_ORDER.indexOf(currentMonth?.toUpperCase());
  if (currentIndex === -1) return '';
  const nextIndex = (currentIndex + 1) % 12;
  return MONTH_ORDER[nextIndex];
};

const getNextYear = (currentMonth, currentYear) => {
  const currentIndex = MONTH_ORDER.indexOf(currentMonth?.toUpperCase());
  if (currentIndex === -1) return currentYear;
  const nextIndex = (currentIndex + 1) % 12;
  if (nextIndex === 0) {
    return (parseInt(currentYear) + 1).toString();
  }
  return currentYear;
};

export default AdminDashboard;