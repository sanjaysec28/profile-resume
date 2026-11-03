/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Certification & Course Recommendation Card
 * Displays verified learning credentials with free/paid status,
 * official issuing platforms, and student pursuit tracker.
 */

import { RecommendedCertification } from '../../../types/careerIntelligence.ts';
import {
  Award,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Check,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface CertificationCardProps {
  certification: RecommendedCertification;
  onUpdateStatus: (
    certId: string,
    status: 'recommended' | 'pursuing' | 'completed'
  ) => void;
}

export function CertificationCard({
  certification,
  onUpdateStatus,
}: CertificationCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Completed
          </span>
        );
      case 'pursuing':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100/70 border border-amber-300 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Pursuing
          </span>
        );
      case 'recommended':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#666666] bg-[#FAF9F5] border border-[#E5E0D8] px-2.5 py-0.5 rounded-full">
            Recommended
          </span>
        );
    }
  };

  const getPriceBadge = (pricing: string) => {
    switch (pricing) {
      case 'free':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            Free / Audit
          </span>
        );
      case 'paid':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
            Paid / Pro
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#777777] bg-[#FAF9F5] border border-[#E5E0D8] px-2 py-0.5 rounded">
            Check Platform
          </span>
        );
    }
  };

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 transition-all ${
        certification.status === 'completed'
          ? 'bg-[#F2F8F4] border-[#C8E4D1]'
          : certification.status === 'pursuing'
          ? 'bg-[#FAF8F5] border-[#E8DEC8]'
          : 'bg-white border-[#E5E0D8] shadow-2xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          {getPriceBadge(certification.isFreeOrPaid)}
          <span className="text-xs font-semibold text-[#555555]">
            Issuer: <strong className="text-[#101010]">{certification.issuer}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(certification.status)}
          <select
            value={certification.status}
            onChange={(e) =>
              onUpdateStatus(
                certification.id,
                e.target.value as 'recommended' | 'pursuing' | 'completed'
              )
            }
            className="text-xs font-semibold p-1 rounded-lg border border-[#E5E0D8] bg-white text-[#101010] cursor-pointer"
          >
            <option value="recommended">Recommended</option>
            <option value="pursuing">Pursuing</option>
            <option value="completed">Completed (Confirmed)</option>
          </select>
        </div>
      </div>

      <h4 className="text-sm sm:text-base font-bold text-[#101010] mb-1 flex items-center gap-2">
        <Award className="w-4 h-4 text-[#8C6D1F] shrink-0" />
        <span>{certification.name}</span>
      </h4>

      <p className="text-xs text-[#555555] mb-2.5 leading-relaxed">
        {certification.whyUseful}
      </p>

      {/* Relevant Skills */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        <span className="text-[11px] font-bold text-[#101010] mr-1">Skills Taught:</span>
        {certification.relevantSkills.map((sk, idx) => (
          <span
            key={idx}
            className="text-[11px] px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#E5E0D8] text-[#333333]"
          >
            {sk}
          </span>
        ))}
      </div>

      {/* Official Link & Verification Guard */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#F0ECE3] text-xs">
        {certification.officialUrl ? (
          <a
            href={certification.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-[#8C6D1F] hover:text-[#705615] hover:underline"
          >
            <span>View Official Platform Course</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-[#888888] text-[11px] italic">Verified industry certification</span>
        )}

        <span className="text-[11px] text-[#777777]">
          {certification.status === 'completed' ? '✓ Verified by student' : 'Student confirmation required'}
        </span>
      </div>
    </div>
  );
}
