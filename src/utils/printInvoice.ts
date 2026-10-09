/**
 * MobiFlow Software — Dedicated Invoice & Receipt Printing Engine
 * Provides pixel-perfect A4 and 80mm Thermal printing
 * with isolated print stylesheets, zero ancestor layout clipping,
 * and exact content-based auto-height for thermal receipt printers.
 */

export type PrintFormat = 'a4' | '80mm' | '58mm';

export interface PrintOptions {
  format?: PrintFormat;
  documentTitle?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Returns the exact print CSS rules needed for thermal or A4 printing
 */
export function getPrintCss(format: PrintFormat): string {
  if (format === '80mm') {
    return `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      *, *::before, *::after {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        width: 80mm !important;
        max-width: 80mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        height: auto !important;
        min-height: 0 !important;
        font-family: 'JetBrains Mono', monospace, -apple-system, sans-serif !important;
        font-size: 11px !important;
        line-height: 1.25 !important;
        overflow: visible !important;
      }
      body > *:not(#mobiflow-print-mount) {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        max-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      #mobiflow-print-mount {
        display: block !important;
        visibility: visible !important;
        position: static !important;
        width: 80mm !important;
        max-width: 80mm !important;
        margin: 0 auto !important;
        padding: 2mm 3mm 4mm 3mm !important;
        background: #ffffff !important;
        color: #000000 !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        box-shadow: none !important;
        border: none !important;
      }
      #mobiflow-print-mount * {
        visibility: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #mobiflow-print-mount .thermal-receipt-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        box-shadow: none !important;
        border: none !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        page-break-inside: auto !important;
      }
      .no-print {
        display: none !important;
      }
    `;
  }

  if (format === '58mm') {
    return `
      @page {
        size: 58mm auto;
        margin: 0;
      }
      *, *::before, *::after {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      html, body {
        width: 58mm !important;
        max-width: 58mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        height: auto !important;
        min-height: 0 !important;
        font-family: 'JetBrains Mono', monospace, -apple-system, sans-serif !important;
        font-size: 10px !important;
        line-height: 1.2 !important;
        overflow: visible !important;
      }
      body > *:not(#mobiflow-print-mount) {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        max-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      #mobiflow-print-mount {
        display: block !important;
        visibility: visible !important;
        position: static !important;
        width: 58mm !important;
        max-width: 58mm !important;
        margin: 0 auto !important;
        padding: 1.5mm 2mm 3mm 2mm !important;
        background: #ffffff !important;
        color: #000000 !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        box-shadow: none !important;
        border: none !important;
      }
      #mobiflow-print-mount * {
        visibility: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #mobiflow-print-mount .thermal-receipt-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        box-shadow: none !important;
        border: none !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
      }
      .no-print {
        display: none !important;
      }
    `;
  }

  // Standard A4 Portrait Invoice
  return `
    @page {
      size: A4 portrait;
      margin: 8mm 8mm 8mm 8mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
      font-size: 12px !important;
      height: auto !important;
      min-height: 0 !important;
    }
    body > *:not(#mobiflow-print-mount) {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      max-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
    #mobiflow-print-mount {
      display: block !important;
      visibility: visible !important;
      position: static !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      height: auto !important;
      min-height: 0 !important;
      box-shadow: none !important;
      border: none !important;
      overflow: visible !important;
    }
    #mobiflow-print-mount * {
      visibility: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #mobiflow-print-mount .a4-invoice-container {
      width: 100% !important;
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      box-shadow: none !important;
      border: none !important;
      height: auto !important;
      min-height: 0 !important;
    }
    .no-print {
      display: none !important;
    }
    table {
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    tfoot {
      display: table-footer-group;
    }
  `;
}

/**
 * Triggers the browser's real print dialog.
 * Uses a dedicated DOM print container mounted directly on document.body,
 * with exact print styles and zero application UI leakage.
 */
export async function printInvoice(
  contentHtmlOrElement: string | HTMLElement,
  options: PrintOptions = {}
): Promise<boolean> {
  const {
    format = '80mm',
    documentTitle = 'MobiFlow Invoice',
    onBeforePrint,
    onAfterPrint,
    onError,
  } = options;

  let targetElement: HTMLElement | null = null;
  if (typeof contentHtmlOrElement === 'string') {
    targetElement = document.getElementById(contentHtmlOrElement);
  } else if (contentHtmlOrElement instanceof HTMLElement) {
    targetElement = contentHtmlOrElement;
  }

  if (!targetElement) {
    const err = new Error('Printable invoice element not found in DOM.');
    console.error(err);
    onError?.(err);
    return false;
  }

  if (onBeforePrint) onBeforePrint();

  // Save current document title
  const originalTitle = document.title;
  document.title = documentTitle;

  // Clean up any stale print mount or styles
  const existingMount = document.getElementById('mobiflow-print-mount');
  if (existingMount) existingMount.remove();

  const existingStyle = document.getElementById('mobiflow-print-dynamic-style');
  if (existingStyle) existingStyle.remove();

  try {
    // 1. Create a dedicated print mount directly attached to document.body
    const printMount = document.createElement('div');
    printMount.id = 'mobiflow-print-mount';
    printMount.className = `mobiflow-print-${format}`;

    // 2. Clone the printable content
    const cloned = targetElement.cloneNode(true) as HTMLElement;
    cloned.id = 'mobiflow-print-content-clone';

    // Remove screen-only container styles that would interfere with print
    cloned.style.boxShadow = 'none';
    cloned.style.border = 'none';
    cloned.style.borderRadius = '0';
    cloned.style.margin = '0 auto';

    if (format === '80mm' || format === '58mm') {
      const widthMm = format === '80mm' ? '80mm' : '58mm';
      cloned.style.width = widthMm;
      cloned.style.maxWidth = widthMm;
      cloned.style.height = 'auto';
      cloned.style.minHeight = '0';
      cloned.style.maxHeight = 'none';
      cloned.style.padding = '0';
    } else {
      cloned.style.width = '100%';
      cloned.style.maxWidth = '100%';
      cloned.style.height = 'auto';
      cloned.style.minHeight = '0';
      cloned.style.maxHeight = 'none';
      cloned.style.padding = '0';
    }

    printMount.appendChild(cloned);
    document.body.appendChild(printMount);

    // 3. Set print format attribute on body
    document.body.classList.add('mobiflow-is-printing');
    document.body.setAttribute('data-print-format', format);

    // 4. Inject format-specific print stylesheet
    const styleEl = document.createElement('style');
    styleEl.id = 'mobiflow-print-dynamic-style';
    styleEl.innerHTML = `@media print { ${getPrintCss(format)} }`;
    document.head.appendChild(styleEl);

    // 5. Ensure all images inside the clone are decoded before opening print
    const images = Array.from(cloned.querySelectorAll('img'));
    if (images.length > 0) {
      await Promise.all(
        images.map(async (img) => {
          if (img.complete) return;
          try {
            await img.decode();
          } catch {
            // Ignore decode failures on broken images
          }
        })
      );
    }

    // Small delay to ensure styles and font rendering are settled
    await new Promise((r) => setTimeout(r, 60));

    // 6. Cleanup handler
    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;

      try {
        if (printMount.parentNode) {
          printMount.remove();
        }
        if (styleEl.parentNode) {
          styleEl.remove();
        }
        document.body.classList.remove('mobiflow-is-printing');
        document.body.removeAttribute('data-print-format');
        document.title = originalTitle;
      } catch (e) {
        console.warn('Print cleanup notice:', e);
      }

      onAfterPrint?.();
    };

    // Listen for afterprint event
    window.addEventListener('afterprint', cleanup, { once: true });

    // Fallback timer to ensure cleanup if afterprint does not fire
    setTimeout(cleanup, 4000);

    // 7. Trigger the real browser print dialog
    window.print();

    return true;
  } catch (error: any) {
    console.error('Error executing print dialog:', error);
    onError?.(error);

    // Emergency cleanup
    try {
      document.getElementById('mobiflow-print-mount')?.remove();
      document.getElementById('mobiflow-print-dynamic-style')?.remove();
      document.body.classList.remove('mobiflow-is-printing');
      document.title = originalTitle;
    } catch {
      // ignore
    }

    return false;
  }
}
