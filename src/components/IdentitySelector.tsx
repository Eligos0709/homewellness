import React, { useState, useRef, useEffect } from 'react';
import { User, ShieldCheck, ShieldAlert, ChevronDown, Check, HeartHandshake, Watch } from 'lucide-react';
import { IdentityId, UserIdentityProfile } from '../types';

interface IdentitySelectorProps {
  currentIdentity: IdentityId;
  onSelectIdentity: (identity: IdentityId) => void;
  aliceAgreedToShare: boolean;
}

export const IDENTITIES: Record<IdentityId, UserIdentityProfile> = {
  alice: {
    id: 'alice',
    name: 'Alice Smith',
    role: 'Care Recipient',
    relation: 'Primary Patient',
    age: 70,
    gender: 'Female',
    deviceId: 'HW-BLE-WATCH-01',
    description: 'Smartwatch wearer with continuous vital tracking & autonomous voice loop.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  bob: {
    id: 'bob',
    name: 'Bob Smith',
    role: 'Family Caregiver',
    relation: "Alice's Son",
    age: 42,
    gender: 'Male',
    description: "Son & authorized caregiver. Can add context/memory, receive alerts, and chat with Agent.",
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
};

export const IdentitySelector: React.FC<IdentitySelectorProps> = ({
  currentIdentity,
  onSelectIdentity,
  aliceAgreedToShare,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeProfile = IDENTITIES[currentIdentity];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div id="identity-selector-wrapper" ref={dropdownRef} className="relative select-none">
      {/* Main Pill Button */}
      <button
        id="identity-selector-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="bg-white hover:bg-neutral-50 active:bg-neutral-100 text-black px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[13px] sm:text-[14px] font-normal shadow-xs flex items-center space-x-2 border border-neutral-300/80 hover:border-neutral-400 transition-all cursor-pointer group"
        title="Switch active user identity (Alice Smith vs. Bob Smith)"
      >
        {/* Avatar badge - smaller size */}
        <div
          className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9.5px] font-semibold tracking-tight ${
            currentIdentity === 'alice'
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {currentIdentity === 'alice' ? 'AS' : 'BS'}
        </div>

        {/* Identity Label */}
        <div className="flex flex-col items-start text-left leading-tight">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-neutral-900 text-[13px] sm:text-[14px]">
              {activeProfile.name}
            </span>
            <span className="text-neutral-400 text-xs font-normal">/</span>
            <span className="text-neutral-600 text-[11.5px] font-medium">
              {currentIdentity === 'alice' ? `${activeProfile.gender}, ${activeProfile.age}` : activeProfile.relation}
            </span>
          </div>
          <span className="text-[9.5px] text-neutral-500 font-mono">
            {currentIdentity === 'alice' ? 'Care Recipient' : 'Family Caregiver'}
          </span>
        </div>

        {/* Consent mini badge */}
        {currentIdentity === 'bob' && (
          <span
            className={`hidden md:inline-flex items-center space-x-1 text-[9.5px] font-medium px-1.5 py-0.5 rounded-full border ${
              aliceAgreedToShare
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {aliceAgreedToShare ? (
              <>
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                <span>Sharing Agreed</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-2.5 h-2.5 text-amber-600" />
                <span>Consent Pending</span>
              </>
            )}
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-200 group-hover:text-black ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="identity-dropdown-menu"
          role="listbox"
          className="absolute right-0 mt-2 w-80 sm:w-92 bg-white rounded-2xl shadow-xl border border-neutral-200 py-2.5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Switch Active Identity
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">2 Registered Profiles</span>
          </div>

          <div className="p-2 space-y-1.5">
            {/* Alice Option */}
            <div
              role="option"
              aria-selected={currentIdentity === 'alice'}
              onClick={() => {
                onSelectIdentity('alice');
                setIsOpen(false);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                currentIdentity === 'alice'
                  ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300'
                  : 'bg-neutral-50/60 hover:bg-neutral-100 border-neutral-200/80'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10.5px] shrink-0 mt-0.5 shadow-xs">
                AS
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-neutral-900 text-sm">Alice Smith</span>
                    <span className="text-[11px] text-neutral-500 font-normal">Female, 70</span>
                  </div>
                  {currentIdentity === 'alice' && (
                    <span className="flex items-center space-x-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-full">
                      <Check className="w-2.5 h-2.5 text-emerald-700" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
                <div className="text-[11.5px] text-neutral-600 mt-0.5">
                  Mother • Patient / Smartwatch Wearer
                </div>
                <div className="mt-1.5 flex items-center space-x-2 text-[10.5px] text-neutral-500 font-mono">
                  <span className="flex items-center space-x-1">
                    <Watch className="w-2.5 h-2.5 text-neutral-400" />
                    <span>Watch HW-BLE-01</span>
                  </span>
                  <span>•</span>
                  <span>Autonomous Voice Channel</span>
                </div>
              </div>
            </div>

            {/* Bob Option */}
            <div
              role="option"
              aria-selected={currentIdentity === 'bob'}
              onClick={() => {
                onSelectIdentity('bob');
                setIsOpen(false);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                currentIdentity === 'bob'
                  ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300'
                  : 'bg-neutral-50/60 hover:bg-neutral-100 border-neutral-200/80'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10.5px] shrink-0 mt-0.5 shadow-xs">
                BS
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-neutral-900 text-sm">Bob Smith</span>
                    <span className="text-[11px] text-neutral-500 font-normal">Male, 42</span>
                  </div>
                  {currentIdentity === 'bob' && (
                    <span className="flex items-center space-x-0.5 text-[10px] font-semibold text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded-full">
                      <Check className="w-2.5 h-2.5 text-blue-700" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
                <div className="text-[11.5px] text-neutral-600 mt-0.5">
                  Alice's Son • Family Caregiver Proxy
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-blue-100/70 text-blue-800">
                    Add Context &amp; Memory
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-200/70 text-neutral-700">
                    Receive Alerts
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800">
                    Independent Chat
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer note on consent */}
          <div className="px-4 py-2 bg-neutral-50 border-t border-neutral-100 text-[11px] text-neutral-500 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-neutral-400" />
              <span>Sharing Consent:</span>
            </span>
            <span
              className={`font-semibold ${
                aliceAgreedToShare ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {aliceAgreedToShare ? 'Alice Agreed (Full Access)' : 'Pending Alice Agreement'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
