// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, writeBatch, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db, db2, db3, db4, db5, getDbByServer, getServerLabel, getServerColor, SERVER_CONFIGS } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import BillForm from '../bills/BillForm';
import ReceiptPrinter from '../bills/ReceiptPrinter';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import '../bills/BillStyles.css';
import './AdminStyles.css';

const EXCEL_PASSWORD = 'Water_2026';
const DISCOUNT_RATE = 0.05;

// ============================================================
// OR NUMBER STORAGE (SERVER 4)
// ============================================================
const OR_SERVER_KEY = 'server4';
const OR_COLLECTION = 'or_numbers';
const USED_OR_COLLECTION = 'used_or_numbers';
const OR_BATCH_SIZE = 50;

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

const CalendarAddIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"currentColor"} fill={"none"} {...props}>
    <path d="M15.5 2V6M7.5 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M20.3985 8C20.2706 6.69989 19.9816 5.82475 19.3284 5.17157C18.1569 4 16.2712 4 12.5 4H10.5C6.72876 4 4.84315 4 3.67157 5.17157C2.5 6.34315 2.5 8.22876 2.5 12V14C2.5 17.7712 2.5 19.6569 3.67157 20.8284C4.47975 21.6366 5.6277 21.8873 7.5 21.965" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M2.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M15.5 15H19.5M17.5 13V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M13 18C13 20.2091 14.7909 22 17 22C19.2091 22 21 20.2091 21 18C21 15.7909 19.2091 14 17 14C14.7909 14 13 15.7909 13 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const ReceiptIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"} {...props}>
    <path d="M4 2V22L7 20L10 22L13 20L16 22L20 19.5V2H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 7H16M8 11H16M8 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

const ImportIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"} {...props}>
    <path d="M12 3V12M12 12L9.5 9.5M12 12L14.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 17.5C3.5 16.5 2 14.5 2 12C2 7.02944 6.02944 3 11 3C15.9706 3 20 7.02944 20 12C20 14.5 18.5 16.5 17 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 21V13M12 21L9.5 18.5M12 21L14.5 18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ExportIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"} {...props}>
    <path d="M12 21V12M12 12L9.5 14.5M12 12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 6.5C3.5 7.5 2 9.5 2 12C2 16.9706 6.02944 21 11 21C15.9706 21 20 16.9706 20 12C20 9.5 18.5 7.5 17 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3V11M12 11L9.5 8.5M12 11L14.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 7L6 4L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AddBillIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"} {...props}>
    <path d="M4 2V22L7 20L10 22L13 20L16 22L20 19.5V2H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8V15M8.5 11.5H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

const DeleteLocationIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"} {...props}>
    <path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" stroke="currentColor" strokeWidth="1.5"></path>
    <path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" stroke="currentColor" strokeWidth="1.5"></path>
    <path d="M17 17L22 22M22 17L17 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const DeleteMonthIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"} {...props}>
    <path d="M15.5 2V6M7.5 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M20.3985 8C20.2706 6.69989 19.9816 5.82475 19.3284 5.17157C18.1569 4 16.2712 4 12.5 4H10.5C6.72876 4 4.84315 4 3.67157 5.17157C2.5 6.34315 2.5 8.22876 2.5 12V14C2.5 17.7712 2.5 19.6569 3.67157 20.8284C4.47975 21.6366 5.6277 21.8873 7.5 21.965" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M2.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M15.5 15H19.5M17.5 13V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M13 18C13 20.2091 14.7909 22 17 22C19.2091 22 21 20.2091 21 18C21 15.7909 19.2091 14 17 14C14.7909 14 13 15.7909 13 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M15.5 18L18.5 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
// OR HELPERS
// ============================================================
const fetchNextAvailableOR = async () => {
  try {
    const orDb = getDbByServer(OR_SERVER_KEY);
    const orRef = collection(orDb, OR_COLLECTION);
    const q = query(orRef, where('status', '==', 'available'));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const sortedDocs = snap.docs.sort((a, b) => {
      const aNum = parseInt(String(a.data().orNumber || '0').replace(/\D/g, ''), 10) || 0;
      const bNum = parseInt(String(b.data().orNumber || '0').replace(/\D/g, ''), 10) || 0;
      return aNum - bNum;
    });
    const orDoc = sortedDocs[0];
    const orData = orDoc.data();
    return {
      id: orDoc.id,
      orNumber: String(orData.orNumber),
      batchId: orData.batchId || null,
      ...orData
    };
  } catch (error) {
    console.error('❌ Error fetching OR:', error);
    return null;
  }
};

