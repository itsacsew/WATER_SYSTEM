// src/components/bills/BillDashboard.jsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import BillCard from './BillCard';
import BillForm from './BillForm';
import './BillStyles.css';

const BillDashboard = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0
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
    
    setStats({ total, paid, unpaid, overdue });
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

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your bills...</p>
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
        <button className="add-bill-btn" onClick={() => setShowForm(true)}>
          + Add New Bill
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>Total Bills</h3>
            <p>{stats.total}</p>
          </div>
        </div>
        <div className="stat-card paid">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Paid</h3>
            <p>{stats.paid}</p>
          </div>
        </div>
        <div className="stat-card unpaid">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Unpaid</h3>
            <p>{stats.unpaid}</p>
          </div>
        </div>
        <div className="stat-card overdue">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>Overdue</h3>
            <p>{stats.overdue}</p>
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="bills-section">
        <h3>Your Bills</h3>
        {bills.length === 0 ? (
          <div className="empty-state">
            <p>No bills yet. Add your first water bill!</p>
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