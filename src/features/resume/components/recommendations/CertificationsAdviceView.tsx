/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Certifications Advice View
 * Recommends industry-standard credential pathways with explicit verification guardrails.
 */

import React from 'react';
import { CertificationRecommendation } from '../../../../types/recommendations.ts';
import {
  Award,
  ShieldCheck,
  Building,
  Info,
} from 'lucide-react';

interface CertificationsAdviceViewProps {
  certifications: CertificationRecommendation[];
}

export function CertificationsAdviceView({
  certifications,
}: CertificationsAdviceViewProps) {
  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-[#E5E0D8]">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#171513]" />
          <h3 className="text-base sm:text-lg font-bold text-[#171513]">
            Recommended Certification & Credential Pathways
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-[#7A7368] mt-1">
          Industry-recognized certifications that validate hands-on capability for your target role.
        </p>
      </div>

      {/* Advisory Banner */}
      <div className="p-4 rounded-2xl bg-[#F6F4EE] border border-[#E8E2D7] text-xs text-[#625D56] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#7A7368] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#171513] block mb-0.5">
            Student Integrity Policy:
          </strong>
          These credentials are curated recommendations for your professional growth. Only list a certification on your actual resume if you have completed the exam and hold an official credential ID or verification link.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="p-5 rounded-2xl bg-white border border-[#E5E0D8] shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-base font-bold text-[#171513]">
                  {cert.title}
                </h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#625D56] shrink-0">
                  {cert.credibilityLevel || 'Industry Standard'}
                </span>
              </div>

              {cert.issuingOrganization && (
                <div className="flex items-center gap-1.5 text-xs text-[#8A8275] mb-2.5">
                  <Building className="w-3.5 h-3.5 text-[#7A7368]" />
                  <span>Issuing Body: <strong className="text-[#171513]">{cert.issuingOrganization}</strong></span>
                </div>
              )}

              <p className="text-xs text-[#524E48] leading-relaxed mb-3">
                {cert.explanation}
              </p>

              {cert.whyItMatters && (
                <p className="text-[11px] text-[#787168] bg-[#F7F4EE] p-2 rounded-xl border border-[#EFECE6]">
                  <strong className="text-[#171513]">Recruiter Value:</strong> {cert.whyItMatters}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-[#EFECE6] mt-4 flex items-center justify-between text-[11px] text-[#8A8275]">
              <span>Status: Unverified / Pathway</span>
              <span className="text-[10px] font-semibold text-[#171513] bg-[#F5F2EB] px-2 py-0.5 rounded-md">
                Recommended Learning
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
