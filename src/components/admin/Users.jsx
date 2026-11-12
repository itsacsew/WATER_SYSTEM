// src/components/admin/Users.jsx
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, doc, writeBatch, setDoc } from 'firebase/firestore';
import { db, getDbByServer, getServerLabel, SERVER_CONFIGS } from '../../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Users.css';

// ============================================================
// ICONS
// ============================================================
const UserIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
    <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 14C7 14 4 16.5 4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19C20 16.5 17 14 12 14Z" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const PesoIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M7 15V4C7 3.44772 7.44772 3 8 3H12C15.3137 3 18 5.68629 18 9C18 12.3137 15.3137 15 12 15H7Z" stroke={color} strokeWidth="1.5"/>
    <path d="M4 7H20M4 11H20M7 15V21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const ImportIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M12 3V15M12 15L7 10M12 15L17 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const ExportIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M12 15V3M12 3L7 8M12 3L17 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const PrinterIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M6 9V3H18V9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M6 18H4C2.89543 18 2 17.1046 2 16V11C2 9.89543 2.89543 9 4 9H20C21.1046 9 22 9.89543 22 11V16C22 17.1046 21.1046 18 20 18H18" stroke={color} strokeWidth="1.8"/>
    <rect x="6" y="14" width="12" height="8" stroke={color} strokeWidth="1.8"/>
  </svg>
);
const AddUserIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5"/>
    <path d="M9 14C4.5 14 2 16.5 2 19C2 20.1046 2.89543 21 4 21H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M19 14V22M15 18H23" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const ServerIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
    <rect x="2" y="3" width="20" height="7" rx="1.5" stroke={color} strokeWidth="1.5"/>
    <rect x="2" y="14" width="20" height="7" rx="1.5" stroke={color} strokeWidth="1.5"/>
    <circle cx="6" cy="6.5" r="1" fill={color}/>
    <circle cx="6" cy="17.5" r="1" fill={color}/>
  </svg>
);
const EyeIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M2 12C2 12 6 5 12 5C18 5 22 12 22 12C22 12 18 19 12 19C6 19 2 12 2 12Z" stroke={color} strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5"/>
  </svg>
);
const EyeOffIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M2 2L22 22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6.7 6.7C3.8 8.4 2 12 2 12C2 12 6 19 12 19C14.2 19 16.1 18.2 17.6 17.1" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 10C9.4 10.6 9 11.3 9 12C9 13.7 10.3 15 12 15C12.7 15 13.4 14.6 14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M20.3 15C21.5 13.2 22 12 22 12C22 12 18 5 12 5C11.5 5 11 5.1 10.5 5.2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const SearchIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8"/>
    <path d="M20 20L17 17" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const RefreshIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none">
    <path d="M20 11C20 6.6 16.4 3 12 3C8.7 3 5.8 5 4.5 7.9M4 4V8H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 13C4 17.4 7.6 21 12 21C15.3 21 18.2 19 19.5 16.1M20 20V16H16" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================================
// MONTH ORDER
// ============================================================
const MONTH_ORDER = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

