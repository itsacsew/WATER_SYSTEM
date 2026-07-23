// src/components/bills/BillCard.jsx
import React from 'react';
import './BillStyles.css';

const BillCard = ({ bill, onEdit, onDelete, onPay }) => {
  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { label: 'Paid', class: 'status-paid' },
      unpaid: { label: 'Unpaid', class: 'status-unpaid' },
      overdue: { label: 'Overdue', class: 'status-overdue' }
    };
    return statusMap[status] || statusMap.unpaid;
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const status = getStatusBadge(bill.status);

  return (
    <div className="bill-card">
      <div className="bill-header">
        <h4>{bill.billNumber || 'N/A'}</h4>
        <span className={`status-badge ${status.class}`}>
          {status.label}
        </span>
      </div>
      
      <div className="bill-body">
        <div className="bill-consumer">{bill.consumerName || 'Unknown Consumer'}</div>
        <div className="bill-amount">{formatCurrency(bill.amount || 0)}</div>
        <div className="bill-due-date">
          <span>Due: {formatDate(bill.dueDate)}</span>
          {new Date(bill.dueDate) < new Date() && bill.status !== 'paid' && (
            <span className="overdue-warning">⚠️ Overdue</span>
          )}
        </div>
        {bill.notes && (
          <div className="bill-notes">{bill.notes}</div>
        )}
      </div>

      <div className="bill-actions">
        {bill.status !== 'paid' && onPay && (
          <button className="pay-btn-card" onClick={() => onPay(bill)}>
            💳 Pay
          </button>
        )}
        <button className="edit-btn-card" onClick={() => onEdit(bill)}>
          Edit
        </button>
        <button className="delete-btn-card" onClick={() => onDelete(bill.id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default BillCard;