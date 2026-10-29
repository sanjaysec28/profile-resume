/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Cloudinary Direct Client-Side Image Upload
 * Uses an unsigned upload preset for direct, secure HTTPS image uploads.
 * Never stores or exposes API secrets in the frontend.
 */

export interface CloudinaryConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export function checkCloudinaryConfig(): CloudinaryConfigStatus {
  const missingKeys: string[] = [];

  if (!cloudName || cloudName.includes('your-') || cloudName.includes('MY_')) {
    missingKeys.push('VITE_CLOUDINARY_CLOUD_NAME');
  }
  if (!uploadPreset || uploadPreset.includes('your-') || uploadPreset.includes('MY_')) {
    missingKeys.push('VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
  };
}

/**
 * Validates an image file before upload.
 * Allowed formats: JPEG, PNG, WEBP, GIF.
 * Maximum file size: 5 MB.
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file format. Please upload a JPG, PNG, WEBP, or GIF image.',
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 5MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Uploads a profile image directly to Cloudinary using an unsigned upload preset.
 */
export async function uploadProfileImageToCloudinary(
  file: File
): Promise<CloudinaryUploadResult> {
  const config = checkCloudinaryConfig();
  if (!config.isConfigured) {
    throw new Error(
      `Cloudinary upload is not configured. Missing environment variables: ${config.missingKeys.join(', ')}`
    );
  }

  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'profile_avatars');

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = 'Image upload failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || errorDetail;
    } catch {
      // Fallback
    }
    throw new Error(`Cloudinary Upload Error: ${errorDetail}`);
  }

  const data = await response.json();

  if (!data.secure_url) {
    throw new Error('Cloudinary response did not return a secure HTTPS image URL.');
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}
