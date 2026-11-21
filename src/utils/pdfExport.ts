import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import type { DocumentType } from '../types/coverPage';
import { getExportFilename } from './coverPageLogic';

export async function exportCoverPageToPdf(
  element: HTMLElement,
  documentType: DocumentType
): Promise<string> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Ensure any uploaded logo image inside the export node is decoded before capture
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const finish = () => resolve();
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', finish, { once: true });
        })
    )
  );

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    width: 794,
    height: 1123,
    windowWidth: 794,
    windowHeight: 1123,
    scrollX: 0,
    scrollY: 0,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Exact A4 dimensions: 210mm x 297mm, guaranteed single page
  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

  const filename = getExportFilename(documentType);
  pdf.save(filename);
  return filename;
}
