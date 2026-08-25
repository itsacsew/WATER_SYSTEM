// src/components/bills/BillForm.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './BillForm.css';

// ============================================================
// HARDCODED SVG ICONS
// ============================================================

const FileDollarIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"} {...props}>
    <path d="M20.0007 9.90907V7.81816C20.0007 6.12492 20.0007 5.2783 19.7327 4.60212C19.3019 3.51508 18.3909 2.65763 17.2359 2.25218C16.5174 1.99998 15.6179 1.99998 13.8188 1.99998C10.6705 1.99998 9.09624 1.99998 7.83897 2.44133C5.81774 3.15086 4.22342 4.6514 3.46954 6.55373C3.00061 7.73704 3.00061 9.21863 3.00061 12.1818V14.7273C3.00061 17.7966 3.00061 19.3313 3.84831 20.3971C4.09119 20.7025 4.37923 20.9736 4.70368 21.2022C5.83607 22 7.46667 22 10.7279 22H11.5007C12.0353 22 13.0344 22 13.5007 21.9972M3.00061 12C3.00061 10.159 4.49299 8.66665 6.33394 8.66665C6.99972 8.66665 7.78464 8.78332 8.43197 8.60987C9.00712 8.45575 9.45637 8.0065 9.61048 7.43134C9.78393 6.78402 9.66727 5.9991 9.66727 5.33331C9.66727 3.49236 11.1597 1.99998 13.0007 1.99998" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M20.7527 15.8111C20.8576 14.5466 18.9229 13.5141 17.4443 14.2068C15.5973 15.0722 15.7584 17.2594 18.0395 17.375C19.0546 17.4265 19.9425 17.3169 20.5459 17.9708C21.1493 18.6248 21.4108 20.2901 19.6322 20.8552C17.8535 21.4204 15.9996 20.4125 15.9996 19.1831M18.4707 13V13.9776M18.4707 21.2204V22" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const User02Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"} {...props}>
    <circle cx="12" cy="7" r="4" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
    <path d="M12 14C7 14 4 16.5 4 19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19C20 16.5 17 14 12 14Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const Location03Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"} {...props}>
    <path d="M14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9Z" stroke="#194752" strokeWidth="1.5"></path>
    <path d="M18.2222 17C19.6167 18.9885 20.2838 20.0475 19.8865 20.8999C19.8466 20.9854 19.7999 21.0679 19.7469 21.1467C19.1724 22 17.6875 22 14.7178 22H9.28223C6.31251 22 4.82765 22 4.25311 21.1467C4.20005 21.0679 4.15339 20.9854 4.11355 20.8999C3.71619 20.0475 4.38326 18.9885 5.77778 17" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M13.2574 17.4936C12.9201 17.8184 12.4693 18 12.0002 18C11.531 18 11.0802 17.8184 10.7429 17.4936C7.6543 14.5008 3.51519 11.1575 5.53371 6.30373C6.6251 3.67932 9.24494 2 12.0002 2C14.7554 2 17.3752 3.67933 18.4666 6.30373C20.4826 11.1514 16.3536 14.5111 13.2574 17.4936Z" stroke="#194752" strokeWidth="1.5"></path>
  </svg>
);

const Calendar03Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"} {...props}>
    <path d="M16 2V6M8 2V6" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M3 10H21" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M12.1258 14H12.0008M12.1258 18H12.0008M7.625 14H7.5M7.625 18H7.5M16.625 14H16.5M12.2508 14C12.2508 14.1381 12.1389 14.25 12.0008 14.25C11.8628 14.25 11.7508 14.1381 11.7508 14C11.7508 13.8619 11.8628 13.75 12.0008 13.75C12.1389 13.75 12.2508 13.8619 12.2508 14ZM12.2508 18C12.2508 18.1381 12.1389 18.25 12.0008 18.25C11.8628 18.25 11.7508 18.1381 11.7508 18C11.7508 17.8619 11.8628 17.75 12.0008 17.75C12.1389 17.75 12.2508 17.8619 12.2508 18ZM7.75 14C7.75 14.1381 7.63807 14.25 7.5 14.25C7.36193 14.25 7.25 14.1381 7.25 14C7.25 13.8619 7.36193 13.75 7.5 13.75C7.63807 13.75 7.75 13.8619 7.75 14ZM7.75 18C7.75 18.1381 7.63807 18.25 7.5 18.25C7.36193 18.25 7.25 18.1381 7.25 18C7.25 17.8619 7.36193 17.75 7.5 17.75C7.63807 17.75 7.75 17.8619 7.75 18ZM16.75 14C16.75 14.1381 16.6381 14.25 16.5 14.25C16.3619 14.25 16.25 14.1381 16.25 14C16.25 13.8619 16.3619 13.75 16.5 13.75C16.6381 13.75 16.75 13.8619 16.75 14Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const ApartmentIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"} {...props}>
    <path d="M9.5 2.5H6.5C4.61438 2.5 3.67157 2.5 3.08579 3.08579C2.5 3.67157 2.5 4.61438 2.5 6.5V17.5C2.5 19.3856 2.5 20.3284 3.08579 20.9142C3.67157 21.5 4.61438 21.5 6.5 21.5H13.5V6.5C13.5 4.61438 13.5 3.67157 12.9142 3.08579C12.3284 2.5 11.3856 2.5 9.5 2.5Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M5.5 5.5H6.5M9.5 5.5H10.5M5.5 8.5H6.5M9.5 8.5H10.5M5.5 11.5H6.5M9.5 11.5H10.5M5.5 14.5H6.5M9.5 14.5H10.5" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M8 21.5V18.5" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M17.5 7.5H13.5V21.5H17.5C19.3856 21.5 20.3284 21.5 20.9142 20.9142C21.5 20.3284 21.5 19.3856 21.5 17.5V11.5C21.5 9.61438 21.5 8.67157 20.9142 8.08579C20.3284 7.5 19.3856 7.5 17.5 7.5Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M17 10.5H18M17 13.5H18M17 16.5H18" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const DuplexIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"} {...props}>
    <path d="M18.5 6L12.916 2.27735C12.6448 2.0965 12.326 2 12 2C11.674 2 11.3552 2.0965 11.084 2.27735L5.5 6" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M20 14L12.916 9.27735C12.6448 9.0965 12.326 9 12 9C11.674 9 11.3552 9.0965 11.084 9.27735L4 14" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M18.5 13.5V18C18.5 19.8856 18.5 20.8284 17.9142 21.4142C17.3284 22 16.3856 22 14.5 22H9.5C7.61438 22 6.67157 22 6.08579 21.4142C5.5 20.8284 5.5 19.8856 5.5 18V13.5" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M17 5V12M7 5V12" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M14 22V18C14 16.8954 13.1046 16 12 16C10.8954 16 10 16.8954 10 18V22" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const PhilippinePesoIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"} {...props}>
    <path d="M7 15V4C7 3.44772 7.44772 3 8 3H12C15.3137 3 18 5.68629 18 9C18 12.3137 15.3137 15 12 15H7Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M4 7H20" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M4 11H20" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M7 15V21" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const UserStatusIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"} {...props}>
    <path d="M18.4984 19.1511C17.3377 17.4018 15.2947 16.2009 12.9313 16.0569L11.9984 16C11.6652 16.0083 11.3547 16.0194 11.0617 16.0325C8.71722 16.1376 6.66598 17.3796 5.5 19.1511" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M14.9961 10C14.9961 11.6569 13.6529 13 11.9961 13C10.3392 13 8.99609 11.6569 8.99609 10C8.99609 8.34315 10.3392 7 11.9961 7C13.6529 7 14.9961 8.34315 14.9961 10Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M14 2.20004C13.3538 2.06886 12.6849 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 11.3151 21.9311 10.6462 21.8 10" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M22 4.5C22 3.11929 20.8807 2 19.5 2C18.1193 2 17 3.11929 17 4.5C17 5.88071 18.1193 7 19.5 7C20.8807 7 22 5.88071 22 4.5Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

const Note01Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={20} height={20} color={"#194752"} fill={"none"} {...props}>
    <path d="M16.5 2V5M7.5 2V5M12 2V5" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M13 3.5H11C7.70017 3.5 6.05025 3.5 5.02513 4.52513C4 5.55025 4 7.20017 4 10.5V15C4 18.2998 4 19.9497 5.02513 20.9749C6.05025 22 7.70017 22 11 22H13C16.2998 22 17.9497 22 18.9749 20.9749C20 19.9497 20 18.2998 20 15V10.5C20 7.20017 20 5.55025 18.9749 4.52512C17.9497 3.5 16.2998 3.5 13 3.5Z" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    <path d="M8 15H12M8 11H16" stroke="#194752" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

// ============================================================
// BILL FORM COMPONENT
// ============================================================

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
      <div className="modal-content bill-form-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-header-icon">
              {bill ? <FileDollarIcon width={28} height={28} /> : <FileDollarIcon width={28} height={28} />}
            </span>
            <div>
              <h3>{bill ? 'Edit Bill' : 'Add New Bill'}</h3>
              <p className="modal-subtitle">
                {bill ? 'Update the bill details below' : 'Fill in the bill information below'}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ROW 1: Bill Number | Consumer Name | Location */}
          <div className="form-row-3">
            <div className="form-group">
              <label>
                <span className="label-icon"><FileDollarIcon width={18} height={18} /></span>
                Bill Number (WSIN) <span className="required">*</span>
              </label>
              <input
                {...register('billNumber')}
                type="text"
                placeholder="e.g., 1001"
                className={`modal-input ${errors.billNumber ? 'error' : ''}`}
              />
              {errors.billNumber && <span className="error-message">{errors.billNumber.message}</span>}
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"><User02Icon width={18} height={18} /></span>
                Consumer Name <span className="required">*</span>
              </label>
              <input
                {...register('consumerName')}
                type="text"
                placeholder="Enter consumer name"
                className={`modal-input ${errors.consumerName ? 'error' : ''}`}
              />
              {errors.consumerName && <span className="error-message">{errors.consumerName.message}</span>}
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"><Location03Icon width={18} height={18} /></span>
                Location <span className="required">*</span>
              </label>
              <input
                {...register('location')}
                type="text"
                placeholder="Enter location"
                className={`modal-input ${errors.location ? 'error' : ''}`}
              />
              {errors.location && <span className="error-message">{errors.location.message}</span>}
            </div>
          </div>

          {/* ROW 2: Month | Year | Consumer Type */}
          <div className="form-row-3">
            <div className="form-group">
              <label>
                <span className="label-icon"><Calendar03Icon width={18} height={18} /></span>
                Month
              </label>
              <select {...register('month')} className="modal-input">
                <option value="">Select Month</option>
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

            <div className="form-group">
              <label>
                <span className="label-icon"><Calendar03Icon width={18} height={18} /></span>
                Year
              </label>
              <input
                {...register('year')}
                type="text"
                placeholder="2026"
                className="modal-input"
              />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"><ApartmentIcon width={18} height={18} /></span>
                Consumer Type <span className="required">*</span>
              </label>
              <select {...register('consumerType')} className="modal-input">
                <option value="RESIDENTIAL"><ApartmentIcon width={16} height={16} /> Residential</option>
                <option value="COMMERCIAL"><DuplexIcon width={16} height={16} /> Commercial</option>
              </select>
              {errors.consumerType && <span className="error-message">{errors.consumerType.message}</span>}
            </div>
          </div>

          {/* ROW 3: Previous Reading | Present Reading | Consumption */}
          <div className="form-row-3">
            <div className="form-group">
              <label>
                <span className="label-icon"><UserStatusIcon width={18} height={18} /></span>
                Previous Reading
              </label>
              <input
                {...register('previousReading')}
                type="number"
                placeholder="0"
                step="0.01"
                className="modal-input"
              />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"><UserStatusIcon width={18} height={18} /></span>
                Present Reading
              </label>
              <input
                {...register('presentReading')}
                type="number"
                placeholder="0"
                step="0.01"
                className="modal-input"
              />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"><UserStatusIcon width={18} height={18} /></span>
                Consumption
              </label>
              <input
                {...register('consumption')}
                type="number"
                placeholder="0"
                step="0.01"
                className="modal-input"
              />
            </div>
          </div>

          {/* ROW 4: Amount | Due Date | Status */}
          <div className="form-row-3">
            <div className="form-group">
              <label>
                <span className="label-icon"><PhilippinePesoIcon width={18} height={18} /></span>
                Amount (₱) <span className="required">*</span>
              </label>
              <input
                {...register('amount')}
                type="number"
                placeholder="0.00"
                step="0.01"
                className={`modal-input ${errors.amount ? 'error' : ''}`}
              />
              {errors.amount && <span className="error-message">{errors.amount.message}</span>}
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"><Calendar03Icon width={18} height={18} /></span>
                Due Date <span className="required">*</span>
              </label>
              <input
                {...register('dueDate')}
                type="date"
                className={`modal-input ${errors.dueDate ? 'error' : ''}`}
              />
              {errors.dueDate && <span className="error-message">{errors.dueDate.message}</span>}
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon"><UserStatusIcon width={18} height={18} /></span>
                Status <span className="required">*</span>
              </label>
              <select {...register('status')} className="modal-input">
                <option value="unpaid">⏳ Unpaid</option>
                <option value="paid">✅ Paid</option>
                <option value="overdue">⚠️ Overdue</option>
              </select>
              {errors.status && <span className="error-message">{errors.status.message}</span>}
            </div>
          </div>

          {/* ROW 5: Notes (Full Width) */}
          <div className="form-group full-width">
            <label>
              <span className="label-icon"><Note01Icon width={18} height={18} /></span>
              Notes (Optional)
            </label>
            <input
              {...register('notes')}
              type="text"
              placeholder="Additional notes..."
              className="modal-input"
            />
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner-small"></span>
                  Saving...
                </>
              ) : (
                <>
                  {bill ? '💾 Update Bill' : '➕ Add Bill'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillForm;