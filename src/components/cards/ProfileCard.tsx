/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentProfile, AvatarType } from '../../types/profile.ts';
import { Avatar } from '../ui/Avatar.tsx';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { Check } from 'lucide-react';

export interface ProfileCardProps {
  profile: StudentProfile;
  onAvatarSelect?: (avatar: AvatarType) => void;
  onEditClick?: () => void;
}

export function ProfileCard({
  profile,
  onAvatarSelect,
  onEditClick,
}: ProfileCardProps) {
  return (
    <Card variant="cream" padding="lg" rounded="3xl" className="w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E5E0D8]">
        <div className="flex items-center gap-4 sm:gap-5">
          <Avatar type={profile.avatar} size="xl" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#101010]">
                {profile.fullName}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#777777] mt-0.5">
              {profile.major} · Class of {profile.graduationYear}
            </p>
            <p className="text-xs text-[#A3A3A3] mt-1">{profile.collegeOrUniversity}</p>
          </div>
        </div>

        {onEditClick && (
          <Button variant="secondary" size="sm" onClick={onEditClick}>
            Edit Profile
          </Button>
        )}
      </div>

      {/* Selectable faceless 3D Avatars selector */}
      <div className="mt-6">
        <label className="text-xs font-semibold text-[#101010] uppercase tracking-wider block mb-3">
          Select 3D Student Avatar
        </label>
        <div className="flex items-center gap-4">
          {/* Boy Avatar Option */}
          <button
            onClick={() => onAvatarSelect?.('boy')}
            className={`group relative flex items-center gap-3 p-2.5 pr-4 rounded-2xl border transition-all cursor-pointer ${
              profile.avatar === 'boy'
                ? 'bg-white border-[#101010] shadow-sm'
                : 'bg-[#F2ECE0]/60 border-[#E5E0D8] hover:border-[#D1C9BE]'
            }`}
          >
            <Avatar type="boy" size="md" bordered={false} />
            <div className="text-left">
              <div className="text-xs font-semibold text-[#101010]">Student (Boy)</div>
              <div className="text-[11px] text-[#777777]">Faceless 3D Clay</div>
            </div>
            {profile.avatar === 'boy' && (
              <div className="w-5 h-5 rounded-full bg-[#101010] text-white flex items-center justify-center ml-2">
                <Check className="w-3 h-3" />
              </div>
            )}
          </button>

          {/* Girl Avatar Option */}
          <button
            onClick={() => onAvatarSelect?.('girl')}
            className={`group relative flex items-center gap-3 p-2.5 pr-4 rounded-2xl border transition-all cursor-pointer ${
              profile.avatar === 'girl'
                ? 'bg-white border-[#101010] shadow-sm'
                : 'bg-[#F2ECE0]/60 border-[#E5E0D8] hover:border-[#D1C9BE]'
            }`}
          >
            <Avatar type="girl" size="md" bordered={false} />
            <div className="text-left">
              <div className="text-xs font-semibold text-[#101010]">Student (Girl)</div>
              <div className="text-[11px] text-[#777777]">Faceless 3D Clay</div>
            </div>
            {profile.avatar === 'girl' && (
              <div className="w-5 h-5 rounded-full bg-[#101010] text-white flex items-center justify-center ml-2">
                <Check className="w-3 h-3" />
              </div>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}
