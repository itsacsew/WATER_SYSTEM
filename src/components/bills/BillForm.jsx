// src/components/bills/BillForm.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './BillStyles.css';

const schema = yup.object().shape({
  billNumber: yup.string().required('Bill number is required'),
  consumerName: yup.string().required('Consumer name is required'),
  location: yup.string().required('Location is required'),
  consumerType: yup.string().required('Consumer type is required'),
  amount: yup.number().required('Amount is required').positive('Must be positive'),
  dueDate: yup.string().required('Due date is required'),
  status: yup.string().required('Status is required'),
  notes: yup.string()
});

const BillForm = ({ bill, onClose, onSave }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: bill || {
      billNumber: '',
      consumerName: '',
      location: 'CALIAN',
      consumerType: 'RESIDENTIAL',
      amount: '',
      dueDate: '',
      status: 'unpaid',
      notes: ''
    }
  });

  const onSubmit = async (data) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const billData = {
        ...data,
        amount: parseFloat(data.amount),
        userId: user.uid,
        updatedAt: new Date().toISOString()
      };

      if (bill) {
        await updateDoc(doc(db, 'bills', bill.id), billData);
        toast.success('Bill updated successfully!');
      } else {
        billData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'bills'), billData);
        toast.success('Bill added successfully!');
      }
      
      onSave();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error saving bill');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bill-form-3d" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-3d">
          <h3>{bill ? 'Edit Bill' : 'Add New Bill'}</h3>
          <button className="close-btn-3d" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row-horizontal">
            <div className="form-group form-group-horizontal">
              <label>Bill Number</label>
              <input
                {...register('billNumber')}
                type="text"
                placeholder="e.g., WB-2024-001"
                className={errors.billNumber ? 'error' : ''}
              />
              {errors.billNumber && <span className="error-message">{errors.billNumber.message}</span>}
            </div>

            <div className="form-group form-group-horizontal">
              <label>Consumer Name</label>
              <input
                {...register('consumerName')}
                type="text"
                placeholder="Enter consumer name"
                className={errors.consumerName ? 'error' : ''}
              />
              {errors.consumerName && <span className="error-message">{errors.consumerName.message}</span>}
            </div>
          </div>

          <div className="form-row-horizontal">
            <div className="form-group form-group-horizontal">
              <label>Location</label>
              <input
                {...register('location')}
                type="text"
                placeholder="Location"
                className={errors.location ? 'error' : ''}
              />
              {errors.location && <span className="error-message">{errors.location.message}</span>}
            </div>

            <div className="form-group form-group-horizontal">
              <label>Consumer Type</label>
              <select {...register('consumerType')} className={errors.consumerType ? 'error' : ''}>
                <option value="RESIDENTIAL">🏠 Residential</option>
                <option value="COMMERCIAL">🏢 Commercial</option>
              </select>
              {errors.consumerType && <span className="error-message">{errors.consumerType.message}</span>}
            </div>
          </div>

          <div className="form-row-horizontal">
            <div className="form-group form-group-horizontal">
              <label>Amount (₱)</label>
              <input
                {...register('amount')}
                type="number"
                placeholder="0.00"
                step="0.01"
                className={errors.amount ? 'error' : ''}
              />
              {errors.amount && <span className="error-message">{errors.amount.message}</span>}
            </div>

            <div className="form-group form-group-horizontal">
              <label>Due Date</label>
              <input
                {...register('dueDate')}
                type="date"
                className={errors.dueDate ? 'error' : ''}
              />
              {errors.dueDate && <span className="error-message">{errors.dueDate.message}</span>}
            </div>
          </div>

          <div className="form-row-horizontal">
            <div className="form-group form-group-horizontal">
              <label>Status</label>
              <select {...register('status')} className={errors.status ? 'error' : ''}>
                <option value="unpaid">⏳ Unpaid</option>
                <option value="paid">✅ Paid</option>
                <option value="overdue">⚠️ Overdue</option>
              </select>
              {errors.status && <span className="error-message">{errors.status.message}</span>}
            </div>

            <div className="form-group form-group-horizontal">
              <label>Notes (Optional)</label>
              <input
                {...register('notes')}
                type="text"
                placeholder="Additional notes..."
                className={errors.notes ? 'error' : ''}
              />
              {errors.notes && <span className="error-message">{errors.notes.message}</span>}
            </div>
          </div>

          <div className="form-actions-horizontal">
            <button type="button" className="cancel-btn-horizontal" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn-horizontal" disabled={loading}>
              {loading ? 'Saving...' : bill ? 'Update Bill' : 'Add Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillForm;