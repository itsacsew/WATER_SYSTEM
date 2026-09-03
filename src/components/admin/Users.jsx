// src/components/admin/Users.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, doc, writeBatch, deleteDoc, updateDoc } from 'firebase/firestore';
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

const ImportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"}>
    <path d="M12 3V12M12 12L9.5 9.5M12 12L14.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 17.5C3.5 16.5 2 14.5 2 12C2 7.02944 6.02944 3 11 3C15.9706 3 20 7.02944 20 12C20 14.5 18.5 16.5 17 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 21V13M12 21L9.5 18.5M12 21L14.5 18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 17L6 20L9 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ExportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"currentColor"} fill={"none"}>
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
    <path d="M12.1258 14H12.0008M12.1258 18H12.0008M7.625 14H7.5M7.625 18H7.5M16.625 14H16.5M12.2508 14C12.2508 14.1381 12.1389 14.25 12.0008 14.25C11.8628 14.25 11.7508 14.1381 11.7508 14C11.7508 13.8619 11.8628 13.75 12.0008 13.75C12.1389 13.75 12.2508 13.8619 12.2508 14ZM12.2508 18C12.2508 18.1381 12.1389 18.25 12.0008 18.25C11.8628 18.25 11.7508 18.1381 11.7508 18C11.7508 17.8619 11.8628 17.75 12.0008 17.75C12.1389 17.75 12.2508 17.8619 12.2508 18ZM7.75 14C7.75 14.1381 7.63807 14.25 7.5 14.25C7.36193 14.25 7.25 14.1381 7.25 14C7.25 13.8619 7.36193 13.75 7.5 13.75C7.63807 13.75 7.75 13.8619 7.75 14ZM7.75 18C7.75 18.1381 7.63807 18.25 7.5 18.25C7.36193 18.25 7.25 18.1381 7.25 18C7.25 17.8619 7.36193 17.75 7.5 17.75C7.63807 17.75 7.75 17.8619 7.75 18ZM16.75 14C16.75 14.1381 16.6381 14.25 16.5 14.25C16.3619 14.25 16.25 14.1381 16.25 14C16.25 13.8619 16.3619 13.75 16.5 13.75C16.6381 13.75 16.75 13.8619 16.75 14Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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

  // ========== IMPORT MODAL STATE ==========
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMonth, setImportMonth] = useState('');
  const [importLocation, setImportLocation] = useState('');
  const [availableImportLocations, setAvailableImportLocations] = useState([]);
  const [availableImportMonths, setAvailableImportMonths] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [showImportProgress, setShowImportProgress] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);

  // ========== EXPORT MODAL STATE ==========
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMonth, setExportMonth] = useState('');
  const [exportLocation, setExportLocation] = useState('');
  const [availableExportLocations, setAvailableExportLocations] = useState([]);
  const [availableExportMonths, setAvailableExportMonths] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [exportPreviewData, setExportPreviewData] = useState([]);
  const [showExportPreview, setShowExportPreview] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchImportFilterOptions();
    fetchExportFilterOptions();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole]);

  // ============================================================
  // FETCH FILTER OPTIONS FOR IMPORT MODAL
  // ============================================================

  const fetchImportFilterOptions = async () => {
    try {
      const billsRef = collection(db, 'bills');
      const querySnapshot = await getDocs(billsRef);
      
      const locations = new Set();
      const months = new Set();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location && data.location !== 'N/A') {
          locations.add(data.location);
        }
        if (data.month && data.month !== 'N/A') {
          months.add(data.month);
        }
      });
      
      const monthOrder = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                          'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
      
      setAvailableImportLocations(Array.from(locations).sort());
      setAvailableImportMonths(Array.from(months).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)));
      
    } catch (error) {
      console.error('Error fetching import filter options:', error);
    }
  };

  // ============================================================
  // FETCH FILTER OPTIONS FOR EXPORT MODAL
  // ============================================================

  const fetchExportFilterOptions = async () => {
    try {
      const importRef = collection(db, 'import');
      const querySnapshot = await getDocs(importRef);
      
      const locations = new Set();
      const months = new Set();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location && data.location !== 'N/A') {
          locations.add(data.location);
        }
        if (data.month && data.month !== 'N/A') {
          months.add(data.month);
        }
      });
      
      const monthOrder = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                          'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
      
      setAvailableExportLocations(Array.from(locations).sort());
      setAvailableExportMonths(Array.from(months).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)));
      
    } catch (error) {
      console.error('Error fetching export filter options:', error);
    }
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
      
      await fetchBillsCount(usersData);
      
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

  // ============================================================
  // IMPORT FUNCTIONS
  // ============================================================

  const openImportModal = () => {
    setImportMonth('');
    setImportLocation('');
    setImportPreviewData([]);
    setShowImportPreview(false);
    setShowImportModal(true);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportMonth('');
    setImportLocation('');
    setImportPreviewData([]);
    setShowImportPreview(false);
  };

  const previewImport = async () => {
    if (!importMonth || !importLocation) {
      toast.error('Please select both Month and Location');
      return;
    }

    setImportLoading(true);
    
    try {
      const billsRef = collection(db, 'bills');
      const q = query(
        billsRef,
        where('month', '==', importMonth),
        where('location', '==', importLocation)
      );
      const querySnapshot = await getDocs(q);
      
      const billsData = [];
      querySnapshot.forEach((doc) => {
        billsData.push({ id: doc.id, ...doc.data() });
      });
      
      if (billsData.length === 0) {
        toast.error(`No bills found for ${importMonth} in ${importLocation}`);
        setImportLoading(false);
        return;
      }
      
      setImportPreviewData(billsData);
      setShowImportPreview(true);
      toast.success(`Found ${billsData.length} bills to import`);
      
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
      const importCollectionRef = collection(db, 'import');
      let successCount = 0;
      let errorCount = 0;
      
      let batch = writeBatch(db);
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
            importBatch: `${importMonth}_${importLocation}_${Date.now()}`,
            importMonth: importMonth,
            importLocation: importLocation,
            sourceCollection: 'bills'
          };
          
          const docRef = doc(importCollectionRef);
          batch.set(docRef, importData);
          successCount++;
          batchCount++;
          
          setImportProgress({ current: i + 1, total: importPreviewData.length });
          
          if (batchCount >= 500) {
            await batch.commit();
            batch = writeBatch(db);
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
        toast.success(`✅ Successfully imported ${successCount} bills to "import" collection!`);
        closeImportModal();
        fetchExportFilterOptions();
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
  // EXPORT FUNCTIONS WITH OVERRIDE (REPLACE ALL)
  // ============================================================

  const openExportModal = () => {
    setExportMonth('');
    setExportLocation('');
    setExportPreviewData([]);
    setShowExportPreview(false);
    setShowExportModal(true);
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportMonth('');
    setExportLocation('');
    setExportPreviewData([]);
    setShowExportPreview(false);
  };

  const previewExport = async () => {
    if (!exportMonth || !exportLocation) {
      toast.error('Please select both Month and Location');
      return;
    }

    setExportLoading(true);
    
    try {
      const importRef = collection(db, 'import');
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
        toast.error(`No imported bills found for ${exportMonth} in ${exportLocation}`);
        setExportLoading(false);
        return;
      }
      
      setExportPreviewData(importData);
      setShowExportPreview(true);
      toast.success(`Found ${importData.length} imported bills to export`);
      
    } catch (error) {
      console.error('Error previewing export:', error);
      toast.error('Error fetching imported bills: ' + error.message);
    }
    
    setExportLoading(false);
  };

  // ============================================================
  // CONFIRM EXPORT - OVERRIDE/REPLACE ALL BILLS
  // ============================================================

  const confirmExport = async () => {
    if (exportPreviewData.length === 0) {
      toast.error('No data to export');
      return;
    }

    setExportLoading(true);
    setShowExportProgress(true);
    setExportProgress({ current: 0, total: exportPreviewData.length * 3 });

    try {
      const billsCollectionRef = collection(db, 'bills');
      let successCount = 0;
      let errorCount = 0;
      let deleteCount = 0;
      let deleteErrorCount = 0;

      // ========== STEP 1: Get year from export data ==========
      const exportYear = exportPreviewData[0]?.year || new Date().getFullYear().toString();

      // ========== STEP 2: Find ALL existing bills with same month/year/location ==========
      const existingBillsQuery = query(
        billsCollectionRef,
        where('month', '==', exportMonth),
        where('year', '==', exportYear),
        where('location', '==', exportLocation)
      );
      const existingSnapshot = await getDocs(existingBillsQuery);
      
      // Store existing bill IDs for deletion
      const existingBillIds = [];
      existingSnapshot.forEach((doc) => {
        existingBillIds.push(doc.id);
      });

      const existingCount = existingBillIds.length;
      
      // ========== STEP 3: Delete ALL existing bills ==========
      if (existingCount > 0) {
        toast(`🗑️ Found ${existingCount} existing bills in "${exportLocation}" for ${exportMonth} ${exportYear}. Replacing with new data...`, {
          icon: '🔄',
          duration: 4000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #F59E0B'
          }
        });

        let deleteBatch = writeBatch(db);
        let deleteBatchCount = 0;

        for (let i = 0; i < existingBillIds.length; i++) {
          try {
            const docRef = doc(db, 'bills', existingBillIds[i]);
            deleteBatch.delete(docRef);
            deleteCount++;
            deleteBatchCount++;

            if (deleteBatchCount >= 500) {
              await deleteBatch.commit();
              deleteBatch = writeBatch(db);
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

        toast.success(`🗑️ Deleted ${deleteCount} existing bills from "${exportLocation}" for ${exportMonth} ${exportYear}`);
      }

      // ========== STEP 4: Export new bills from import collection ==========
      let exportBatch = writeBatch(db);
      let exportBatchCount = 0;

      // Store document IDs for deletion from import later
      const importDocIds = [];

      for (let i = 0; i < exportPreviewData.length; i++) {
        try {
          const importDoc = exportPreviewData[i];
          const { id, ...importData } = importDoc;
          
          // Store ID for deletion from import
          importDocIds.push(id);
          
          // Remove import-specific metadata
          const { 
            importedAt, 
            importedBy, 
            importedByUid, 
            originalBillId, 
            importBatch, 
            importMonth: impMonth, 
            importLocation: impLocation, 
            sourceCollection,
            ...cleanBillData 
          } = importData;
          
          // Create bill data
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
            // Mark as replacement
            isReplacement: true,
            replacedAt: new Date().toISOString(),
            replacedFrom: id,
            replacedMonth: exportMonth,
            replacedYear: exportYear,
            replacedLocation: exportLocation
          };
          
          const docRef = doc(billsCollectionRef);
          exportBatch.set(docRef, billData);
          successCount++;
          exportBatchCount++;
          
          setExportProgress({ current: i + 1, total: exportPreviewData.length * 3 });
          
          if (exportBatchCount >= 500) {
            await exportBatch.commit();
            exportBatch = writeBatch(db);
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

      // ========== STEP 5: Delete from import collection ==========
      if (successCount > 0) {
        setExportProgress({ current: exportPreviewData.length, total: exportPreviewData.length * 3 });
        
        let deleteImportBatch = writeBatch(db);
        let deleteImportBatchCount = 0;

        for (let i = 0; i < importDocIds.length; i++) {
          try {
            const docId = importDocIds[i];
            const docRef = doc(db, 'import', docId);
            deleteImportBatch.delete(docRef);
            deleteImportBatchCount++;
            
            setExportProgress({ 
              current: exportPreviewData.length + i + 1, 
              total: exportPreviewData.length * 3 
            });
            
            if (deleteImportBatchCount >= 500) {
              await deleteImportBatch.commit();
              deleteImportBatch = writeBatch(db);
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

      // ========== STEP 6: Show results ==========
      if (successCount > 0) {
        let message = `✅ Successfully exported ${successCount} bills to "bills" collection!`;
        if (deleteCount > 0) {
          message += ` 🔄 Replaced ${deleteCount} existing bills for ${exportMonth} ${exportYear} in ${exportLocation}.`;
        }
        toast.success(message);
        toast.success(`🗑️ Successfully deleted ${importDocIds.length} bills from "import" collection!`);
        closeExportModal();
        fetchImportFilterOptions();
        fetchExportFilterOptions();
      }
      
      if (errorCount > 0) {
        toast.error(`⚠️ ${errorCount} bills failed to export`);
      }
      
      if (deleteErrorCount > 0) {
        toast.error(`⚠️ ${deleteErrorCount} bills failed to delete from import`);
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
            className="btn btn-secondary" 
            onClick={openImportModal}
            style={{ 
              background: '#194752', 
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ImportIcon />
            IMPORT DATA
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={openExportModal}
            style={{ 
              background: '#DC2626', 
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ExportIcon />
            REPLACE BILLS
          </button>
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

      {/* ============================================================
          IMPORT MODAL
          ============================================================ */}
      {showImportModal && (
        <div className="modal-overlay" onClick={closeImportModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ImportIcon width={28} height={28} color="#194752" />
                Import Bills to "import" Collection
              </h2>
              <button className="close-btn" onClick={closeImportModal}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
                Select a <strong>Month</strong> and <strong>Location</strong> to import bills from the 
                <strong> "bills" </strong> collection to the <strong> "import" </strong> collection in Firebase.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A' }}>
                    <MonthIcon width={18} height={18} style={{ display: 'inline', marginRight: '6px' }} />
                    Month <span className="required" style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={importMonth}
                    onChange={(e) => setImportMonth(e.target.value)}
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
                    <option value="">Select Month...</option>
                    {availableImportMonths.map(month => (
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
                    value={importLocation}
                    onChange={(e) => setImportLocation(e.target.value)}
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
                    <option value="">Select Location...</option>
                    {availableImportLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={previewImport}
                  disabled={!importMonth || !importLocation || importLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#194752',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: (!importMonth || !importLocation || importLoading) ? '0.5' : '1'
                  }}
                >
                  {importLoading ? '⏳ Loading...' : '🔍 Preview Bills'}
                </button>
              </div>

              {showImportPreview && importPreviewData.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#0F172A' }}>
                      📋 Found {importPreviewData.length} bills to import
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      From: {importMonth} | {importLocation}
                    </span>
                  </div>
                  
                  <div style={{ 
                    maxHeight: '200px', 
                    overflow: 'auto',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      fontSize: '12px'
                    }}>
                      <thead style={{ 
                        background: '#F1F5F9', 
                        position: 'sticky', 
                        top: 0,
                        zIndex: 1
                      }}>
                        <tr>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>WSIN</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Consumer</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Type</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Amount</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreviewData.slice(0, 50).map((bill) => (
                          <tr key={bill.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '6px 12px', fontWeight: '600' }}>{bill.billNumber || 'N/A'}</td>
                            <td style={{ padding: '6px 12px' }}>{bill.consumerName || 'N/A'}</td>
                            <td style={{ padding: '6px 12px' }}>
                              <span style={{ 
                                padding: '2px 10px', 
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                background: bill.consumerType === 'COMMERCIAL' ? '#DBEAFE' : '#D1FAE5',
                                color: bill.consumerType === 'COMMERCIAL' ? '#1E40AF' : '#065F46'
                              }}>
                                {bill.consumerType || 'N/A'}
                              </span>
                            </td>
                            <td style={{ padding: '6px 12px', fontWeight: '600' }}>
                              ₱{(bill.amount || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '6px 12px' }}>
                              <span style={{ 
                                padding: '2px 10px', 
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                background: bill.status === 'paid' ? '#D1FAE5' : bill.status === 'overdue' ? '#FEE2E2' : '#FEF3C7',
                                color: bill.status === 'paid' ? '#065F46' : bill.status === 'overdue' ? '#991B1B' : '#92400E'
                              }}>
                                {bill.status || 'UNPAID'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importPreviewData.length > 50 && (
                      <div style={{ 
                        padding: '8px 12px', 
                        textAlign: 'center', 
                        background: '#F8FAFC',
                        fontSize: '12px',
                        color: '#64748B'
                      }}>
                        Showing first 50 of {importPreviewData.length} bills
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-outline" 
                onClick={closeImportModal}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={confirmImport}
                disabled={importPreviewData.length === 0 || importLoading}
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
                  opacity: (importPreviewData.length === 0 || importLoading) ? '0.5' : '1'
                }}
              >
                {importLoading ? '⏳ Importing...' : `📥 Import ${importPreviewData.length} Bills`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Progress Modal */}
      {showImportProgress && (
        <div className="modal-overlay">
          <div className="modal-content progress-modal">
            <h3>📤 Importing Bills to "import" Collection</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` 
                }}
              />
            </div>
            <p className="progress-text">
              {importProgress.current} / {importProgress.total} bills imported
            </p>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
              ⏳ Please wait, this may take a few moments...
            </p>
          </div>
        </div>
      )}

      {/* ============================================================
          EXPORT MODAL - REPLACE/OVERRIDE
          ============================================================ */}
      {showExportModal && (
        <div className="modal-overlay" onClick={closeExportModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ExportIcon width={28} height={28} color="#DC2626" />
                Replace Bills in "bills" Collection
              </h2>
              <button className="close-btn" onClick={closeExportModal}>✕</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
                Select a <strong>Month</strong> and <strong>Location</strong> to <strong>REPLACE</strong> bills in the 
                <strong> "bills" </strong> collection with data from the <strong> "import" </strong> collection.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0F172A' }}>
                    <MonthIcon width={18} height={18} style={{ display: 'inline', marginRight: '6px' }} />
                    Month <span className="required" style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
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
                    onChange={(e) => setExportLocation(e.target.value)}
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
                    <option value="">Select Location...</option>
                    {availableExportLocations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={previewExport}
                  disabled={!exportMonth || !exportLocation || exportLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#DC2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: (!exportMonth || !exportLocation || exportLoading) ? '0.5' : '1'
                  }}
                >
                  {exportLoading ? '⏳ Loading...' : '🔍 Preview Imported Bills'}
                </button>
              </div>

              {showExportPreview && exportPreviewData.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#0F172A' }}>
                      📋 Found {exportPreviewData.length} imported bills to export
                    </span>
                    <span style={{ fontSize: '12px', color: '#DC2626' }}>
                      Will REPLACE all existing bills for {exportMonth} in {exportLocation}
                    </span>
                  </div>
                  
                  <div style={{ 
                    maxHeight: '200px', 
                    overflow: 'auto',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      fontSize: '12px'
                    }}>
                      <thead style={{ 
                        background: '#F1F5F9', 
                        position: 'sticky', 
                        top: 0,
                        zIndex: 1
                      }}>
                        <tr>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>WSIN</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Consumer</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Type</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Amount</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportPreviewData.slice(0, 50).map((bill) => (
                          <tr key={bill.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '6px 12px', fontWeight: '600' }}>{bill.billNumber || 'N/A'}</td>
                            <td style={{ padding: '6px 12px' }}>{bill.consumerName || 'N/A'}</td>
                            <td style={{ padding: '6px 12px' }}>
                              <span style={{ 
                                padding: '2px 10px', 
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                background: bill.consumerType === 'COMMERCIAL' ? '#DBEAFE' : '#D1FAE5',
                                color: bill.consumerType === 'COMMERCIAL' ? '#1E40AF' : '#065F46'
                              }}>
                                {bill.consumerType || 'N/A'}
                              </span>
                            </td>
                            <td style={{ padding: '6px 12px', fontWeight: '600' }}>
                              ₱{(bill.amount || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '6px 12px' }}>
                              <span style={{ 
                                padding: '2px 10px', 
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '600',
                                background: bill.status === 'paid' ? '#D1FAE5' : bill.status === 'overdue' ? '#FEE2E2' : '#FEF3C7',
                                color: bill.status === 'paid' ? '#065F46' : bill.status === 'overdue' ? '#991B1B' : '#92400E'
                              }}>
                                {bill.status || 'UNPAID'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {exportPreviewData.length > 50 && (
                      <div style={{ 
                        padding: '8px 12px', 
                        textAlign: 'center', 
                        background: '#F8FAFC',
                        fontSize: '12px',
                        color: '#64748B'
                      }}>
                        Showing first 50 of {exportPreviewData.length} bills
                      </div>
                    )}
                  </div>
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
                onClick={confirmExport}
                disabled={exportPreviewData.length === 0 || exportLoading}
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
                  opacity: (exportPreviewData.length === 0 || exportLoading) ? '0.5' : '1'
                }}
              >
                {exportLoading ? '⏳ Replacing...' : `🔄 REPLACE ${exportPreviewData.length} Bills`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Progress Modal */}
      {showExportProgress && (
        <div className="modal-overlay">
          <div className="modal-content progress-modal">
            <h3>🔄 Replacing Bills in "bills" Collection</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${exportProgress.total > 0 ? (exportProgress.current / exportProgress.total) * 100 : 0}%` 
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