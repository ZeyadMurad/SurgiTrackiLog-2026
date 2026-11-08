import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export const SurgiTrackLogo: React.FC<LogoProps> = ({
  className = '',
  size = 40,
  showText = true,
  textColor = 'text-white',
}) => {
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 whitespace-nowrap select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-2xl overflow-hidden shadow-md shadow-teal-950/20 border border-teal-500/30 bg-[#101C32] shrink-0"
        style={{ width: size, height: size }}
      >
        <img
          src="/icon-192.png"
          alt="SurgiTrack iLog Official Icon"
          className="w-full h-full object-cover"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight text-left whitespace-nowrap min-w-0" dir="ltr">
          <div className="flex items-center gap-1.5 whitespace-nowrap" dir="ltr">
            <span className="text-lg sm:text-xl font-extrabold tracking-tight whitespace-nowrap inline-flex items-center gap-1.5" dir="ltr">
              <span className="text-white">SurgiTrack</span>
              <span className="text-teal-400">iLog</span>
            </span>
            <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-400/40 rounded shrink-0">
              PRO
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 tracking-wide hidden md:inline whitespace-nowrap truncate" dir="ltr">
            Professional Surgical Training & Clinical Portfolio
          </span>
        </div>
      )}
    </div>
  );
};
