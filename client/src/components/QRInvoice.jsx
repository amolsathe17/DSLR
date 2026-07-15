import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Download, FileText, CheckCircle2, QrCode } from 'lucide-react';

export default function QRInvoice({ payment, onClose }) {
  const invoiceRef = useRef(null);

  if (!payment) return null;

  const downloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const primaryColor = '#4f46e5'; // indigo
      const darkColor = '#0f172a'; // slate 900
      const lightColor = '#f8fafc'; // slate 50
      const borderLineColor = '#e2e8f0'; // slate 200

      // Header Banner
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, 'F');

      // Title
      doc.setTextColor('#ffffff');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('DSLR CONTEST INVOICE', 15, 25);
      
      // Payment Status Badge
      doc.setFillColor('#10b981'); // emerald 500
      doc.roundedRect(160, 18, 35, 8, 1, 1, 'F');
      doc.setTextColor('#ffffff');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('PAID SUCCESS', 165, 23.5);

      // Metas
      doc.setTextColor(darkColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Left Column - Bill To
      doc.setFont('helvetica', 'bold');
      doc.text('Billed To:', 15, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${payment.userName || 'Participant'}`, 15, 61);
      doc.text(`Email: ${payment.userEmail}`, 15, 67);

      // Right Column - Invoice Metas
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Details:', 120, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${payment.invoiceNumber || 'INV-000000'}`, 120, 61);
      doc.text(`Txn ID: ${payment.transactionId}`, 120, 67);
      doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString()}`, 120, 73);

      // Divider Line
      doc.setDrawColor(borderLineColor);
      doc.line(15, 80, 195, 80);

      // Table Header
      doc.setFillColor(lightColor);
      doc.rect(15, 87, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 18, 92);
      doc.text('Amount (INR)', 160, 92);

      // Table Row
      doc.setFont('helvetica', 'normal');
      doc.text(`Competition Entry Fee - ${payment.packageName}`, 18, 103);
      doc.setFont('helvetica', 'bold');
      doc.text(`INR ${payment.amount}.00`, 160, 103);

      // Table Border lines
      doc.line(15, 87, 195, 87);
      doc.line(15, 95, 195, 95);
      doc.line(15, 108, 195, 108);

      // Totals
      doc.text('Total Amount Paid:', 120, 120);
      doc.setFontSize(14);
      doc.setTextColor(primaryColor);
      doc.text(`INR ${payment.amount}.00`, 160, 120);

      // Verification QR Code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(payment.qrContent || '')}`;
      doc.setTextColor(darkColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Scan to Verify Invoice Authenticity', 15, 140);
      doc.addImage(qrUrl, 'PNG', 15, 145, 30, 30);

      // Footer disclaimer
      doc.setFont('helvetica', 'italic');
      doc.setTextColor('#94a3b8');
      doc.setFontSize(8);
      doc.text('This is a computer-generated invoice. No physical signature is required.', 15, 190);
      doc.text('For queries, please email support@dslrcontest.com', 15, 195);

      // Save PDF
      doc.save(`invoice-${payment.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Could not download PDF. Please try again.');
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(payment.qrContent || '')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Success Banner */}
        <div className="bg-emerald-600 dark:bg-emerald-700 p-6 text-white text-center flex flex-col items-center gap-2">
          <div className="p-2 bg-white/20 rounded-full">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="font-display font-extrabold text-xl">Payment Successful!</h2>
          <p className="text-sm text-emerald-100">Your entry is now activated for the competition.</p>
        </div>

        {/* Invoice Body */}
        <div ref={invoiceRef} className="p-6 text-slate-800 dark:text-slate-200 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Invoice No</p>
              <p className="text-sm font-semibold">{payment.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Payment Date</p>
              <p className="text-sm font-semibold">{new Date(payment.paymentDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Participant:</span>
              <span className="font-medium">{payment.userName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Selected Package:</span>
              <span className="font-medium">{payment.packageName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono text-xs">{payment.transactionId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Method:</span>
              <span className="font-medium">{payment.paymentMethod}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-center">
            <span className="font-display font-bold text-slate-900 dark:text-white">Amount Paid:</span>
            <span className="font-display font-extrabold text-xl text-indigo-600 dark:text-indigo-400">
              ₹{payment.amount}.00
            </span>
          </div>

          {/* QR Scan and Verification Info */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 flex items-center gap-4 border border-slate-100 dark:border-slate-800">
            <img 
              src={qrImageUrl} 
              alt="Verification QR" 
              className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200"
            />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <QrCode size={14} className="text-indigo-600 dark:text-indigo-400" />
                Receipt Verification QR
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Scan this code to verify your transaction status and receipt authenticity against the database ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <button
            onClick={downloadPDF}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2 px-4 rounded-xl shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download size={16} />
            Download PDF Invoice
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm py-2 px-4 rounded-xl transition-all cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
