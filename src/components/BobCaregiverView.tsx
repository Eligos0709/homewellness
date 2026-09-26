/**
 * ==============================================================================
 * BOB CAREGIVER VIEW
 * ==============================================================================
 * Caregiver proxy view for Bob Smith, including vital stream snapshots,
 * conversational duplex chat, episodic context & memory injection,
 * and proactive health notifications.
 * ==============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  PlusCircle,
  Bell,
  ShieldCheck,
  ShieldAlert,
  Send,
  Heart,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Pill,
  Sparkles,
  Volume2,
  UserCheck,
  ChevronRight,
  Database,
  Calendar,
  Trash2,
  Lock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  VitalData,
  SystemLogData,
  CaregiverContextItem,
  CaregiverAlert,
  CaregiverChatMessage,
} from '../types';

interface BobCaregiverViewProps {
  aliceAgreedToShare: boolean;
  onToggleAliceAgree: () => void;
  onSwitchToAlice: () => void;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  selectedWatch: VitalData;
  allWatches: VitalData[];
  currentLog: SystemLogData;
  caregiverContexts: CaregiverContextItem[];
  onAddContext: (item: Omit<CaregiverContextItem, 'id' | 'timestampIso' | 'status'>) => void;
  onRemoveContext: (id: string) => void;
  alerts: CaregiverAlert[];
  onAcknowledgeAlert: (id: string) => void;
  messages: CaregiverChatMessage[];
  onSendMessage: (text: string) => void;
  isAgentTyping: boolean;
}

export const BobCaregiverView: React.FC<BobCaregiverViewProps> = ({
  aliceAgreedToShare,
  onToggleAliceAgree,
  onSwitchToAlice,
  selectedTime,
  onSelectTime,
  selectedWatch,
  allWatches,
  currentLog,
  caregiverContexts,
  onAddContext,
  onRemoveContext,
  alerts,
  onAcknowledgeAlert,
  messages,
  onSendMessage,
  isAgentTyping,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'add_context' | 'alerts'>('chat');
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Add context form state
  const [contextTitle, setContextTitle] = useState('');
  const [contextType, setContextType] = useState<CaregiverContextItem['type']>('REMINDER');
  const [contextTime, setContextTime] = useState('19:00');
  const [contextChannel, setContextChannel] = useState<'incomeContext' | 'newToMemory' | 'presentContext'>('incomeContext');
  const [showSuccessBanner, setShowSuccessBanner] = useState<string | null>(null);

  // Alerts filter
  const [alertFilter, setAlertFilter] = useState<'ALL' | 'ABNORMAL' | 'MEDICATION'>('ALL');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;
    onSendMessage(text);
    setInputText('');
  };

  const handleCreateContextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contextTitle.trim()) return;

    onAddContext({
      type: contextType,
      title: contextTitle.trim(),
      time: contextTime.trim() || undefined,
      addedBy: "Bob Smith (Alice's Son)",
      targetChannel: contextChannel,
    });

    setShowSuccessBanner(`Injected "${contextTitle.trim()}" into Agent context & memory graph!`);
    setTimeout(() => setShowSuccessBanner(null), 4000);

    setContextTitle('');
  };

  const quickPrompts = [
    { label: "How is Mom's heart rate right now?", prompt: "How is Mom's heart rate doing right now, and did she stabilize?" },
    { label: "Summarize 19:02–19:12 stream", prompt: "Can you give me a summary of Mom's timeline stream from 19:02 to 19:12 while I was busy at work?" },
    { label: "Did she take her 19:00 medication?", prompt: "Did Mom take her 19:00 evening medication yet?" },
    { label: "Why did her HR spike to 82 bpm at 18:57?", prompt: "Can you explain why Mom's heart rate spiked to 82 bpm between 18:56 and 18:57?" },
    { label: "How did she sleep last night?", prompt: "How was Mom's sleep quality and duration last night?" },
  ];

  const filteredAlerts = alerts.filter((alert) => {
    if (alertFilter === 'ABNORMAL') return alert.type === 'URGENT_VITAL';
    if (alertFilter === 'MEDICATION') return alert.type === 'MEDICATION_SCHEDULED' || alert.type === 'MEDICATION_TAKEN';
    return true;
  });

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div id="bob-caregiver-dashboard" className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 select-text">
      {/* 1. Caregiver Header & Identity Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-neutral-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            BS
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight">
                Bob Smith
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                Family Caregiver Proxy
              </span>
              <span className="text-xs text-neutral-400">•</span>
              <span className="text-xs text-neutral-600 font-medium">
                Relationship: Alice Smith's Son
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Alert Checked at 19:12 (Busy at work)</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Authorized caregiver console. Bob was busy at work and checked alerts at 19:12 UTC; extended 19:02–19:12 telemetry stream active.
            </p>
          </div>
        </div>

        {/* Alice's Sharing Consent Status Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 w-full md:w-auto shrink-0">
          <div
            className={`px-3.5 py-2 rounded-xl border text-xs flex items-center space-x-2.5 ${
              aliceAgreedToShare
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            {aliceAgreedToShare ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <div>
              <div className="font-semibold">
                {aliceAgreedToShare
                  ? "Alice's Sharing Consent: GRANTED"
                  : "Alice's Sharing Consent: PENDING"}
              </div>
              <div className="text-[11px] opacity-85">
                {aliceAgreedToShare
                  ? 'Authorized to chat with Agent about vitals'
                  : 'Requires Alice to toggle agree in Voice Channel'}
              </div>
            </div>
          </div>

          <button
            id="switch-to-alice-channel-btn"
            type="button"
            onClick={onSwitchToAlice}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition cursor-pointer shrink-0"
            title="Switch to Alice's view to manage agreement or view smartwatch display"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Switch to Alice</span>
          </button>
        </div>
      </div>

      {/* 2. Patient Telemetry Snapshot Card (Alice's Current Status) */}
      <div className="bg-neutral-900 text-white rounded-2xl p-4 sm:p-5 border border-neutral-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-emerald-400 border border-neutral-700">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono text-neutral-400">Target Patient</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                HW-BLE-01
              </span>
            </div>
            <div className="text-base font-semibold text-white">
              Alice Smith (70, Female) • Snapshot {selectedTime}:00 UTC
            </div>
          </div>
        </div>

        {/* Quick vitals metrics */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
          <div className="bg-neutral-800/90 px-3 py-1.5 rounded-lg border border-neutral-700">
            <span className="text-neutral-400 mr-1.5">Resting HR:</span>
            <span
              className={`font-bold ${
                selectedWatch.isAbnormal ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {selectedWatch.restingHr} bpm
            </span>
          </div>

          <div className="bg-neutral-800/90 px-3 py-1.5 rounded-lg border border-neutral-700">
            <span className="text-neutral-400 mr-1.5">HRV:</span>
            <span className="font-bold text-white">{selectedWatch.hrv} ms</span>
          </div>

          <div className="bg-neutral-800/90 px-3 py-1.5 rounded-lg border border-neutral-700">
            <span className="text-neutral-400 mr-1.5">SpO2:</span>
            <span className="font-bold text-white">{selectedWatch.spo2}%</span>
          </div>

          <div className="bg-neutral-800/90 px-3 py-1.5 rounded-lg border border-neutral-700">
            <span className="text-neutral-400 mr-1.5">Sleep:</span>
            <span className="font-bold text-amber-300">{selectedWatch.avgSleep} hrs</span>
          </div>
        </div>

        {/* Timestamp navigation shortcut */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-neutral-400 font-mono hidden lg:inline">Select Timestamp:</span>
          <select
            id="caregiver-timestamp-select"
            value={selectedTime}
            onChange={(e) => onSelectTime(e.target.value)}
            className="bg-neutral-800 text-white text-xs font-mono border border-neutral-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {allWatches.map((w) => (
              <option key={w.time} value={w.time}>
                {w.time} UTC {w.isAbnormal ? '(Elevated HR)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-neutral-300/80 pb-1">
        <button
          id="bob-tab-chat"
          type="button"
          onClick={() => setActiveSubTab('chat')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 transition cursor-pointer ${
            activeSubTab === 'chat'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Independent Channel with Agent</span>
          {aliceAgreedToShare ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          id="bob-tab-add-context"
          type="button"
          onClick={() => setActiveSubTab('add_context')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 transition cursor-pointer ${
            activeSubTab === 'add_context'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Context &amp; Memory</span>
          <span className="px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-800 text-xs font-mono">
            {caregiverContexts.length}
          </span>
        </button>

        <button
          id="bob-tab-alerts"
          type="button"
          onClick={() => setActiveSubTab('alerts')}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 transition cursor-pointer relative ${
            activeSubTab === 'alerts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alerts &amp; Notifications from Alice</span>
          {unreadAlertsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unreadAlertsCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB 1: Independent Channel to talk/chat with Agent */}
      {activeSubTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header of Channel */}
          <div className="p-4 sm:p-5 bg-[#0b0e14] text-white border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-600/60 text-blue-300 flex items-center justify-center font-bold text-xs font-mono">
                AI
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    Independent Caregiver Channel (Bob Smith &harr; Health Agent)
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700 font-bold">
                    Direct Care Loop
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Consult the Agent on Alice's telemetry, vital anomalies, medication status, and clinical guidance.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-neutral-300 text-[11px] font-mono">
                  Agent Duplex Ready
                </span>
              </div>
            </div>
          </div>

          {/* Consent Check: If Alice has NOT agreed */}
          {!aliceAgreedToShare ? (
            <div id="consent-locked-barrier" className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto my-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center shadow-xs">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-neutral-900">
                  Health Situation Channel Restricted by Alice
                </h4>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Alice has not yet agreed to share her clinical health data and continuous voice updates with family members. To protect patient privacy, the Agent cannot discuss Alice's vitals or heart rate anomalies until she enables sharing.
                </p>
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 text-left font-mono space-y-1">
                  <div className="font-semibold text-neutral-900">How to authorize this channel:</div>
                  <div>1. Switch to Alice Smith's identity in the header</div>
                  <div>2. Open the <strong>Voice &amp; Context Channel</strong> on the smartwatches</div>
                  <div>3. Click the <strong>"Agree to Share Health Situation with Bob"</strong> button</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  id="grant-consent-from-bob-view-btn"
                  type="button"
                  onClick={onToggleAliceAgree}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center space-x-2 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Grant Sharing Consent</span>
                </button>
                <button
                  type="button"
                  onClick={onSwitchToAlice}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs flex items-center space-x-2 transition cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Go to Alice's Voice Channel</span>
                </button>
              </div>
            </div>
          ) : (
            /* If Alice HAS agreed: Full interactive chat */
            <div className="flex flex-col flex-1">
              {/* Consent active banner */}
              <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Alice's Consent Active:</strong> Alice authorized Bob Smith to access full telemetry summaries and discuss care plans.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onToggleAliceAgree}
                  className="text-neutral-500 hover:text-neutral-700 underline text-[11px] cursor-pointer"
                  title="Revoke consent to test locked state"
                >
                  (Toggle Consent for Testing)
                </button>
              </div>

              {/* Work shift catch-up banner */}
              <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Work Shift Catch-up (19:12 UTC):</strong> Bob was busy at work during earlier spikes; he reviewed health alerts at 19:12. Channel messages and timeline stream (19:02–19:12) are synced below.
                  </span>
                </div>
                <span className="hidden sm:inline text-[11px] font-mono text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300/60 shrink-0 font-bold">
                  Alert Opened 19:12 UTC
                </span>
              </div>

              {/* Chat Message Stream */}
              <div
                id="caregiver-chat-scroll"
                className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[440px] min-h-[320px] bg-neutral-50/50"
              >
                {messages.map((msg) => {
                  const isBob = msg.sender === 'bob';
                  const displayText = msg.text.replace(/\[Simulation\]\s*/gi, '');
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isBob ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-neutral-500 font-mono mb-1 px-1 flex items-center space-x-1.5">
                        <span className={isBob ? 'text-blue-600 font-semibold' : 'text-neutral-800 font-semibold'}>
                          {isBob ? "Bob Smith (Son)" : "HomeWellness AI Agent"}
                        </span>
                        <span>•</span>
                        <span>{msg.time} UTC</span>
                      </div>

                      <div
                        className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed shadow-xs ${
                          isBob
                            ? 'bg-blue-600 text-white rounded-tr-xs'
                            : 'bg-white text-neutral-900 border border-neutral-200 rounded-tl-xs'
                        }`}
                      >
                        {displayText}
                      </div>
                    </div>
                  );
                })}

                {isAgentTyping && (
                  <div className="flex items-center space-x-2 text-neutral-500 text-xs italic pl-1 font-mono">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span>Agent evaluating telemetry context and drafting response...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Inquiry Prompts */}
              <div className="p-3 bg-white border-t border-neutral-200 overflow-x-auto">
                <div className="text-[11px] font-semibold text-neutral-500 mb-1.5 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Suggested inquiries for Bob:</span>
                </div>
                <div className="flex items-center space-x-2 min-w-max pb-1">
                  {quickPrompts.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(q.prompt)}
                      className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-medium transition cursor-pointer"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input Box */}
              <div className="p-3 sm:p-4 bg-white border-t border-neutral-200 flex items-center space-x-2">
                <input
                  id="caregiver-chat-input"
                  type="text"
                  placeholder="Ask the Agent about Alice's heart rate, medication, sleep, or symptoms..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  className="flex-1 bg-neutral-100 border border-neutral-300 rounded-xl px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
                />

                <button
                  id="caregiver-chat-send-btn"
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center space-x-1.5 shrink-0 shadow-xs"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Add Context & Memory to Agent */}
      {activeSubTab === 'add_context' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Add Context/Memory */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div>
              <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider">
                <PlusCircle className="w-4 h-4" />
                <span>Agent Injection Console</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mt-1">
                Add Context &amp; Memory for Alice
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Bob can inject medication reminders, dietary notes, or episodic memory nodes into the Agent's reasoning loop.
              </p>
            </div>

            {showSuccessBanner && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{showSuccessBanner}</span>
              </div>
            )}

            <form onSubmit={handleCreateContextSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Context / Memory Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'REMINDER', label: 'Medication Reminder', icon: Pill },
                    { id: 'CLINICAL_NOTE', label: 'Clinical Note', icon: Activity },
                    { id: 'LIFESTYLE', label: 'Diet & Lifestyle', icon: Heart },
                    { id: 'MEMORY', label: 'Episodic Memory', icon: Database },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = contextType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setContextType(cat.id as any)}
                        className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold ring-1 ring-blue-400'
                            : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Reminder / Context Content
                </label>
                <input
                  id="context-title-input"
                  type="text"
                  placeholder="e.g., Reminder: 19:00 to take medication"
                  value={contextTitle}
                  onChange={(e) => setContextTitle(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-blue-500"
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-neutral-400">Templates:</span>
                  {[
                    'Reminder: 19:00 to take medication',
                    'Reminder: Drink full glass of water with pill',
                    'Dietary: Low sodium dinner only',
                    'Observation: Felt fatigued after afternoon walk',
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setContextTitle(tpl)}
                      className="text-[10.5px] px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300 transition cursor-pointer"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 19:00"
                    value={contextTime}
                    onChange={(e) => setContextTime(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Target Channel
                  </label>
                  <select
                    value={contextChannel}
                    onChange={(e) => setContextChannel(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="incomeContext">incomeContext (Queue)</option>
                    <option value="newToMemory">newToMemory (Graph)</option>
                    <option value="presentContext">presentContext (Active)</option>
                  </select>
                </div>
              </div>

              <button
                id="submit-context-to-agent-btn"
                type="submit"
                disabled={!contextTitle.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-2.5 rounded-xl font-semibold text-xs shadow-xs transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Inject into Agent Memory &amp; Context</span>
              </button>
            </form>
          </div>

          {/* Right List: Active Contexts & Memories */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  Active Contexts &amp; Memories Added by Bob
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Synchronized with the HomeWellness LangGraph StateGraph &amp; MemorySaver.
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                {caregiverContexts.length} Active Nodes
              </span>
            </div>

            <div className="space-y-2.5">
              {caregiverContexts.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 text-xs">
                  No context items currently active. Use the form to inject a reminder or memory.
                </div>
              ) : (
                caregiverContexts.map((item) => {
                  const displayTitle = item.title.replace(/\[Simulation\]\s*/gi, '');
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-neutral-200/90 bg-neutral-50/60 hover:bg-white hover:shadow-xs transition flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                            {item.type}
                          </span>
                          {item.time && (
                            <span className="px-2 py-0.5 rounded bg-neutral-200 text-neutral-800 font-semibold">
                              Time: {item.time}
                            </span>
                          )}
                          <span className="text-neutral-500">
                            Channel: <span className="font-semibold text-neutral-700">{item.targetChannel}</span>
                          </span>
                        </div>

                        <div className="text-sm font-semibold text-neutral-900">
                          {displayTitle}
                        </div>

                        <div className="text-[11px] text-neutral-500 font-mono flex items-center space-x-2">
                          <span>Source: {item.addedBy}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">Synced with Alice's Watch</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveContext(item.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove context node"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 font-mono leading-relaxed">
              <span className="font-semibold">Semantic Reflection:</span> When Bob adds a reminder (e.g., <em>Reminder: 19:00 to take medication</em>), the Agent binds this incoming context to Alice's schedule. When Alice looks at her watch at 18:55–19:01, the green reminder banner triggers automatically.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Alerts & Notifications from Alice */}
      {activeSubTab === 'alerts' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Alerts &amp; Notifications from Alice
                </h3>
                {unreadAlertsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold">
                    {unreadAlertsCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Proactive notifications pushed from Alice's smartwatch sensors to Bob Smith's phone/watch app.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1.5">
              {(['ALL', 'ABNORMAL', 'MEDICATION'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setAlertFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    alertFilter === filter
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {filter === 'ALL' ? 'All Alerts' : filter === 'ABNORMAL' ? 'HR Abnormalities' : 'Medication'}
                </button>
              ))}
            </div>
          </div>

          {/* Alert Feed Items */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 text-xs">
                No alerts match the selected filter.
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isCritical = alert.severity === 'critical';
                const isWarning = alert.severity === 'warning';
                const isSuccess = alert.severity === 'success';

                let borderClass = 'border-neutral-200 bg-neutral-50/50';
                let iconColor = 'text-neutral-500';
                if (isCritical) {
                  borderClass = 'border-rose-300 bg-rose-50/60 ring-1 ring-rose-300/60';
                  iconColor = 'text-rose-600';
                } else if (isWarning) {
                  borderClass = 'border-amber-300 bg-amber-50/60';
                  iconColor = 'text-amber-600';
                } else if (isSuccess) {
                  borderClass = 'border-emerald-300 bg-emerald-50/60';
                  iconColor = 'text-emerald-600';
                }

                const displayTitle = alert.title.replace(/\[Simulation\]\s*/gi, '');
                const displayDesc = alert.description.replace(/\[Simulation\]\s*/gi, '');

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${borderClass}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-0.5 p-2 rounded-lg bg-white shadow-xs ${iconColor}`}>
                        {isCritical ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : isSuccess ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Bell className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm text-neutral-900">
                            {displayTitle}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-neutral-700 border border-neutral-200">
                            {alert.time} UTC
                          </span>
                          {!alert.isRead && (
                            <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded">
                              Unread
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                          {displayDesc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onSelectTime(alert.relatedWatchTime)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-semibold shadow-xs transition cursor-pointer flex items-center space-x-1"
                        title={`Jump to watch at ${alert.relatedWatchTime}`}
                      >
                        <span>View Watch Snapshot ({alert.relatedWatchTime})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {!alert.isRead && (
                        <button
                          type="button"
                          onClick={() => onAcknowledgeAlert(alert.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition cursor-pointer"
                          title="Acknowledge alert"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 5. Smartwatches Timeline Preview Strip for Bob (Extended 18:54 – 19:12 Stream) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm sm:text-base font-semibold text-neutral-900">
              Alice's Smartwatch Timeline Stream ({allWatches[0]?.time || '18:54'} – {allWatches[allWatches.length - 1]?.time || '19:12'})
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium">
              {allWatches.length} Snapshots • Extended Stream Active
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-neutral-400 mr-1 text-[11px] font-mono">Quick Jump:</span>
            <button
              type="button"
              onClick={() => onSelectTime('19:12')}
              className={`px-2 py-1 rounded-lg border text-xs font-mono font-medium transition cursor-pointer ${
                selectedTime === '19:12'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
              }`}
            >
              19:12 (Bob Check-in)
            </button>
            <button
              type="button"
              onClick={() => onSelectTime('19:02')}
              className={`px-2 py-1 rounded-lg border text-xs font-mono font-medium transition cursor-pointer ${
                selectedTime === '19:02'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
              }`}
            >
              19:02 (Medication)
            </button>
            <button
              type="button"
              onClick={() => onSelectTime('18:57')}
              className={`px-2 py-1 rounded-lg border text-xs font-mono font-medium transition cursor-pointer ${
                selectedTime === '18:57'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
              }`}
            >
              18:57 (Spike 82 bpm)
            </button>
          </div>
        </div>

        <div className="text-xs text-neutral-500 font-mono flex items-center justify-between">
          <span>Click any timestamp card below to inspect full telemetry in Bob's view:</span>
          <span className="text-indigo-600 font-semibold hidden md:inline">
            19:03–19:12 synced post-medication while Bob was busy at work
          </span>
        </div>

        <div className="flex items-stretch space-x-2.5 overflow-x-auto py-2 px-1 scroll-smooth">
          {allWatches.map((w) => {
            const isSelected = selectedTime === w.time;
            const isAbnormal = w.cardColor === 'pink' || w.isAbnormal;
            const isExtendedStream = w.time > '19:02';
            const isBobCheckIn = w.time === '19:12';

            return (
              <button
                key={w.time}
                type="button"
                onClick={() => onSelectTime(w.time)}
                className={`min-w-[135px] sm:min-w-[145px] p-3 rounded-xl text-xs font-mono border transition cursor-pointer shrink-0 text-left flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/40'
                    : isAbnormal
                    ? 'bg-rose-50/90 text-rose-950 border-rose-300 hover:bg-rose-100'
                    : isBobCheckIn
                    ? 'bg-amber-50/90 text-amber-950 border-amber-300 hover:bg-amber-100'
                    : isExtendedStream
                    ? 'bg-indigo-50/70 text-indigo-950 border-indigo-200 hover:bg-indigo-100/70'
                    : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-sm tracking-tight">{w.time}</span>
                    {isBobCheckIn ? (
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-semibold">
                        19:12 SYNC
                      </span>
                    ) : isAbnormal ? (
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-semibold animate-pulse">
                        ⚠️ ALERT
                      </span>
                    ) : isExtendedStream ? (
                      <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-indigo-100 text-indigo-700'}`}>
                        +STREAM
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[10px] opacity-80 truncate mb-2">
                    {w.activity || 'Resting'}
                  </div>
                </div>

                <div className="space-y-0.5 pt-1 border-t border-current/10 text-[11px]">
                  <div className="flex justify-between">
                    <span className="opacity-75">HR:</span>
                    <span className="font-bold">{w.restingHr} bpm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">SpO2:</span>
                    <span>{w.spo2}%</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
