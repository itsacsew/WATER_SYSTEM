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
  month: yup.string(),
  year: yup.string(),
  previousReading: yup.number(),
  presentReading: yup.number(),
  consumption: yup.number(),
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
      location: '',
      consumerType: 'RESIDENTIAL',
      amount: '',
      dueDate: '',
      status: 'unpaid',
      month: '',
      year: new Date().getFullYear().toString(),
      previousReading: '',
      presentReading: '',
      consumption: '',
      notes: ''
    }
  });

  const onSubmit = async (data) => {
    if (!user) {
      toast.error('You must be logged in to add bills');
      return;
    }
    
    setLoading(true);
    try {
      const billData = {
        ...data,
        amount: parseFloat(data.amount),
        previousReading: data.previousReading ? parseFloat(data.previousReading) : 0,
        presentReading: data.presentReading ? parseFloat(data.presentReading) : 0,
        consumption: data.consumption ? parseFloat(data.consumption) : 0,
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
      console.error('Error saving bill:', error);
      toast.error(error.message || 'Error saving bill');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{bill ? 'Edit Bill' : 'Add New Bill'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Bill Number (WSIN) *</label>
            <input
              {...register('billNumber')}
              type="text"
              placeholder="e.g., 1001"
              className={`modal-input ${errors.billNumber ? 'error' : ''}`}
            />
            {errors.billNumber && <span className="error-message">{errors.billNumber.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Consumer Name *</label>
              <input
                {...register('consumerName')}
                type="text"
                placeholder="Enter consumer name"
                className={`modal-input ${errors.consumerName ? 'error' : ''}`}
              />
              {errors.consumerName && <span className="error-message">{errors.consumerName.message}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Location</label>
              <input
                {...register('location')}
                type="text"
                placeholder="Location"
                className={`modal-input ${errors.location ? 'error' : ''}`}
              />
              {errors.location && <span className="error-message">{errors.location.message}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Consumer Type *</label>
              <select {...register('consumerType')} className="modal-input">
                <option value="RESIDENTIAL">🏠 Residential</option>
                <option value="COMMERCIAL">🏢 Commercial</option>
              </select>
              {errors.consumerType && <span className="error-message">{errors.consumerType.message}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Status *</label>
              <select {...register('status')} className="modal-input">
                <option value="unpaid">⏳ Unpaid</option>
                <option value="paid">✅ Paid</option>
                <option value="overdue">⚠️ Overdue</option>
              </select>
              {errors.status && <span className="error-message">{errors.status.message}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Month</label>
              <select {...register('month')} className="modal-input">
                <option value="JANUARY">January</option>
                <option value="FEBRUARY">February</option>
                <option value="MARCH">March</option>
                <option value="APRIL">April</option>
                <option value="MAY">May</option>
                <option value="JUNE">June</option>
                <option value="JULY">July</option>
                <option value="AUGUST">August</option>
                <option value="SEPTEMBER">September</option>
                <option value="OCTOBER">October</option>
                <option value="NOVEMBER">November</option>
                <option value="DECEMBER">December</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Year</label>
              <input
                {...register('year')}
                type="text"
                placeholder="2026"
                className="modal-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Previous Reading</label>
              <input
                {...register('previousReading')}
                type="number"
                placeholder="0"
                step="0.01"
                className="modal-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Present Reading</label>
              <input
                {...register('presentReading')}
                type="number"
                placeholder="0"
                step="0.01"
                className="modal-input"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Consumption</label>
              <input
                {...register('consumption')}
                type="number"
                placeholder="0"
                step="0.01"
                className="modal-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Amount (₱) *</label>
              <input
                {...register('amount')}
                type="number"
                placeholder="0.00"
                step="0.01"
                className={`modal-input ${errors.amount ? 'error' : ''}`}
              />
              {errors.amount && <span className="error-message">{errors.amount.message}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Due Date *</label>
              <input
                {...register('dueDate')}
                type="date"
                className={`modal-input ${errors.dueDate ? 'error' : ''}`}
              />
              {errors.dueDate && <span className="error-message">{errors.dueDate.message}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Notes (Optional)</label>
            <input
              {...register('notes')}
              type="text"
              placeholder="Additional notes..."
              className="modal-input"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="modal-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn primary" disabled={loading}>
              {loading ? 'Saving...' : bill ? 'Update Bill' : 'Add Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillForm;