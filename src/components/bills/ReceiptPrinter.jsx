// src/components/bills/ReceiptPrinter.jsx
import React, { useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import './ReceiptStyles.css';

const ReceiptPrinter = ({ bill, paymentCode, referenceNumber, onClose }) => {
  const receiptRef = useRef(null);
  const currentDate = new Date();
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₱0.00';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // ============================================================
  // AMOUNT TO WORDS CONVERTER
  // ============================================================
  const amountToWords = (amount) => {
    if (!amount && amount !== 0) return 'ZERO PESOS ONLY';
    
    const num = parseFloat(amount);
    const pesos = Math.floor(num);
    const centavos = Math.round((num - pesos) * 100);
    
    if (pesos === 0 && centavos === 0) return 'ZERO PESOS ONLY';
    
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 
                  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 
                  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    
    const toWords = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) {
        const ten = Math.floor(n / 10);
        const one = n % 10;
        return one === 0 ? tens[ten] : `${tens[ten]}-${ones[one]}`;
      }
      if (n < 1000) {
        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        if (remainder === 0) return `${ones[hundred]} HUNDRED`;
        return `${ones[hundred]} HUNDRED ${toWords(remainder)}`;
      }
      if (n < 1000000) {
        const thousands = Math.floor(n / 1000);
        const remainder = n % 1000;
        if (remainder === 0) return `${toWords(thousands)} THOUSAND`;
        return `${toWords(thousands)} THOUSAND ${toWords(remainder)}`;
      }
      return '';
    };
    
    const pesoWords = toWords(pesos);
    const pesoLabel = pesos === 1 ? 'PESO' : 'PESOS';
    
    if (centavos === 0) {
      return `${pesoWords} ${pesoLabel} ONLY`;
    }
    
    const centavoStr = String(centavos).padStart(2, '0');
    return `${pesoWords} ${pesoLabel} AND ${centavoStr}/100 PESOS ONLY`;
  };

  // ============================================================
  // WATER FEE PERIOD FORMATTER - WITH MONTH RANGE & YEAR
  // ============================================================
  const formatWaterFeePeriod = () => {
    const monthOrder = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                        'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    // Check if this is a PAY ALL transaction (multiple bills)
    if (bill?.isPayAll && bill?.payAllDetails && bill.payAllDetails.length > 0) {
      // Extract all months and years from payAllDetails
      const details = bill.payAllDetails;
      
      // Get unique month-year combos, sorted
      const sortedPeriods = [...details].sort((a, b) => {
        const aYear = parseInt(a.year) || 0;
        const bYear = parseInt(b.year) || 0;
        if (aYear !== bYear) return aYear - bYear;
        const aIdx = monthOrder.indexOf(a.month?.toUpperCase());
        const bIdx = monthOrder.indexOf(b.month?.toUpperCase());
        return aIdx - bIdx;
      });
      
      const firstPeriod = sortedPeriods[0];
      const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
      
      const firstMonth = firstPeriod.month?.toUpperCase() || '';
      const lastMonth = lastPeriod.month?.toUpperCase() || '';
      const firstYear = firstPeriod.year || '';
      const lastYear = lastPeriod.year || '';
      
      // If only one bill in pay all
      if (sortedPeriods.length === 1) {
        return `${firstMonth} ${firstYear}`;
      }
      
      // If same month and year
      if (firstMonth === lastMonth && firstYear === lastYear) {
        return `${firstMonth} ${firstYear}`;
      }
      
      // If same year, different months - use range: APRIL - JUNE 2026
      if (firstYear === lastYear) {
        return `${firstMonth} - ${lastMonth} ${firstYear}`;
      }
      
      // If different years - use: DECEMBER 2025 - FEBRUARY 2026
      return `${firstMonth} ${firstYear} - ${lastMonth} ${lastYear}`;
    }
    
    // Single bill
    const month = bill?.month || 'N/A';
    const year = bill?.year || '';
    
    if (year) {
      return `${month} ${year}`;
    }
    return month;
  };

  const handlePrint = async () => {
    try {
      const element = receiptRef.current;
      
      // Capture the receipt as image
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 776, // 205mm in pixels at 96dpi
        height: 378, // 100mm in pixels at 96dpi
        windowWidth: 776,
        windowHeight: 378,
      });
      
      const printWindow = window.open('', '_blank', 'width=800,height=500');
      if (!printWindow) {
        alert('Please allow popups for this site to print receipts.');
        return;
      }
      
      const imgData = canvas.toDataURL('image/png');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Official Receipt</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              @page {
                size: 205mm 100mm landscape;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                min-height: 100vh;
                background: #e8ecf1;
                font-family: 'Courier New', monospace;
                padding-top: 20px;
              }
              .print-container {
                width: 205mm;
                height: 100mm;
                background: white;
                padding: 0;
                margin: 0;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                overflow: hidden;
                position: relative;
              }
              .print-container img {
                width: 100%;
                height: 100%;
                display: block;
                object-fit: fill;
              }
              .no-print {
                text-align: center;
                padding: 12px;
                background: #f1f5f9;
                border-top: 1px solid #e2e8f0;
              }
              .no-print button {
                padding: 8px 32px;
                margin: 0 6px;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
              }
              .print-btn {
                background: #1e3a5f;
                color: white;
              }
              .print-btn:hover {
                background: #2a4a7a;
              }
              .close-btn {
                background: #e2e8f0;
                color: #1e293b;
              }
              .close-btn:hover {
                background: #cbd5e1;
              }
              @media print {
                body {
                  background: white;
                  margin: 0;
                  padding: 0;
                  align-items: flex-start;
                  padding-top: 0;
                }
                .print-container {
                  box-shadow: none;
                  width: 205mm;
                  height: 100mm;
                  margin: 0;
                  padding: 0;
                }
                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <img src="${imgData}" alt="Official Receipt" />
            </div>
            <div class="no-print">
              <button class="print-btn" onclick="window.print()">🖨️ Print</button>
              <button class="close-btn" onclick="window.close()">Close</button>
            </div>
            <script>
              setTimeout(() => { window.print(); }, 800);
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
    } catch (error) {
      console.error('Print error:', error);
      alert('Error printing receipt. Please try again.');
    }
  };

  useEffect(() => {
    // Auto-open print dialog when modal appears
    setTimeout(() => {
      handlePrint();
    }, 600);
  }, []);

  const consumerName = bill?.consumerName || 'N/A';
  const waterFeePeriod = formatWaterFeePeriod();
  const amount = bill?.amount || 0;
  const amountInWords = amountToWords(amount);

  // Treasurer details
  const treasurerName = "DANNIE LYN I. VILLAFLOR";
  const treasurerTitle = "MUNICIPAL TREASURER";

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div 
        className="receipt-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '205mm',
          height: '100mm',
          maxWidth: '205mm',
          maxHeight: '100mm',
          padding: '0',
          margin: '0',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          alignSelf: 'flex-start',
          marginTop: '20px'
        }}
      >
        {/* Action Buttons */}
        <div style={{
          padding: '6px 14px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          flexShrink: 0,
          zIndex: 10
        }}>
          <button 
            onClick={handlePrint}
            style={{
              padding: '6px 24px',
              background: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#2a4a7a'}
            onMouseLeave={(e) => e.target.style.background = '#1e3a5f'}
          >
            🖨️ Print
          </button>
          <button 
            onClick={onClose}
            style={{
              padding: '6px 24px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
            onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
          >
            Close
          </button>
        </div>

        {/* ============================================================
            RECEIPT - 10cm HEIGHT × 20.5cm WEIGHT (Landscape)
            ============================================================ */}
        <div 
          ref={receiptRef} 
          style={{ 
            width: '205mm',
            height: '100mm',
            padding: '0',
            margin: '0',
            background: 'white',
            fontFamily: '"Courier New", monospace',
            fontSize: '8pt',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid #e2e8f0',
            borderRadius: '0 0 8px 8px'
          }}
        >
          {/* MUNICIPAL NAME */}
          <div style={{
            position: 'absolute',
            top: '1.8cm',
            left: '4.5cm',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '18pt',
            fontWeight: 'bold',
            color: '#1a365d',
            letterSpacing: '3px',
            whiteSpace: 'nowrap'
          }}>
            LILOAN
          </div>

          {/* CONSUMER NAME */}
          <div style={{
            position: 'absolute',
            top: '2.8cm',
            left: '4.5cm',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '14pt',
            fontWeight: 'bold',
            color: '#1a365d',
            whiteSpace: 'nowrap',
            maxWidth: '8cm',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {consumerName}
          </div>

          {/* DATE */}
          <div style={{
            position: 'absolute',
            top: '3cm',
            left: '16.5cm',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '10pt',
            color: '#1a365d',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}>
            {formatDate(currentDate)}
          </div>

          {/* WATER FEE - WITH MONTH RANGE & YEAR */}
          <div style={{
            position: 'absolute',
            top: '5.1cm',
            left: '4cm',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '15pt',
            fontWeight: '600',
            color: '#1a365d',
            whiteSpace: 'nowrap'
          }}>
            WATER FEE: {waterFeePeriod}
          </div>

          {/* AMOUNT */}
          <div style={{
            position: 'absolute',
            top: '4.1cm',
            left: '16.5cm',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '12pt',
            fontWeight: '700',
            color: '#1a365d',
            whiteSpace: 'nowrap'
          }}>
            {formatCurrency(amount)}
          </div>

          {/* AMOUNT IN WORD */}
          <div style={{
            position: 'absolute',
            top: '7.5cm',
            left: '8cm',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '10pt',
            fontWeight: '700',
            color: '#1a365d',
            whiteSpace: 'nowrap',
            maxWidth: '9cm',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {amountInWords}
          </div>

          {/* TOTAL AMOUNT */}
          <div style={{
            position: 'absolute',
            top: '7cm',
            left: '16.5cm',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '14pt',
            fontWeight: '700',
            color: '#1a365d',
            whiteSpace: 'nowrap'
          }}>
            {formatCurrency(amount)}
          </div>

          {/* TREASURER NAME */}
          <div style={{
            position: 'absolute',
            top: '8.4cm',
            left: '16.2cm',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '8pt',
            fontWeight: '600',
            color: '#1a365d',
            whiteSpace: 'nowrap'
          }}>
            {treasurerName}
          </div>

          {/* TREASURER TITLE */}
          <div style={{
            position: 'absolute',
            top: '9.1cm',
            left: '16.2cm',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '7pt',
            fontWeight: '600',
            color: '#1a365d',
            whiteSpace: 'nowrap',
            letterSpacing: '1px'
          }}>
            {treasurerTitle}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrinter;