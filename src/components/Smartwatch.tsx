import React from 'react';
import { VitalData } from '../types';

interface SmartwatchProps {
  data: VitalData;
  isSelected?: boolean;
  onSelect?: () => void;
  onTalkClick?: (e: React.MouseEvent) => void;
}

export const Smartwatch: React.FC<SmartwatchProps> = ({
  data,
  isSelected = false,
  onSelect,
  onTalkClick,
}) => {
  const isAbnormal = data.cardColor === 'pink';
  const cleanTime = data.time.replace(':', '');

  return (
    <div
      id={`smartwatch-container-${cleanTime}`}
      onClick={onSelect}
      className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 select-none group shrink-0 ${
        isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
      }`}
      style={{ width: '290px', minWidth: '290px', flexShrink: 0 }}
    >
      {/* Top Watch Band */}
      <div className="relative w-[150px] h-[72px] sm:w-[170px] sm:h-[84px] overflow-hidden flex items-end justify-center">
        <svg
          viewBox="0 0 180 90"
          className="w-full h-full drop-shadow-sm"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`top-band-grad-${cleanTime}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cfd2d8" />
              <stop offset="15%" stopColor="#e5e7eb" />
              <stop offset="50%" stopColor="#f3f4f6" />
              <stop offset="85%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#cfd2d8" />
            </linearGradient>
            <linearGradient id={`band-shadow-top-${cleanTime}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
              <stop offset="85%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
            </linearGradient>
          </defs>
          <path
            d="M 28 0 L 152 0 C 146 30 142 60 138 90 L 42 90 C 38 60 34 30 28 0 Z"
            fill={`url(#top-band-grad-${cleanTime})`}
          />
          <path
            d="M 28 0 L 152 0 C 146 30 142 60 138 90 L 42 90 C 38 60 34 30 28 0 Z"
            fill={`url(#band-shadow-top-${cleanTime})`}
          />
          <line
            x1="90"
            y1="5"
            x2="90"
            y2="85"
            stroke="rgba(0,0,0,0.04)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Watch Case & Body Container */}
      <div className="relative w-[280px] h-[348px] sm:w-[310px] sm:h-[386px]">
        {/* Hardware: Digital Crown on Right */}
        <div
          className="absolute -right-[13px] top-[74px] sm:top-[84px] w-[15px] h-[52px] sm:h-[60px] rounded-r-md z-0 shadow-md flex flex-col justify-between py-1 overflow-hidden"
          style={{
            background: 'linear-gradient(to right, #9ca3af 0%, #d1d5db 45%, #6b7280 90%, #4b5563 100%)',
            borderTopRightRadius: '7px',
            borderBottomRightRadius: '7px',
            boxShadow: '2px 3px 6px rgba(0,0,0,0.25)',
          }}
        >
          <div className="w-full h-[2px] bg-neutral-600/60" />
          <div className="w-full h-[2px] bg-neutral-600/60" />
          <div className="w-full h-[2px] bg-neutral-600/60" />
          <div className="w-full h-[2px] bg-neutral-600/60" />
          <div className="w-full h-[2px] bg-neutral-600/60" />
          <div className="w-full h-[2px] bg-neutral-600/60" />
          <div className="w-full h-[2px] bg-neutral-600/60" />
        </div>

        {/* Hardware: Side Button on Right */}
        <div
          className="absolute -right-[6px] top-[162px] sm:top-[182px] w-[8px] h-[54px] sm:h-[62px] z-0 shadow-sm"
          style={{
            background: 'linear-gradient(to right, #9ca3af 0%, #e5e7eb 60%, #9ca3af 100%)',
            borderTopRightRadius: '4px',
            borderBottomRightRadius: '4px',
            boxShadow: '1px 2px 4px rgba(0,0,0,0.18)',
          }}
        />

        {/* Outer Metallic Case (Silver Aluminum) */}
        <div
          className="relative z-10 w-full h-full rounded-[48px] sm:rounded-[54px] p-[10px] sm:p-[12px] flex items-center justify-center transition-shadow duration-300"
          style={{
            background:
              'linear-gradient(135deg, #f4f5f7 0%, #e1e4e8 22%, #cbd0d8 50%, #b4bac3 78%, #dce0e6 100%)',
            boxShadow: isSelected
              ? '0 20px 45px -10px rgba(0,0,0,0.35), 0 0 0 3px #05ff2b'
              : '0 20px 40px -12px rgba(0,0,0,0.28), 0 6px 14px -4px rgba(0,0,0,0.12), inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 3px rgba(0,0,0,0.3)',
          }}
        >
          {/* Inner Chamfer Bezel Ring */}
          <div
            className="w-full h-full rounded-[38px] sm:rounded-[44px] p-[6px] sm:p-[7px] flex items-center justify-center"
            style={{
              background:
                'linear-gradient(145deg, #2b2d31 0%, #151619 40%, #0c0d0e 100%)',
              boxShadow:
                'inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.7)',
            }}
          >
            {/* Screen Glass & OLED Display */}
            <div
              className="relative w-full h-full bg-black rounded-[32px] sm:rounded-[38px] overflow-hidden flex flex-col px-3.5 sm:px-4 pt-3 pb-3 justify-between"
              style={{
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.95)',
              }}
            >
              {/* Subtle Glass Corner Reflection */}
              <div
                className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none opacity-20"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
                }}
              />

              {/* Screen Content Area */}
              <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Upper Section: Warning Banner & Clock */}
                <div className="flex flex-col justify-start">
                  {/* Warning Notification Placeholder */}
                  <div className="w-full h-[28px] sm:h-[30px] flex items-center justify-center shrink-0">
                    {data.warning ? (
                      <div
                        id={`warn-banner-${data.time.replace(':', '')}`}
                        className="w-full bg-[#faebc6] text-black text-[11px] sm:text-[12px] font-normal px-2 sm:px-2.5 py-0.5 rounded-lg shadow-xs text-center truncate flex items-center justify-center space-x-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                        <span>{data.warning}</span>
                      </div>
                    ) : (
                      <div className="w-full h-full" aria-hidden="true" />
                    )}
                  </div>

                  {/* Digital Clock Time Display */}
                  <div className="w-full flex items-center justify-center py-2.5 sm:py-3.5">
                    <div
                      id={`clock-display-${data.time.replace(':', '')}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.();
                      }}
                      title={`Click timestamp ${data.time} to view system log`}
                      className={`text-white text-center font-normal tracking-tight select-none cursor-pointer transition-all duration-200 hover:text-emerald-300 active:scale-95 relative group/clock text-[38px] sm:text-[44px] leading-none ${
                        isSelected ? 'text-white' : 'text-white/90'
                      }`}
                      style={{
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      <span>{data.time}</span>
                      {isSelected && (
                        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#05ff2b] shadow-[0_0_6px_#05ff2b]" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle Section: Vitals Card */}
                <div
                  id={`vitals-card-${data.time.replace(':', '')}`}
                  className={`w-full rounded-xl p-2.5 sm:p-3 flex items-center justify-between text-black transition-colors shadow-sm shrink-0 ${
                    isAbnormal ? 'bg-[#fcd7d7]' : 'bg-[#beeef2]'
                  }`}
                >
                  {/* Left Column: Vitals List */}
                  <div className="flex flex-col space-y-1 text-[11px] sm:text-[12px] font-normal leading-[1.35]">
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold">Resting HR:</span>
                      <span className="font-bold">{data.restingHr} bpm</span>
                    </div>
                    <div>HRV: {data.hrv} ms</div>
                    <div>SpO2: {data.spo2}%</div>
                    <div>Avg. Sleep: {data.avgSleep.toFixed(1)} Hrs</div>
                  </div>

                  {/* Right Column: "Click to Talk" Button */}
                  <button
                    id={`talk-btn-${data.time.replace(':', '')}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTalkClick?.(e);
                    }}
                    type="button"
                    className="bg-white hover:bg-neutral-50 active:bg-neutral-100 text-black text-[11px] sm:text-[11.5px] font-normal px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all border border-neutral-200/50 hover:shadow cursor-pointer shrink-0 ml-1.5"
                  >
                    Click to Talk
                  </button>
                </div>

                {/* Bottom Section: Optional Medication Reminder Banner or Blank Placeholder */}
                <div className="h-[28px] sm:h-[32px] flex items-center shrink-0">
                  {data.reminder ? (
                    <div
                      id={`reminder-banner-${data.time.replace(':', '')}`}
                      className="w-full bg-[#b5f3d6] text-black text-[10.5px] sm:text-[11.5px] font-normal px-2.5 py-1.5 rounded-xl shadow-xs text-center truncate"
                    >
                      {data.reminder}
                    </div>
                  ) : (
                    <div className="w-full h-full" aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Watch Band */}
      <div className="relative w-[150px] h-[72px] sm:w-[170px] sm:h-[84px] overflow-hidden flex items-start justify-center">
        <svg
          viewBox="0 0 180 90"
          className="w-full h-full drop-shadow-sm"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`bottom-band-grad-${cleanTime}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#cfd2d8" />
              <stop offset="15%" stopColor="#e5e7eb" />
              <stop offset="50%" stopColor="#f3f4f6" />
              <stop offset="85%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#cfd2d8" />
            </linearGradient>
            <linearGradient id={`band-shadow-bottom-${cleanTime}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
              <stop offset="85%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
            </linearGradient>
          </defs>
          <path
            d="M 42 0 L 138 0 C 142 30 146 60 152 90 L 28 90 C 34 60 38 30 42 0 Z"
            fill={`url(#bottom-band-grad-${cleanTime})`}
          />
          <path
            d="M 42 0 L 138 0 C 142 30 146 60 152 90 L 28 90 C 34 60 38 30 42 0 Z"
            fill={`url(#band-shadow-bottom-${cleanTime})`}
          />
          <line
            x1="90"
            y1="5"
            x2="90"
            y2="85"
            stroke="rgba(0,0,0,0.04)"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
};