const markORAsUsed = async (orNumber, orDocId, billInfo, paymentCode, userEmail) => {
  try {
    const orDb = getDbByServer(OR_SERVER_KEY);
    const orRef = doc(orDb, OR_COLLECTION, orDocId);
    const usedRef = collection(orDb, USED_OR_COLLECTION);
    const usedAt = new Date().toISOString();
    await updateDoc(orRef, {
      status: 'used', usedAt, usedBy: userEmail || 'Unknown',
      billId: billInfo?.id || null, billNumber: billInfo?.billNumber || null,
      consumerName: billInfo?.consumerName || null, paymentCode,
      serverSource: billInfo?.serverSource || null,
      referenceNumber: billInfo?.referenceNumber || null
    });
    const usedDocId = `${orNumber}_${Date.now()}`;
    await setDoc(doc(usedRef, usedDocId), {
      orNumber, originalOrDocId: orDocId, status: 'used', usedAt,
      usedBy: userEmail || 'Unknown', billId: billInfo?.id || null,
      billNumber: billInfo?.billNumber || null, consumerName: billInfo?.consumerName || null,
      consumerAddress: billInfo?.location || null, month: billInfo?.month || null,
      year: billInfo?.year || null, amount: billInfo?.amount || 0, paymentCode,
      referenceNumber: billInfo?.referenceNumber || null,
      serverSource: billInfo?.serverSource || null, archivedAt: usedAt
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Error marking OR as used:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// ADMIN DASHBOARD COMPONENT
// ============================================================

const AdminDashboard = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedServer, setSelectedServer] = useState('server1');
  
  const [selectedBillIds, setSelectedBillIds] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
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
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentCode, setPaymentCode] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPaid, setIsExportingPaid] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  
  const [availableOR, setAvailableOR] = useState(null);
  const [loadingOR, setLoadingOR] = useState(false);
  const [orFetchError, setOrFetchError] = useState('');
  
  const [tableType, setTableType] = useState('regular');
  
  const [showPayAllModal, setShowPayAllModal] = useState(false);
  const [payAllBills, setPayAllBills] = useState([]);
  const [payAllConsumerName, setPayAllConsumerName] = useState('');
  const [payAllPaymentCode, setPayAllPaymentCode] = useState('');
  const [payAllPaymentError, setPayAllPaymentError] = useState('');
  const [isPayingAll, setIsPayingAll] = useState(false);
  const [payAllAvailableOR, setPayAllAvailableOR] = useState(null);
  const [payAllLoadingOR, setPayAllLoadingOR] = useState(false);
  const [payAllOrFetchError, setPayAllOrFetchError] = useState('');
  
  const [isSeniorCitizen, setIsSeniorCitizen] = useState(false);
  const [isPWD, setIsPWD] = useState(false);
  
  const [showCutoffPayModal, setShowCutoffPayModal] = useState(false);
  const [cutoffBillToPay, setCutoffBillToPay] = useState(null);
  const [cutoffPaymentCode, setCutoffPaymentCode] = useState('');
  const [cutoffPaymentError, setCutoffPaymentError] = useState('');
  const [isPayingCutoff, setIsPayingCutoff] = useState(false);
  const [cutoffAvailableOR, setCutoffAvailableOR] = useState(null);
  const [cutoffLoadingOR, setCutoffLoadingOR] = useState(false);
  const [cutoffOrFetchError, setCutoffOrFetchError] = useState('');
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportLocation, setSelectedExportLocation] = useState('all');
  const [exportLocations, setExportLocations] = useState([]);
  
  const [locations, setLocations] = useState([]);
  const [months, setMonths] = useState([]);
  const [years, setYears] = useState([]);
  const [consumerPeriods, setConsumerPeriods] = useState([]);
  
  const [stats, setStats] = useState({
    total: 0, paid: 0, unpaid: 0, overdue: 0,
    totalConsumers: 0, residential: 0, commercial: 0, location: ''
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

  const [showServerSelectModal, setShowServerSelectModal] = useState(false);
  const [selectedImportServer, setSelectedImportServer] = useState(null);

  const [showORModal, setShowORModal] = useState(false);
  const [orFrom, setOrFrom] = useState('');
  const [orTo, setOrTo] = useState('');
  const [orToTouched, setOrToTouched] = useState(false);
  const [orSaving, setOrSaving] = useState(false);

  const [orStats, setOrStats] = useState({ available: 0, used: 0 });

  // ✅ DELETE LOCATION STATES
  const [showDeleteLocationModal, setShowDeleteLocationModal] = useState(false);
  const [deleteLocationTarget, setDeleteLocationTarget] = useState('');
  const [deleteLocationBills, setDeleteLocationBills] = useState([]);
  const [deleteLocationLoading, setDeleteLocationLoading] = useState(false);
  const [deleteLocationPreview, setDeleteLocationPreview] = useState([]);
  const [showDeleteLocationPreview, setShowDeleteLocationPreview] = useState(false);
  const [deleteLocationConfirmText, setDeleteLocationConfirmText] = useState('');
  const [deleteLocationOptions, setDeleteLocationOptions] = useState([]);

  // ✅ DELETE MONTH STATES
  const [showDeleteMonthModal, setShowDeleteMonthModal] = useState(false);
  const [deleteMonthTarget, setDeleteMonthTarget] = useState('');
  const [deleteMonthYear, setDeleteMonthYear] = useState('');
  const [deleteMonthBills, setDeleteMonthBills] = useState([]);
  const [deleteMonthLoading, setDeleteMonthLoading] = useState(false);
  const [deleteMonthPreview, setDeleteMonthPreview] = useState([]);
  const [showDeleteMonthPreview, setShowDeleteMonthPreview] = useState(false);
  const [deleteMonthConfirmText, setDeleteMonthConfirmText] = useState('');
  const [deleteMonthMonthOptions, setDeleteMonthMonthOptions] = useState([]);
  const [deleteMonthYearOptions, setDeleteMonthYearOptions] = useState([]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterLocation, filterMonth, filterYear, filterConsumerPeriod, selectedServer, tableType]);

  useEffect(() => {
    loadORStats();
  }, []);

  const loadORStats = async () => {
    try {
      const orDb = getDbByServer(OR_SERVER_KEY);
      const orRef = collection(orDb, OR_COLLECTION);
      const availableQuery = query(orRef, where('status', '==', 'available'));
      const usedQuery = query(orRef, where('status', '==', 'used'));
      const [availableSnap, usedSnap] = await Promise.all([
        getDocs(availableQuery),
        getDocs(usedQuery)
      ]);
      setOrStats({
        available: availableSnap.size,
        used: usedSnap.size
      });
    } catch (error) {
      console.error('Error loading OR stats:', error);
    }
  };

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
      setAvailableOR(null);
      setOrFetchError('');
      setIsSeniorCitizen(false);
      setIsPWD(false);

      const loadOR = async () => {
        setLoadingOR(true);
        const or = await fetchNextAvailableOR();
        if (or) {
          setAvailableOR(or);
          setPaymentCode(or.orNumber);
        } else {
          setOrFetchError('No available OR number in Server 4. Please add OR numbers first.');
        }
        setLoadingOR(false);
      };
      loadOR();
    }
  }, [showPayModal]);

  useEffect(() => {
    if (showPayAllModal) {
      setPayAllPaymentCode('');
      setPayAllPaymentError('');
      setPayAllAvailableOR(null);
      setPayAllOrFetchError('');
      setIsSeniorCitizen(false);
      setIsPWD(false);

      const loadOR = async () => {
        setPayAllLoadingOR(true);
        const or = await fetchNextAvailableOR();
        if (or) {
          setPayAllAvailableOR(or);
          setPayAllPaymentCode(or.orNumber);
        } else {
          setPayAllOrFetchError('No available OR number in Server 4.');
        }
        setPayAllLoadingOR(false);
      };
      loadOR();
    }
  }, [showPayAllModal]);

  useEffect(() => {
    if (showCutoffPayModal) {
      setCutoffPaymentCode('');
      setCutoffPaymentError('');
      setCutoffAvailableOR(null);
      setCutoffOrFetchError('');

      const loadOR = async () => {
        setCutoffLoadingOR(true);
        const or = await fetchNextAvailableOR();
        if (or) {
          setCutoffAvailableOR(or);
          setCutoffPaymentCode(or.orNumber);
        } else {
          setCutoffOrFetchError('No available OR number in Server 4.');
        }
        setCutoffLoadingOR(false);
      };
      loadOR();
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
      const originalServer = cutoffBillToPay.serverSource || selectedServer;
      const targetDb = getDbByServer(originalServer);
      const billRef = doc(targetDb, 'bills', cutoffBillToPay.id);
      
      await updateDoc(billRef, {
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
      });

      if (cutoffAvailableOR) {
        await markORAsUsed(
          cutoffAvailableOR.orNumber,
          cutoffAvailableOR.id,
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
      }

      toast.success(`✅ Cut-off bill ${cutoffBillToPay.billNumber} marked as paid!`);
      toast.success(`💰 Amount: ₱${amountToPay.toFixed(2)}`);
      toast.success(`📋 OR Number: ${cutoffPaymentCode}`);

      setShowCutoffPayModal(false);

      setReceiptData({
        bill: { ...cutoffBillToPay, consumption: 'CUT-OFF', amount: amountToPay, isDefective: false, isCutoff: true },
        paymentCode: cutoffPaymentCode,
        referenceNumber
      });
      setShowReceipt(true);

      setCutoffBillToPay(null);
      setCutoffPaymentCode('');
      setCutoffPaymentError('');
      setCutoffAvailableOR(null);
      fetchBills(selectedServer);
      loadORStats();
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

  const confirmPayAll = async () => {
    if (!payAllPaymentCode || payAllPaymentCode.length !== 7) {
      setPayAllPaymentError('Please enter a valid 7-digit payment code.');
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

          const targetDb = getDbByServer(bill.serverSource || selectedServer);
          const billRef = doc(targetDb, 'bills', bill.id);
          
          await updateDoc(billRef, {
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
          });

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
        if (payAllAvailableOR) {
          await markORAsUsed(
            payAllAvailableOR.orNumber,
            payAllAvailableOR.id,
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
        }

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
      setPayAllAvailableOR(null);
      setSelectedBillIds([]);
      setIsSeniorCitizen(false);
      setIsPWD(false);
      fetchBills(selectedServer);
      loadORStats();
    } catch (error) {
      console.error('❌ Pay All error:', error);
      toast.error('Error processing payment: ' + error.message);
    } finally {
      setIsPayingAll(false);
    }
  };

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
      
      await updateDoc(billRef, {
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
      });

      if (availableOR) {
        await markORAsUsed(
          availableOR.orNumber,
          availableOR.id,
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
      }

      await createNextMonthBill({
        ...selectedBill,
        consumption, amount: finalAmount, isDefective: isDefectiveReading,
        isPresentDefective, isPreviousDefective
      });

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

      setShowPayModal(false);

      setReceiptData({
        bill: { 
          ...selectedBill, 
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
      setAvailableOR(null);
      setIsSeniorCitizen(false);
      setIsPWD(false);
      fetchBills(selectedServer);
      loadORStats();
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

  const createNextMonthBill = async (paidBill) => {
    try {
      const currentMonth = paidBill.month;
      const currentYear = parseInt(paidBill.year);

      const currentIndex = MONTH_ORDER.indexOf(currentMonth?.toUpperCase());
      if (currentIndex === -1) return;

      const nextIndex = (currentIndex + 1) % 12;
      const nextMonth = MONTH_ORDER[nextIndex];
      const nextYear = nextIndex === 0 ? currentYear + 1 : currentYear;

      const targetDb = getDbByServer(paidBill.serverSource || selectedServer);

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
          await updateDoc(doc(targetDb, 'bills', existingDoc.id), {
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
        serverSource: paidBill.serverSource || selectedServer
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
      const serverConfigs = selectedServer === 'all' 
        ? SERVER_CONFIGS 
        : SERVER_CONFIGS.filter(s => s.key === selectedServer);

      for (const serverConfig of serverConfigs) {
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
      toast.success(`Found ${allBills.length} bills`);
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

      const groupedByServer = {};
      for (const bill of newMonthPreview) {
        const serverKey = bill.serverSource || selectedServer;
        if (!groupedByServer[serverKey]) groupedByServer[serverKey] = [];
        groupedByServer[serverKey].push(bill);
      }

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

            newBillData.billNumber = billData.billNumber || `${nextYear}-${String(i + 1).padStart(3, '0')}`;

            batch.set(doc(billsCollectionRef), newBillData);
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

        if (batchCount > 0) await batch.commit();
      }

      if (successCount > 0) {
        toast.success(`✅ Created ${successCount} bills for ${nextMonth} ${nextYear}!`);
        closeNewMonthModal();
        fetchBills(selectedServer);
      }

      if (errorCount > 0) toast.error(`⚠️ ${errorCount} bills failed to create`);
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
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
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
            paidAt = date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          } catch (e) { paidAt = bill.paidAt || 'N/A'; }
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
          paidAt,
          paidBy: bill.paidBy || 'N/A'
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
      const defaultFileName = `Paid_Water_Bills_${new Date().toISOString().split('T')[0]}.xlsx`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = defaultFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`✅ Exported ${paidBills.length} paid bills!`);

      const groupedByServer = {};
      for (const bill of paidBills) {
        const serverKey = bill.serverSource || selectedServer;
        if (!groupedByServer[serverKey]) groupedByServer[serverKey] = [];
        groupedByServer[serverKey].push(bill);
      }

      let deleteSuccessCount = 0;

      for (const [serverKey, serverBills] of Object.entries(groupedByServer)) {
        const targetDb = getDbByServer(serverKey);
        let deleteBatch = writeBatch(targetDb);
        let deleteBatchCount = 0;

        for (let i = 0; i < serverBills.length; i++) {
          deleteBatch.delete(doc(targetDb, 'bills', serverBills[i].id));
          deleteSuccessCount++;
          deleteBatchCount++;

          if (deleteBatchCount >= 500) {
            await deleteBatch.commit();
            deleteBatch = writeBatch(targetDb);
            deleteBatchCount = 0;
          }
        }

        if (deleteBatchCount > 0) await deleteBatch.commit();
      }

      toast.success(`🗑️ Deleted ${deleteSuccessCount} paid bills!`);
      toast.success(`🔒 Excel Password: ${EXCEL_PASSWORD}`);

      await fetchBills(selectedServer);
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
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
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

  // ============================================================
  // IMPORT FUNCTIONS
  // ============================================================

  const detectExcelFormat = (jsonData) => {
    if (!jsonData || jsonData.length === 0) return 'unknown';
    const firstRow = jsonData[0];
    const keys = Object.keys(firstRow).map(k => k.toLowerCase().trim());
    const hasCollectableAmount = keys.some(k => k === 'collectable amount' || k === 'collectableamount' || k === 'collectable_amount');
    const hasPresentReading = keys.some(k => k === 'present reading' || k === 'presentreading');
    const hasPreviousReading = keys.some(k => k === 'previous reading' || k === 'previousreading');
    if (hasCollectableAmount) return 'cutoff_format';
    if (hasPresentReading && hasPreviousReading) return 'calian_format';
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
      
      if (!consumerName || consumerName === '') return;
      
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
      if (isCutoff) billStatus = 'cutoff';
      else if (statusUpper === 'PAID') billStatus = 'paid';
      else if (statusUpper === 'OVERDUE') billStatus = 'overdue';
      
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
        isCutoff,
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
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '', blankrows: false });
          
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
              
              batch.set(doc(billsRef), billData);
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

          if (batchCount > 0) await batch.commit();

          const cutoffCount = parsedBills.filter(b => b.isCutoff).length;
          
          toast.success(`✅ Imported ${successCount} bills to ${serverLabel}!`);
          if (cutoffCount > 0) toast.success(`🔴 ${cutoffCount} cut-off accounts detected.`);
          
          if (selectedServer !== serverChoice && selectedServer !== 'all') {
            setSelectedServer(serverChoice);
          } else {
            fetchBills(selectedServer);
          }
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          let errorMsg = 'Error processing Excel file.';
          if (error?.code === 'permission-denied') errorMsg = `❌ Permission denied sa ${serverLabel}. Check Firestore rules!`;
          else if (error?.code === 'unavailable') errorMsg = `❌ Cannot connect to ${serverLabel}. Check internet!`;
          else if (error?.code === 'not-found') errorMsg = `❌ Firestore sa ${serverLabel} wala pa na-setup!`;
          else if (error?.message) errorMsg = `Error: ${error.message}`;
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

  // ============================================================
  // OR NUMBER MODAL FUNCTIONS
  // ============================================================
  const openORModal = () => {
    setOrFrom('');
    setOrTo('');
    setOrToTouched(false);
    setShowORModal(true);
  };

  const closeORModal = () => {
    setShowORModal(false);
    setOrFrom('');
    setOrTo('');
    setOrToTouched(false);
    setOrSaving(false);
  };

  const handleORFromChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setOrFrom(value);
      if (value.length > 0) {
        const fromNum = parseInt(value);
        if (!isNaN(fromNum)) {
          setOrTo(String(fromNum + (OR_BATCH_SIZE - 1)));
        }
      } else {
        setOrTo('');
      }
    }
  };

  const handleORToChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setOrTo(value);
      setOrToTouched(true);
    }
  };

  const handleSaveORNumbers = async () => {
    if (!orFrom || !orTo) {
      toast.error('Please enter both FROM and TO values');
      return;
    }

    const fromNum = parseInt(orFrom);
    const toNum = parseInt(orTo);

    if (isNaN(fromNum) || isNaN(toNum)) {
      toast.error('Invalid numbers');
      return;
    }

    if (toNum < fromNum) {
      toast.error('TO must be greater than FROM');
      return;
    }

    if (toNum - fromNum + 1 !== OR_BATCH_SIZE) {
      toast.error(`Batch size must be exactly ${OR_BATCH_SIZE} pieces. Current: ${toNum - fromNum + 1}`);
      return;
    }

    setOrSaving(true);

    try {
      const archiveDb = getDbByServer(OR_SERVER_KEY);
      const orCollectionRef = collection(archiveDb, OR_COLLECTION);
      const batchId = `BATCH-${Date.now()}`;
      const createdAt = new Date().toISOString();

      let batch = writeBatch(archiveDb);
      let batchCount = 0;
      let savedCount = 0;

      for (let i = fromNum; i <= toNum; i++) {
        const orNumber = String(i);
        const docRef = doc(orCollectionRef, orNumber);

        batch.set(docRef, {
          orNumber,
          from: String(fromNum),
          to: String(toNum),
          batchId,
          rangeStart: fromNum,
          rangeEnd: toNum,
          batchSize: OR_BATCH_SIZE,
          status: 'available',
          createdAt,
          createdBy: user?.email || 'Unknown',
          createdByUid: user?.uid || 'unknown',
          usedAt: null,
          usedBy: null,
          billId: null,
          paymentCode: null,
          serverSource: OR_SERVER_KEY
        });

        savedCount++;
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          batch = writeBatch(archiveDb);
          batchCount = 0;
        }
      }

      if (batchCount > 0) await batch.commit();

      toast.success(`✅ Saved ${savedCount} OR Numbers to Server 4!`, { duration: 5000 });
      toast.success(`📋 Range: ${fromNum} → ${toNum}`, { duration: 5000 });
      toast.success(`🆔 Batch ID: ${batchId}`, { duration: 5000, icon: '🗄️' });

      await loadORStats();
      closeORModal();
    } catch (error) {
      console.error('❌ Save OR Numbers error:', error);
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Check Server 4 Firestore rules!', { duration: 8000 });
      } else {
        toast.error('Error saving OR Numbers: ' + error.message, { duration: 8000 });
      }
    } finally {
      setOrSaving(false);
    }
  };

  const orPreviewCount = (() => {
    if (!orFrom || !orTo) return 0;
    const f = parseInt(orFrom);
    const t = parseInt(orTo);
    if (isNaN(f) || isNaN(t)) return 0;
    return Math.max(0, t - f + 1);
  })();

  // ============================================================
  // ✅ DELETE LOCATION FUNCTIONS
  // ============================================================

  const openDeleteLocationModal = () => {
    if (locations.length === 0) {
      toast.error('No locations found in the current server.');
      return;
    }
    setDeleteLocationOptions([...locations].sort());
    setDeleteLocationTarget('');
    setDeleteLocationPreview([]);
    setShowDeleteLocationPreview(false);
    setDeleteLocationConfirmText('');
    setShowDeleteLocationModal(true);
  };

  const closeDeleteLocationModal = () => {
    setShowDeleteLocationModal(false);
    setDeleteLocationTarget('');
    setDeleteLocationBills([]);
    setDeleteLocationLoading(false);
    setDeleteLocationPreview([]);
    setShowDeleteLocationPreview(false);
    setDeleteLocationConfirmText('');
    setDeleteLocationOptions([]);
  };

  const previewDeleteLocation = async () => {
    if (!deleteLocationTarget) {
      toast.error('Please select a location to delete.');
      return;
    }
    if (deleteLocationTarget === 'N/A') {
      toast.error('Cannot delete "N/A" location.');
      return;
    }

    setDeleteLocationLoading(true);
    setDeleteLocationPreview([]);
    setShowDeleteLocationPreview(false);

    try {
      const billsToDelete = [];
      const serverConfigs = selectedServer === 'all'
        ? SERVER_CONFIGS
        : SERVER_CONFIGS.filter(s => s.key === selectedServer);

      for (const serverConfig of serverConfigs) {
        try {
          const billsRef = collection(serverConfig.db, 'bills');
          const q = query(billsRef, where('location', '==', deleteLocationTarget));
          const snap = await getDocs(q);
          snap.forEach((docSnap) => {
            billsToDelete.push({
              id: docSnap.id,
              ...docSnap.data(),
              serverSource: serverConfig.key
            });
          });
        } catch (e) {
          console.error(`Error fetching from ${serverConfig.label}:`, e);
        }
      }

      if (billsToDelete.length === 0) {
        toast.error(`No bills found for location: ${deleteLocationTarget}`);
        setDeleteLocationLoading(false);
        return;
      }

      setDeleteLocationBills(billsToDelete);
      setDeleteLocationPreview(billsToDelete);
      setShowDeleteLocationPreview(true);
      toast.success(`Found ${billsToDelete.length} bills to delete.`);

    } catch (error) {
      console.error('Error previewing delete:', error);
      toast.error('Error fetching bills: ' + error.message);
    }

    setDeleteLocationLoading(false);
  };

  const executeDeleteLocation = async () => {
    if (!deleteLocationTarget) return;
    if (deleteLocationConfirmText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm.');
      return;
    }
    if (deleteLocationBills.length === 0) {
      toast.error('No bills to delete.');
      return;
    }

    setDeleteLocationLoading(true);

    try {
      const groupedByServer = {};
      for (const bill of deleteLocationBills) {
        const serverKey = bill.serverSource || selectedServer;
        if (!groupedByServer[serverKey]) groupedByServer[serverKey] = [];
        groupedByServer[serverKey].push(bill);
      }

      let deleteCount = 0;
      let errorCount = 0;

      for (const [serverKey, serverBills] of Object.entries(groupedByServer)) {
        const targetDb = getDbByServer(serverKey);
        let batch = writeBatch(targetDb);
        let batchCount = 0;

        for (let i = 0; i < serverBills.length; i++) {
          try {
            batch.delete(doc(targetDb, 'bills', serverBills[i].id));
            deleteCount++;
            batchCount++;

            if (batchCount >= 500) {
              await batch.commit();
              batch = writeBatch(targetDb);
              batchCount = 0;
            }
          } catch (e) {
            console.error('Error adding delete to batch:', e);
            errorCount++;
          }
        }

        if (batchCount > 0) await batch.commit();
      }

      toast.success(`🗑️ Deleted ${deleteCount} bills from location "${deleteLocationTarget}"!`);
      if (errorCount > 0) toast.error(`⚠️ ${errorCount} bills failed to delete.`);

      try {
        const logDb = getDbByServer(selectedServer === 'all' ? 'server1' : selectedServer);
        await addDoc(collection(logDb, 'deletion_logs'), {
          type: 'DELETE_LOCATION',
          location: deleteLocationTarget,
          deletedCount: deleteCount,
          serverScope: selectedServer,
          deletedBy: user?.email || 'Unknown',
          deletedByUid: user?.uid || 'unknown',
          deletedAt: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging deletion:', logError);
      }

      closeDeleteLocationModal();
      fetchBills(selectedServer);
    } catch (error) {
      console.error('❌ Delete location error:', error);
      toast.error('Error deleting location bills: ' + error.message);
    } finally {
      setDeleteLocationLoading(false);
    }
  };

  // ============================================================
  // ✅ DELETE MONTH FUNCTIONS
  // ============================================================

  const openDeleteMonthModal = () => {
    if (months.length === 0 || years.length === 0) {
      toast.error('No months/years found in the current server.');
      return;
    }
    setDeleteMonthMonthOptions([...months].sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b)));
    setDeleteMonthYearOptions([...years].sort((a, b) => Number(b) - Number(a)));
    setDeleteMonthTarget('');
    setDeleteMonthYear('');
    setDeleteMonthPreview([]);
    setShowDeleteMonthPreview(false);
    setDeleteMonthConfirmText('');
    setShowDeleteMonthModal(true);
  };

  const closeDeleteMonthModal = () => {
    setShowDeleteMonthModal(false);
    setDeleteMonthTarget('');
    setDeleteMonthYear('');
    setDeleteMonthBills([]);
    setDeleteMonthLoading(false);
    setDeleteMonthPreview([]);
    setShowDeleteMonthPreview(false);
    setDeleteMonthConfirmText('');
    setDeleteMonthMonthOptions([]);
    setDeleteMonthYearOptions([]);
  };

  const previewDeleteMonth = async () => {
    if (!deleteMonthTarget || !deleteMonthYear) {
      toast.error('Please select both Month and Year.');
      return;
    }

    setDeleteMonthLoading(true);
    setDeleteMonthPreview([]);
    setShowDeleteMonthPreview(false);

    try {
      const billsToDelete = [];
      const serverConfigs = selectedServer === 'all'
        ? SERVER_CONFIGS
        : SERVER_CONFIGS.filter(s => s.key === selectedServer);

      for (const serverConfig of serverConfigs) {
        try {
          const billsRef = collection(serverConfig.db, 'bills');
          const q = query(
            billsRef,
            where('month', '==', deleteMonthTarget),
            where('year', '==', deleteMonthYear)
          );
          const snap = await getDocs(q);
          snap.forEach((docSnap) => {
            billsToDelete.push({
              id: docSnap.id,
              ...docSnap.data(),
              serverSource: serverConfig.key
            });
          });
        } catch (e) {
          console.error(`Error fetching from ${serverConfig.label}:`, e);
        }
      }

      if (billsToDelete.length === 0) {
        toast.error(`No bills found for ${deleteMonthTarget} ${deleteMonthYear}`);
        setDeleteMonthLoading(false);
        return;
      }

      setDeleteMonthBills(billsToDelete);
      setDeleteMonthPreview(billsToDelete);
      setShowDeleteMonthPreview(true);
      toast.success(`Found ${billsToDelete.length} bills to delete.`);

    } catch (error) {
      console.error('Error previewing delete month:', error);
      toast.error('Error fetching bills: ' + error.message);
    }

    setDeleteMonthLoading(false);
  };

  const executeDeleteMonth = async () => {
    if (!deleteMonthTarget || !deleteMonthYear) return;
    if (deleteMonthConfirmText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Please type DELETE to confirm.');
      return;
    }
    if (deleteMonthBills.length === 0) {
      toast.error('No bills to delete.');
      return;
    }

    setDeleteMonthLoading(true);

    try {
      const groupedByServer = {};
      for (const bill of deleteMonthBills) {
        const serverKey = bill.serverSource || selectedServer;
        if (!groupedByServer[serverKey]) groupedByServer[serverKey] = [];
        groupedByServer[serverKey].push(bill);
      }

      let deleteCount = 0;
      let errorCount = 0;

      for (const [serverKey, serverBills] of Object.entries(groupedByServer)) {
        const targetDb = getDbByServer(serverKey);
        let batch = writeBatch(targetDb);
        let batchCount = 0;

        for (let i = 0; i < serverBills.length; i++) {
          try {
            batch.delete(doc(targetDb, 'bills', serverBills[i].id));
            deleteCount++;
            batchCount++;

            if (batchCount >= 500) {
              await batch.commit();
              batch = writeBatch(targetDb);
              batchCount = 0;
            }
          } catch (e) {
            console.error('Error adding delete to batch:', e);
            errorCount++;
          }
        }

        if (batchCount > 0) await batch.commit();
      }

      toast.success(`🗑️ Deleted ${deleteCount} bills for ${deleteMonthTarget} ${deleteMonthYear}!`);
      if (errorCount > 0) toast.error(`⚠️ ${errorCount} bills failed to delete.`);

      try {
        const logDb = getDbByServer(selectedServer === 'all' ? 'server1' : selectedServer);
        await addDoc(collection(logDb, 'deletion_logs'), {
          type: 'DELETE_MONTH',
          month: deleteMonthTarget,
          year: deleteMonthYear,
          deletedCount: deleteCount,
          serverScope: selectedServer,
          deletedBy: user?.email || 'Unknown',
          deletedByUid: user?.uid || 'unknown',
          deletedAt: new Date().toISOString()
        });
      } catch (logError) {
        console.error('Error logging deletion:', logError);
      }

      closeDeleteMonthModal();
      fetchBills(selectedServer);
    } catch (error) {
      console.error('❌ Delete month error:', error);
      toast.error('Error deleting month bills: ' + error.message);
    } finally {
      setDeleteMonthLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="bill-dashboard">
      {/* ========== HEADER ========== */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <h1>Admin Dashboard</h1>
          <p>Manage all water bill records</p>
        </div>
        <div className="dashboard-header-right">
          <div className="server-selector">
            <ServerIcon width={16} height={16} color="#64748B" />
            <select
              value={selectedServer}
              onChange={handleServerChange}
              disabled={loading}
            >
              <option value="server1">CADUCAN</option>
              <option value="server2">Luyo</option>
              <option value="server3">San Isidro</option>
              <option value="server4">Moryo-Moryo</option>
              <option value="server5">Calian</option>
              <option value="server6">San Roque</option>
              <option value="all">All Servers (Slow)</option>
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
            onClick={openNewMonthModal}
          >
            <CalendarAddIcon width={16} height={16} color="#FFFFFF" />
            NEW MONTH
          </button>

          <button
            className="btn btn-purple"
            onClick={openORModal}
          >
            <ReceiptIcon width={16} height={16} color="#FFFFFF" />
            OR NUMBER
          </button>

          <button
            className="btn btn-purple"
            onClick={() => setShowServerSelectModal(true)}
            disabled={uploading}
          >
            <ImportIcon width={16} height={16} color="#FFFFFF" />
            {uploading ? 'UPLOADING...' : 'IMPORT'}
          </button>

          <button
            className="btn btn-purple"
            onClick={openExportModal}
            disabled={bills.length === 0 || isExporting}
          >
            <ExportIcon width={16} height={16} color="#FFFFFF" />
            {isExporting ? 'EXPORTING...' : 'EXPORT'}
          </button>

          <button
            className="btn btn-purple"
            onClick={openExportPaidConfirm}
            disabled={bills.filter(b => b.status === 'paid').length === 0 || isExportingPaid}
          >
            <ExportPaidIcon width={16} height={16} color="#FFFFFF" />
            {isExportingPaid ? 'PROCESSING...' : 'EXPORT PAID'}
          </button>

          {/* ✅ DELETE LOCATION BUTTON */}
          <button
            className="btn btn-danger"
            onClick={openDeleteLocationModal}
            disabled={loading || locations.length === 0}
            style={{
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 18px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: '600',
              cursor: (loading || locations.length === 0) ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              opacity: (loading || locations.length === 0) ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && locations.length > 0) {
                e.currentTarget.style.background = '#B91C1C';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#DC2626';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <DeleteLocationIcon width={16} height={16} color="#FFFFFF" />
            DELETE LOCATION
          </button>

          {/* ✅ DELETE MONTH BUTTON */}
          <button
            className="btn btn-danger"
            onClick={openDeleteMonthModal}
            disabled={loading || (months.length === 0 && years.length === 0)}
            style={{
              background: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 18px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: '600',
              cursor: (loading || (months.length === 0 && years.length === 0)) ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              opacity: (loading || (months.length === 0 && years.length === 0)) ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && (months.length > 0 || years.length > 0)) {
                e.currentTarget.style.background = '#B91C1C';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#DC2626';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <DeleteMonthIcon width={16} height={16} color="#FFFFFF" />
            DELETE MONTH
          </button>
        </div>
      </header>

      <input
        type="file"
        id="fileInput"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e, selectedImportServer)}
      />

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

          {/* OR STATS */}
          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon sidebar-icon-green">
              <ReceiptIcon width={18} height={18} color="#16A34A" />
            </div>
            <div className="sidebar-stat-content">
              <span className="sidebar-stat-label">Available OR</span>
              <span className="sidebar-stat-value" style={{ color: '#16A34A' }}>
                {orStats.available}
              </span>
            </div>
          </div>

          <div className="sidebar-stat-card">
            <div className="sidebar-stat-icon sidebar-icon-red">
              <ReceiptIcon width={18} height={18} color="#DC2626" />
            </div>
            <div className="sidebar-stat-content">
              <span className="sidebar-stat-label">Used OR</span>
              <span className="sidebar-stat-value" style={{ color: '#DC2626' }}>
                {orStats.used}
              </span>
            </div>
          </div>
        </aside>

        {/* CENTER CONTENT - FILTERS + TABLE */}
        <main className="center-content">
          {/* FILTER SECTION */}
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

          {/* SELECTION BAR */}
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

          {/* TABLE */}
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
                      <th>Server</th>
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
                            {isDefectiveReading && <span className="defective-badge"> DEF</span>}
                          </td>
                          <td className="name-cell text-right" style={{ fontWeight: '600' }}>
                            {formatCurrency(displayAmount)}
                            {bill.hasDiscount && (
                              <div className="discount-note">🎉 {bill.discountType}</div>
                            )}
                          </td>
                          <td><span className={`status-badge ${status.class}`}>{status.label}</span></td>
                          <td>
                            <div className="action-buttons">
                              {displayStatus !== 'paid' ? (
                                <button className="action-btn pay" onClick={() => handlePayBill(bill)}>PAY</button>
                              ) : (
                                <span className="or-badge">{bill.paymentCode || '—'}</span>
                              )}
                              <button className="action-btn" style={{ background: '#F1F5F9', color: '#0F172A' }} onClick={() => handleEdit(bill)}>EDIT</button>
                              <button className="action-btn" style={{ background: '#FEF2F2', color: '#DC2626' }} onClick={() => handleDelete(bill.id)}>DEL</button>
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

      {/* ✅ DELETE LOCATION MODAL */}
      {showDeleteLocationModal && (
        <div className="modal-overlay" onClick={closeDeleteLocationModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626' }}>
                <DeleteLocationIcon width={24} height={24} color="#DC2626" />
                DELETE LOCATION
              </h2>
              <button className="close-btn" onClick={closeDeleteLocationModal}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <span style={{
                  padding: '6px 18px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  background: selectedServer === 'all' ? '#FEF2F2' : `${getServerColor(selectedServer)}22`,
                  color: selectedServer === 'all' ? '#DC2626' : getServerColor(selectedServer),
                  border: `2px solid ${selectedServer === 'all' ? '#FECACA' : `${getServerColor(selectedServer)}44`}`
                }}>
                  🗄️ {selectedServer === 'all' ? 'ALL SERVERS' : getServerLabel(selectedServer).toUpperCase()}
                </span>
              </div>

              <div style={{
                padding: '14px 18px',
                background: '#FEF2F2',
                border: '2px solid #FECACA',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#991B1B', fontWeight: '600', lineHeight: '1.6' }}>
                  ⚠️ <strong>WARNING:</strong> This will permanently delete <strong>ALL BILLS</strong> in the selected location
                  {selectedServer === 'all' ? ' across ALL SERVERS' : ` from ${getServerLabel(selectedServer)}`}.
                  This action <strong>CANNOT be undone</strong>.
                </p>
              </div>

              <div className="form-group">
                <label style={{
                  display: 'block',
                  fontWeight: '700',
                  marginBottom: '8px',
                  color: '#0F172A',
                  fontSize: '13px',
                  textTransform: 'uppercase'
                }}>
                  Select Location to Delete <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={deleteLocationTarget}
                  onChange={(e) => {
                    setDeleteLocationTarget(e.target.value);
                    setDeleteLocationPreview([]);
                    setShowDeleteLocationPreview(false);
                    setDeleteLocationConfirmText('');
                  }}
                  className="filter-select"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '14px' }}
                  disabled={deleteLocationLoading}
                >
                  <option value="">-- Select Location --</option>
                  {deleteLocationOptions.map(loc => (
                    <option key={loc} value={loc}>📍 {loc}</option>
                  ))}
                </select>
              </div>

              {deleteLocationTarget && (
                <div style={{ marginTop: '16px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={previewDeleteLocation}
                    disabled={deleteLocationLoading}
                    style={{
                      width: '100%',
                      background: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: deleteLocationLoading ? 'not-allowed' : 'pointer',
                      opacity: deleteLocationLoading ? 0.6 : 1
                    }}
                  >
                    {deleteLocationLoading ? '⏳ Loading...' : '🔍 Preview Bills to Delete'}
                  </button>
                </div>
              )}

              {showDeleteLocationPreview && deleteLocationPreview.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{
                    padding: '12px 16px',
                    background: '#FEF2F2',
                    border: '2px solid #FECACA',
                    borderRadius: '10px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#991B1B' }}>
                      🗑️ {deleteLocationPreview.length} bills will be deleted
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#DC2626' }}>
                      Total: {formatCurrency(deleteLocationPreview.reduce((sum, b) => sum + (b.amount || 0), 0))}
                    </span>
                  </div>

                  <div style={{
                    maxHeight: '240px',
                    overflowY: 'auto',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>WSIN</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>Consumer</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>Period</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid #E2E8F0' }}>Amount</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deleteLocationPreview.slice(0, 100).map((bill) => (
                          <tr key={`${bill.serverSource}-${bill.id}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 12px', fontWeight: '600' }}>{bill.billNumber || 'N/A'}</td>
                            <td style={{ padding: '8px 12px' }}>{bill.consumerName || 'N/A'}</td>
                            <td style={{ padding: '8px 12px' }}>{bill.month || 'N/A'} {bill.year || ''}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>₱{(bill.amount || 0).toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span className={`status-badge ${getStatusBadge(bill.status || 'unpaid').class}`}>
                                {getStatusBadge(bill.status || 'unpaid').label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontWeight: '700',
                      marginBottom: '8px',
                      color: '#0F172A',
                      fontSize: '13px'
                    }}>
                      Type <span style={{ color: '#DC2626', fontFamily: 'monospace' }}>DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteLocationConfirmText}
                      onChange={(e) => setDeleteLocationConfirmText(e.target.value)}
                      placeholder="Type DELETE here..."
                      className="payment-input"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        letterSpacing: '2px'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-outline"
                onClick={closeDeleteLocationModal}
                style={{ flex: 1 }}
                disabled={deleteLocationLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={executeDeleteLocation}
                disabled={
                  deleteLocationLoading ||
                  deleteLocationBills.length === 0 ||
                  deleteLocationConfirmText.trim().toUpperCase() !== 'DELETE'
                }
                style={{
                  flex: 1,
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: (
                    deleteLocationLoading ||
                    deleteLocationBills.length === 0 ||
                    deleteLocationConfirmText.trim().toUpperCase() !== 'DELETE'
                  ) ? 0.5 : 1
                }}
              >
                {deleteLocationLoading ? '⏳ Deleting...' : `🗑️ Delete ${deleteLocationBills.length} Bills`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ DELETE MONTH MODAL */}
      {showDeleteMonthModal && (
        <div className="modal-overlay" onClick={closeDeleteMonthModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626' }}>
                <DeleteMonthIcon width={24} height={24} color="#DC2626" />
                DELETE MONTH
              </h2>
              <button className="close-btn" onClick={closeDeleteMonthModal}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <span style={{
                  padding: '6px 18px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  background: selectedServer === 'all' ? '#FEF2F2' : `${getServerColor(selectedServer)}22`,
                  color: selectedServer === 'all' ? '#DC2626' : getServerColor(selectedServer),
                  border: `2px solid ${selectedServer === 'all' ? '#FECACA' : `${getServerColor(selectedServer)}44`}`
                }}>
                  🗄️ {selectedServer === 'all' ? 'ALL SERVERS' : getServerLabel(selectedServer).toUpperCase()}
                </span>
              </div>

              <div style={{
                padding: '14px 18px',
                background: '#FEF2F2',
                border: '2px solid #FECACA',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#991B1B', fontWeight: '600', lineHeight: '1.6' }}>
                  ⚠️ <strong>WARNING:</strong> This will permanently delete <strong>ALL BILLS</strong> for the selected Month + Year
                  {selectedServer === 'all' ? ' across ALL SERVERS' : ` from ${getServerLabel(selectedServer)}`}.
                  This action <strong>CANNOT be undone</strong>.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{
                    display: 'block',
                    fontWeight: '700',
                    marginBottom: '8px',
                    color: '#0F172A',
                    fontSize: '13px',
                    textTransform: 'uppercase'
                  }}>
                    Month <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={deleteMonthTarget}
                    onChange={(e) => {
                      setDeleteMonthTarget(e.target.value);
                      setDeleteMonthPreview([]);
                      setShowDeleteMonthPreview(false);
                      setDeleteMonthConfirmText('');
                    }}
                    className="filter-select"
                    style={{ width: '100%', padding: '12px 16px', fontSize: '14px' }}
                    disabled={deleteMonthLoading}
                  >
                    <option value="">-- Select Month --</option>
                    {deleteMonthMonthOptions.map(m => (
                      <option key={m} value={m}>📅 {m}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{
                    display: 'block',
                    fontWeight: '700',
                    marginBottom: '8px',
                    color: '#0F172A',
                    fontSize: '13px',
                    textTransform: 'uppercase'
                  }}>
                    Year <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={deleteMonthYear}
                    onChange={(e) => {
                      setDeleteMonthYear(e.target.value);
                      setDeleteMonthPreview([]);
                      setShowDeleteMonthPreview(false);
                      setDeleteMonthConfirmText('');
                    }}
                    className="filter-select"
                    style={{ width: '100%', padding: '12px 16px', fontSize: '14px' }}
                    disabled={deleteMonthLoading}
                  >
                    <option value="">-- Select Year --</option>
                    {deleteMonthYearOptions.map(y => (
                      <option key={y} value={y}>📆 {y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {deleteMonthTarget && deleteMonthYear && (
                <div style={{ marginTop: '16px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={previewDeleteMonth}
                    disabled={deleteMonthLoading}
                    style={{
                      width: '100%',
                      background: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: deleteMonthLoading ? 'not-allowed' : 'pointer',
                      opacity: deleteMonthLoading ? 0.6 : 1
                    }}
                  >
                    {deleteMonthLoading ? '⏳ Loading...' : '🔍 Preview Bills to Delete'}
                  </button>
                </div>
              )}

              {showDeleteMonthPreview && deleteMonthPreview.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{
                    padding: '12px 16px',
                    background: '#FEF2F2',
                    border: '2px solid #FECACA',
                    borderRadius: '10px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#991B1B' }}>
                      🗑️ {deleteMonthPreview.length} bills for {deleteMonthTarget} {deleteMonthYear}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#DC2626' }}>
                      Total: {formatCurrency(deleteMonthPreview.reduce((sum, b) => sum + (b.amount || 0), 0))}
                    </span>
                  </div>

                  <div style={{
                    maxHeight: '240px',
                    overflowY: 'auto',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>WSIN</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>Consumer</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>Location</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', borderBottom: '1px solid #E2E8F0' }}>Amount</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deleteMonthPreview.slice(0, 100).map((bill) => (
                          <tr key={`${bill.serverSource}-${bill.id}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 12px', fontWeight: '600' }}>{bill.billNumber || 'N/A'}</td>
                            <td style={{ padding: '8px 12px' }}>{bill.consumerName || 'N/A'}</td>
                            <td style={{ padding: '8px 12px' }}>{bill.location || 'N/A'}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>₱{(bill.amount || 0).toFixed(2)}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <span className={`status-badge ${getStatusBadge(bill.status || 'unpaid').class}`}>
                                {getStatusBadge(bill.status || 'unpaid').label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontWeight: '700',
                      marginBottom: '8px',
                      color: '#0F172A',
                      fontSize: '13px'
                    }}>
                      Type <span style={{ color: '#DC2626', fontFamily: 'monospace' }}>DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteMonthConfirmText}
                      onChange={(e) => setDeleteMonthConfirmText(e.target.value)}
                      placeholder="Type DELETE here..."
                      className="payment-input"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        letterSpacing: '2px'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-outline"
                onClick={closeDeleteMonthModal}
                style={{ flex: 1 }}
                disabled={deleteMonthLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={executeDeleteMonth}
                disabled={
                  deleteMonthLoading ||
                  deleteMonthBills.length === 0 ||
                  deleteMonthConfirmText.trim().toUpperCase() !== 'DELETE'
                }
                style={{
                  flex: 1,
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: (
                    deleteMonthLoading ||
                    deleteMonthBills.length === 0 ||
                    deleteMonthConfirmText.trim().toUpperCase() !== 'DELETE'
                  ) ? 0.5 : 1
                }}
              >
                {deleteMonthLoading ? '⏳ Deleting...' : `🗑️ Delete ${deleteMonthBills.length} Bills`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OR NUMBER MODAL */}
      {showORModal && (
        <div className="modal-overlay" onClick={closeORModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ReceiptIcon width={24} height={24} color="#111827" />
                OFFICIAL NUMBER
              </h2>
              <button className="close-btn" onClick={closeORModal}>✕</button>
            </div>

            <div style={{ marginTop: '24px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px', textAlign: 'center', lineHeight: '1.6' }}>
                Enter the <strong>FROM</strong> number below. The <strong>TO</strong> number
                will be auto-generated with exactly <strong>{OR_BATCH_SIZE} pieces</strong>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#0F172A', fontSize: '12px', textTransform: 'uppercase' }}>
                    From <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    value={orFrom}
                    onChange={handleORFromChange}
                    placeholder="e.g., 1299900"
                    maxLength="10"
                    autoFocus
                    className="payment-input"
                    style={{ textAlign: 'center' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#0F172A', fontSize: '12px', textTransform: 'uppercase' }}>
                    To <span style={{ color: '#94A3B8', fontSize: '11px', textTransform: 'none' }}>(auto)</span>
                  </label>
                  <input
                    type="text"
                    value={orTo}
                    onChange={handleORToChange}
                    placeholder="Auto-generated"
                    maxLength="10"
                    className="payment-input"
                    style={{ textAlign: 'center', background: '#F0FDF4', borderColor: '#16A34A', color: '#166534' }}
                  />
                </div>
              </div>

              {orFrom && orTo && (
                <div style={{
                  padding: '16px 20px',
                  background: orPreviewCount === OR_BATCH_SIZE ? '#F0FDF4' : '#FEF2F2',
                  border: orPreviewCount === OR_BATCH_SIZE ? '2px solid #86EFAC' : '2px solid #FECACA',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                    Total OR Numbers to be generated:
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '28px', fontWeight: '800', color: orPreviewCount === OR_BATCH_SIZE ? '#16A34A' : '#DC2626' }}>
                    {orPreviewCount} {orPreviewCount === 1 ? 'piece' : 'pieces'}
                  </p>
                </div>
              )}

              <div style={{
                padding: '12px 16px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '10px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '18px' }}>🗄️</span>
                <span style={{ fontSize: '13px', color: '#1E40AF', fontWeight: '600' }}>
                  These OR Numbers will be stored in <strong>Server 4</strong> → collection <strong>`or_numbers`</strong>
                </span>
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={closeORModal} style={{ flex: 1 }} disabled={orSaving}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSaveORNumbers}
                disabled={orPreviewCount !== OR_BATCH_SIZE || orSaving}
                style={{ flex: 1 }}
              >
                {orSaving ? '⏳ Saving...' : `💾 Save ${OR_BATCH_SIZE} OR Numbers`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SERVER SELECTION MODAL FOR IMPORT */}
      {showServerSelectModal && (
        <div className="modal-overlay" onClick={() => setShowServerSelectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>🌐 Select Server</h2>
              <button className="close-btn" onClick={() => setShowServerSelectModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
                Pilia asa nga <strong>Firebase Firestore</strong> nimo e-store ang gi-import nga Excel data.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
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
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <span style={{ fontSize: '30px' }}>🗄️</span>
                    <span style={{ fontSize: '16px', fontWeight: '700' }}>{server.label.toUpperCase()}</span>
                    <span style={{ fontSize: '10px', opacity: 0.9 }}>{server.project}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setShowServerSelectModal(false)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* CUTOFF PAY MODAL */}
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
                      <td style={{ padding: '14px 16px', fontWeight: '600', color: '#111827' }}>{cutoffBillToPay.billNumber || 'N/A'}</td>
                      <td style={{ padding: '14px 16px', fontWeight: '500', color: '#0F172A' }}>{cutoffBillToPay.consumerName || 'N/A'}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', fontSize: '18px', color: '#DC2626' }}>
                        {formatCurrency(cutoffBillToPay.amount || cutoffBillToPay.collectableAmount || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="form-group">
                <label>OR Number (Auto-Assigned) <span className="required">*</span></label>
                {cutoffLoadingOR ? (
                  <div style={{
                    padding: '14px 16px',
                    background: '#F1F5F9',
                    border: '2px solid #E2E8F0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#64748B',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    ⏳ Fetching available OR Number...
                  </div>
                ) : cutoffAvailableOR ? (
                  <>
                    <input
                      type="text"
                      className="payment-input"
                      value={cutoffPaymentCode}
                      readOnly
                      style={{
                        background: '#F0FDF4',
                        border: '2px solid #16A34A',
                        color: '#166534',
                        cursor: 'not-allowed',
                        fontWeight: '800'
                      }}
                    />
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: '#F0FDF4',
                      border: '1px solid #86EFAC',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '14px' }}>✅</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>
                        Auto-assigned from Server 4 → Batch: {cutoffAvailableOR.batchId || 'N/A'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{
                    padding: '14px 16px',
                    background: '#FEF2F2',
                    border: '2px solid #FECACA',
                    borderRadius: '8px',
                    color: '#991B1B',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    ⚠️ {cutoffOrFetchError || 'No available OR numbers.'}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setShowCutoffPayModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={confirmCutoffPay}
                disabled={!cutoffPaymentCode || cutoffPaymentCode.length !== 7 || isPayingCutoff || !cutoffAvailableOR}
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
                  opacity: (!cutoffPaymentCode || cutoffPaymentCode.length !== 7 || isPayingCutoff || !cutoffAvailableOR) ? '0.5' : '1'
                }}
              >
                {isPayingCutoff ? '⏳ Processing...' : '✅ Confirm Payment'}
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
              <div className="form-group">
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A' }}>
                  Select Location <span className="required" style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={selectedExportLocation}
                  onChange={(e) => setSelectedExportLocation(e.target.value)}
                  className="filter-select"
                  style={{ width: '100%', padding: '12px 16px' }}
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

      {/* PAY ALL MODAL — WITH DISCOUNT */}
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
                <label>OR Number (Auto-Assigned) <span className="required">*</span></label>
                {payAllLoadingOR ? (
                  <div style={{
                    padding: '14px 16px',
                    background: '#F1F5F9',
                    border: '2px solid #E2E8F0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#64748B',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    ⏳ Fetching available OR Number...
                  </div>
                ) : payAllAvailableOR ? (
                  <>
                    <input
                      type="text"
                      className="payment-input"
                      value={payAllPaymentCode}
                      readOnly
                      style={{
                        background: '#F0FDF4',
                        border: '2px solid #16A34A',
                        color: '#166534',
                        cursor: 'not-allowed',
                        fontWeight: '800'
                      }}
                    />
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: '#F0FDF4',
                      border: '1px solid #86EFAC',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '14px' }}>✅</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>
                        Auto-assigned from Server 4 → Batch: {payAllAvailableOR.batchId || 'N/A'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{
                    padding: '14px 16px',
                    background: '#FEF2F2',
                    border: '2px solid #FECACA',
                    borderRadius: '8px',
                    color: '#991B1B',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    ⚠️ {payAllOrFetchError || 'No available OR numbers.'}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={() => setShowPayAllModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={confirmPayAll}
                disabled={!payAllPaymentCode || payAllPaymentCode.length !== 7 || isPayingAll || !payAllAvailableOR}
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
                  opacity: (!payAllPaymentCode || payAllPaymentCode.length !== 7 || isPayingAll || !payAllAvailableOR) ? '0.5' : '1'
                }}
              >
                {isPayingAll ? '⏳ Processing...' : `✅ Pay (${payAllBills.length} Bill${payAllBills.length > 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT PAID CONFIRMATION */}
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
              <ul style={{ color: '#475569', fontSize: '14px', lineHeight: '2', paddingLeft: '20px' }}>
                <li>📤 Export <strong>{paidBillsToDelete.length}</strong> paid bills to Excel</li>
                <li>🗑️ <strong style={{ color: '#DC2626' }}>DELETE</strong> all paid bills from Firebase</li>
                <li>🔒 File protected with <strong>"Water_2026"</strong></li>
              </ul>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={closeExportPaidConfirm} style={{ flex: 1 }}>Cancel</button>
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
                  cursor: 'pointer'
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
                Select Location, Month, and Year to rollover.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A', fontSize: '13px' }}>
                    Location <span className="required" style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={newMonthLocation}
                    onChange={(e) => setNewMonthLocation(e.target.value)}
                    className="filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Location...</option>
                    {availableLocationsForNewMonth.map(location => <option key={location} value={location}>{location}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A', fontSize: '13px' }}>
                    Month <span className="required" style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={newMonthMonth}
                    onChange={(e) => setNewMonthMonth(e.target.value)}
                    className="filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Month...</option>
                    {months.map(month => <option key={month} value={month}>{month}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A', fontSize: '13px' }}>
                    Year <span className="required" style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={newMonthYear}
                    onChange={(e) => setNewMonthYear(e.target.value)}
                    className="filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Year...</option>
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button
                  className="btn btn-primary"
                  onClick={previewNewMonth}
                  disabled={!newMonthLocation || !newMonthMonth || !newMonthYear || newMonthLoading}
                  style={{ width: '100%', background: '#16A34A' }}
                >
                  {newMonthLoading ? '⏳ Loading...' : '🔍 Preview Bills'}
                </button>
              </div>

              {showNewMonthPreview && newMonthPreview.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#0F172A' }}>📋 Found {newMonthPreview.length} bills</span>
                  </div>
                  <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ background: '#F1F5F9', position: 'sticky', top: 0 }}>
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
                            <td style={{ padding: '6px 12px', fontWeight: '600', color: '#16A34A' }}>{bill.presentReading || '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" onClick={closeNewMonthModal} style={{ flex: 1 }}>Cancel</button>
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
                  opacity: (newMonthPreview.length === 0 || newMonthLoading) ? '0.5' : '1'
                }}
              >
                {newMonthLoading ? '⏳ Creating...' : `📋 Create ${getNextMonth(newMonthMonth)} ${getNextYear(newMonthMonth, newMonthYear)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgress && (
        <div className="modal-overlay">
          <div className="modal-content progress-modal">
            <h3>Importing Bills to {getServerLabel(selectedImportServer)}</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` }} />
            </div>
            <p className="progress-text">{uploadProgress.current} / {uploadProgress.total} bills</p>
          </div>
        </div>
      )}

      {/* PAY MODAL - SINGLE BILL — WITH DISCOUNT */}
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
              <label>OR Number (Auto-Assigned) <span className="required">*</span></label>
              {loadingOR ? (
                <div style={{
                  padding: '14px 16px',
                  background: '#F1F5F9',
                  border: '2px solid #E2E8F0',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  ⏳ Fetching available OR Number...
                </div>
              ) : availableOR ? (
                <>
                  <input
                    type="text"
                    className="payment-input"
                    value={paymentCode}
                    readOnly
                    style={{
                      background: '#F0FDF4',
                      border: '2px solid #16A34A',
                      color: '#166534',
                      cursor: 'not-allowed',
                      fontWeight: '800'
                    }}
                  />
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '14px' }}>✅</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#166534' }}>
                      Auto-assigned from Server 4 → Batch: {availableOR.batchId || 'N/A'}
                    </span>
                  </div>
                </>
              ) : orFetchError ? (
                <div style={{
                  padding: '14px 16px',
                  background: '#FEF2F2',
                  border: '2px solid #FECACA',
                  borderRadius: '8px',
                  color: '#991B1B',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  ⚠️ {orFetchError}
                </div>
              ) : (
                <div style={{
                  padding: '14px 16px',
                  background: '#FEF2F2',
                  border: '2px solid #FECACA',
                  borderRadius: '8px',
                  color: '#991B1B',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  ⚠️ No available OR numbers.
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={confirmPayBill}
                disabled={!paymentCode || paymentCode.length !== 7 || isPaying || !availableOR}
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