// src/components/bills/BillCard.jsx
import React from 'react';
import './BillStyles.css';

const BillCard = ({ bill, onEdit, onDelete }) => {
  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { label: 'Paid', class: 'status-paid-3d' },
      unpaid: { label: 'Unpaid', class: 'status-unpaid-3d' },
      overdue: { label: 'Overdue', class: 'status-overdue-3d' }
    };
    return statusMap[status] || statusMap.unpaid;
  };

  const formatDate = (dateString) => {
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
    <div className="bill-card-3d">
      <div className="bill-header-3d">
        <h4>{bill.billNumber}</h4>
        <span className={`status-badge-3d ${status.class}`}>
          {status.label}
        </span>
      </div>
      
      <div className="bill-body-3d">
        <div className="bill-amount-3d">{formatCurrency(bill.amount)}</div>
        <div className="bill-due-date-3d">
          <span>Due: {formatDate(bill.dueDate)}</span>
          {new Date(bill.dueDate) < new Date() && bill.status !== 'paid' && (
            <span className="overdue-warning-3d">⚠️ Overdue</span>
          )}
        </div>
        {bill.notes && (
          <div className="bill-notes-3d">{bill.notes}</div>
        )}
      </div>

      <div className="bill-actions-3d">
        <button className="edit-btn-3d" onClick={() => onEdit(bill)}>
          Edit
        </button>
        <button className="delete-btn-3d" onClick={() => onDelete(bill.id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default BillCard;