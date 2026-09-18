// src/bills/Paid.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getDbByServer, getServerLabel, getServerColor, } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import '../bills/BillStyles.css';
import '../admin/AdminStyles.css';

// ============================================================
// SERVER 4 = SOURCE OF PAID DATA (used_or_numbers)
// ============================================================
const PAID_SERVER_KEY = 'server4';
const PAID_COLLECTION = 'used_or_numbers';
const EXCEL_PASSWORD = 'Water_2026';

// ============================================================
// HARD-CODED SVG ICONS
// ============================================================

const ReceiptIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color="currentColor" fill="none" {...props}>
    <path d="M4 2V22L7 20L10 22L13 20L16 22L20 19.5V2H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 7H16M8 11H16M8 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SummationCircleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={28} height={28} color={"currentColor"} fill={"none"} {...props}>
    <path d="M14.9998 14.4986C14.9981 15.0266 14.983 15.3137 14.8502 15.5299C14.5236 16.0612 13.8736 15.9976 13.3241 15.9976H10.7994C9.69158 15.9976 9.13766 15.9976 9.01957 15.6713C8.90149 15.345 9.32205 14.9765 10.1632 14.2394L11.8529 12.7588C12.2554 12.4062 12.4566 12.2298 12.4566 12C12.4566 11.7702 12.2554 11.5938 11.8529 11.2412L10.1632 9.76058C9.32205 9.02355 8.90149 8.65503 9.01957 8.3287C9.13766 8.00237 9.69158 8.00237 10.7994 8.00237H13.3241C13.8736 8.00237 14.5236 7.93885 14.8502 8.47006C14.983 8.68627 14.9981 8.97338 14.9998 9.50144" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"></circle>
  </svg>
);

const PhilippinePesoIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={28} height={28} color={"currentColor"} fill={"none"} {...props}>
    <path d="M7 15V4C7 3.44772 7.44772 3 8 3H12C15.3137 3 18 5.68629 18 9C18 12.3137 15.3137 15 12 15H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M4 7H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M4 11H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M7 15V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const User02Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={28} height={28} color={"currentColor"} fill={"none"} {...props}>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
    <path d="M12 14C7 14 4 16.5 4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19C20 16.5 17 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const CalendarClockIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={28} height={28} color={"currentColor"} fill={"none"} {...props}>
    <path d="M15.5 2V6M7.5 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M20.3985 8C20.2706 6.69989 19.9816 5.82475 19.3284 5.17157C18.1569 4 16.2712 4 12.5 4H10.5C6.72876 4 4.84315 4 3.67157 5.17157C2.5 6.34315 2.5 8.22876 2.5 12V14C2.5 17.7712 2.5 19.6569 3.67157 20.8284C4.47975 21.6366 5.6277 21.8873 7.5 21.965" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M2.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M15.5 22C18.8137 22 21.5 19.3137 21.5 16C21.5 12.6863 18.8137 10 15.5 10C12.1863 10 9.5 12.6863 9.5 16C9.5 19.3137 12.1863 22 15.5 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M15.5 13V16L17.5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
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

const ExportIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color="currentColor" fill="none" {...props}>
    <path d="M12 21V12M12 12L9.5 14.5M12 12L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 6.5C3.5 7.5 2 9.5 2 12C2 16.9706 6.02944 21 11 21C15.9706 21 20 16.9706 20 12C20 9.5 18.5 7.5 17 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3V11M12 11L9.5 8.5M12 11L14.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 7L6 4L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RefreshIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} color="currentColor" fill="none" {...props}>
    <path d="M3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C15.2 3.5 17.9804 5.21905 19.5 7.78693" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5 4V8H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C8.8 20.5 6.01905 18.7809 4.5 16.2131" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.5 20V16H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================================
