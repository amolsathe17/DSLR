const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateBackupPdf = async (event, submissions, payments, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const writeStream = fs.createWriteStream(outputPath);
      doc.pipe(writeStream);

      // Styles
      const primaryColor = '#4f46e5'; // Indigo
      const secondaryColor = '#0f172a'; // Slate-900
      const mutedColor = '#64748b'; // Slate-500
      const accentColor = '#10b981'; // Emerald

      // Document Title
      doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text('Contest History & Event Snapshot Backup', { align: 'center' });
      doc.moveDown(0.5);
      doc.fillColor(mutedColor).fontSize(10).font('Helvetica').text(`Backup Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Section 1: Event Details
      doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text('1. Event & Contest General Information');
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').fillColor(secondaryColor);
      doc.text(`Title: `, { continued: true }).font('Helvetica').text(event.title);
      doc.font('Helvetica-Bold').text(`Type: `, { continued: true }).font('Helvetica').text(event.eventType);
      doc.font('Helvetica-Bold').text(`Status: `, { continued: true }).font('Helvetica').text(event.status);
      doc.font('Helvetica-Bold').text(`Venue: `, { continued: true }).font('Helvetica').text(event.venue || 'N/A');
      doc.font('Helvetica-Bold').text(`Deadline: `, { continued: true }).font('Helvetica').text(new Date(event.deadline).toLocaleDateString());
      
      if (event.hasExhibition) {
        const fromD = event.exhibitionFromDate ? new Date(event.exhibitionFromDate).toLocaleDateString() : 'N/A';
        const toD = event.exhibitionToDate ? new Date(event.exhibitionToDate).toLocaleDateString() : 'N/A';
        doc.font('Helvetica-Bold').text(`Exhibition Schedule: `, { continued: true }).font('Helvetica').text(`${fromD} to ${toD}`);
      }
      doc.moveDown(1.5);

      // Section 2: Prizes & Rewards
      doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text('2. Prizes & Package Fees');
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').text('Prizes:');
      if (event.prizes && event.prizes.length > 0) {
        event.prizes.forEach(p => {
          doc.fontSize(9).font('Helvetica').text(`- ${p.rank}: ${p.reward} (${p.description || ''})`);
        });
      } else {
        doc.fontSize(9).font('Helvetica').text('No prizes configured.');
      }
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').text('Entry Packages:');
      if (event.packages && event.packages.length > 0) {
        event.packages.forEach(p => {
          doc.fontSize(9).font('Helvetica').text(`- ${p.name}: INR ${p.price} (Max ${p.maxPhotos} uploads)`);
        });
      } else {
        doc.fontSize(9).font('Helvetica').text('No packages configured.');
      }
      doc.moveDown(1.5);

      // Section 3: Revenue & Payments Ledger
      doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text('3. Revenue Ledger & Payment Transactions');
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
      doc.fontSize(10).font('Helvetica-Bold').text(`Total Ledger Count: `, { continued: true }).font('Helvetica').text(`${payments.length} successful payment(s)`);
      doc.fontSize(10).font('Helvetica-Bold').text(`Total Revenue Collected: `, { continued: true }).font('Helvetica').fillColor(accentColor).text(`INR ${totalRevenue}`);
      doc.fillColor(secondaryColor);
      doc.moveDown(0.5);

      if (payments.length > 0) {
        payments.forEach((p, idx) => {
          doc.fontSize(8).font('Helvetica-Bold').text(`[Transaction #${idx + 1}] Invoice: `, { continued: true }).font('Helvetica').text(`${p.invoiceNumber || 'N/A'} | ID: ${p.transactionId}`);
          doc.fontSize(8).font('Helvetica').text(`Buyer: ${p.userName} (${p.userEmail}) | Package: ${p.packageName} | Paid: INR ${p.amount} on ${p.paymentDate ? new Date(p.paymentDate).toLocaleString() : 'N/A'}`);
          doc.moveDown(0.3);
        });
      } else {
        doc.fontSize(9).font('Helvetica').text('No financial transactions recorded for this event.');
      }
      doc.moveDown(1.5);

      // Section 4: Winners List (if completed)
      if (event.winners && event.winners.length > 0) {
        doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text('4. Contest Winners & Rankings');
        doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        event.winners.forEach(w => {
          doc.fontSize(9).font('Helvetica-Bold').text(`${w.rank}: `, { continued: true }).font('Helvetica').text(`${w.userName} - "${w.photoTitle}" (Score: ${w.score || 'N/A'}) [Reward: ${w.reward || ''}]`);
        });
        doc.moveDown(1.5);
      }

      // Add a page for participant submissions
      doc.addPage();
      doc.fillColor(secondaryColor).fontSize(14).font('Helvetica-Bold').text('5. Participant Submissions & Uploaded Media Metadata');
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold').text(`Total Registered Entries: `, { continued: true }).font('Helvetica').text(`${submissions.length} submission folder(s)`);
      doc.moveDown(0.5);

      if (submissions.length > 0) {
        submissions.forEach((sub, subIdx) => {
          doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text(`[Submission Folder #${subIdx + 1}] Entry: ${sub.entryNumber || 'N/A'} | Status: ${sub.entryStatus}`);
          doc.fontSize(8).font('Helvetica').fillColor(secondaryColor).text(`Participant: ${sub.userName} (${sub.userEmail}) | Package: ${sub.eventTitle || ''} - ${sub.photoLimit} uploads | Paid: ${sub.paymentStatus}`);
          doc.moveDown(0.3);

          if (sub.photographs && sub.photographs.length > 0) {
            sub.photographs.forEach((photo, photoIdx) => {
              doc.fontSize(8).font('Helvetica-Bold').text(`   * Photo #${photoIdx + 1}: "${photo.title}" | Category: ${photo.category} | Status: ${photo.status}`);
              
              if (event.eventType === 'Photography') {
                doc.fontSize(7).font('Helvetica').text(`     EXIF: Brand: ${photo.cameraBrand || 'N/A'} | Model: ${photo.cameraModel || 'N/A'} | Lens: ${photo.lensUsed || 'N/A'} | Location: ${photo.location || 'N/A'}`);
              } else {
                doc.fontSize(7).font('Helvetica').text(`     Details: Medium: ${photo.cameraBrand || 'N/A'} | Dimensions: ${photo.cameraModel || 'N/A'} | Materials: ${photo.lensUsed || 'N/A'} | Location: ${photo.location || 'N/A'}`);
              }

              if (photo.scores && photo.scores.length > 0) {
                photo.scores.forEach(s => {
                  doc.fontSize(7).font('Helvetica').text(`     Grading by ${s.judgeName}: Creativity: ${s.creativity}, Composition: ${s.composition}, Tech: ${s.technicalQuality}, Overall: ${s.overallImpact} | Remarks: "${s.remarks || 'None'}"`);
                });
                const totalScoreAvg = photo.scores.reduce((acc, s) => acc + s.averageScore, 0) / photo.scores.length;
                doc.fontSize(7).font('Helvetica-Bold').text(`     Average Evaluation Score: ${totalScoreAvg.toFixed(2)}/10`);
              } else {
                doc.fontSize(7).font('Helvetica').text('     Grading Status: Unrated / Pending evaluation');
              }
              doc.moveDown(0.2);
            });
          } else {
            doc.fontSize(8).font('Helvetica').text('   * No media uploaded in this entry folder.');
          }
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(9).font('Helvetica').text('No submissions folders found for this event.');
      }

      doc.end();

      writeStream.on('finish', () => resolve(outputPath));
      writeStream.on('error', (err) => reject(err));
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = { generateBackupPdf };
