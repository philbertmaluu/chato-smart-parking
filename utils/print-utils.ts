/**
 * Print utilities for handling printing in Tauri and web environments
 */

interface PrintOptions {
  title?: string;
  content: string;
}

/**
 * Generate receipt HTML content for printing
 */
export function generateReceiptHTML(receiptData: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Parking Receipt</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: black;
        }
        .receipt {
          max-width: 400px;
          margin: 0 auto;
          border: 2px dashed #ccc;
          padding: 20px;
          border-radius: 8px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: #8B0000;
          border-radius: 50%;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          margin: 0;
        }
        .subtitle {
          font-size: 12px;
          color: #666;
          margin: 5px 0 0 0;
        }
        .details {
          font-size: 12px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .label {
          font-weight: normal;
        }
        .value {
          font-weight: bold;
        }
        .amount {
          border-top: 1px solid #ccc;
          padding-top: 8px;
          margin-top: 8px;
          font-weight: bold;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #666;
          margin-top: 20px;
        }
        @media print {
          body { margin: 0; }
          .receipt { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">🚗</div>
          <h1 class="title">Smart Parking System</h1>
          <p class="subtitle">Entry Receipt</p>
        </div>
        
        <div class="details">
          <div class="row">
            <span class="label">Receipt ID:</span>
            <span class="value">${receiptData.receiptId}</span>
          </div>
          ${receiptData.passageNumber ? `
          <div class="row">
            <span class="label">Passage Number:</span>
            <span class="value">${receiptData.passageNumber}</span>
          </div>
          ` : ''}
          <div class="row">
            <span class="label">License Plate:</span>
            <span class="value">${receiptData.plateNumber}</span>
          </div>
          <div class="row">
            <span class="label">Vehicle Type:</span>
            <span class="value">${receiptData.vehicleType}</span>
          </div>
          <div class="row">
            <span class="label">Entry Time:</span>
            <span class="value">${receiptData.entryTime}</span>
          </div>
          ${receiptData.gate ? `
          <div class="row">
            <span class="label">Gate:</span>
            <span class="value">${receiptData.gate}</span>
          </div>
          ` : ''}
          ${receiptData.passageType ? `
          <div class="row">
            <span class="label">Passage Type:</span>
            <span class="value">${receiptData.passageType}</span>
          </div>
          ` : ''}
          ${receiptData.paymentMethod ? `
          <div class="row">
            <span class="label">Payment Method:</span>
            <span class="value">${receiptData.paymentMethod}</span>
          </div>
          ` : ''}
          <div class="row amount">
            <span class="label">Amount:</span>
            <span class="value">
              ${receiptData.passageType === "free" || receiptData.passageType === "exempted"
                ? "FREE"
                : `Tsh. ${receiptData.amount || receiptData.rate}.00`}
            </span>
          </div>
        </div>
        
        <div class="footer">
          <p>Please keep this receipt for exit</p>
          <p>Lost receipts subject to maximum daily rate</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Print content using available methods
 */
export async function printContent(options: PrintOptions): Promise<void> {
  try {
    // For desktop app, use a simple approach that works reliably
    createSimplePrintWindow(options);
  } catch (error) {
    console.error('Print error:', error);
    throw new Error('Failed to print content');
  }
}



/**
 * Create a simple print window for desktop fallback
 */
function createSimplePrintWindow(options: PrintOptions): void {
  // For desktop apps, create a downloadable HTML file
  const blob = new Blob([options.content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Create a download link
  const link = document.createElement('a');
  link.href = url;
  link.download = `parking-receipt-${Date.now()}.html`;
  link.style.display = 'none';
  
  // Add to document and trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}



/**
 * Save receipt as PDF (placeholder for future implementation)
 */
export async function saveAsPDF(receiptData: any): Promise<void> {
  try {
    const htmlContent = generateReceiptHTML(receiptData);
    
    // For now, we'll use the print functionality
    // In the future, this could use a PDF generation library
    await printContent({
      title: 'Parking Receipt',
      content: htmlContent
    });
  } catch (error) {
    console.error('PDF save error:', error);
    throw new Error('Failed to save as PDF');
  }
}
