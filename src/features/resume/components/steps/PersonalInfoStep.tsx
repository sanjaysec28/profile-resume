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
import { AiInlineTrigger } from '../assistant/AiInlineTrigger.tsx';
import { ContentAssistantAction, ContentAssistantSection } from '../../../../types/assistant.ts';

interface PersonalInfoStepProps {
  data: ResumeData;
  onChange: (updater: (prev: ResumeData) => ResumeData) => void;
  onOpenAssistant?: (section: ContentAssistantSection, action?: ContentAssistantAction, content?: string) => void;
}

export function PersonalInfoStep({ data, onChange, onOpenAssistant }: PersonalInfoStepProps) {
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
      onChange((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          photoUrl: reader.result as string,
          showPhoto: true, // Automatically enable when user uploads a photo
        },
        sectionVisibility: {
          ...prev.sectionVisibility,
          photo: true,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    onChange((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        photoUrl: '',
        showPhoto: false,
      },
      sectionVisibility: {
        ...prev.sectionVisibility,
        photo: false,
      },
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTogglePhoto = (enabled: boolean) => {
    onChange((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        showPhoto: enabled,
      },
      sectionVisibility: {
        ...prev.sectionVisibility,
        photo: enabled,
      },
    }));
  };

  const isPhotoEnabled = Boolean(info.photoUrl && info.showPhoto === true);

  return (
    <div className="space-y-6">
      {/* Photo Upload Area */}
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
              <span className="font-semibold text-[#101010]">Standard size:</span> Standardized to 72×72px (48px on Compact) with aspect ratio protection.
            </p>
          </div>
        </div>

        {/* User-controlled setting: Include Profile Photo in Resume */}
        <div className="mt-4 pt-3.5 border-t border-[#F0ECE3] flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#101010]">
                Include Profile Photo in Resume
              </span>
              <span className="text-[10px] font-medium text-[#777777] bg-[#F5F2EB] px-2 py-0.5 rounded">
                ATS Recommended: Off
              </span>
            </div>
            <p className="text-[11px] text-[#777777] mt-0.5 leading-relaxed">
              {info.photoUrl
                ? 'Turn off to export a photo-free ATS-friendly resume without deleting your uploaded photo.'
                : 'Upload a photo above to enable photo display on supported resume templates.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPhotoEnabled}
            disabled={!info.photoUrl}
            onClick={() => handleTogglePhoto(!isPhotoEnabled)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
              isPhotoEnabled ? 'bg-[#101010]' : 'bg-[#D1C9BE]'
            }`}
            title={info.photoUrl ? 'Toggle profile photo on resume' : 'Upload a photo first to enable'}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isPhotoEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
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
          placeholder="e.g. Jane Doe"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('fullName', e.target.value)
          }
        />
        <Input
          label="Professional Title"
          value={info.professionalTitle || ''}
          placeholder="e.g. Computer Science Student"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('professionalTitle', e.target.value)
          }
        />
        <Input
          label="Email Address"
          type="email"
          value={info.email}
          placeholder="e.g. jane.doe@university.edu"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('email', e.target.value)
          }
        />
        <Input
          label="Phone Number"
          type="tel"
          value={info.phone}
          placeholder="e.g. +1 (555) 000-0000"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('phone', e.target.value)
          }
        />
        <Input
          label="Location"
          value={info.location}
          placeholder="e.g. San Francisco, CA"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('location', e.target.value)
          }
        />
        <Input
          label="LinkedIn Profile"
          value={info.linkedin || ''}
          placeholder="e.g. https://linkedin.com/in/janedoe"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('linkedin', e.target.value)
          }
        />
        <Input
          label="GitHub Profile"
          value={info.github || ''}
          placeholder="e.g. https://github.com/janedoe"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('github', e.target.value)
          }
        />
        <Input
          label="Portfolio Website"
          value={info.website || ''}
          placeholder="e.g. https://janedoe.dev"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateField('website', e.target.value)
          }
        />
      </div>

      {/* Professional Summary */}
      <div className="space-y-1.5 text-left">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#101010]">
              Professional Summary
            </label>
            {onOpenAssistant && (
              <AiInlineTrigger
                section="summary"
                compact
                label="AI Assist"
                onOpenAssistant={(sec, act) => onOpenAssistant(sec, act, info.summary)}
              />
            )}
          </div>
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
