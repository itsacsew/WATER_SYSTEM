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

  const formatDateShort = (date) => {
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const numberToWords = (num) => {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convert = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      return 'Number too large';
    };
    
    const parts = num.toString().split('.');
    const whole = parseInt(parts[0]);
    const cents = parts[1] ? parseInt(parts[1].padEnd(2, '0')) : 0;
    
    let result = convert(whole);
    if (cents > 0) {
      result += ' and ' + convert(cents) + ' Cents';
    }
    return result + ' Pesos Only';
  };

  const handlePrint = async () => {
    try {
      const element = receiptRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 360,
        height: element.scrollHeight,
        windowWidth: 360,
      });
      
      const printWindow = window.open('', '_blank', 'width=400,height=600');
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
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f0f4f8;
                font-family: 'Courier New', monospace;
              }
              .print-container {
                width: 360px;
                background: white;
                padding: 0;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .print-container img {
                width: 100%;
                height: auto;
                display: block;
              }
              @media print {
                body {
                  background: white;
                  margin: 0;
                  padding: 0;
                }
                .print-container {
                  box-shadow: none;
                  width: 100%;
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
              <div class="no-print" style="text-align:center;padding:10px;background:#f0f4f8;margin:0;">
                <button onclick="window.print()" style="padding:10px 30px;margin:5px;background:linear-gradient(135deg,#1e3a5f,#4a90d9);color:white;border:none;border-radius:5px;cursor:pointer;font-size:14px;">
                  🖨️ Print Receipt
                </button>
                <button onclick="window.close()" style="padding:10px 30px;margin:5px;background:#e53e3e;color:white;border:none;border-radius:5px;cursor:pointer;font-size:14px;">
                  Close
                </button>
              </div>
            </div>
            <script>
              setTimeout(() => { window.print(); }, 1000);
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
    setTimeout(() => {
      handlePrint();
    }, 500);
  }, []);

  const consumerInfo = `${bill.consumerName || 'N/A'} - ${bill.location || 'N/A'}`;
  const monthName = bill.month || 'N/A';
  const amount = bill.amount || 0;
  const amountInWords = numberToWords(amount);

  return (
    <div className="receipt-modal-overlay" onClick={onClose}>
      <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-actions">
          <button className="receipt-print-btn" onClick={handlePrint}>
            🖨️ Print Receipt
          </button>
          <button className="receipt-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
        
        <div ref={receiptRef} className="official-receipt" style={{ width: '360px', padding: '12px', background: 'white', fontFamily: '"Courier New", monospace', fontSize: '9px', border: '1px solid #e2e8f0' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a5f', paddingBottom: '4px', marginBottom: '4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e3a5f' }}>Republic of the Philippines</div>
            <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e3a5f' }}>Province of Southern Leyte</div>
            <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '2px', color: '#1e3a5f' }}>OFFICIAL RECEIPT</div>
            <div style={{ fontSize: '10px', marginTop: '2px', color: '#1e3a5f' }}>
              No. <span style={{ fontWeight: 'bold', letterSpacing: '1px' }}>{referenceNumber || 'N/A'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #1e3a5f', padding: '2px 0' }}>
            <div style={{ flex: 1, paddingRight: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e3a5f' }}>PAYOR</div>
              <div style={{ fontSize: '9px', fontWeight: 'bold', wordWrap: 'break-word', color: '#1e3a5f' }}>
                {consumerInfo}
              </div>
            </div>
            <div style={{ flex: 1, padding: '0 4px', borderLeft: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e3a5f' }}>NATURE OF COLLECTION</div>
              <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e3a5f' }}>
                WATER FEE - {monthName}
              </div>
            </div>
            <div style={{ flex: 0.6, paddingLeft: '4px', textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e3a5f' }}>AMOUNT</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e3a5f' }}>
                {formatCurrency(amount)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #1e3a5f', padding: '2px 0' }}>
            <div style={{ flex: 1, paddingRight: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e3a5f' }}>MUNICIPALITY</div>
              <div style={{ fontSize: '9px', color: '#1e3a5f' }}>{bill.location || 'N/A'}</div>
            </div>
            <div style={{ flex: 1, padding: '0 4px', borderLeft: '1px solid #1e3a5f', borderRight: '1px solid #1e3a5f' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e3a5f' }}>FUND</div>
              <div style={{ fontSize: '9px', color: '#1e3a5f' }}>Water Fund</div>
            </div>
            <div style={{ flex: 1, padding: '0 4px', borderRight: '1px solid #1e3a5f' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e3a5f' }}>ACCOUNT CODE</div>
              <div style={{ fontSize: '9px', color: '#1e3a5f' }}>WTR-001</div>
            </div>
            <div style={{ flex: 0.6, paddingLeft: '4px', textAlign: 'right' }}>
              <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e3a5f' }}>{formatCurrency(amount)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #1e3a5f', padding: '2px 0' }}>
            <div style={{ flex: 1, paddingRight: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e3a5f' }}>VALIDATION DATE</div>
              <div style={{ fontSize: '9px', color: '#1e3a5f' }}>{formatDateShort(currentDate)}</div>
            </div>
            <div style={{ flex: 1, padding: '0 4px', borderLeft: '1px solid #1e3a5f' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e3a5f' }}>DATE</div>
              <div style={{ fontSize: '9px', color: '#1e3a5f' }}>{formatDate(currentDate)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 4px 0', borderBottom: '1px solid #1e3a5f' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #1e3a5f', padding: '2px 0', marginBottom: '2px' }}>
                <span style={{ fontSize: '8px', color: '#1e3a5f' }}>_________________________________</span>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e3a5f' }}>PROVINCIAL MUNICIPAL TREASURER</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', borderLeft: '1px solid #1e3a5f', paddingLeft: '8px' }}>
              <div style={{ borderBottom: '1px solid #1e3a5f', padding: '2px 0', marginBottom: '2px' }}>
                <span style={{ fontSize: '8px', color: '#1e3a5f' }}>_________________________________</span>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e3a5f' }}>DEPUTY COLLECTOR</div>
            </div>
          </div>

          <div style={{ paddingTop: '4px', borderBottom: '1px solid #1e3a5f' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 'bold', fontSize: '8px', color: '#1e3a5f' }}>AMOUNT IN WORDS</span>
              <span style={{ fontSize: '8px', textTransform: 'uppercase', color: '#1e3a5f' }}>{amountInWords}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '2px solid #1e3a5f' }}>
            <span style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e3a5f' }}>TOTAL</span>
            <span style={{ fontWeight: 'bold', fontSize: '10px', color: '#1e3a5f' }}>{formatCurrency(amount)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '8px', borderBottom: '1px solid #1e3a5f' }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#1e3a5f' }}>☐ Money Order</div>
              <div style={{ fontWeight: 'bold', color: '#1e3a5f' }}>☐ Check</div>
              <div style={{ fontWeight: 'bold', color: '#1e3a5f' }}>☐ Cash</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#1e3a5f' }}>BANK: <span style={{ fontWeight: 'bold' }}>N/A</span></div>
              <div style={{ color: '#1e3a5f' }}>DRAWEE: <span style={{ fontWeight: 'bold' }}>N/A</span></div>
              <div style={{ color: '#1e3a5f' }}>NUMBER: <span style={{ fontWeight: 'bold' }}>N/A</span></div>
              <div style={{ color: '#1e3a5f' }}>DATE: <span style={{ fontWeight: 'bold' }}>{formatDateShort(currentDate)}</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '8px' }}>
            <div style={{ color: '#1e3a5f' }}>dated above</div>
            <div style={{ color: '#1e3a5f' }}>Received the amount</div>
          </div>

          <div style={{ fontSize: '7px', paddingTop: '2px', borderTop: '1px solid #e2e8f0', marginTop: '2px', color: '#718096' }}>
            NOTE: Write the number and date of this receipt on the back of check or money order received.
            <div style={{ marginTop: '2px' }}>
              Payment Code: <span style={{ fontWeight: 'bold', color: '#1e3a5f' }}>{paymentCode}</span>
              {' | '}
              Payment Date: {formatDate(currentDate)}
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '7px', marginTop: '4px', color: '#a0aec0', borderTop: '1px dashed #e2e8f0', paddingTop: '4px' }}>
            💧 WaterBill System • Generated: {formatDate(currentDate)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrinter;