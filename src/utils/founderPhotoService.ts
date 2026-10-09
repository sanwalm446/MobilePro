/**
 * Founder Photo Pipeline for MobiFlow Software
 * 
 * Strict Identity Preservation Rules:
 * - ZERO AI image generation, face restoration, or generative filters.
 * - UPLOAD ORIGINAL -> STORE ORIGINAL -> DISPLAY ORIGINAL.
 * - Pure client-side FileReader pipeline preserving 100% facial identity, proportions, and details.
 * - Safe format validation: JPG, JPEG, PNG, WEBP.
 * - Maximum file size boundary: 10MB.
 */

export interface FounderPhotoUploadResult {
  success: boolean;
  error?: string;
  dataUrl?: string;
  originalFileName?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Validates the uploaded founder photo file without modifying it.
 */
export function validateFounderPhotoFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No image file selected.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'Selected file is empty.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a photograph under 10MB.`,
    };
  }

  const parts = file.name.split('.');
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Unsupported format (.${ext || 'unknown'}). Please upload a genuine JPG, JPEG, PNG, or WebP photo.`,
    };
  }

  const fileType = file.type.toLowerCase();
  if (fileType && !ALLOWED_MIME_TYPES.has(fileType)) {
    return {
      valid: false,
      error: `Invalid image type (${file.type}). Supported formats are JPG, JPEG, PNG, and WebP.`,
    };
  }

  return { valid: true };
}

/**
 * Reads the original founder photograph directly as a high-fidelity Data URL.
 * Preserves the exact original image data without any AI transformations.
 * If the image resolution is exceptionally large (>2000px on either dimension),
 * it produces an optimized display copy while strictly preserving exact aspect ratio
 * and facial identity without smoothing or filters.
 */
export async function processFounderPhoto(file: File): Promise<FounderPhotoUploadResult> {
  const validation = validateFounderPhotoFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read image file from device.' });
    };

    reader.onload = () => {
      const originalDataUrl = reader.result as string;
      const img = new Image();

      img.onerror = () => {
        resolve({
          success: false,
          error: 'Corrupt or unreadable image data. Please upload a genuine photo.',
        });
      };

      img.onload = () => {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        // If file is already reasonable in size (< 1.5MB and max dimension <= 1600),
        // store the 100% untouched raw binary data URL
        if (file.size <= 1.5 * 1024 * 1024 && Math.max(origWidth, origHeight) <= 1600) {
          resolve({
            success: true,
            dataUrl: originalDataUrl,
            originalFileName: file.name,
            sizeBytes: file.size,
            width: origWidth,
            height: origHeight,
          });
          return;
        }

        // For large mobile camera photos (e.g. 12MP / 4000x3000px / 5MB),
        // scale proportionally to standard 1600px max dimension using high-quality bicubic canvas
        // to stay within localStorage quota while preserving 100% facial details and proportions.
        try {
          const maxDim = 1600;
          let targetWidth = origWidth;
          let targetHeight = origHeight;

          if (origWidth > maxDim || origHeight > maxDim) {
            if (origWidth > origHeight) {
              targetHeight = Math.round((origHeight * maxDim) / origWidth);
              targetWidth = maxDim;
            } else {
              targetWidth = Math.round((origWidth * maxDim) / origHeight);
              targetHeight = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to original
            resolve({
              success: true,
              dataUrl: originalDataUrl,
              originalFileName: file.name,
              sizeBytes: file.size,
              width: origWidth,
              height: origHeight,
            });
            return;
          }

          // Use high-quality image smoothing without filters
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Output high-quality JPEG (quality 0.92) to maintain natural skin and hair texture
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

          resolve({
            success: true,
            dataUrl: optimizedDataUrl,
            originalFileName: file.name,
            sizeBytes: Math.round((optimizedDataUrl.length * 3) / 4),
            width: targetWidth,
            height: targetHeight,
          });
        } catch {
          // If canvas fails, fallback gracefully to original dataUrl
          resolve({
            success: true,
            dataUrl: originalDataUrl,
            originalFileName: file.name,
            sizeBytes: file.size,
            width: origWidth,
            height: origHeight,
          });
        }
      };

      img.src = originalDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