// ============================================================
// MAIN COMPONENT
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

  const [selectedServer, setSelectedServer] = useState('server1');
  const [serverBills, setServerBills] = useState([]);
  const [serverBillsLoading, setServerBillsLoading] = useState(false);
  // ✅ Track which server button is loading (to show spinner only on clicked button)
  const [loadingServerKey, setLoadingServerKey] = useState(null);

  const [stats, setStats] = useState({ totalUsers: 0, adminCount: 0, userCount: 0, staffCount: 0 });

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMonth, setPrintMonth] = useState('');
  const [printYear, setPrintYear] = useState('');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importServer, setImportServer] = useState('server1');
  const [importMonth, setImportMonth] = useState('');
  const [importYear, setImportYear] = useState('');
  const [importLocation, setImportLocation] = useState('');
  const [availableImportLocations, setAvailableImportLocations] = useState([]);
  const [availableImportMonths, setAvailableImportMonths] = useState([]);
  const [availableImportYears, setAvailableImportYears] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importOptionsLoading, setImportOptionsLoading] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportServer, setExportServer] = useState('server1');
  const [exportMonth, setExportMonth] = useState('');
  const [exportLocation, setExportLocation] = useState('');
  const [availableExportLocations, setAvailableExportLocations] = useState([]);
  const [availableExportMonths, setAvailableExportMonths] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportPreviewData, setExportPreviewData] = useState([]);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportOptionsLoading, setExportOptionsLoading] = useState(false);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'user' });
  const [addUserErrors, setAddUserErrors] = useState({});
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showAddConfirmPassword, setShowAddConfirmPassword] = useState(false);

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { fetchServerBills(selectedServer); }, [selectedServer]);
  useEffect(() => { filterUsers(); }, [users, searchTerm, filterRole]);

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

  // ✅ UPDATED: Accepts a serverKey so we know which button to show spinner on
  const fetchServerBills = async (serverKey) => {
    setServerBillsLoading(true);
    setLoadingServerKey(serverKey);
    try {
      const targetDb = getDbByServer(serverKey);
      const snap = await getDocs(collection(targetDb, 'bills'));
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setServerBills(data);
    } catch (e) {
      console.error(e);
      setServerBills([]);
    }
    setServerBillsLoading(false);
    setLoadingServerKey(null);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      const data = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      setUsers(data);
      setFilteredUsers(data);
      setStats({
        totalUsers: data.length,
        adminCount: data.filter(u => u.role === 'admin').length,
        userCount: data.filter(u => u.role === 'user' || !u.role).length,
        staffCount: data.filter(u => u.role === 'staff').length,
      });
    } catch (e) {
      console.error(e);
      toast.error('Error loading users');
    }
    setLoading(false);
  };

  const filterUsers = () => {
    let f = [...users];
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      f = f.filter(u => u.displayName?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t));
    }
    if (filterRole !== 'all') f = f.filter(u => (u.role || 'user') === filterRole);
    setFilteredUsers(f);
  };

  const handleServerClick = (key) => {
    if (key === selectedServer) return; // already selected
    setSelectedServer(key);
  };

  // ============ PRINT ============
  const getAvailablePrintMonths = () => {
    const s = new Set();
    serverBills.forEach(b => { if (b.month && b.month !== 'N/A') s.add(String(b.month).toUpperCase()); });
    return Array.from(s).sort((a, b) => MONTH_ORDER.indexOf(a) - MONTH_ORDER.indexOf(b));
  };
  const getAvailablePrintYears = () => {
    const s = new Set();
    serverBills.forEach(b => { if (b.year && b.year !== 'N/A') s.add(String(b.year)); });
    return Array.from(s).sort((a, b) => Number(b) - Number(a));
  };

  const openPrintModal = () => {
    if (serverBills.length === 0) { toast.error(`No bills to print!`); return; }
    setPrintMonth(''); setPrintYear(''); setShowPrintModal(true);
  };

  const handleConfirmPrint = () => {
    if (!printMonth || !printYear) { toast.error('Please select Month and Year'); return; }
    const filtered = serverBills.filter(b =>
      String(b.month || '').toUpperCase() === printMonth.toUpperCase() &&
      String(b.year || '') === String(printYear)
    );
    if (filtered.length === 0) { toast.error('No bills found'); return; }

    const isDef = (r) => { if (!r && r !== 0) return false; const s = String(r).toUpperCase().trim(); return s === 'DEFECTIVE' || s === 'D' || s === 'DEF' || s.includes('DEFECTIVE'); };
    const isNA = (r) => { if (!r && r !== 0) return false; const s = String(r).toUpperCase().trim(); return s === 'N/A' || s === 'NA' || s === 'NULL' || s === '-'; };
    const isCut = (b) => {
      const s = String(b.status || '').toUpperCase().trim();
      if (s === 'CUTOFF' || s === 'CUT-OFF' || s === 'CUT OFF') return true;
      return isNA(b.presentReading) && isNA(b.previousReading);
    };
    const fmtD = (d) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return d; } };

    const sorted = [...filtered].sort((a, b) => (parseInt(String(a.billNumber||'0').replace(/\D/g,''),10)||0) - (parseInt(String(b.billNumber||'0').replace(/\D/g,''),10)||0));

    const rows = sorted.map((b, i) => {
      const c = isCut(b);
      const pD = isDef(b.presentReading);
      const vD = isDef(b.previousReading);
      return `<tr style="background:${i%2?'#F8FAFC':'#FFF'}">
        <td style="padding:8px;border:1px solid #CBD5E1;font-weight:600">${i+1}</td>
        <td style="padding:8px;border:1px solid #CBD5E1;font-weight:bold;white-space:nowrap">${b.billNumber||'N/A'}</td>
        <td style="padding:8px;border:1px solid #CBD5E1">${b.consumerName||'N/A'}</td>
        <td style="padding:8px;border:1px solid #CBD5E1;text-align:center;color:${pD?'#DC2626':'#000'}">${c?'N/A':(pD?'DEFECTIVE':(b.presentReading??'0'))}</td>
        <td style="padding:8px;border:1px solid #CBD5E1;text-align:center;color:${vD?'#DC2626':'#000'}">${c?'N/A':(vD?'DEFECTIVE':(b.previousReading??'0'))}</td>
        <td style="padding:8px;border:1px solid #CBD5E1;text-align:center;font-weight:bold;background:#F0FDF4">${c?'N/A':(b.consumption??'0')}</td>
        <td style="padding:8px;border:1px solid #CBD5E1;text-align:center;font-family:monospace;font-weight:bold">${b.paymentCode||'—'}</td>
        <td style="padding:8px;border:1px solid #CBD5E1;text-align:center;font-size:11px">${b.paidAt?fmtD(b.paidAt):'—'}</td>
      </tr>`;
    }).join('');

    const locSet = new Set();
    filtered.forEach(b => { if (b.location && b.location !== 'N/A') locSet.add(String(b.location).trim()); });
    const locDisplay = locSet.size ? Array.from(locSet).sort().join(', ') : 'N/A';
    const paidCount = sorted.filter(b => b.status === 'paid').length;

    const html = `<!DOCTYPE html><html><head><title>Bills Report</title>
    <style>* { margin:0; padding:0; box-sizing:border-box; } @page { size:A4 landscape; margin:10mm; }
    body { font-family:'Times New Roman',serif; padding:20px; color:#000; }
    .container { max-width:1200px; margin:0 auto; }
    .header { text-align:center; padding-bottom:14px; border-bottom:3px double #000; margin-bottom:20px; }
    .header h1 { font-size:25px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; }
    .header .municipality { font-size:17px; font-style:italic; margin:4px 0 8px; }
    .header h2 { font-size:20px; font-weight:bold; letter-spacing:3px; text-transform:uppercase; }
    .header .meta-line { font-size:19px; font-weight:bold; letter-spacing:1.5px; margin-top:6px; }
    .header .location-line { font-size:18px; font-weight:bold; letter-spacing:1px; margin-top:4px; text-transform:uppercase; }
    .header .info { font-size:16px; margin-top:8px; font-style:italic; }
    table { width:100%; border-collapse:collapse; font-size:16px; }
    thead th { padding:10px 8px; text-align:left; font-weight:bold; text-transform:uppercase; border:2px solid #000; white-space:nowrap; }
    .summary { margin-top:20px; padding-top:14px; border-top:2px solid #000; display:flex; justify-content:space-between; font-size:17px; font-weight:bold; text-transform:uppercase; letter-spacing:1px; }
    .footer { margin-top:30px; padding-top:16px; border-top:1px dashed #94A3B8; text-align:center; font-size:15px; font-style:italic; }
    .controls { text-align:center; padding:16px; background:#f8fafc; border-bottom:1px solid #e2e8f0; margin-bottom:20px; }
    .controls button { padding:10px 28px; margin:0 6px; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
    .print-btn { background:#111827; color:white; } .close-btn { background:#e2e8f0; color:#1e293b; }
    @media print { .controls { display:none; } body { padding:0; } }
    </style></head><body>
    <div class="controls"><button class="print-btn" onclick="window.print()">🖨️ Print</button><button class="close-btn" onclick="window.close()">Close</button></div>
    <div class="container"><div class="header">
    <h1>LGU LILOAN WATER SYSTEM</h1><p class="municipality">Municipality of Liloan, Southern Leyte</p>
    <h2>BILLS REPORT — ${getServerLabel(selectedServer).toUpperCase()}</h2>
    <div class="meta-line">MONTH: ${printMonth} | YEAR: ${printYear}</div>
    <div class="location-line">LOCATION: ${locDisplay}</div>
    <p class="info">Generated: ${new Date().toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})} | Total Records: ${sorted.length}</p></div>
    <table><thead><tr><th>#</th><th>WSIN</th><th>Consumer Name</th><th style="text-align:center">Present Reading</th><th style="text-align:center">Previous Reading</th><th style="text-align:center">Consumption (m³)</th><th style="text-align:center">OR Number</th><th style="text-align:center">Date Paid</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="summary"><div>Total Records: ${sorted.length}</div><div>Paid: ${paidCount}</div><div>Unpaid: ${sorted.length-paidCount}</div></div>
    <div class="footer">This is a system-generated report. No signature required.</div></div>
    <script>setTimeout(()=>window.print(),500);</script></body></html>`;

    const w = window.open('', '_blank', 'width=1400,height=900');
    if (!w) { toast.error('Please allow popups'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    toast.success(`🖨️ Print preview opened!`);
    setShowPrintModal(false);
  };

  // ============ IMPORT / EXPORT ============
  const extractImportOptions = (data) => {
    const l = new Set(), m = new Set(), y = new Set();
    data.forEach(b => {
      if (b.location && b.location !== 'N/A') l.add(b.location);
      if (b.month && b.month !== 'N/A') m.add(b.month);
      if (b.year && b.year !== 'N/A') y.add(b.year.toString());
    });
    return { locations: Array.from(l).sort(), months: Array.from(m).sort((a,b)=>MONTH_ORDER.indexOf(a)-MONTH_ORDER.indexOf(b)), years: Array.from(y).sort((a,b)=>Number(b)-Number(a)) };
  };
  const extractExportOptions = (data) => {
    const l = new Set(), m = new Set();
    data.forEach(i => { if (i.location && i.location !== 'N/A') l.add(i.location); if (i.month && i.month !== 'N/A') m.add(i.month); });
    return { locations: Array.from(l).sort(), months: Array.from(m).sort((a,b)=>MONTH_ORDER.indexOf(a)-MONTH_ORDER.indexOf(b)) };
  };

  const openImportModalForServer = async (key) => {
    setImportServer(key); setImportMonth(''); setImportYear(''); setImportLocation('');
    setImportPreviewData([]); setShowImportPreview(false);
    setImportOptionsLoading(true);
    try {
      const dbRef = getDbByServer(key);
      const snap = await getDocs(collection(dbRef, 'bills'));
      const data = []; snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      const opts = extractImportOptions(data);
      setAvailableImportLocations(opts.locations);
      setAvailableImportMonths(opts.months);
      setAvailableImportYears(opts.years);
    } catch (e) { toast.error('Error loading options'); }
    setImportOptionsLoading(false);
    setShowImportModal(true);
  };

  const previewImport = async () => {
    if (!importMonth || !importYear || !importLocation) { toast.error('Select all fields'); return; }
    setImportLoading(true);
    try {
      const dbRef = getDbByServer(importServer);
      const q = query(collection(dbRef, 'bills'), where('month','==',importMonth), where('year','==',importYear), where('location','==',importLocation));
      const snap = await getDocs(q);
      const data = []; snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      if (data.length === 0) { toast.error('No bills found'); setImportLoading(false); return; }
      setImportPreviewData(data); setShowImportPreview(true);
      toast.success(`Found ${data.length} bills`);
    } catch (e) { toast.error(e.message); }
    setImportLoading(false);
  };

  const confirmImport = async () => {
    if (!importPreviewData.length) return;
    setImportLoading(true);
    try {
      const dbRef = getDbByServer(importServer);
      const collRef = collection(dbRef, 'import');
      let batch = writeBatch(dbRef), bc = 0, ok = 0;
      for (let i = 0; i < importPreviewData.length; i++) {
        const { id, ...data } = importPreviewData[i];
        batch.set(doc(collRef), {
          ...data, importedAt: new Date().toISOString(), importedBy: user?.email || 'Unknown',
          importedByUid: user?.uid || 'unknown', originalBillId: id,
          importBatch: `${importMonth}_${importYear}_${importLocation}_${Date.now()}`,
          importMonth, importYear, importLocation, sourceCollection: 'bills', sourceServer: importServer
        });
        ok++; bc++;
        if (bc >= 500) { await batch.commit(); batch = writeBatch(dbRef); bc = 0; }
      }
      if (bc > 0) await batch.commit();
      toast.success(`✅ Imported ${ok} bills!`);
      setShowImportModal(false);
    } catch (e) { toast.error('Error: ' + e.message); }
    setImportLoading(false);
  };

  const openExportModalForServer = async (key) => {
    setExportServer(key); setExportMonth(''); setExportLocation('');
    setExportPreviewData([]); setShowExportPreview(false);
    setExportOptionsLoading(true);
    try {
      const dbRef = getDbByServer(key);
      const snap = await getDocs(collection(dbRef, 'import'));
      const data = []; snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      const opts = extractExportOptions(data);
      setAvailableExportLocations(opts.locations);
      setAvailableExportMonths(opts.months);
    } catch (e) { toast.error('Error loading options'); }
    setExportOptionsLoading(false);
    setShowExportModal(true);
  };

  const previewExport = async () => {
    if (!exportMonth || !exportLocation) { toast.error('Select Month and Location'); return; }
    setExportLoading(true);
    try {
      const dbRef = getDbByServer(exportServer);
      const q = query(collection(dbRef, 'import'), where('month','==',exportMonth), where('location','==',exportLocation));
      const snap = await getDocs(q);
      const data = []; snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      if (data.length === 0) { toast.error('No imported bills found'); setExportLoading(false); return; }
      setExportPreviewData(data); setShowExportPreview(true);
      toast.success(`Found ${data.length} imported bills`);
    } catch (e) { toast.error(e.message); }
    setExportLoading(false);
  };

  const confirmExport = async () => {
    if (!exportPreviewData.length) return;
    setExportLoading(true);
    try {
      const dbRef = getDbByServer(exportServer);
      const billsRef = collection(dbRef, 'bills');
      const year = exportPreviewData[0]?.year || new Date().getFullYear().toString();

      const existingSnap = await getDocs(query(billsRef, where('month','==',exportMonth), where('year','==',year), where('location','==',exportLocation)));
      const existingIds = []; existingSnap.forEach(d => existingIds.push(d.id));
      let dbatch = writeBatch(dbRef), dbc = 0;
      for (const id of existingIds) {
        dbatch.delete(doc(dbRef, 'bills', id)); dbc++;
        if (dbc >= 500) { await dbatch.commit(); dbatch = writeBatch(dbRef); dbc = 0; }
      }
      if (dbc > 0) await dbatch.commit();

      let ok = 0, bc = 0;
      let batch = writeBatch(dbRef);
      const importIds = [];
      for (let i = 0; i < exportPreviewData.length; i++) {
        const { id, ...data } = exportPreviewData[i];
        importIds.push(id);
        const { importedAt, importedBy, importedByUid, originalBillId, importBatch, importMonth: im, importYear: iy, importLocation: il, sourceCollection, sourceServer, ...clean } = data;
        batch.set(doc(billsRef), {
          ...clean, exportedAt: new Date().toISOString(), exportedFrom: id,
          exportedBy: user?.email || 'Unknown', exportedByUid: user?.uid || 'unknown',
          exportBatch: `${exportMonth}_${exportLocation}_${Date.now()}`, exportMonth, exportLocation,
          createdAt: data.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
          isReplacement: true, replacedAt: new Date().toISOString(), replacedFrom: id,
          replacedMonth: exportMonth, replacedYear: year, replacedLocation: exportLocation, serverSource: exportServer
        });
        ok++; bc++;
        if (bc >= 500) { await batch.commit(); batch = writeBatch(dbRef); bc = 0; }
      }
      if (bc > 0) await batch.commit();

      let dbatch2 = writeBatch(dbRef), dbc2 = 0;
      for (const iid of importIds) {
        dbatch2.delete(doc(dbRef, 'import', iid)); dbc2++;
        if (dbc2 >= 500) { await dbatch2.commit(); dbatch2 = writeBatch(dbRef); dbc2 = 0; }
      }
      if (dbc2 > 0) await dbatch2.commit();

      toast.success(`✅ Replaced with ${ok} bills!`);
      setShowExportModal(false);
      fetchServerBills(selectedServer);
    } catch (e) { toast.error('Error: ' + e.message); }
    setExportLoading(false);
  };

  // ============ ADD USER ============
  const openAddUserModal = () => {
    setAddUserForm({ fullName: '', email: '', password: '', confirmPassword: '', role: 'user' });
    setAddUserErrors({}); setShowAddPassword(false); setShowAddConfirmPassword(false);
    setShowAddUserModal(true);
  };

  const checkReq = (regex) => regex.test(addUserForm.password);

  const validateAddUser = () => {
    const e = {};
    if (!addUserForm.fullName.trim()) e.fullName = 'Full name required';
    if (!addUserForm.email.trim()) e.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(addUserForm.email)) e.email = 'Invalid email';
    if (!addUserForm.password) e.password = 'Password required';
    else if (addUserForm.password.length < 14) e.password = 'Min 14 characters';
    else if (!/[a-z]/.test(addUserForm.password)) e.password = 'Need lowercase';
    else if (!/[A-Z]/.test(addUserForm.password)) e.password = 'Need uppercase';
    else if (!/[0-9]/.test(addUserForm.password)) e.password = 'Need number';
    if (!addUserForm.confirmPassword) e.confirmPassword = 'Confirm password';
    else if (addUserForm.password !== addUserForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setAddUserErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddUserSubmit = async (ev) => {
    ev.preventDefault();
    if (!validateAddUser()) return;
    setAddUserLoading(true);
    try {
      const emailCheck = await getDocs(query(collection(db, 'users'), where('email', '==', addUserForm.email)));
      if (!emailCheck.empty) { toast.error('Email already exists!'); setAddUserLoading(false); return; }
      const cred = await createUserWithEmailAndPassword(auth, addUserForm.email, addUserForm.password);
      const uid = cred.user.uid;
      const ts = new Date().toISOString();
      await setDoc(doc(db, 'users', uid), {
        createdAt: ts, displayName: addUserForm.fullName, email: addUserForm.email,
        lastLogin: ts, preferences: { notifications: true, theme: 'light' },
        role: addUserForm.role, uid, updatedAt: ts
      });
      toast.success(`✅ User "${addUserForm.fullName}" created!`);
      await fetchUsers();
      setShowAddUserModal(false);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') toast.error('Email already in use!');
      else if (err.code === 'auth/weak-password') toast.error('Password too weak!');
      else toast.error('Error: ' + err.message);
    }
    setAddUserLoading(false);
  };

  // ============ HELPERS ============
  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    let d;
    if (ts.toDate) d = ts.toDate();
    else if (ts.seconds) d = new Date(ts.seconds * 1000);
    else d = new Date(ts);
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const getRoleBadge = (r) => ({ admin: { label: 'Admin', class: 'role-admin' }, user: { label: 'User', class: 'role-user' }, staff: { label: 'Staff', class: 'role-staff' } }[r] || { label: 'User', class: 'role-user' });
  const getInitials = (n, e) => n ? n.charAt(0).toUpperCase() : (e?.charAt(0).toUpperCase() || 'U');
  const getStatusDot = (ts) => {
    if (!ts) return 'offline';
    let d;
    if (ts.toDate) d = ts.toDate(); else if (ts.seconds) d = new Date(ts.seconds * 1000); else d = new Date(ts);
    const h = (new Date() - d) / 3600000;
    if (h < 2) return 'online';
    if (h < 24) return 'recent';
    return 'offline';
  };
  const getStatusLabel = (s) => ({ online: 'Online', recent: 'Recent', offline: 'Offline' }[s] || 'Offline');

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p style={{ color: '#374151', marginTop: 16 }}>Loading users...</p>
      </div>
    );
  }

  const importServerConfig = SERVER_CONFIGS.find(s => s.key === importServer);
  const exportServerConfig = SERVER_CONFIGS.find(s => s.key === exportServer);
  const currentServerConfig = SERVER_CONFIGS.find(s => s.key === selectedServer);
  const availablePrintMonths = getAvailablePrintMonths();
  const availablePrintYears = getAvailablePrintYears();
  const filteredPrintCount = printMonth && printYear ? serverBills.filter(b => String(b.month||'').toUpperCase() === printMonth.toUpperCase() && String(b.year||'') === String(printYear)).length : 0;
  const previewLocations = (() => {
    if (!printMonth || !printYear) return '';
    const s = new Set();
    serverBills.filter(b => String(b.month||'').toUpperCase() === printMonth.toUpperCase() && String(b.year||'') === String(printYear)).forEach(b => { if (b.location && b.location !== 'N/A') s.add(String(b.location).trim()); });
    return s.size ? Array.from(s).sort().join(', ') : 'N/A';
  })();

  return (
    <div className="users-dashboard">

      {/* ═══════════════════════════════════════════ */}
      {/* HEADER                                        */}
      {/* ═══════════════════════════════════════════ */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <h1>User Management</h1>
          <p>Manage accounts and permissions across all servers</p>
        </div>

        <div className="dashboard-header-right">
          <button className="btn btn-outline" onClick={fetchUsers}>
            <RefreshIcon size={16} color="#111827" />
            <span>Refresh</span>
          </button>
          <button className="btn btn-outline" onClick={openPrintModal} disabled={!serverBills.length}>
            <PrinterIcon size={16} color="#111827" />
            <span>Print</span>
          </button>
          <button className="btn btn-primary" onClick={openAddUserModal}>
            <AddUserIcon size={16} color="#FFFFFF" />
            <span>Add User</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════ */}
      {/* 3-COLUMN LAYOUT                              */}
      {/* ═══════════════════════════════════════════ */}
      <div className="users-layout-3col">

        {/* ══════════ LEFT COLUMN — IMPORT DATA ══════════ */}
        <aside className="users-import-panel">
          <div className="users-panel-title">
            <ImportIcon size={16} color="#111827" />
            <span>IMPORT DATA</span>
          </div>
          <div className="users-panel-body">
            {SERVER_CONFIGS.map(s => (
              <button
                key={`i-${s.key}`}
                className="users-import-btn"
                onClick={() => openImportModalForServer(s.key)}
              >
                <ImportIcon size={14} color="#FFFFFF" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ══════════ CENTER COLUMN ══════════ */}
        <main className="users-center-col">

          {/* ─────── SERVER BUTTONS ROW (with loading indicator) ─────── */}
          <div className="users-server-row">
            {SERVER_CONFIGS.map((server, idx) => {
              const isActive = selectedServer === server.key;
              const isLoading = loadingServerKey === server.key;
              return (
                <button
                  key={server.key}
                  onClick={() => handleServerClick(server.key)}
                  disabled={serverBillsLoading}
                  className={`users-server-btn ${isActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <span className="users-server-spinner"></span>
                      <span>LOADING...</span>
                    </>
                  ) : (
                    <span>{server.label.toUpperCase()}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ─────── ACTIVE SERVER INFO BAR (black, matching image) ─────── */}
          <div className="users-server-info-bar">
            <div className="users-info-item">
              <span className="users-info-label">CURRENTLY ACTIVE</span>
              <span className="users-info-value">{getServerLabel(selectedServer)}</span>
            </div>
            <div className="users-info-item users-info-item-right">
              <span className="users-info-label">BILLS LOADED</span>
              <span className="users-info-value">{serverBillsLoading ? '...' : serverBills.length}</span>
            </div>
          </div>

          {/* ─────── STATS ROW ─────── */}
          <div className="users-stats-row">
            <div className="users-stat-box">
              <span className="users-stat-num">{stats.totalUsers}</span>
              <span className="users-stat-lbl">TOTAL</span>
            </div>
            <div className="users-stat-box">
              <span className="users-stat-num">{stats.adminCount}</span>
              <span className="users-stat-lbl">ADMIN</span>
            </div>
            <div className="users-stat-box">
              <span className="users-stat-num">{stats.userCount}</span>
              <span className="users-stat-lbl">USER</span>
            </div>
            <div className="users-stat-box">
              <span className="users-stat-num">{stats.staffCount}</span>
              <span className="users-stat-lbl">STAFF</span>
            </div>
          </div>

          {/* ─────── MAIN CONTENT PANEL (User Directory) ─────── */}
          <div className="users-main-panel">
            <div className="users-toolbar">
              <div className="users-search-bar">
                <SearchIcon size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="users-search-clear" onClick={() => setSearchTerm('')}>✕</button>
                )}
              </div>

              <div className="users-filter-chips">
                {[
                  { v: 'all', l: 'ALL' },
                  { v: 'admin', l: 'ADMIN' },
                  { v: 'user', l: 'USER' },
                  { v: 'staff', l: 'STAFF' },
                ].map(r => (
                  <button
                    key={r.v}
                    className={`users-chip ${filterRole === r.v ? 'active' : ''}`}
                    onClick={() => setFilterRole(r.v)}
                  >
                    {r.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="users-table-wrap">
              {filteredUsers.length === 0 ? (
                <div className="users-empty">
                  <div className="users-empty-icon">👥</div>
                  <p className="users-empty-title">No users found</p>
                  <p className="users-empty-sub">
                    {searchTerm ? 'Try a different search.' : 'No registered users yet.'}
                  </p>
                </div>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Bills</th>
                      <th>Paid</th>
                      <th>Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => {
                      const role = getRoleBadge(u.role || 'user');
                      const status = getStatusDot(u.lastLogin);
                      const totalBills = billsCount[u.uid] || 0;
                      const paidBills = paidBillsCount[u.uid] || 0;
                      return (
                        <tr key={u.id}>
                          <td>
                            <div className="users-table-user">
                              <div className="users-table-avatar">
                                {getInitials(u.displayName, u.email)}
                              </div>
                              <span className="users-table-name">{u.displayName || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="users-table-email">{u.email || 'N/A'}</td>
                          <td>
                            <span className={`users-role-badge ${role.class}`}>{role.label}</span>
                          </td>
                          <td>
                            <span className={`users-status-badge ${status}`}>
                              {getStatusLabel(status)}
                            </span>
                          </td>
                          <td className="users-table-num">{totalBills}</td>
                          <td className="users-table-num" style={{ color: '#16A34A' }}>{paidBills}</td>
                          <td className="users-table-date">{formatDate(u.lastLogin)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>

        {/* ══════════ RIGHT COLUMN — REPLACE BILLS ══════════ */}
        <aside className="users-replace-panel">
          <div className="users-panel-title">
            <ExportIcon size={16} color="#111827" />
            <span>REPLACE BILLS</span>
          </div>
          <div className="users-panel-body">
            {SERVER_CONFIGS.map(s => (
              <button
                key={`r-${s.key}`}
                className="users-replace-btn"
                onClick={() => openExportModalForServer(s.key)}
              >
                <ExportIcon size={14} color="#FFFFFF" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER                                        */}
      {/* ═══════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════ */}
      {/* MODALS (unchanged)                            */}
      {/* ═══════════════════════════════════════════ */}

      {/* PRINT MODAL */}
      {showPrintModal && (
        <div className="modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PrinterIcon size={20} color="#111827" /> Print Bills Report
              </h2>
              <button className="close-btn" onClick={() => setShowPrintModal(false)}>✕</button>
            </div>

            <div style={{ padding: '20px 8px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: '#F3F4F6', border: '2px solid #111827', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#111827' }}>
                  🗄️ {getServerLabel(selectedServer).toUpperCase()}
                  <span style={{ fontSize: 11, opacity: 0.7 }}>({serverBills.length} bills)</span>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#111827', fontSize: 12, textTransform: 'uppercase' }}>Month *</label>
                  <select value={printMonth} onChange={e => setPrintMonth(e.target.value)} className="modal-input" style={{ fontWeight: 700 }}>
                    <option value="">Select Month</option>
                    {availablePrintMonths.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, marginBottom: 8, color: '#111827', fontSize: 12, textTransform: 'uppercase' }}>Year *</label>
                  <select value={printYear} onChange={e => setPrintYear(e.target.value)} className="modal-input" style={{ fontWeight: 700 }}>
                    <option value="">Select Year</option>
                    {availablePrintYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {printMonth && printYear && (
                <div style={{ padding: 16, background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '2px solid #86EFAC', borderRadius: 12, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#166534', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>Bills to be printed</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#16A34A', margin: '4px 0 8px', fontFamily: 'JetBrains Mono, monospace' }}>{filteredPrintCount}</p>
                  <div style={{ paddingTop: 8, borderTop: '1px dashed #86EFAC', fontSize: 11, color: '#166534', fontWeight: 600 }}>
                    📍 {previewLocations}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowPrintModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmPrint}
                disabled={!printMonth || !printYear}
                style={{ flex: 1 }}
              >
                <PrinterIcon size={16} color="#FFF" /> PRINT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 880 }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AddUserIcon size={22} color="#111827" /> Create New User
              </h2>
              <button className="close-btn" onClick={() => setShowAddUserModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddUserSubmit}>
              <div className="form-two-column">
                <div className="form-column">
                  <div className="form-section-label">
                    <span className="form-section-icon">👤</span> PERSONAL INFORMATION
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#111827', fontSize: 13 }}>
                      Full Name <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input type="text" placeholder="Enter full name" value={addUserForm.fullName} onChange={e => setAddUserForm({ ...addUserForm, fullName: e.target.value })}
                      style={{ width: '100%', padding: '12px 14px', background: '#F9FAFB', border: `2px solid ${addUserErrors.fullName ? '#DC2626' : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    {addUserErrors.fullName && <span style={{ color: '#DC2626', fontSize: 12, marginTop: 4, display: 'block' }}>{addUserErrors.fullName}</span>}
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#111827', fontSize: 13 }}>
                      Email Address <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input type="email" placeholder="name@company.com" value={addUserForm.email} onChange={e => setAddUserForm({ ...addUserForm, email: e.target.value })}
                      style={{ width: '100%', padding: '12px 14px', background: '#F9FAFB', border: `2px solid ${addUserErrors.email ? '#DC2626' : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    {addUserErrors.email && <span style={{ color: '#DC2626', fontSize: 12, marginTop: 4, display: 'block' }}>{addUserErrors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#111827', fontSize: 13 }}>
                      Role <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <select value={addUserForm.role} onChange={e => setAddUserForm({ ...addUserForm, role: e.target.value })}
                      style={{ width: '100%', padding: '12px 14px', background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
                      <option value="user">👤 User</option>
                      <option value="admin">👑 Administrator</option>
                      <option value="staff">👔 Staff</option>
                    </select>
                  </div>
                </div>

                <div className="form-column">
                  <div className="form-section-label">
                    <span className="form-section-icon">🔒</span> SECURITY
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#111827', fontSize: 13 }}>
                      Password <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input type={showAddPassword ? 'text' : 'password'} placeholder="Strong password" value={addUserForm.password}
                        onChange={e => setAddUserForm({ ...addUserForm, password: e.target.value })}
                        style={{ width: '100%', padding: '12px 44px 12px 14px', background: '#F9FAFB', border: `2px solid ${addUserErrors.password ? '#DC2626' : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                      <button type="button" onClick={() => setShowAddPassword(!showAddPassword)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                        {showAddPassword ? <EyeIcon color="#6B7280" /> : <EyeOffIcon color="#6B7280" />}
                      </button>
                    </div>
                    {addUserErrors.password && <span style={{ color: '#DC2626', fontSize: 12, marginTop: 4, display: 'block' }}>{addUserErrors.password}</span>}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 8 }}>
                      {[
                        { ok: checkReq(/[a-z]/), l: 'Lowercase' },
                        { ok: checkReq(/[A-Z]/), l: 'Uppercase' },
                        { ok: checkReq(/[0-9]/), l: 'Number' },
                        { ok: addUserForm.password.length >= 14, l: '14+ chars' },
                      ].map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: r.ok ? '#111827' : '#9CA3AF', fontWeight: r.ok ? 700 : 500 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.ok ? '#111827' : '#E5E7EB' }}></span>
                          {r.l}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#111827', fontSize: 13 }}>
                      Confirm Password <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input type={showAddConfirmPassword ? 'text' : 'password'} placeholder="Confirm" value={addUserForm.confirmPassword}
                        onChange={e => setAddUserForm({ ...addUserForm, confirmPassword: e.target.value })}
                        style={{ width: '100%', padding: '12px 44px 12px 14px', background: '#F9FAFB', border: `2px solid ${addUserErrors.confirmPassword ? '#DC2626' : '#E5E7EB'}`, borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                      <button type="button" onClick={() => setShowAddConfirmPassword(!showAddConfirmPassword)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                        {showAddConfirmPassword ? <EyeIcon color="#6B7280" /> : <EyeOffIcon color="#6B7280" />}
                      </button>
                    </div>
                    {addUserErrors.confirmPassword && <span style={{ color: '#DC2626', fontSize: 12, marginTop: 4, display: 'block' }}>{addUserErrors.confirmPassword}</span>}
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid #E5E7EB' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddUserModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={addUserLoading} className="btn btn-primary" style={{ flex: 1 }}>
                  {addUserLoading ? '⏳ Creating...' : <><AddUserIcon size={16} color="#FFF" /> Create User</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 850 }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#111827' }}>
                <ImportIcon size={22} color="#111827" /> Import Data — {getServerLabel(importServer)}
              </h2>
              <button className="close-btn" onClick={() => setShowImportModal(false)}>✕</button>
            </div>

            {importOptionsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 12 }}>
                <div style={{ width: 40, height: 40, border: '4px solid #E5E7EB', borderTop: '4px solid #111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>Loading options...</span>
              </div>
            ) : (
              <>
                {availableImportMonths.length === 0 && availableImportYears.length === 0 && availableImportLocations.length === 0 ? (
                  <div style={{ padding: '30px 20px', background: '#FEF3C7', border: '2px solid #F59E0B', borderRadius: 12, textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: '#92400E', fontWeight: 600, margin: 0 }}>⚠️ No data on {getServerLabel(importServer)}</p>
                  </div>
                ) : (
                  <div className="form-two-column">
                    <div className="form-column">
                      <div className="form-section-label"><span className="form-section-icon">📅</span> PERIOD</div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#111827', fontSize: 13 }}>Month *</label>
                        <select value={importMonth} onChange={e => setImportMonth(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
                          <option value="">Select Month...</option>
                          {availableImportMonths.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#111827', fontSize: 13 }}>Year *</label>
                        <select value={importYear} onChange={e => setImportYear(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
                          <option value="">Select Year...</option>
                          {availableImportYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-column">
                      <div className="form-section-label"><span className="form-section-icon">📍</span> LOCATION</div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#111827', fontSize: 13 }}>Location *</label>
                        <select value={importLocation} onChange={e => setImportLocation(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
                          <option value="">Select Location...</option>
                          {availableImportLocations.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {availableImportMonths.length > 0 && availableImportLocations.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <button onClick={previewImport} disabled={!importMonth || !importYear || !importLocation || importLoading} className="btn btn-primary" style={{ width: '100%' }}>
                      {importLoading ? '⏳ Loading...' : `🔍 Preview Bills`}
                    </button>
                  </div>
                )}

                {showImportPreview && importPreviewData.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>📋 Found {importPreviewData.length} bills</span>
                    <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #E5E7EB', borderRadius: 10, marginTop: 10 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead style={{ background: '#F9FAFB', position: 'sticky', top: 0 }}>
                          <tr>
                            <th style={{ padding: '10px 12px', textAlign: 'left' }}>WSIN</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Consumer</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreviewData.slice(0, 50).map(b => (
                            <tr key={b.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{b.billNumber || 'N/A'}</td>
                              <td style={{ padding: '8px 12px' }}>{b.consumerName || 'N/A'}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>₱{(b.amount || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="modal-actions" style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #E5E7EB', marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => setShowImportModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button onClick={confirmImport} disabled={importPreviewData.length === 0 || importLoading} className="btn btn-primary" style={{ flex: 1 }}>
                {importLoading ? '⏳ Importing...' : `📥 Import ${importPreviewData.length} Bills`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 850 }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#111827' }}>
                <ExportIcon size={22} color="#111827" /> Replace Bills — {getServerLabel(exportServer)}
              </h2>
              <button className="close-btn" onClick={() => setShowExportModal(false)}>✕</button>
            </div>

            {exportOptionsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div style={{ width: 40, height: 40, border: '4px solid #E5E7EB', borderTop: '4px solid #111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <>
                {availableExportMonths.length === 0 && availableExportLocations.length === 0 ? (
                  <div style={{ padding: '30px 20px', background: '#FEF3C7', border: '2px solid #F59E0B', borderRadius: 12, textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: '#92400E', fontWeight: 600, margin: 0 }}>⚠️ No import data for {getServerLabel(exportServer)}</p>
                  </div>
                ) : (
                  <div className="form-two-column">
                    <div className="form-column">
                      <div className="form-section-label"><span className="form-section-icon">📅</span> PERIOD</div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#111827', fontSize: 13 }}>Month *</label>
                        <select value={exportMonth} onChange={e => setExportMonth(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
                          <option value="">Select Month...</option>
                          {availableExportMonths.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-column">
                      <div className="form-section-label"><span className="form-section-icon">📍</span> LOCATION</div>
                      <div className="form-group">
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#111827', fontSize: 13 }}>Location *</label>
                        <select value={exportLocation} onChange={e => setExportLocation(e.target.value)} style={{ width: '100%', padding: '12px 14px', background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>
                          <option value="">Select Location...</option>
                          {availableExportLocations.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {availableExportMonths.length > 0 && availableExportLocations.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <button onClick={previewExport} disabled={!exportMonth || !exportLocation || exportLoading} className="btn btn-primary" style={{ width: '100%' }}>
                      {exportLoading ? '⏳ Loading...' : `🔍 Preview`}
                    </button>
                  </div>
                )}

                {showExportPreview && exportPreviewData.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>📋 Found {exportPreviewData.length} imported bills</span>
                  </div>
                )}
              </>
            )}

            <div className="modal-actions" style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #E5E7EB', marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => setShowExportModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button onClick={confirmExport} disabled={exportPreviewData.length === 0 || exportLoading} className="btn btn-primary" style={{ flex: 1 }}>
                {exportLoading ? '⏳ Replacing...' : `🔄 REPLACE ${exportPreviewData.length} Bills`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;