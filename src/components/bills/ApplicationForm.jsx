// src/bills/ApplicationForm.jsx
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import './ApplicationForm.css';
import logo from '../../assets/LOGO.png';

const ApplicationForm = ({ onClose }) => {
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    consumerName: '',
    age: '',
    location: '',
    contact: '',
    validId: '',
    numberOfHousehold: '',
    signatureOverPrinterName: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ============================================================
  // PRINT FUNCTION
  // ============================================================
  const handlePrint = async () => {
    try {
      const element = formRef.current;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 900,
        windowHeight: 1200
      });

      const printWindow = window.open('', '_blank', 'width=900,height=1300');
      if (!printWindow) {
        alert('Please allow popups for this site to print the form.');
        return;
      }

      const imgData = canvas.toDataURL('image/png');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>LGU Liloan Water System Application</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              @page {
                size: A4 portrait;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                background: #e8ecf1;
                font-family: 'Times New Roman', serif;
                padding-top: 20px;
              }
              .print-container {
                width: 210mm;
                min-height: 297mm;
                background: white;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                overflow: hidden;
              }
              .print-container img {
                width: 100%;
                display: block;
              }
              .no-print {
                text-align: center;
                padding: 12px;
                background: #f1f5f9;
                border-top: 1px solid #e2e8f0;
              }
              .no-print button {
                padding: 10px 32px;
                margin: 0 6px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
              }
              .print-btn { background: #1e3a5f; color: white; }
              .print-btn:hover { background: #2a4a7a; }
              .close-btn { background: #e2e8f0; color: #1e293b; }
              .close-btn:hover { background: #cbd5e1; }
              @media print {
                body { background: white; padding-top: 0; }
                .print-container { box-shadow: none; margin: 0; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <img src="${imgData}" alt="Application Form" />
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
      alert('Error printing form. Please try again.');
    }
  };

  // ============================================================
  // FIELD COMPONENT — reusable
  // ============================================================
  const FormField = ({ label, value, onChange }) => (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: '12px',
      marginBottom: '26px'
    }}>
      <label style={{
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        minWidth: '210px',
        fontSize: '14px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color: '#000',
        fontFamily: '"Times New Roman", Georgia, serif'
      }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          border: 'none',
          borderBottom: '1.5px solid #000',
          outline: 'none',
          background: 'transparent',
          fontSize: '14px',
          fontFamily: '"Times New Roman", Georgia, serif',
          padding: '4px 10px',
          color: '#000',
          minHeight: '26px'
        }}
      />
    </div>
  );

  return (
    <div className="application-modal-overlay" onClick={onClose}>
      <div
        className="application-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '880px',
          maxHeight: '95vh',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* TOP ACTION BAR */}
        <div style={{
          padding: '10px 16px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          flexShrink: 0
        }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 28px',
              background: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🖨️ Print
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 28px',
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        {/* SCROLLABLE FORM AREA */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
          background: '#f1f5f9'
        }}>
          {/* FORM DOCUMENT */}
          <div
            ref={formRef}
            style={{
              width: '100%',
              maxWidth: '820px',
              margin: '0 auto',
              background: 'white',
              padding: '55px 70px 70px',
              fontFamily: '"Times New Roman", Georgia, serif',
              color: '#000',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
          >
            {/* ============================================================ */}
            {/* HEADER WITH LOGO */}
            {/* ============================================================ */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              paddingBottom: '18px',
              borderBottom: '3px double #000',
              marginBottom: '26px'
            }}>
              {/* LOGO */}
              <div style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={logo}
                  alt="LGU Liloan Logo"
                  style={{
                    width: '115px',
                    height: '115px',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/115x115?text=LGU+LOGO';
                  }}
                />
              </div>

              {/* HEADER TEXT */}
              <div style={{
                flex: 1,
                textAlign: 'center'
              }}>
                <h1 style={{
                  fontSize: '26px',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                  margin: '0 0 6px 0',
                  textTransform: 'uppercase',
                  fontFamily: '"Times New Roman", Georgia, serif',
                  color: '#000',
                  lineHeight: '1.2'
                }}>
                  LGU LILOAN WATER SYSTEM
                </h1>
                <p style={{
                  fontSize: '13px',
                  letterSpacing: '1px',
                  margin: '0 0 12px 0',
                  color: '#333',
                  fontFamily: '"Times New Roman", Georgia, serif',
                  fontStyle: 'italic'
                }}>
                  Municipality of Liloan, Southern Leyte
                </p>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 36px',
                  border: '2px solid #000',
                  borderRadius: '3px'
                }}>
                  <h2 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    letterSpacing: '4px',
                    margin: 0,
                    textTransform: 'uppercase',
                    fontFamily: '"Times New Roman", Georgia, serif',
                    color: '#000'
                  }}>
                    APPLICATION FORM
                  </h2>
                </div>
              </div>
            </div>

            {/* SUBTITLE NOTE */}
            <p style={{
              textAlign: 'center',
              fontSize: '12px',
              fontStyle: 'italic',
              color: '#666',
              margin: '0 0 40px 0',
              letterSpacing: '0.3px',
              fontFamily: '"Times New Roman", Georgia, serif'
            }}>
              Please fill out all information clearly and completely
            </p>

            {/* ============================================================ */}
            {/* FORM FIELDS */}
            {/* ============================================================ */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <FormField
                label="Consumer Name:"
                value={formData.consumerName}
                onChange={(v) => handleChange('consumerName', v)}
              />

              <FormField
                label="Age:"
                value={formData.age}
                onChange={(v) => handleChange('age', v)}
              />

              <FormField
                label="Location:"
                value={formData.location}
                onChange={(v) => handleChange('location', v)}
              />

              <FormField
                label="Contact:"
                value={formData.contact}
                onChange={(v) => handleChange('contact', v)}
              />

              <FormField
                label="Valid ID #:"
                value={formData.validId}
                onChange={(v) => handleChange('validId', v)}
              />

              <FormField
                label="Number of Household:"
                value={formData.numberOfHousehold}
                onChange={(v) => handleChange('numberOfHousehold', v)}
              />

              <FormField
                label="Signature over Printer Name:"
                value={formData.signatureOverPrinterName}
                onChange={(v) => handleChange('signatureOverPrinterName', v)}
              />
            </div>

            {/* ============================================================ */}
            {/* FOOTER NOTE — NO BOX, JUST TEXT */}
            {/* ============================================================ */}
            <div style={{
              marginTop: '70px',
              paddingTop: '26px',
              borderTop: '2px dashed #666',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#000',
                margin: '0 0 6px 0',
                letterSpacing: '1.2px',
                fontFamily: '"Times New Roman", Georgia, serif',
                textTransform: 'uppercase',
                lineHeight: '1.8'
              }}>
                AFTER FILL OUT GO TO
              </p>
              <p style={{
                fontSize: '15px',
                fontWeight: 'bold',
                color: '#000',
                margin: '0 0 6px 0',
                letterSpacing: '1.5px',
                fontFamily: '"Times New Roman", Georgia, serif',
                textTransform: 'uppercase',
                lineHeight: '1.8'
              }}>
                MUNICIPAL ENGINEERING OFFICE
              </p>
              <p style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#000',
                margin: '0',
                letterSpacing: '1.2px',
                fontFamily: '"Times New Roman", Georgia, serif',
                textTransform: 'uppercase',
                lineHeight: '1.8'
              }}>
                FOR VERIFICATION
              </p>
            </div>

          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div style={{
          padding: '14px 20px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexShrink: 0
        }}>
          <button
            onClick={handlePrint}
            style={{
              padding: '12px 40px',
              background: 'linear-gradient(135deg, #1e3a5f, #25606e)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(30, 58, 95, 0.3)'
            }}
          >
            🖨️ PRINT
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 40px',
              background: '#FFFFFF',
              color: '#475569',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ✕ CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;