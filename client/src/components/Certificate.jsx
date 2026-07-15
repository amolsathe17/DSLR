import React from 'react';
import { jsPDF } from 'jspdf';
import { Download, Award, ShieldCheck } from 'lucide-react';

export default function Certificate({ user, submission, event, onClose }) {
  if (!user || !submission || !event) return null;

  // Determine if winner or participation
  const isWinner = event.winners?.some(w => w.userId === user.id);
  const winInfo = event.winners?.find(w => w.userId === user.id);

  const downloadCertificate = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Colors
      const goldColor = '#d97706'; // amber 600
      const primaryColor = '#4f46e5'; // indigo 600
      const borderLineColor = '#1e293b'; // slate 800

      // Border Design (A4 is 297mm x 210mm)
      // Outer border
      doc.setDrawColor(borderLineColor);
      doc.setLineWidth(1.5);
      doc.rect(8, 8, 281, 194);

      // Inner elegant border
      doc.setDrawColor(isWinner ? goldColor : primaryColor);
      doc.setLineWidth(0.8);
      doc.rect(12, 12, 273, 186);

      // Background decorative corner vectors
      doc.setFillColor(isWinner ? '#fef3c7' : '#e0e7ff'); // light amber or light indigo
      doc.triangle(12, 12, 35, 12, 12, 35, 'F');
      doc.triangle(285, 12, 262, 12, 285, 35, 'F');
      doc.triangle(12, 198, 35, 198, 12, 175, 'F');
      doc.triangle(285, 198, 262, 198, 285, 175, 'F');

      // Title
      doc.setFont('times', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(isWinner ? goldColor : '#1e293b');
      doc.text(isWinner ? 'CERTIFICATE OF EXCELLENCE' : 'CERTIFICATE OF PARTICIPATION', 148, 45, { align: 'center' });

      // Subtitle
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      doc.setTextColor('#64748b');
      doc.text('THIS IS PROUDLY PRESENTED TO', 148, 60, { align: 'center' });

      // Participant Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor('#0f172a');
      doc.text(user.name.toUpperCase(), 148, 78, { align: 'center' });

      // Line under name
      doc.setDrawColor('#e2e8f0');
      doc.setLineWidth(0.5);
      doc.line(78, 84, 218, 84);

      // Certificate content text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor('#475569');
      
      let bodyText = `for active participation in the "${event.title}"`;
      if (isWinner) {
        bodyText = `for securing ${winInfo.rank} with the photograph titled "${winInfo.photoTitle}"\nin the "${event.title}" under the themed category.`;
      }
      
      doc.text(bodyText, 148, 98, { align: 'center' });

      // Event details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor('#1e293b');
      doc.text(`Theme: ${event.theme}`, 148, 115, { align: 'center' });

      // Date & Signatures
      doc.line(40, 155, 100, 155); // Sign line left
      doc.line(197, 155, 257, 155); // Sign line right

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor('#64748b');
      doc.text('Date of Declaration', 70, 161, { align: 'center' });
      doc.text('Organizing Committee Chairperson', 227, 161, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#1e293b');
      doc.text(new Date(event.eventDate).toLocaleDateString(), 70, 151, { align: 'center' });
      doc.text('DSLR Contest Panel', 227, 151, { align: 'center' });

      // Verification QR
      const verifyData = JSON.stringify({
        certId: `CERT-${submission._id.slice(0, 6)}-${user.id.slice(0, 4)}`,
        event: event.title,
        recipient: user.name,
        rank: isWinner ? winInfo.rank : 'Participant'
      });
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyData)}`;
      doc.addImage(qrUrl, 'PNG', 133, 140, 30, 30);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor('#94a3b8');
      doc.text('Scan to Verify Certificate', 148, 175, { align: 'center' });

      // Save PDF
      doc.save(`certificate-${user.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Could not download PDF. Please try again.');
    }
  };

  const verifyDataStr = JSON.stringify({
    certId: `CERT-${submission._id.slice(0, 6)}-${user.id.slice(0, 4)}`,
    event: event.title,
    recipient: user.name,
    rank: isWinner ? winInfo.rank : 'Participant'
  });
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyDataStr)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Certificate Display Area */}
        <div className="p-8 md:p-12 overflow-x-auto">
          <div className="min-w-[650px] aspect-[1.414/1] bg-slate-50 dark:bg-slate-900/40 border-4 border-slate-900 dark:border-slate-800 p-8 flex flex-col justify-between text-center relative select-none rounded-lg shadow-inner">
            
            {/* Elegant corner decals */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-indigo-600 dark:border-indigo-500 m-2"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-indigo-600 dark:border-indigo-500 m-2"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-indigo-600 dark:border-indigo-500 m-2"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-indigo-600 dark:border-indigo-500 m-2"></div>

            <div className="flex flex-col items-center gap-1">
              <Award className={`w-12 h-12 ${isWinner ? 'text-amber-500 animate-bounce' : 'text-indigo-600'}`} />
              <h2 className="font-display font-extrabold text-2xl tracking-wide text-slate-900 dark:text-white uppercase">
                {isWinner ? 'Certificate of Excellence' : 'Certificate of Participation'}
              </h2>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                This is proudly presented to
              </p>
            </div>

            <div className="my-6">
              <h3 className="font-display font-black text-3xl text-indigo-600 dark:text-indigo-400 capitalize">
                {user.name}
              </h3>
              <div className="w-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 mx-auto mt-2"></div>
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto flex flex-col gap-2">
              <p>
                {isWinner ? (
                  <span>
                    for outstanding performance and securing <strong className="text-amber-600 dark:text-amber-400 font-bold">{winInfo.rank}</strong> in the category of <strong className="font-bold">"{winInfo.photoTitle}"</strong> during the:
                  </span>
                ) : (
                  <span>
                    for active involvement and exhibiting exceptional skill in the:
                  </span>
                )}
              </p>
              <p className="font-display font-bold text-slate-800 dark:text-slate-100 text-base">
                {event.title}
              </p>
              <p className="text-xs text-slate-500">Theme: {event.theme}</p>
            </div>

            <div className="flex items-end justify-between mt-8">
              <div className="text-left">
                <p className="font-display font-semibold text-xs text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800 pt-1.5 min-w-[140px]">
                  {new Date(event.eventDate).toLocaleDateString()}
                </p>
                <p className="text-[10px] text-slate-400">Date of Declaration</p>
              </div>

              <div className="flex flex-col items-center">
                <img 
                  src={qrCodeUrl} 
                  alt="Verify" 
                  className="w-16 h-16 bg-white p-0.5 rounded border border-slate-200"
                />
                <span className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-0.5">
                  <ShieldCheck size={8} className="text-emerald-500" />
                  Secured QR Verify
                </span>
              </div>

              <div className="text-right">
                <p className="font-display font-semibold text-xs text-slate-800 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800 pt-1.5 min-w-[140px]">
                  DSLR Contest Panel
                </p>
                <p className="text-[10px] text-slate-400">Organizing Committee</p>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 dark:bg-slate-900/40 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm py-2 px-5 rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={downloadCertificate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2 px-5 rounded-xl shadow hover:shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download size={16} />
            Download PDF Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
