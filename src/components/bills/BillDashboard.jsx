// src/components/bills/BillDashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, addDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import BillCard from './BillCard';
import BillForm from './BillForm';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import './BillStyles.css';

const EXCEL_PASSWORD = 'Water_2026';

const BillDashboard = () => {
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
  const [viewMode, setViewMode] = useState('table');
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentCode, setPaymentCode] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
    checkLocalStorage();
  }, [user]);

  useEffect(() => {
    filterBills();
  }, [bills, searchTerm, filterType]);

  useEffect(() => {
    if (showPayModal) {
      setPaymentCode('');
      setPaymentError('');
    }
  }, [showPayModal]);

  const checkLocalStorage = () => {
    try {
      const importedData = localStorage.getItem('importedBills');
      if (importedData) {
        console.log('Found imported data in localStorage');
      }
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
  };

  const fetchBills = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const billsRef = collection(db, 'bills');
      const q = query(
        billsRef,
        where('userId', '==', user.uid),
        orderBy('dueDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const billsData = [];
      querySnapshot.forEach((doc) => {
        billsData.push({ id: doc.id, ...doc.data() });
      });
      setBills(billsData);
      setFilteredBills(billsData);
      calculateStats(billsData);
      
      try {
        localStorage.setItem('bills_backup', JSON.stringify(billsData));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
    } catch (error) {
      toast.error('Error fetching bills');
      try {
        const backupData = localStorage.getItem('bills_backup');
        if (backupData) {
          const parsedData = JSON.parse(backupData);
          setBills(parsedData);
          setFilteredBills(parsedData);
          calculateStats(parsedData);
          toast.success('Loaded bills from local backup');
        }
      } catch (e) {
        console.error('Error loading backup:', e);
      }
    }
    setLoading(false);
  };

  const filterBills = () => {
    let filtered = [...bills];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(bill => 
        bill.consumerName?.toLowerCase().includes(term)
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(bill => 
        bill.consumerType?.toUpperCase() === filterType.toUpperCase()
      );
    }
    
    setFilteredBills(filtered);
  };

  const calculateStats = (billsData) => {
    const total = billsData.length;
    const paid = billsData.filter(b => b.status === 'paid').length;
    const unpaid = billsData.filter(b => b.status === 'unpaid').length;
    const overdue = billsData.filter(b => {
      if (b.status === 'paid') return false;
      const dueDate = new Date(b.dueDate);
      return dueDate < new Date();
    }).length;
    
    const uniqueConsumers = new Set();
    const residentialCount = billsData.filter(b => b.consumerType?.toUpperCase() === 'RESIDENTIAL').length;
    const commercialCount = billsData.filter(b => b.consumerType?.toUpperCase() === 'COMMERCIAL').length;
    
    billsData.forEach(b => {
      if (b.consumerName) {
        uniqueConsumers.add(b.consumerName);
      }
    });
    
    const locations = new Set();
    billsData.forEach(b => {
      if (b.location) {
        locations.add(b.location);
      }
    });
    const locationString = Array.from(locations).join(', ') || 'N/A';
    
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

  const handleDelete = async (billId) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    
    try {
      await deleteDoc(doc(db, 'bills', billId));
      toast.success('Bill deleted successfully');
      
      const updatedBills = bills.filter(b => b.id !== billId);
      localStorage.setItem('bills_backup', JSON.stringify(updatedBills));
      
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
      
      const billRef = doc(db, 'bills', selectedBill.id);
      await updateDoc(billRef, {
        status: 'paid',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentCode: paymentCode,
        referenceNumber: referenceNumber,
        paidBy: user?.email || 'Unknown'
      });
      
      toast.success(`✅ Bill ${selectedBill.billNumber} marked as paid!`);
      toast.success(`Reference: ${referenceNumber}`);
      
      setShowPayModal(false);
      setSelectedBill(null);
      setPaymentCode('');
      setPaymentError('');
      fetchBills();
    } catch (error) {
      toast.error('Error updating bill status');
      console.error('Payment error:', error);
    } finally {
      setIsPaying(false);
    }
  };

  // ========== EXPORT WITH HARDCODED PASSWORD - WHITE BACKGROUND ==========
  const handleExportWithPassword = async () => {
    if (filteredBills.length === 0) {
      toast.error('No bills to export!');
      return;
    }

    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Water Bills');

      // Define columns
      worksheet.columns = [
        { header: 'WSIN', key: 'wsin', width: 15 },
        { header: 'Consumer Name', key: 'consumerName', width: 25 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Period', key: 'period', width: 15 },
        { header: 'Consumer Type', key: 'consumerType', width: 18 },
        { header: 'Previous Reading', key: 'previousReading', width: 18 },
        { header: 'Present Reading', key: 'presentReading', width: 18 },
        { header: 'Status', key: 'status', width: 12 }
      ];

      // ========== HEADER ROW - WHITE BACKGROUND WITH BLACK TEXT ==========
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FF000000' }, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' } // WHITE
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 25;

      // ========== ADD DATA WITH WHITE BACKGROUND ==========
      filteredBills.forEach((bill) => {
        const period = `${bill.month || 'N/A'} ${bill.year || ''}`;
        worksheet.addRow({
          wsin: bill.billNumber || 'N/A',
          consumerName: bill.consumerName || 'N/A',
          location: bill.location || 'N/A',
          period: period.trim() || 'N/A',
          consumerType: bill.consumerType || 'N/A',
          previousReading: bill.previousReading || '0',
          presentReading: bill.presentReading || '0',
          status: bill.status?.toUpperCase() || 'UNPAID'
        });
      });

      // ========== STYLE DATA ROWS - WHITE BACKGROUND ==========
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.height = 22;
          row.alignment = { vertical: 'middle' };
          
          // ALL ROWS HAVE WHITE BACKGROUND
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFFFF' } // WHITE
            };
            cell.font = { color: { argb: 'FF000000' }, size: 11 }; // BLACK TEXT
          });
          
          // Status color coding - only text color changes
          const statusCell = row.getCell(8);
          const statusValue = statusCell.value?.toString().toLowerCase() || '';
          if (statusValue === 'paid') {
            statusCell.font = { color: { argb: 'FF008000' }, bold: true }; // Dark Green
          } else if (statusValue === 'unpaid') {
            statusCell.font = { color: { argb: 'FFDAA520' }, bold: true }; // Goldenrod
          } else if (statusValue === 'overdue') {
            statusCell.font = { color: { argb: 'FFFF0000' }, bold: true }; // Red
          }
        }
      });

      // ========== ADD BORDER TO ALL CELLS ==========
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });
      });

      // ========== PROTECT THE WORKSHEET WITH PASSWORD ==========
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

      // Lock all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.protection = { locked: true };
        });
      });

      // ========== GENERATE EXCEL FILE ==========
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Water_Bills_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`✅ Exported ${filteredBills.length} bills with password protection!`);
      toast.info(`🔒 Password: ${EXCEL_PASSWORD}`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting file: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              const docRef = doc(billsRef);
              batch.set(docRef, billData);
              successCount++;
              
              setUploadProgress({ current: i + 1, total: parsedBills.length });
              
              if (i % 500 === 499) {
                await batch.commit();
              }
            } catch (error) {
              console.error('Error adding bill:', error);
              errorCount++;
            }
          }

          if (successCount > 0) {
            await batch.commit();
          }

          try {
            const existingBackup = JSON.parse(localStorage.getItem('bills_backup') || '[]');
            const allBills = [...existingBackup, ...parsedBills.map((b, idx) => ({
              ...b,
              id: `local_${Date.now()}_${idx}`
            }))];
            localStorage.setItem('bills_backup', JSON.stringify(allBills));
            localStorage.setItem('importedBills', JSON.stringify({
              date: new Date().toISOString(),
              count: successCount,
              filename: file.name
            }));
          } catch (error) {
            console.error('Error saving to localStorage:', error);
          }

          toast.success(`Successfully imported ${successCount} bills! ${errorCount > 0 ? `${errorCount} failed.` : ''}`);
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
      paid: { label: 'Paid', class: 'status-paid-3d' },
      unpaid: { label: 'Unpaid', class: 'status-unpaid-3d' },
      overdue: { label: 'Overdue', class: 'status-overdue-3d' }
    };
    return statusMap[status] || statusMap.unpaid;
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-3d"></div>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '16px' }}>Loading your bills...</p>
      </div>
    );
  }

  return (
    <div className="bill-dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Water Bill Dashboard</h2>
          <p>Manage and track your water bills</p>
        </div>
        <div className="header-actions">
          <button className="add-bill-btn" onClick={() => setShowForm(true)}>
            + Add New Bill
          </button>
          <div className="file-upload-wrapper">
            <button 
              className="add-bill-btn" 
              onClick={() => document.getElementById('fileInput').click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Import Excel'}
            </button>
            <input
              type="file"
              id="fileInput"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
          <button 
            className="add-bill-btn"
            onClick={handleExportWithPassword}
            disabled={filteredBills.length === 0 || isExporting}
          >
            {isExporting ? '⏳ Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Upload Progress Modal */}
      {showProgress && (
        <div className="progress-overlay">
          <div className="progress-modal">
            <h3>Importing Excel Data</h3>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <p className="progress-text">
              {uploadProgress.current} / {uploadProgress.total} bills imported
            </p>
            <p className="progress-status">
              {uploading ? 'Processing...' : 'Complete!'}
            </p>
          </div>
        </div>
      )}

      {/* Pay Bill Modal */}
      {showPayModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-3d">
              <h3>Confirm Payment</h3>
              <button className="close-btn-3d" onClick={() => setShowPayModal(false)}>×</button>
            </div>
            <div>
              
              
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                padding: '16px', 
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <p style={{ color: '#14652B', fontSize: '18px', fontWeight:'700', margin: '0 0 2px 0' }}>Bill Number</p>
                    <p style={{ color: '#14652B', fontWeight: '600', fontSize:'18px', margin: '0' }}>{selectedBill.billNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{  color: '#14652B', fontSize: '18px', fontWeight:'700', margin: '0 0 2px 0' }}>Consumer</p>
                    <p style={{ color: '#14652B', fontWeight: '600', fontSize:'18px', margin: '0' }}>{selectedBill.consumerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ color: '#14652B', fontSize: '18px', fontWeight:'700', margin: '0 0 2px 0'  }}>Amount</p>
                    <p style={{ color: '#14652B', fontWeight: '600', fontSize:'18px', margin: '0' }}>{formatCurrency(selectedBill.amount)}</p>
                  </div>
                  <div>
                    <p style={{ color: '#14652B', fontSize: '18px', fontWeight:'700', margin: '0 0 2px 0' }}>Due Date</p>
                    <p style={{color: '#14652B', fontWeight: '600', fontSize:'20px', margin: '0' }}>{formatDate(selectedBill.dueDate)}</p>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ color: '#14652B', fontWeight: '700', fontSize: '18px' }}>
                  Payment Code <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  type="text"
                  className={`modal-input ${paymentError ? 'error' : ''}`}
                  placeholder="Enter 7-digit payment code"
                  value={paymentCode}
                  onChange={handlePaymentCodeChange}
                  maxLength="7"
                  autoFocus
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `2px solid ${paymentError ? 'rgba(68, 239, 77, 0.3)' : 'rgba(34, 107, 43, 1)'}`,
                    borderRadius: '12px',
                    padding: '10px 16px',
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#14652B',
                    width: '100%',
                    outline: 'none',
                    boxSizing: 'border-box',
                    letterSpacing: '6px',
                    textAlign: 'center'
                  }}
                />
                {paymentError && (
                  <span className="error-message" style={{ color: '#f87171', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    ❌ {paymentError}
                  </span>
                )}
                <p style={{ color: '#14652B', fontSize: '12px'}}>
                  Enter the 7-digit code provided for this payment (e.g., 1234567)
                </p>
              </div>

              <div className="modal-actions">
                <button 
                  className="modal-btn secondary" 
                  onClick={() => setShowPayModal(false)}
                  disabled={isPaying}
                >
                  Cancel
                </button>
                <button 
                  className={`modal-btn primary ${(!paymentCode || paymentCode.length !== 7) ? 'disabled' : ''}`}
                  onClick={confirmPayBill}
                  disabled={!paymentCode || paymentCode.length !== 7 || isPaying}
                  style={{
                    opacity: (!paymentCode || paymentCode.length !== 7) ? '0.4' : '1',
                    cursor: (!paymentCode || paymentCode.length !== 7) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isPaying ? '⏳ Processing...' : '✅ Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HORIZONTAL STATS */}
      <div className="stats-horizontal">
        <div className="stat-item">
          
          <div className="stat-info-horizontal">
            <span className="stat-label">Total Bills</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
        
          <div className="stat-info-horizontal">
            <span className="stat-label">Paid</span>
            <span className="stat-value paid-value">{stats.paid}</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          
          <div className="stat-info-horizontal">
            <span className="stat-label">Unpaid</span>
            <span className="stat-value unpaid-value">{stats.unpaid}</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          
          <div className="stat-info-horizontal">
            <span className="stat-label">Overdue</span>
            <span className="stat-value overdue-value">{stats.overdue}</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          
          <div className="stat-info-horizontal">
            <span className="stat-label">Total Consumers</span>
            <span className="stat-value">{stats.totalConsumers}</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          
          <div className="stat-info-horizontal">
            <span className="stat-label">Residential</span>
            <span className="stat-value residential-value">{stats.residential}</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
     
          <div className="stat-info-horizontal">
            <span className="stat-label">Commercial</span>
            <span className="stat-value commercial-value">{stats.commercial}</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          
          <div className="stat-info-horizontal">
            <span className="stat-label">Location</span>
            <span className="stat-value location-value">{stats.location || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-bar-container">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by consumer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="RESIDENTIAL">🏠 Residential</option>
            <option value="COMMERCIAL">🏢 Commercial</option>
          </select>
          <span className="result-count">
            {filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'} found
          </span>
        </div>
      </div>

      {/* Bills Display - Table View */}
      {viewMode === 'table' ? (
        <div className="table-container">
          {filteredBills.length === 0 ? (
            <div className="empty-state-3d">
              <p>No bills found. {searchTerm || filterType !== 'all' ? 'Try adjusting your search.' : 'Add your first water bill!'}</p>
            </div>
          ) : (
            <table className="bills-table">
              <thead>
                <tr>
                  <th>WSIN</th>
                  <th>Consumer Name</th>
                  <th>Location</th>
                  <th>Period</th>
                  <th>Consumer Type</th>
                  <th>Previous Reading</th>
                  <th>Present Reading</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => {
                  const status = getStatusBadge(bill.status);
                  const period = `${bill.month || 'N/A'} ${bill.year || ''}`;
                  return (
                    <tr key={bill.id}>
                      <td className="bill-number-cell">{bill.billNumber || 'N/A'}</td>
                      <td className="consumer-name-cell">{bill.consumerName || 'N/A'}</td>
                      <td>{bill.location || 'N/A'}</td>
                      <td>{period.trim() || 'N/A'}</td>
                      <td>
                        <span className={`consumer-type-badge ${bill.consumerType?.toUpperCase() === 'RESIDENTIAL' ? 'residential' : 'commercial'}`}>
                          {bill.consumerType || 'N/A'}
                        </span>
                      </td>
                      <td>{bill.previousReading || '0'}</td>
                      <td>{bill.presentReading || '0'}</td>
                      <td>
                        <span className={`status-badge-3d ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          {bill.status !== 'paid' && (
                            <button 
                              className="pay-btn"
                              onClick={() => handlePayBill(bill)}
                            >
                              💳 Pay
                            </button>
                          )}
                         
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bills-grid">
          {filteredBills.length === 0 ? (
            <div className="empty-state-3d" style={{ gridColumn: '1 / -1' }}>
              <p>No bills found. {searchTerm || filterType !== 'all' ? 'Try adjusting your search.' : 'Add your first water bill!'}</p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPay={handlePayBill}
              />
            ))
          )}
        </div>
      )}

      {/* Bill Form Modal */}
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

export default BillDashboard;