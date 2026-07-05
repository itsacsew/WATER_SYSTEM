// src/components/bills/BillDashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import BillCard from './BillCard';
import BillForm from './BillForm';
import * as XLSX from 'xlsx';
import './BillStyles.css';

const BillDashboard = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [uploading, setUploading] = useState(false);
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
      calculateStats(billsData);
    } catch (error) {
      toast.error('Error fetching bills');
    }
    setLoading(false);
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
    
    // Get unique consumers (from billNumber or consumerName)
    const uniqueConsumers = new Set();
    const residentialCount = billsData.filter(b => b.consumerType === 'RESIDENTIAL').length;
    const commercialCount = billsData.filter(b => b.consumerType === 'COMMERCIAL').length;
    
    billsData.forEach(b => {
      if (b.consumerName) {
        uniqueConsumers.add(b.consumerName);
      }
    });
    
    // Get unique locations
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          console.log('Excel Data:', jsonData);
          
          let importedCount = 0;
          let skippedCount = 0;
          
          for (const row of jsonData) {
            // Skip rows without consumer name
            if (!row['Consumer Name'] || row['Consumer Name'].trim() === '') {
              skippedCount++;
              continue;
            }
            
            // Extract data from columns
            const consumerName = row['Consumer Name']?.toString().trim() || '';
            const location = row['Location']?.toString().trim() || 'N/A';
            const type = row['Type']?.toString().trim() || 'OLD';
            const consumerType = row['Consumer Type']?.toString().trim().toUpperCase() || 'RESIDENTIAL';
            const year = row['Year']?.toString() || '2026';
            const month = row['Month']?.toString().toUpperCase() || 'APRIL';
            const presentReading = row['Present Reading']?.toString().trim() || '0';
            const previousReading = row['Previous Reading']?.toString().trim() || '0';
            const consumption = row['Consumption']?.toString().trim() || '0';
            const waterCharge = row['Water Charge']?.toString().trim() || '0';
            const surcharge = row['Surcharge']?.toString().trim() || '0';
            const overallTotal = row['Overall Total']?.toString().trim() || '0';
            const paymentStatus = row['Payment Status']?.toString().trim().toLowerCase() || 'unpaid';
            const officialReceipt = row['Official Receipt']?.toString().trim() || '';
            const processedBy = row['Processed By']?.toString().trim() || '';
            const wsin = row['WSIN']?.toString().trim() || `WSIN-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            
            // Skip if consumer name is empty
            if (!consumerName) {
              skippedCount++;
              continue;
            }
            
            // Generate bill number from WSIN or create one
            const billNumber = wsin || `WB-${year}-${String(importedCount + 1).padStart(3, '0')}`;
            
            // Determine status based on Payment Status or default to unpaid
            let status = 'unpaid';
            if (paymentStatus === 'paid') {
              status = 'paid';
            } else if (paymentStatus === 'overdue') {
              status = 'overdue';
            }
            
            // Create bill data
            const billData = {
              billNumber: billNumber,
              consumerName: consumerName,
              location: location,
              type: type,
              consumerType: consumerType,
              year: year,
              month: month,
              presentReading: parseFloat(presentReading) || 0,
              previousReading: parseFloat(previousReading) || 0,
              consumption: parseFloat(consumption) || 0,
              waterCharge: parseFloat(waterCharge) || 0,
              surcharge: parseFloat(surcharge) || 0,
              amount: parseFloat(overallTotal) || 0,
              status: status,
              dueDate: new Date(`${year}-${month}-15`).toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
              officialReceipt: officialReceipt,
              processedBy: processedBy,
              notes: '',
              userId: user.uid,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isImported: true
            };
            
            // Save to Firestore
            await addDoc(collection(db, 'bills'), billData);
            importedCount++;
          }
          
          toast.success(`Imported ${importedCount} bills successfully! ${skippedCount > 0 ? `${skippedCount} rows skipped.` : ''}`);
          fetchBills();
          
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          toast.error('Error parsing Excel file. Please check the format.');
        }
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Error reading file');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
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
              className="upload-btn" 
              onClick={() => document.getElementById('fileInput').click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : '📤 Import Excel'}
            </button>
            <input
              type="file"
              id="fileInput"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards - Updated */}
      <div className="stats-grid">
        <div className="stat-card-3d total">
          <div className="stat-icon-3d">📋</div>
          <div className="stat-info">
            <h3>Total Bills</h3>
            <p>{stats.total}</p>
          </div>
        </div>
        <div className="stat-card-3d paid">
          <div className="stat-icon-3d">✅</div>
          <div className="stat-info">
            <h3>Paid</h3>
            <p>{stats.paid}</p>
          </div>
        </div>
        <div className="stat-card-3d unpaid">
          <div className="stat-icon-3d">⏳</div>
          <div className="stat-info">
            <h3>Unpaid</h3>
            <p>{stats.unpaid}</p>
          </div>
        </div>
        <div className="stat-card-3d overdue">
          <div className="stat-icon-3d">⚠️</div>
          <div className="stat-info">
            <h3>Overdue</h3>
            <p>{stats.overdue}</p>
          </div>
        </div>
      </div>

      {/* New Stats Cards */}
      <div className="stats-grid stats-grid-2">
        <div className="stat-card-3d consumers">
          <div className="stat-icon-3d">👤</div>
          <div className="stat-info">
            <h3>Total Consumers</h3>
            <p>{stats.totalConsumers}</p>
          </div>
        </div>
        <div className="stat-card-3d residential">
          <div className="stat-icon-3d">🏠</div>
          <div className="stat-info">
            <h3>Residential</h3>
            <p>{stats.residential}</p>
          </div>
        </div>
        <div className="stat-card-3d commercial">
          <div className="stat-icon-3d">🏢</div>
          <div className="stat-info">
            <h3>Commercial</h3>
            <p>{stats.commercial}</p>
          </div>
        </div>
        <div className="stat-card-3d location">
          <div className="stat-icon-3d">📍</div>
          <div className="stat-info">
            <h3>Location</h3>
            <p>{stats.location}</p>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="bills-section">
        <h3>Your Bills</h3>
        {bills.length === 0 ? (
          <div className="empty-state-3d">
            <p>No bills yet. Add your first water bill or import from Excel!</p>
          </div>
        ) : (
          <div className="bills-grid">
            {bills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

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