// PAID COMPONENT
// ============================================================
const Paid = () => {
  const { user } = useAuth();
  const [paidRecords, setPaidRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterServer, setFilterServer] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const rowsPerPage = 10;

  const [stats, setStats] = useState({
    totalRecords: 0,
    totalAmount: 0,
    totalConsumers: 0,
    serversUsed: 0
  });

  // ============================================================
  // FETCH ALL PAID RECORDS FROM SERVER 4 → used_or_numbers
  // ============================================================
  const fetchPaidRecords = useCallback(async () => {
    setLoading(true);
    console.log('🔍 Fetching PAID records from Server 4 → used_or_numbers');

    try {
      const paidDb = getDbByServer(PAID_SERVER_KEY);
      const paidRef = collection(paidDb, PAID_COLLECTION);

      const snap = await getDocs(paidRef);

      console.log(`📊 Total documents in used_or_numbers: ${snap.size}`);

      const records = [];
      snap.forEach((docSnap) => {
        records.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      // ✅ Sort by OR number ascending
      const sortedRecords = records.sort((a, b) => {
        const aNum = parseInt(String(a.orNumber || '0').replace(/\D/g, ''), 10) || 0;
        const bNum = parseInt(String(b.orNumber || '0').replace(/\D/g, ''), 10) || 0;
        return aNum - bNum;
      });

      console.log(`✅ Sorted ${sortedRecords.length} paid records`);

      setPaidRecords(sortedRecords);
      setFilteredRecords(sortedRecords);
      calculateStats(sortedRecords);
    } catch (error) {
      console.error('❌ Error fetching paid records:', error);
      toast.error('Error loading paid records from Server 4');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPaidRecords();
  }, [fetchPaidRecords]);

  useEffect(() => {
    filterRecords();
  }, [paidRecords, searchTerm, filterServer, filterMonth, filterYear]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterServer, filterMonth, filterYear]);

  const calculateStats = (records) => {
    const totalRecords = records.length;
    const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const uniqueConsumers = new Set(records.map(r => r.consumerName).filter(Boolean));
    const uniqueServers = new Set(records.map(r => r.serverSource).filter(Boolean));

    setStats({
      totalRecords,
      totalAmount,
      totalConsumers: uniqueConsumers.size,
      serversUsed: uniqueServers.size
    });
  };

  const filterRecords = () => {
    let filtered = [...paidRecords];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(r =>
        r.consumerName?.toLowerCase().includes(term) ||
        r.billNumber?.toString().toLowerCase().includes(term) ||
        r.orNumber?.toString().toLowerCase().includes(term) ||
        r.consumerAddress?.toLowerCase().includes(term)
      );
    }

    if (filterServer !== 'all') {
      filtered = filtered.filter(r => r.serverSource === filterServer);
    }

    if (filterMonth !== 'all') {
      filtered = filtered.filter(r => r.month?.toUpperCase() === filterMonth.toUpperCase());
    }

    if (filterYear !== 'all') {
      filtered = filtered.filter(r => r.year === filterYear);
    }

    setFilteredRecords(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterServer('all');
    setFilterMonth('all');
    setFilterYear('all');
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredRecords.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const getPaginationInfo = () => {
    if (filteredRecords.length === 0) return 'No records';
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, filteredRecords.length);
    return `Showing ${start} - ${end} of ${filteredRecords.length} paid records`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount) || 0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleExportToExcel = async () => {
    if (filteredRecords.length === 0) {
      toast.error('No paid records to export!');
      return;
    }

    setIsExporting(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Paid Records');

      worksheet.columns = [
        { header: 'OR Number', key: 'orNumber', width: 15 },
        { header: 'Server', key: 'server', width: 12 },
        { header: 'Consumer Name', key: 'consumerName', width: 25 },
        { header: 'Address', key: 'consumerAddress', width: 20 },
        { header: 'Period', key: 'period', width: 15 },
        { header: 'Bill Number', key: 'billNumber', width: 18 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Paid At', key: 'paidAt', width: 20 },
        { header: 'Paid By', key: 'usedBy', width: 25 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 25;

      filteredRecords.forEach((record) => {
        const period = `${record.month || 'N/A'} ${record.year || ''}`;
        worksheet.addRow({
          orNumber: record.orNumber || 'N/A',
          server: getServerLabel(record.serverSource),
          consumerName: record.consumerName || 'N/A',
          consumerAddress: record.consumerAddress || 'N/A',
          period: period.trim() || 'N/A',
          billNumber: record.billNumber || 'N/A',
          amount: Number(record.amount) || 0,
          paidAt: formatDateTime(record.usedAt || record.archivedAt),
          paidBy: record.usedBy || 'N/A'
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

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Paid_Records_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`✅ Exported ${filteredRecords.length} paid records!`);
      toast.success(`🔒 Password: ${EXCEL_PASSWORD}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting file: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const availableServers = Array.from(new Set(paidRecords.map(r => r.serverSource).filter(Boolean)));
  const availableMonths = Array.from(new Set(paidRecords.map(r => r.month).filter(Boolean)))
    .sort((a, b) => {
      const order = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                     'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
      return order.indexOf(a.toUpperCase()) - order.indexOf(b.toUpperCase());
    });
  const availableYears = Array.from(new Set(paidRecords.map(r => r.year).filter(Boolean)))
    .sort((a, b) => Number(b) - Number(a));

  return (
    <div className="bill-dashboard" style={{ padding: '24px 2px 4px' }}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>PAID RECORDS</h1>
          <p>All paid bills from Server 4 → <strong style={{ color: '#7C3AED' }}>used_or_numbers</strong></p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={fetchPaidRecords}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshIcon width={18} height={18} color="#ffffff" />
            {loading ? 'LOADING...' : 'REFRESH'}
          </button>

          <button
            className="btn btn-success"
            onClick={handleExportToExcel}
            disabled={filteredRecords.length === 0 || isExporting}
            style={{
              background: '#16A34A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (filteredRecords.length === 0 || isExporting) ? 'not-allowed' : 'pointer',
              opacity: (filteredRecords.length === 0 || isExporting) ? 0.5 : 1
            }}
          >
            <ExportIcon width={18} height={18} color="#ffffff" />
            {isExporting ? 'EXPORTING...' : 'EXPORT EXCEL'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card" style={{ borderColor: '#16A34A' }}>
          <span className="stat-icon"><SummationCircleIcon width={28} height={28} color="#16A34A" /></span>
          <div>
            <p className="stat-label">Total Paid Records</p>
            <p className="stat-number" style={{ color: '#16A34A' }}>{stats.totalRecords}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#D97706' }}>
          <span className="stat-icon"><PhilippinePesoIcon width={28} height={28} color="#D97706" /></span>
          <div>
            <p className="stat-label">Overall Total</p>
            <p className="stat-number" style={{ color: '#D97706', fontSize: '18px' }}>{formatCurrency(stats.totalAmount)}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#2563EB' }}>
          <span className="stat-icon"><User02Icon width={28} height={28} color="#2563EB" /></span>
          <div>
            <p className="stat-label">Unique Consumers</p>
            <p className="stat-number" style={{ color: '#2563EB' }}>{stats.totalConsumers}</p>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: '#7C3AED' }}>
          <span className="stat-icon"><ServerIcon width={28} height={28} color="#7C3AED" /></span>
          <div>
            <p className="stat-label">Servers Used</p>
            <p className="stat-number" style={{ color: '#7C3AED' }}>{stats.serversUsed}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="search-filter-container">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, OR Number, WSIN, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select className="filter-select" value={filterServer} onChange={(e) => setFilterServer(e.target.value)}>
            <option value="all">All Servers</option>
            {availableServers.map(s => (
              <option key={s} value={s}>{getServerLabel(s)}</option>
            ))}
          </select>

          <select className="filter-select" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="all">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select className="filter-select" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="all">All Years</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="filter-actions">
          {(searchTerm || filterServer !== 'all' || filterMonth !== 'all' || filterYear !== 'all') && (
            <button className="btn-clear" onClick={resetFilters}>✕ Clear Filters</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            minHeight: '400px',
            gap: '20px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '6px solid #19475220',
              borderTop: '6px solid #194752',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{
              color: '#194752',
              fontSize: '16px',
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              margin: 0,
              letterSpacing: '0.5px'
            }}>
              LOADING PAID RECORDS...
            </p>
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
              Fetching from Server 4 → used_or_numbers
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>📭</p>
            <p>
              {paidRecords.length === 0
                ? 'No paid records found in Server 4 → used_or_numbers collection.'
                : 'No records match your filters. Try adjusting your search.'}
            </p>
          </div>
        ) : (
          <>
            <table className="bills-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>OR Number</th>
                  <th>Server</th>
                  <th>Consumer Name</th>
                  <th>Address</th>
                  <th>Period</th>
                  <th>Bill No.</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Paid At</th>
                  <th>Paid By</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentPageData().map((record, index) => {
                  const globalIndex = (currentPage - 1) * rowsPerPage + index + 1;
                  const period = `${record.month || 'N/A'} ${record.year || ''}`;

                  return (
                    <tr key={record.id}>
                      <td style={{ color: '#64748B', fontSize: '13px', fontWeight: '600' }}>
                        {globalIndex}
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'JetBrains Mono, Inter, sans-serif',
                          fontSize: '14px',
                          fontWeight: '800',
                          color: '#7C3AED',
                          background: '#F5F3FF',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #DDD6FE',
                          whiteSpace: 'nowrap'
                        }}>
                          {record.orNumber || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: `${getServerColor(record.serverSource)}22`,
                          color: getServerColor(record.serverSource),
                          whiteSpace: 'nowrap'
                        }}>
                          {getServerLabel(record.serverSource).toUpperCase()}
                        </span>
                      </td>
                      <td className="name-cell">{record.consumerName || 'N/A'}</td>
                      <td className="name-cell">{record.consumerAddress || 'N/A'}</td>
                      <td className="name-cell">{period.trim() || 'N/A'}</td>
                      <td className="name-cell">{record.billNumber || 'N/A'}</td>
                      <td className="name-cell" style={{ textAlign: 'right', color: '#16A34A', fontSize: '14px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="name-cell" style={{ fontSize: '12px', color: '#64748B' }}>
                        {formatDateTime(record.usedAt || record.archivedAt)}
                      </td>
                      <td className="name-cell" style={{ fontSize: '12px', color: '#64748B' }}>
                        {record.usedBy || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{
                  background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
                  borderTop: '3px solid #16A34A'
                }}>
                  <td colSpan="7" style={{
                    padding: '16px 20px',
                    textAlign: 'right',
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#166534',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    OVERALL TOTAL ({filteredRecords.length} records):
                  </td>
                  <td style={{
                    padding: '16px 20px',
                    textAlign: 'right',
                    fontSize: '20px',
                    fontWeight: '900',
                    color: '#16A34A',
                    fontFamily: 'JetBrains Mono, monospace',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatCurrency(filteredRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0))}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>

            {/* Pagination */}
            {filteredRecords.length > rowsPerPage && (
              <div className="pagination-container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ color: '#64748B', fontSize: '14px', fontWeight: '500' }}>
                  {getPaginationInfo()}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      background: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                      color: currentPage === 1 ? '#94A3B8' : '#0F172A',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    <ChevronLeftIcon width={18} height={18} color={currentPage === 1 ? '#94A3B8' : '#0F172A'} />
                    Previous
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                          return <span key={`ellipsis-${index}`} style={{ padding: '8px 4px', color: '#94A3B8', fontSize: '14px' }}>…</span>;
                        }

                        const isActive = page === current;
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              border: isActive ? '2px solid #194752' : '1px solid #E2E8F0',
                              background: isActive ? '#194752' : '#FFFFFF',
                              color: isActive ? '#FFFFFF' : '#0F172A',
                              cursor: 'pointer',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '13px',
                              fontWeight: isActive ? '600' : '500',
                              minWidth: '40px'
                            }}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      background: currentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                      color: currentPage === totalPages ? '#94A3B8' : '#0F172A',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    Next
                    <ChevronRightIcon width={18} height={18} color={currentPage === totalPages ? '#94A3B8' : '#0F172A'} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Paid;