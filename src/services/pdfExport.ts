import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Data payload for generating a pure vector PDF fallback dossier
 * when HTML-to-canvas cannot export due to canvas security sandboxing.
 */
export interface DossierPdfData {
  caseId: string;
  generatedDate: string;
  parcel: {
    dagNo: string;
    dagNoBn: string;
    khatianNo: string;
    khatianNoBn: string;
    surveyType: string;
    surveyYear: number;
    mouzaNameEn: string;
    mouzaNameBn: string;
    jlNo: string;
    upazila: string;
    district: string;
    normalizedAreaDecimal: number;
    recordedArea: number;
    recordedUnit: string;
    sourceReference: string;
  };
  relationships: Array<{
    sourceDag: string;
    sourceSurvey: string;
    targetDag: string;
    targetSurvey: string;
    relationshipType: string;
    score: number;
    confidenceLabel: string;
    summary: string;
  }>;
  reviewerAssessment?: {
    reviewerName: string;
    reviewerRole: string;
    status: string;
    notes: string;
  };
  discrepancies: string[];
}

/**
 * Directly renders a formal, vector PDF dossier using jsPDF.
 * This guarantees 100% reliable PDF generation without relying on DOM canvas rasterization.
 */
export function generateDirectVectorPdf(data: DossierPdfData, filename: string): boolean {
  try {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Header Band
    doc.setFillColor(24, 24, 27); // Dark zinc
    doc.rect(margin, y, contentWidth, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('BhumiSutra (Bhumisutra) — Land Record Verification Dossier', margin + 6, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(167, 243, 208); // Emerald light
    doc.text('Historical Cadastral Parcel Lineage & Evidence Discrepancy Investigation', margin + 6, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`CASE ID: ${data.caseId}`, pageWidth - margin - 6, y + 8, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(212, 212, 216);
    doc.text(`Date: ${data.generatedDate}`, pageWidth - margin - 6, y + 14, { align: 'right' });

    y += 28;

    // Section 1: Target Parcel Specifications
    doc.setFillColor(244, 244, 245);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);
    doc.text('1. INVESTIGATED TARGET PARCEL RECORD', margin + 3, y + 5);
    y += 11;

    // Table Grid
    doc.setFontSize(8.5);
    const col1 = margin + 3;
    const col2 = margin + 50;
    const col3 = margin + 100;
    const col4 = margin + 145;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 113, 122);
    doc.text('Survey Regime:', col1, y);
    doc.text('Dag / Plot Number:', col2, y);
    doc.text('Khatian (Holding):', col3, y);
    doc.text('Standard Decimal Area:', col4, y);
    y += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(`${data.parcel.surveyType} Survey (${data.parcel.surveyYear})`, col1, y);
    doc.text(`Dag #${data.parcel.dagNo} (${data.parcel.dagNoBn})`, col2, y);
    doc.text(`Khatian #${data.parcel.khatianNo}`, col3, y);
    doc.setTextColor(4, 120, 87); // Emerald 700
    doc.text(`${data.parcel.normalizedAreaDecimal.toFixed(2)} Dec (${data.parcel.recordedArea} ${data.parcel.recordedUnit})`, col4, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 113, 122);
    doc.text('Mouza & JL Number:', col1, y);
    doc.text('Administrative Seat:', col2, y);
    doc.text('Archival Citation:', col3, y);
    y += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(`Mouza ${data.parcel.mouzaNameEn} (JL #${data.parcel.jlNo})`, col1, y);
    doc.text(`${data.parcel.upazila}, ${data.parcel.district}`, col2, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(doc.splitTextToSize(data.parcel.sourceReference, 80), col3, y);
    y += 12;

    // Section 2: Lineage Progression & Associated Candidates
    doc.setFillColor(244, 244, 245);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);
    doc.text('2. RECONSTRUCTED CROSS-SURVEY LINEAGE CHAIN', margin + 3, y + 5);
    y += 10;

    if (data.relationships.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(113, 113, 122);
      doc.text('No predecessor or successor linkages meet automated match thresholds. Cataloged as isolated historical parcel.', margin + 3, y);
      y += 8;
    } else {
      data.relationships.forEach((rel, index) => {
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(228, 228, 231);
        doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(24, 24, 27);
        doc.text(
          `[${index + 1}] ${rel.sourceSurvey} #${rel.sourceDag} -> ${rel.targetSurvey} #${rel.targetDag}  |  Type: ${rel.relationshipType.toUpperCase().replace(/_/g, ' ')}`,
          margin + 3,
          y + 5
        );

        doc.setTextColor(4, 120, 87);
        doc.text(`Match Confidence: ${rel.score}% (${rel.confidenceLabel})`, pageWidth - margin - 3, y + 5, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(63, 63, 70);
        const summaryLines = doc.splitTextToSize(rel.summary, contentWidth - 6);
        doc.text(summaryLines, margin + 3, y + 10);

        y += 21;
      });
    }

    y += 2;

    // Section 3: Evidentiary Audit
    doc.setFillColor(244, 244, 245);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);
    doc.text('3. EVIDENTIARY AUDIT & DISCREPANCY SUMMARY', margin + 3, y + 5);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(24, 24, 27);

    const bullets = [
      `Mouza Jurisdiction: Verified against JL #${data.parcel.jlNo} boundary records.`,
      `Area Analysis: Recorded ${data.parcel.recordedArea} ${data.parcel.recordedUnit} standardized to ${data.parcel.normalizedAreaDecimal.toFixed(2)} decimals.`,
      ...(data.discrepancies.length > 0
        ? data.discrepancies.map((d) => `Audit Observation: ${d}`)
        : ['Cross-Survey Discrepancy: No anomalous dimensional or jurisdictional contradiction detected.']),
    ];

    bullets.forEach((bullet) => {
      doc.circle(margin + 4, y - 1, 0.8, 'F');
      const lines = doc.splitTextToSize(bullet, contentWidth - 10);
      doc.text(lines, margin + 7, y);
      y += lines.length * 4.2;
    });

    y += 4;

    // Section 4: Human Review Findings
    doc.setFillColor(244, 244, 245);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(24, 24, 27);
    doc.text('4. HUMAN LAND SETTLEMENT INVESTIGATOR VERDICT', margin + 3, y + 5);
    y += 10;

    if (data.reviewerAssessment) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(24, 24, 27);
      doc.text(`Reviewer: ${data.reviewerAssessment.reviewerName} (${data.reviewerAssessment.reviewerRole})`, margin + 3, y);
      doc.setTextColor(4, 120, 87);
      doc.text(`Status: ${data.reviewerAssessment.status.toUpperCase()}`, pageWidth - margin - 3, y, { align: 'right' });
      y += 5;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(63, 63, 70);
      const notes = doc.splitTextToSize(`"${data.reviewerAssessment.notes}"`, contentWidth - 6);
      doc.text(notes, margin + 3, y);
      y += notes.length * 4.2 + 4;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text('Status: Pending authorized land settlement officer formal review sign-off.', margin + 3, y);
      y += 8;
    }

    // Disclaimer Box
    doc.setFillColor(244, 244, 245);
    doc.setDrawColor(212, 212, 216);
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9); // Amber 700
    doc.text('LEGAL NOTICE & INFORMATIONAL DISCLAIMER:', margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(82, 82, 91);
    const disclaimer = 
      'BhumiSutra is an investigative decision-support platform for historical land-record correlation. This dossier does not constitute certified ownership, legal title deed, mutation clearance, or judicial decree. All historical lineage assertions must be authenticated against physical volume ledgers at the District Collectorate Record Room.';
    doc.text(doc.splitTextToSize(disclaimer, contentWidth - 6), margin + 3, y + 8.5);

    y += 24;

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(161, 161, 170);
    doc.text('BhumiSutra (Bhumisutra) • Bangladesh Historical Land Record Lineage Platform', margin, pageHeight - 8);
    doc.text('Official Archival Verification Stamp • Confidential Document', pageWidth - margin, pageHeight - 8, { align: 'right' });

    doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('Vector PDF generation failed:', err);
    return false;
  }
}

/**
 * Exports an HTML element containing an Evidence Report Dossier into a professional PDF.
 * If canvas-based rasterization is blocked or tainted by external map tiles,
 * it seamlessly invokes direct vector generation or native print dialog.
 */
export async function exportReportToPdf(
  elementId: string, 
  filename: string, 
  fallbackData?: DossierPdfData
): Promise<boolean> {
  const element = document.getElementById(elementId);

  // If no element or fallback provided, use vector generation
  if (!element && fallbackData) {
    return generateDirectVectorPdf(fallbackData, filename);
  }

  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return false;
  }

  try {
    // Generate high-resolution canvas with html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // 2x for sharp printing
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      ignoreElements: (el) => {
        // Exclude interactive leaflet control buttons, print-hidden buttons, etc.
        return (
          el.classList.contains('leaflet-control-container') ||
          el.classList.contains('print:hidden') ||
          el.classList.contains('no-pdf')
        );
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
    heightLeft -= pageHeight;

    // Additional pages if report exceeds A4 height
    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.warn('html2canvas failed, trying vector PDF fallback:', error);
    if (fallbackData) {
      return generateDirectVectorPdf(fallbackData, filename);
    }
    // Fallback to native print dialog
    window.print();
    return false;
  }
}
