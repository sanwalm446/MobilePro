/**
 * Utility functions for validating, compressing, and optimizing shop logo uploads.
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_LOGO_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates uploaded image file type and size.
 */
export function validateLogoFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const isValidType =
    ALLOWED_LOGO_TYPES.includes(file.type.toLowerCase()) ||
    /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isValidType) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a JPG, JPEG, PNG, or WEBP image.',
    };
  }

  if (file.size > MAX_LOGO_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Reads and optionally downscales/compresses an image file to keep localStorage snappy.
 * Maintains aspect ratio without stretching or distortion.
 */
export function optimizeAndProcessLogo(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read the image file.'));
    };

    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        reject(new Error('Empty image result.'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        reject(new Error('Could not parse image data.'));
      };

      img.onload = () => {
        try {
          const { naturalWidth: width, naturalHeight: height } = img;

          // If image is already smaller than maxWidth & maxHeight and size is small, return directly
          if (width <= maxWidth && height <= maxHeight && file.size < 300 * 1024) {
            resolve(result);
            return;
          }

          // Compute proportional dimensions
          let newWidth = width;
          let newHeight = height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            newWidth = Math.round(width * ratio);
            newHeight = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result); // Fallback to raw data url if canvas unavailable
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // If PNG or has transparency, export as PNG; otherwise JPEG/WEBP
          const isTransparent = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
          const outputType = isTransparent ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(outputType, quality);

          resolve(compressedDataUrl);
        } catch (err) {
          // If canvas fails for any reason, fallback to raw reader result
          resolve(result);
        }
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}
