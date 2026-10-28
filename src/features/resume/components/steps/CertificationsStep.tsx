/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResumeData, ResumeCertification } from '../../../../types/resume.ts';
import { Input } from '../../../../components/ui/Input.tsx';
import { Plus, Trash2, Award } from 'lucide-react';

interface CertificationsStepProps {
  data: ResumeData;
  onChange: (updater: (prev: ResumeData) => ResumeData) => void;
}

export function CertificationsStep({ data, onChange }: CertificationsStepProps) {
  const certifications = data.certifications || [];

  const handleAddCertification = () => {
    const newCert: ResumeCertification = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      issueDate: '',
      credentialUrl: '',
    };
    onChange((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), newCert],
    }));
  };

  const handleRemoveCertification = (id: string) => {
    onChange((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((c) => c.id !== id),
    }));
  };

  const handleUpdateCertification = (id: string, field: keyof ResumeCertification, value: string) => {
    onChange((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Add Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleAddCertification}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#101010] hover:bg-[#252525] text-white text-xs sm:text-sm font-medium rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Certification</span>
        </button>

        <span className="text-xs text-[#777777]">Optional</span>
      </div>

      {/* Certifications Cards */}
      <div className="space-y-5">
        {certifications.map((cert, idx) => (
          <div
            key={cert.id}
            className="p-5 sm:p-6 rounded-2xl bg-[#F8F8F6] border border-[#E5E0D8] space-y-4 shadow-2xs"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DC]">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#101010]" />
                <h4 className="text-sm sm:text-base font-bold text-[#101010]">
                  {cert.name || `Certification #${idx + 1}`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCertification(cert.id)}
                className="p-1.5 rounded-lg text-[#777777] hover:text-red-600 hover:bg-[#EFE9DF] transition-colors cursor-pointer"
                aria-label="Remove certification"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Title */}
            <Input
              label="Certification Name"
              placeholder="e.g. Google AI Essentials"
              value={cert.name}
              onChange={(e) => handleUpdateCertification(cert.id, 'name', e.target.value)}
            />

            {/* Issuer, Date, Link */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Input
                  label="Issuing Organization"
                  placeholder="e.g. Google / IBM / AWS"
                  value={cert.issuer}
                  onChange={(e) => handleUpdateCertification(cert.id, 'issuer', e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Issue Date"
                  placeholder="e.g. May 2026"
                  value={cert.issueDate}
                  onChange={(e) => handleUpdateCertification(cert.id, 'issueDate', e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Credential Link / ID"
                  placeholder="e.g. https://coursera.org/verify/..."
                  value={cert.credentialUrl || ''}
                  onChange={(e) => handleUpdateCertification(cert.id, 'credentialUrl', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        {certifications.length === 0 && (
          <div className="p-8 text-center border-2 border-dashed border-[#E5E0D8] rounded-2xl bg-[#FAF9F6]">
            <p className="text-xs sm:text-sm text-[#777777] mb-3">
              No certifications added. Certifications show initiative and expertise in modern technologies.
            </p>
            <button
              type="button"
              onClick={handleAddCertification}
              className="px-4 py-2 bg-[#101010] text-white text-xs font-medium rounded-xl hover:bg-[#252525] transition-colors"
            >
              Add First Certification
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
