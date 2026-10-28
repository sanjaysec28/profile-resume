/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { ResumeData } from '../../../../types/resume.ts';
import { Input } from '../../../../components/ui/Input.tsx';
import { Textarea } from '../../../../components/ui/Textarea.tsx';
import { Upload, Camera } from 'lucide-react';
import { Avatar } from '../../../../components/ui/Avatar.tsx';

interface PersonalInfoStepProps {
  data: ResumeData;
  onChange: (updater: (prev: ResumeData) => ResumeData) => void;
}

export function PersonalInfoStep({ data, onChange }: PersonalInfoStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const info = data.personalInfo;

  const updateField = (field: keyof ResumeData['personalInfo'], value: string) => {
    onChange((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const [photoError, setPhotoError] = React.useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPhotoError('Please upload a JPG, PNG, or WebP image.');
      return;
    }

    // Validate size (max 3MB)
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setPhotoError('Image size exceeds 3MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateField('photoUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateField('photoUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Photo Upload Area matching reference */}
      <div className="pb-5 border-b border-[#E5E0D8]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload profile photo"
            >
              {info.photoUrl ? (
                <img
                  src={info.photoUrl}
                  alt={info.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#101010] shadow-sm"
                />
              ) : (
                <Avatar type="boy" size="lg" />
              )}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#E5E0D8] text-[#101010] hover:bg-[#FAF9F6] shadow-2xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#777777]" />
                  <span>{info.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                </button>

                {info.photoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#F0D5D5] text-[#C53030] hover:bg-[#FFF5F5] transition-all cursor-pointer"
                    title="Remove profile photo"
                  >
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#A3A3A3] mt-1.5">
                JPG, PNG, WebP (Max 3MB)
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right max-w-xs">
            <p className="text-[11px] text-[#777777] leading-relaxed">
              <span className="font-semibold text-[#101010]">Photo compatibility:</span> Automatically rendered on creative, sidebar, and executive layouts; kept clean on ATS templates.
            </p>
          </div>
        </div>

        {photoError && (
          <div className="mt-2.5 p-2.5 bg-[#FFF5F5] border border-[#F0D5D5] rounded-xl text-xs text-[#C53030]">
            {photoError}
          </div>
        )}
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Full Name"
          value={info.fullName}
          placeholder="e.g. Sanjay Kumar"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('fullName', e.target.value)
          }
        />
        <Input
          label="Professional Title"
          value={info.professionalTitle || ''}
          placeholder="e.g. AI & Data Science Student"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('professionalTitle', e.target.value)
          }
        />
        <Input
          label="Email Address"
          type="email"
          value={info.email}
          placeholder="e.g. sanjay@example.com"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('email', e.target.value)
          }
        />
        <Input
          label="Phone Number"
          type="tel"
          value={info.phone}
          placeholder="e.g. +91 98765 43210"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('phone', e.target.value)
          }
        />
        <Input
          label="Location"
          value={info.location}
          placeholder="e.g. Chennai, Tamil Nadu"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('location', e.target.value)
          }
        />
        <Input
          label="LinkedIn Profile"
          value={info.linkedin || ''}
          placeholder="e.g. https://linkedin.com/in/sanjay"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('linkedin', e.target.value)
          }
        />
        <Input
          label="GitHub Profile"
          value={info.github || ''}
          placeholder="e.g. https://github.com/sanjay"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('github', e.target.value)
          }
        />
        <Input
          label="Portfolio Website"
          value={info.website || ''}
          placeholder="e.g. https://sanjay.dev"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('website', e.target.value)
          }
        />
      </div>

      {/* Professional Summary */}
      <div className="space-y-1.5 text-left">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-[#101010]">
            Professional Summary
          </label>
          <span className="text-[11px] text-[#A3A3A3]">
            {info.summary.length}/500
          </span>
        </div>
        <Textarea
          rows={3}
          maxLength={500}
          value={info.summary}
          placeholder="A passionate student with a strong interest in building real-world solutions..."
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            updateField('summary', e.target.value)
          }
        />
      </div>
    </div>
  );
}
