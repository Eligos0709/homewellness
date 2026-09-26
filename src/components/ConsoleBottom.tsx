import React, { useState } from 'react';
import { Cpu, Play, Copy, Check, ChevronDown, ChevronRight, Activity, Terminal, Filter, GitBranch, ArrowRight } from 'lucide-react';
import { SystemLogData, AgentActionStep, VitalData } from '../types';

interface ConsoleBottomProps {
  logData: SystemLogData;
  selectedTime: string;
  selectedWatch?: VitalData;
  onOpenArchitecture?: () => void;
}

export const ConsoleBottom: React.FC<ConsoleBottomProps> = ({
  logData,
  selectedTime,
  selectedWatch,
  onOpenArchitecture,
}) => {
  // Mode toggles for System Log
  const [logViewMode, setLogViewMode] = useState<'natural' | 'compact' | 'raw'>('natural');
  const [logFilter, setLogFilter] = useState<'ALL' | 'INGEST' | 'EVAL' | 'NOTIFY' | 'CONTEXT' | 'MEMORY'>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedLog, setCopiedLog] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);

  // Mode toggles for Agent Actions
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [isExecutingCycle, setIsExecutingCycle] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [cycleCount, setCycleCount] = useState(3412);
  const [copiedAgent, setCopiedAgent] = useState(false);
  const [agentFilter, setAgentFilter] = useState<
    'ALL' | 'INGEST' | 'ANALYTICS' | 'TRIAGE' | 'NOTIFY' | 'CONTEXT' | 'IDENTITY' | 'MEMORY'
  >('ALL');

  // Agent action steps specification
  const isAbnormal = selectedTime === '18:56' || selectedTime === '18:57';
  const isPeakAbnormal = selectedTime === '18:57';
  const isRecovering = selectedTime === '18:58';
  const isMedRecord = selectedTime === '19:02';
  const hasReminder = ['18:55', '18:56', '19:00', '19:01'].includes(selectedTime);

  const restingHr = selectedWatch ? selectedWatch.restingHr : (isAbnormal ? 78 : 65);
  const hrv = selectedWatch ? selectedWatch.hrv : 15;
  const spo2 = selectedWatch ? selectedWatch.spo2 : 95;
  const stateLabel = isPeakAbnormal ? 'PEAK_ELEVATED' : isAbnormal ? 'ELEVATED' : isRecovering ? 'RECOVERED' : 'NORMAL';

  const deltaBpm = restingHr - 64;
  const zScore = isPeakAbnormal ? 3.12 : isAbnormal ? 2.68 : isRecovering ? 0.31 : 0.12;

  // Copy handler for System Log
  const handleCopyLog = () => {
    let textToCopy = '';
    if (logViewMode === 'raw') {
      textToCopy = JSON.stringify(logData, null, 2);
    } else if (logViewMode === 'compact') {
      textToCopy = `System log (Compact Engineering View) - ${logData.time}
> Get the real time vital data: ${logData.time}
Status: ${logData.status}
Notification: ${logData.notification}
Context -
  present context: ${logData.presentContext}
  income context: ${logData.incomeContext}
  new to memory: ${logData.newToMemory}`;
    } else {
      textToCopy = `[SYSTEM LOG - ${logData.time}:00 UTC - PID ${logData.pid}]
[${selectedTime}:00.124] [INGEST]   Ingested real-time vital packet: HR ${restingHr} bpm, HRV ${hrv} ms, SpO2 ${spo2}%.
[${selectedTime}:00.198] [EVAL]     Health evaluation: ${isPeakAbnormal ? 'Critical tachycardia (82 bpm, z-score: 3.12, SpO2: 93%)' : isAbnormal ? 'HR abnormal (78 bpm, z-score: 2.68)' : isRecovering ? 'Stabilized (65 bpm, anomaly cleared)' : 'Normal vitals (delta: ' + (deltaBpm >= 0 ? '+' : '') + deltaBpm.toFixed(1) + ' bpm, z-score: ' + zScore.toFixed(2) + ')'}.
[${selectedTime}:00.245] [NOTIFY]   Notification dispatch: ${logData.notification !== 'none' ? 'Dispatched "' + logData.notification + '"' : 'Ambient vitals nominal; active banners suppressed'}.
[${selectedTime}:00.312] [CONTEXT]  Context engine: Present: "${logData.presentContext}", Incoming: "${logData.incomeContext}".
[${selectedTime}:00.380] [MEMORY]   Semantic memory: ${logData.newToMemory !== 'none' ? 'Committed node "' + logData.newToMemory + '"' : 'Graph topology nominal; zero delta commits'}.`;
    }

    navigator.clipboard?.writeText(textToCopy);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 1800);
  };

  // Copy handler for AI Agent Actions
  const handleCopyAgent = () => {
    const textToCopy = `[AI AGENT ACTIONS - ${logData.time}:00 UTC - CYCLE #${cycleCount}]
[${selectedTime}:00.142] [INGEST]    sensor.readVitals() (14ms)
  -> Ingested real-time vital packet from watch sensor: HR ${restingHr} bpm, HRV ${hrv} ms, SpO2 ${spo2}%.
[${selectedTime}:00.180] [ANALYTICS] analytics.rollingEvaluation() (38ms)
  -> ${isPeakAbnormal ? 'HR peaked at 82 bpm (+28.1% above 64 bpm baseline, z-score: 3.12). Critical tachycardia detected.' : isAbnormal ? 'Detected acute upward shift to 78 bpm (+21.8% above 64 bpm baseline, z-score: 2.68).' : isRecovering ? 'Resting HR normalized to 65 bpm (within 95% CI of baseline, z-score: 0.31). Anomaly cleared.' : 'Biometrics steady within expected baseline (delta: ' + (deltaBpm >= 0 ? '+' : '') + deltaBpm.toFixed(1) + ' bpm, z-score: ' + zScore.toFixed(2) + ').'}
[${selectedTime}:00.192] [TRIAGE]    triage.classifyHealthIndex() (12ms)
  -> Classified state as ${logData.status} (${isPeakAbnormal ? 'P1_URGENT' : isAbnormal ? 'P2_ALERT' : 'P0_ROUTINE'}).
[${selectedTime}:00.210] [NOTIFY]    dispatch.evaluateNotificationRules() (18ms)
  -> Dispatched: ${logData.notification !== 'none' ? '"' + logData.notification + '"' : 'None (suppressed nominal)'}.
[${selectedTime}:00.237] [CONTEXT]   contextStore.resolveActiveVectors() (27ms)
  -> Present: "${logData.presentContext}", Incoming: "${logData.incomeContext}".
[${selectedTime}:00.245] [IDENTITY]  security.verifySessionScope() (8ms)
  -> Verified patient session token for Alice Smith (AS-70-F) with clock ${logData.time}:00.
[${selectedTime}:00.299] [MEMORY]    semanticStore.syncMemoryGraph() (54ms)
  -> ${logData.newToMemory !== 'none' ? 'Committed episodic node: "' + logData.newToMemory + '"' : 'Episodic memory nominal. Zero delta commits'}.`;

    navigator.clipboard?.writeText(textToCopy);
    setCopiedAgent(true);
    setTimeout(() => setCopiedAgent(false), 1800);
  };

  const actionSteps: AgentActionStep[] = [
    {
      id: 'step-1',
      stepNumber: '01',
      name: 'sensor.readVitals',
      category: 'INGEST',
      badgeStyle: 'bg-sky-950/90 border-sky-700/90 text-sky-300',
      timeOffsetMs: `${selectedTime}:00.142`,
      signature: 'sensor.readVitals({ patientId: "AS-70-F", stream: "ble_raw" })',
      latencyMs: 14,
      status: 'SUCCESS',
      outputPreview: `{ restingHr: ${restingHr}, hrv: ${hrv}, spo2: ${spo2}, state: "${stateLabel}" }`,
      naturalText: (
        <span>
          Polled BLE telemetry stream from watch sensor:{' '}
          Ingested resting HR of <strong className="text-white font-semibold">{restingHr} bpm</strong>,{' '}
          HRV of <strong className="text-white font-semibold">{hrv} ms</strong>, and{' '}
          SpO2 at <strong className="text-white font-semibold">{spo2}%</strong> with optimal signal quality.
        </span>
      ),
      payload: {
        sensor: 'HW-BLE-WATCH-01',
        sampleRateHz: 25,
        ppgSnrDb: isAbnormal ? 24.1 : 28.4,
        confidence: isAbnormal ? 0.962 : 0.994,
      },
    },
    {
      id: 'step-2',
      stepNumber: '02',
      name: 'analytics.rollingEvaluation',
      category: 'ANALYTICS',
      badgeStyle: isPeakAbnormal
        ? 'bg-rose-950/90 border-rose-600 text-rose-300'
        : isAbnormal
        ? 'bg-amber-950/90 border-amber-600 text-amber-300'
        : 'bg-emerald-950/90 border-emerald-600 text-emerald-300',
      timeOffsetMs: `${selectedTime}:00.180`,
      signature: 'analytics.rollingEvaluation({ windowDays: 30, baselineHr: 64 })',
      latencyMs: 38,
      status: isAbnormal ? 'ALERT' : 'SUCCESS',
      outputPreview: isAbnormal
        ? `delta: +${deltaBpm} bpm (+${((deltaBpm / 64) * 100).toFixed(1)}% over baseline 64 bpm), zScore: ${zScore} [ANOMALY_TRIGGER]`
        : isRecovering
        ? `delta: +${deltaBpm} bpm (normalized within 95% CI of 30-day mean, alert cleared)`
        : `delta: ${deltaBpm >= 0 ? '+' : ''}${deltaBpm.toFixed(1)} bpm (within 95% confidence interval of 30-day mean)`,
      naturalText: isPeakAbnormal ? (
        <span>
          Ran 30-day baseline comparison:{' '}
          Resting HR peaked at <strong className="text-rose-400 font-semibold">82 bpm</strong> (+28.1% above 64 bpm baseline, z-score: 3.12).{' '}
          Flagged acute tachycardia anomaly trigger.
        </span>
      ) : isAbnormal ? (
        <span>
          Ran 30-day baseline comparison:{' '}
          Detected significant resting HR jump to <strong className="text-amber-400 font-semibold">78 bpm</strong> (+21.8% above 64 bpm baseline, z-score: 2.68).{' '}
          Flagged acute physiological elevation.
        </span>
      ) : isRecovering ? (
        <span>
          Ran 30-day baseline comparison:{' '}
          Resting HR recovered to <strong className="text-emerald-400 font-semibold">65 bpm</strong> (normalized within 95% CI of 30-day baseline, z-score: 0.31).{' '}
          Anomaly state cleared.
        </span>
      ) : (
        <span>
          Ran 30-day baseline comparison:{' '}
          Biometrics steady within normal circadian baseline{' '}
          (delta: <strong className="text-emerald-400 font-semibold">{deltaBpm >= 0 ? '+' : ''}{deltaBpm.toFixed(1)} bpm</strong>, z-score: {zScore.toFixed(2)}).
        </span>
      ),
      payload: {
        baselineMean: 64.0,
        standardDeviation: 3.2,
        zScore: zScore,
        statusFlag: isAbnormal ? 'HR_ABNORMAL' : isRecovering ? 'HR_RECOVERY' : 'STABLE',
      },
    },
    {
      id: 'step-3',
      stepNumber: '03',
      name: 'triage.classifyHealthIndex',
      category: 'TRIAGE',
      badgeStyle: isPeakAbnormal
        ? 'bg-rose-950/90 border-rose-600 text-rose-300'
        : isAbnormal
        ? 'bg-amber-950/90 border-amber-600 text-amber-300'
        : 'bg-emerald-950/90 border-emerald-600 text-emerald-300',
      timeOffsetMs: `${selectedTime}:00.192`,
      signature: 'triage.classifyHealthIndex({ vitals, delta, sleepHrs: 5.5 })',
      latencyMs: 12,
      status: isAbnormal ? 'ALERT' : 'SUCCESS',
      outputPreview: isAbnormal
        ? `classification: "${logData.status}", priority: "${isPeakAbnormal ? 'P1_URGENT' : 'P2_ALERT'}"`
        : `classification: "${logData.status}", priority: "P0_ROUTINE"`,
      naturalText: isPeakAbnormal ? (
        <span>
          Classified clinical triage state as <strong className="text-rose-400 font-semibold">HR Abnormal (Critical)</strong> with P1 urgent escalation priority.{' '}
          Clinical risk score: 85/100.
        </span>
      ) : isAbnormal ? (
        <span>
          Classified clinical triage state as <strong className="text-amber-400 font-semibold">HR Abnormal</strong> with P2 alert priority.{' '}
          Clinical risk score: 72/100. Triggered alert workflow.
        </span>
      ) : isRecovering ? (
        <span>
          Classified clinical triage state as <strong className="text-emerald-400 font-semibold">HR Recovered / Nominal</strong>.{' '}
          Confirmed cardiovascular restabilization.
        </span>
      ) : (
        <span>
          Classified clinical triage state as <strong className="text-emerald-400 font-semibold">Nominal (P0 Routine)</strong>.{' '}
          Zero clinical intervention required.
        </span>
      ),
      payload: {
        riskScore: isAbnormal ? 72 : 12,
        clinicalGrade: isAbnormal ? 'ELEVATED_HEART_RATE' : 'NOMINAL',
      },
    },
    {
      id: 'step-4',
      stepNumber: '04',
      name: 'dispatch.evaluateNotificationRules',
      category: 'NOTIFY',
      badgeStyle: 'bg-violet-950/90 border-violet-700/90 text-violet-300',
      timeOffsetMs: `${selectedTime}:00.210`,
      signature: 'dispatch.evaluateNotificationRules({ status, patient: "AS-70-F" })',
      latencyMs: 18,
      status: 'SUCCESS',
      outputPreview: logData.notification !== 'none'
        ? `pushWatchBanner: "${logData.notification}"${isAbnormal ? ' & audioBeep: true' : ''}`
        : 'notification: none (suppress mute)',
      naturalText: logData.notification.includes('Warn: HR abnormal') ? (
        <span>
          Evaluated push notification rules:{' '}
          Dispatched urgent alert banner <strong className="text-rose-300 font-semibold">"Warn: HR abnormal"</strong> to watch display with triple-pulse haptic vibration.
        </span>
      ) : logData.notification.includes('Warn: HR back to normal') ? (
        <span>
          Evaluated push notification rules:{' '}
          Dispatched recovery notice banner <strong className="text-amber-300 font-semibold">"Warn: HR back to normal"</strong> to confirm heart rate normalization.
        </span>
      ) : logData.notification.includes('Reminder') ? (
        <span>
          Evaluated push notification rules:{' '}
          Dispatched scheduled prompt <strong className="text-sky-300 font-semibold">"{logData.notification}"</strong> to remind patient of evening medication.
        </span>
      ) : logData.notification.includes('Record') ? (
        <span>
          Evaluated push notification rules:{' '}
          Dispatched confirmation banner <strong className="text-emerald-300 font-semibold">"{logData.notification}"</strong> acknowledging verified medication adherence.
        </span>
      ) : (
        <span>
          Evaluated push notification rules:{' '}
          All vital streams nominal; suppressed active banners to prevent notification fatigue.
        </span>
      ),
      payload: {
        bannerText: logData.notification,
        audioAlertEnabled: isAbnormal,
        hapticPattern: isAbnormal ? 'TRIPLE_PULSE' : isMedRecord ? 'DOUBLE_CHIME' : 'GENTLE_TAP',
      },
    },
    {
      id: 'step-5',
      stepNumber: '05',
      name: 'contextStore.resolveActiveVectors',
      category: 'CONTEXT',
      badgeStyle: 'bg-teal-950/90 border-teal-700/90 text-teal-300',
      timeOffsetMs: `${selectedTime}:00.237`,
      signature: 'contextStore.resolveActiveVectors({ userId: "AS-70-F", lookbackMin: 60 })',
      latencyMs: 27,
      status: 'SUCCESS',
      outputPreview: `present: "${logData.presentContext}", incoming: "${logData.incomeContext}"`,
      naturalText: isMedRecord ? (
        <span>
          Resolved active semantic context graph:{' '}
          Ingestion of evening prescription (<strong className="text-teal-300 font-semibold">Metoprolol 25mg & Aspirin 81mg</strong>) verified and logged on schedule.
        </span>
      ) : selectedTime === '19:00' ? (
        <span>
          Resolved active semantic context graph:{' '}
          19:00 medication window is currently open; tracking patient verification for evening prescriptions.
        </span>
      ) : isAbnormal ? (
        <span>
          Resolved active semantic context graph:{' '}
          Patient is resting (<strong className="text-teal-300 font-semibold">{logData.presentContext}</strong>); cross-referenced tachycardia with upcoming medication (<strong className="text-teal-300 font-semibold">{logData.incomeContext}</strong>).
        </span>
      ) : (
        <span>
          Resolved active semantic context graph:{' '}
          Identified present patient context as <strong className="text-teal-300 font-semibold">"{logData.presentContext}"</strong> with pending agenda <strong className="text-teal-300 font-semibold">"{logData.incomeContext}"</strong>.
        </span>
      ),
      payload: {
        medicationDue: '19:00',
        medicationName: 'Metoprolol 25mg / Aspirin 81mg',
        prescribedSchedule: 'DAILY_1900',
      },
    },
    {
      id: 'step-6',
      stepNumber: '06',
      name: 'security.verifySessionScope',
      category: 'IDENTITY',
      badgeStyle: 'bg-indigo-950/90 border-indigo-700/90 text-indigo-300',
      timeOffsetMs: `${selectedTime}:00.245`,
      signature: 'security.verifySessionScope({ uid: "AS-70-F", clock: "' + logData.time + '" })',
      latencyMs: 8,
      status: 'SUCCESS',
      outputPreview: 'verified: true, epochTs: ' + Math.floor(Date.now() / 1000) + ', tenantId: "home_wellness_prod"',
      naturalText: (
        <span>
          Validated secure cryptographic session token for <strong className="text-indigo-300 font-semibold">Alice Smith (AS-70-F, Age: 70)</strong> and synchronized authoritative UTC timestamps.
        </span>
      ),
      payload: {
        patientId: 'AS-70-F',
        name: 'Alice Smith',
        age: 70,
        gender: 'Female',
        sessionToken: 'hw_sec_v2_99a8f4c1',
      },
    },
    {
      id: 'step-7',
      stepNumber: '07',
      name: 'semanticStore.syncMemoryGraph',
      category: 'MEMORY',
      badgeStyle: 'bg-fuchsia-950/90 border-fuchsia-700/90 text-fuchsia-300',
      timeOffsetMs: `${selectedTime}:00.299`,
      signature: 'semanticStore.syncMemoryGraph({ activeNodes: 5, target: "care_loop" })',
      latencyMs: 54,
      status: 'SUCCESS',
      outputPreview: logData.newToMemory !== 'none'
        ? `Memory synced: ${logData.newToMemory}. Semantic vector state synchronized.`
        : 'Memory state nominal. Standby for vitals stream updates.',
      naturalText: logData.newToMemory !== 'none' ? (
        <span>
          Synchronized semantic memory graph:{' '}
          Committed episodic node <strong className="text-fuchsia-300 font-semibold">"{logData.newToMemory}"</strong> to long-term clinical care vector storage.
        </span>
      ) : (
        <span>
          Synchronized semantic memory graph:{' '}
          Episodic graph topology verified; zero new delta commits required for this cycle. Standby for next event.
        </span>
      ),
      payload: {
        vectorDimension: 768,
        activeMemoryEntries: 3,
        nowChatReady: true,
        lastVoiceInteraction: 'Today 14:22',
      },
    },
  ];

  const filteredActionSteps =
    agentFilter === 'ALL'
      ? actionSteps
      : actionSteps.filter((step) => step.category === agentFilter);

  // Engineering-style natural language log entries
  const engineeringLogItems = [
    {
      id: 'log-ingest',
      timeMs: `${selectedTime}:00.124`,
      category: 'INGEST' as const,
      subsystem: 'ble.telemetry_ingest',
      levelLabel: 'INGEST',
      badgeStyle: 'bg-sky-950/90 border-sky-700/90 text-sky-300',
      naturalSentence: (
        <span>
          Ingested real-time vital packet from watch sensor:{' '}
          Resting HR is <strong className="text-white font-semibold">{restingHr} bpm</strong>,{' '}
          HRV is <strong className="text-white font-semibold">{hrv} ms</strong>, and{' '}
          SpO2 is <strong className="text-white font-semibold">{spo2}%</strong> at 25 Hz sampling rate.
        </span>
      ),
      payloadSnippet: {
        sensorId: 'HW-BLE-WATCH-01',
        restingHr,
        hrv,
        spo2,
        batteryPct: logData.rawTelemetry?.batteryPct ?? 84,
        ppgSignalQuality: logData.rawTelemetry?.ppgSignalQuality ?? 'OPTIMAL',
        motionArtifact: logData.rawTelemetry?.motionArtifact ?? 'LOW',
        confidenceScore: logData.rawTelemetry?.confidenceScore ?? (isAbnormal ? 0.962 : 0.994),
        bleRssi: `${logData.rawTelemetry?.bleRssi ?? -54} dBm`,
      },
    },
    {
      id: 'log-eval',
      timeMs: `${selectedTime}:00.198`,
      category: 'EVAL' as const,
      subsystem: 'vitals.health_triage',
      levelLabel: isPeakAbnormal ? 'CRITICAL' : isAbnormal ? 'ALERT' : isRecovering ? 'RECOVERY' : 'EVAL',
      badgeStyle: isPeakAbnormal
        ? 'bg-rose-950/90 border-rose-600 text-rose-300'
        : isAbnormal
        ? 'bg-amber-950/90 border-amber-600 text-amber-300'
        : isRecovering
        ? 'bg-emerald-950/90 border-emerald-600 text-emerald-300'
        : 'bg-emerald-950/80 border-emerald-800 text-emerald-300',
      naturalSentence: isPeakAbnormal ? (
        <span>
          Health evaluation flagged critical tachycardia: Sustained resting HR spike to{' '}
          <strong className="text-rose-400 font-semibold">82 bpm</strong> (+28.1% above 64 bpm baseline, z-score: 3.12, SpO2: 93%).{' '}
          Classification escalated to <strong className="text-rose-400 font-semibold">HR Abnormal (Critical)</strong>.
        </span>
      ) : isAbnormal ? (
        <span>
          Health evaluation flagged abnormal heart rate: Acute resting HR jump detected at{' '}
          <strong className="text-amber-400 font-semibold">78 bpm</strong> (+21.8% over 64 bpm baseline, z-score: 2.68).{' '}
          Classification: <strong className="text-amber-400 font-semibold">HR Abnormal</strong>.
        </span>
      ) : isRecovering ? (
        <span>
          Health evaluation confirmed physiological stabilization: Resting HR recovered to{' '}
          <strong className="text-emerald-400 font-semibold">65 bpm</strong> (normalized within 95% CI of 30-day baseline, z-score: 0.31).{' '}
          Anomaly status cleared.
        </span>
      ) : (
        <span>
          Health evaluation nominal: All biometric parameters remain steady within expected circadian baseline{' '}
          (delta: <strong className="text-emerald-400 font-semibold">{deltaBpm >= 0 ? '+' : ''}{deltaBpm.toFixed(1)} bpm</strong>, z-score: {zScore.toFixed(2)}).{' '}
          Status: <strong className="text-emerald-400 font-semibold">Normal</strong>.
        </span>
      ),
      payloadSnippet: {
        status: logData.status,
        deltaBpm,
        zScore,
        baselineMean: 64.0,
        standardDeviation: 3.2,
        clinicalGrade: isAbnormal ? 'ELEVATED_HEART_RATE' : 'NOMINAL',
      },
    },
    {
      id: 'log-notify',
      timeMs: `${selectedTime}:00.245`,
      category: 'NOTIFY' as const,
      subsystem: 'push.notification_dispatch',
      levelLabel: 'DISPATCH',
      badgeStyle: 'bg-violet-950/90 border-violet-700/90 text-violet-300',
      naturalSentence: logData.notification.includes('Warn: HR abnormal') ? (
        <span>
          Notification engine issued urgent alert banner:{' '}
          Pushed <strong className="text-rose-300 font-semibold">"Warn: HR abnormal"</strong> to watch display with triple-pulse haptic vibration.
        </span>
      ) : logData.notification.includes('Warn: HR back to normal') ? (
        <span>
          Notification engine dispatched recovery notice:{' '}
          Pushed <strong className="text-amber-300 font-semibold">"Warn: HR back to normal"</strong> banner to confirm physiological stabilization.
        </span>
      ) : logData.notification.includes('Reminder') ? (
        <span>
          Notification engine dispatched scheduled prompt:{' '}
          Pushed <strong className="text-sky-300 font-semibold">"{logData.notification}"</strong> to prompt patient for evening medication.
        </span>
      ) : logData.notification.includes('Record') ? (
        <span>
          Notification engine confirmed medication adherence:{' '}
          Displayed confirmation banner <strong className="text-emerald-300 font-semibold">"{logData.notification}"</strong> acknowledging successful dose verification.
        </span>
      ) : (
        <span>
          Notification engine evaluated push policy:{' '}
          Ambient vitals are nominal; suppressed active popups to prevent alert fatigue.
        </span>
      ),
      payloadSnippet: {
        bannerText: logData.notification,
        audioAlertEnabled: isAbnormal,
        hapticPattern: isAbnormal ? 'TRIPLE_PULSE' : logData.notification !== 'none' ? 'GENTLE_TAP' : 'NONE',
        displayWoke: logData.notification !== 'none',
      },
    },
    {
      id: 'log-context',
      timeMs: `${selectedTime}:00.312`,
      category: 'CONTEXT' as const,
      subsystem: 'context.semantic_graph',
      levelLabel: 'CONTEXT',
      badgeStyle: 'bg-teal-950/90 border-teal-700/90 text-teal-300',
      naturalSentence: isMedRecord ? (
        <span>
          Context engine updated patient status:{' '}
          Ingestion of prescribed evening doses (<strong className="text-teal-300 font-semibold">Metoprolol 25mg & Aspirin 81mg</strong>) verified and recorded on time.
        </span>
      ) : selectedTime === '19:00' ? (
        <span>
          Context engine reached scheduled deadline:{' '}
          19:00 evening medication adherence window is now open; waiting for patient dose intake verification.
        </span>
      ) : selectedTime === '19:01' ? (
        <span>
          Context engine tracking pending adherence:{' '}
          Scheduled 19:00 dose is pending verification; adherence persistence timer is running.
        </span>
      ) : isAbnormal ? (
        <span>
          Context engine correlated multi-stream state:{' '}
          Cross-referencing acute tachycardia event with upcoming scheduled medication (<strong className="text-teal-300 font-semibold">{logData.incomeContext}</strong>).
        </span>
      ) : logData.incomeContext !== 'none' ? (
        <span>
          Context engine resolved situational awareness:{' '}
          Patient is in restful baseline (<strong className="text-teal-300 font-semibold">{logData.presentContext}</strong>), with upcoming scheduled event <strong className="text-teal-300 font-semibold">"{logData.incomeContext}"</strong>.
        </span>
      ) : (
        <span>
          Context engine resolved situational awareness:{' '}
          Patient is in steady resting state (<strong className="text-teal-300 font-semibold">{logData.presentContext}</strong>) with zero pending external events.
        </span>
      ),
      payloadSnippet: {
        presentContext: logData.presentContext,
        incomeContext: logData.incomeContext,
        medicationDue: '19:00',
        medicationName: 'Metoprolol 25mg / Aspirin 81mg',
      },
    },
    {
      id: 'log-memory',
      timeMs: `${selectedTime}:00.380`,
      category: 'MEMORY' as const,
      subsystem: 'memory.graph_sync',
      levelLabel: 'MEMORY',
      badgeStyle: 'bg-fuchsia-950/90 border-fuchsia-700/90 text-fuchsia-300',
      naturalSentence: logData.newToMemory !== 'none' ? (
        <span>
          Semantic memory synchronized:{' '}
          Committed episodic node <strong className="text-fuchsia-300 font-semibold">"{logData.newToMemory}"</strong> into patient care loop vector graph.
        </span>
      ) : (
        <span>
          Semantic memory verified:{' '}
          Knowledge graph topology is fully synchronized; zero new delta commits required for this cycle.
        </span>
      ),
      payloadSnippet: {
        newToMemory: logData.newToMemory,
        vectorDimensions: 768,
        activeGraphNodes: 5,
        syncTarget: 'clinical_care_loop',
      },
    },
  ];

  const filteredLogItems =
    logFilter === 'ALL'
      ? engineeringLogItems
      : engineeringLogItems.filter((item) => item.category === logFilter);

  // Simulate step-by-step pipeline execution
  const runAgentCycle = () => {
    if (isExecutingCycle) return;
    setIsExecutingCycle(true);
    setActiveStepIndex(0);
    setCycleCount((c) => c + 1);

    actionSteps.forEach((_, idx) => {
      setTimeout(() => {
        setActiveStepIndex(idx);
        if (idx === actionSteps.length - 1) {
          setTimeout(() => {
            setIsExecutingCycle(false);
            setActiveStepIndex(-1);
          }, 800);
        }
      }, (idx + 1) * 320);
    });
  };

  return (
    <div
      id="console-bottom-section"
      className="w-full grid grid-cols-1 md:grid-cols-2 border-t border-neutral-700/60 transition-all duration-300"
      style={{ minHeight: '260px' }}
    >
      {/* ============================================================== */}
      {/* 1. Left Column: System log with natural language (Engineering)  */}
      {/* ============================================================== */}
      <div
        id="system-log-panel"
        className="bg-[#090b0e] text-[#05ff2b] px-4 sm:px-7 lg:px-8 py-4 sm:py-5 flex flex-col justify-start select-text relative font-mono transition-colors border-r border-neutral-800/90 shadow-inner"
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
      >
        {/* Terminal Header & Controls */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-neutral-800/80">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isPeakAbnormal ? 'bg-rose-400' : isAbnormal ? 'bg-amber-400' : 'bg-[#05ff2b]'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isPeakAbnormal ? 'bg-rose-400' : isAbnormal ? 'bg-amber-400' : 'bg-[#05ff2b]'
                  }`}
                />
              </span>
              <div className="flex items-center space-x-2">
                <h2 className="text-[17px] sm:text-[18px] lg:text-[19px] font-semibold tracking-tight text-[#05ff2b]">
                  System Log
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold tracking-wide border border-[#05ff2b]/30 bg-[#05ff2b]/10 text-[#05ff2b]">
                  NATURAL LANGUAGE STREAM
                </span>
              </div>
            </div>

            {/* Operational Controls Pill */}
            <div className="flex items-center space-x-2">
              {/* View Switcher: Natural Stream vs Compact KV vs Raw JSON */}
              <div className="flex bg-neutral-900 border border-neutral-800 rounded-md p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setLogViewMode('natural')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                    logViewMode === 'natural'
                      ? 'bg-[#05ff2b] text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Natural Stream
                </button>
                <button
                  type="button"
                  onClick={() => setLogViewMode('compact')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                    logViewMode === 'compact'
                      ? 'bg-[#05ff2b] text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Compact KV
                </button>
                <button
                  type="button"
                  onClick={() => setLogViewMode('raw')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                    logViewMode === 'raw'
                      ? 'bg-[#05ff2b] text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Telemetry JSON
                </button>
              </div>

              {/* Copy Log Snippet */}
              <button
                type="button"
                onClick={handleCopyLog}
                className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-[#05ff2b] border border-neutral-800 transition cursor-pointer flex items-center space-x-1 text-[11px] px-2.5 py-1"
                title="Copy log text"
              >
                {copiedLog ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#05ff2b]" />
                    <span className="text-[#05ff2b] font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Operational Status Sub-bar */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 font-mono mb-3 bg-neutral-950/90 px-3 py-1.5 rounded-md border border-neutral-800/90 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
              <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>SOCKET: ACTIVE</span>
              </span>
              <span className="text-neutral-600">•</span>
              <span>PID: {logData.pid}</span>
              <span className="text-neutral-600">•</span>
              <span>LATENCY: 14ms</span>
              <span className="text-neutral-600">•</span>
              <span className={isPeakAbnormal ? 'text-rose-400 font-semibold' : isAbnormal ? 'text-amber-400 font-semibold' : 'text-neutral-300'}>
                STATUS: {isPeakAbnormal ? 'CRITICAL_ALERT' : isAbnormal ? 'ELEVATED_HR' : isRecovering ? 'RECOVERED' : 'NOMINAL'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-400">
              <span className="hidden lg:inline text-neutral-500">Stream: BLE 0x2A37</span>
              <button
                type="button"
                onClick={() => setIsStreaming(!isStreaming)}
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium cursor-pointer transition ${
                  isStreaming
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {isStreaming ? 'STREAMING' : 'PAUSED'}
              </button>
            </div>
          </div>

          {/* Log Body Content */}
          {logViewMode === 'natural' ? (
            <div>
              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1.5 mb-2.5 overflow-x-auto pb-1 text-[10.5px]">
                <span className="text-neutral-500 font-mono flex items-center space-x-1 mr-1">
                  <Filter className="w-3 h-3 text-neutral-400" />
                  <span>Filter:</span>
                </span>
                {(['ALL', 'INGEST', 'EVAL', 'NOTIFY', 'CONTEXT', 'MEMORY'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setLogFilter(cat)}
                    className={`px-2 py-0.5 rounded cursor-pointer transition font-mono ${
                      logFilter === cat
                        ? 'bg-neutral-200 text-black font-semibold shadow-sm'
                        : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Natural Language Event Stream */}
              <div className="space-y-1.5">
                {filteredLogItems.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-md border border-neutral-800/70 bg-neutral-950/60 hover:bg-neutral-900/60 hover:border-neutral-700/80 transition-all p-2.5 sm:p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-baseline space-x-2 flex-wrap">
                        <span className="text-neutral-500 text-[11px] font-mono select-none">
                          [{item.timeMs}]
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide border ${item.badgeStyle}`}
                        >
                          {item.levelLabel}
                        </span>
                        <span className="text-neutral-500 text-[11px] font-mono select-none hidden sm:inline">
                          {item.subsystem}
                        </span>
                      </div>

                      {/* Expand payload inspector toggle */}
                      <button
                        type="button"
                        onClick={() => setExpandedLogId(expandedLogId === item.id ? null : item.id)}
                        className="text-[10.5px] text-neutral-400 group-hover:text-neutral-200 font-mono hover:text-[#05ff2b] flex items-center space-x-1 cursor-pointer px-1.5 py-0.5 rounded bg-neutral-900/60 border border-neutral-800/60"
                      >
                        <span>{expandedLogId === item.id ? 'Hide' : 'Params'}</span>
                        {expandedLogId === item.id ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Natural Language Sentence */}
                    <div className="text-[13.5px] sm:text-[14.5px] leading-relaxed text-neutral-200 font-sans pl-0.5">
                      {item.naturalSentence}
                    </div>

                    {/* Expandable Engineering Parameters */}
                    {expandedLogId === item.id && (
                      <div className="mt-2.5 p-2.5 bg-black/90 rounded border border-neutral-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto shadow-inner">
                        <pre>{JSON.stringify(item.payloadSnippet, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Real-time Blinking Cursor Footer */}
              <div className="flex items-center space-x-2 pt-3 text-[11px] text-neutral-400 font-mono border-t border-neutral-900 mt-2.5">
                <span className="text-neutral-600 select-none">
                  [{selectedTime}:00.412]
                </span>
                <span className="text-[#05ff2b] animate-pulse select-none">
                  &gt; listening on BLE characteristic 0x2A37 • latency 14ms ▌
                </span>
              </div>
            </div>
          ) : logViewMode === 'compact' ? (
            /* Compact Structured KV View (Matching original prototype with engineering polish) */
            <div className="text-[14.5px] sm:text-[15.5px] lg:text-[16px] leading-relaxed font-mono space-y-2 select-text bg-neutral-950/70 p-3 sm:p-4 rounded-md border border-neutral-800">
              <div className="flex items-baseline space-x-2">
                <span className="text-neutral-500 text-xs font-mono select-none">
                  [{logData.time}:02]
                </span>
                <div className="text-[#05ff2b] font-medium">
                  &gt; Get the real time vital data: <span className="text-white font-semibold">{logData.time}</span>
                </div>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-neutral-500 text-xs font-mono select-none">
                  [{logData.time}:02]
                </span>
                <div className="text-neutral-300">
                  Status:{' '}
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-xs tracking-wide uppercase border ${
                      logData.status.includes('abnormal')
                        ? 'bg-red-950/90 text-red-300 border-red-700'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                    }`}
                  >
                    {logData.status}
                  </span>
                </div>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-neutral-500 text-xs font-mono select-none">
                  [{logData.time}:02]
                </span>
                <div className="text-neutral-300">
                  Notification:{' '}
                  <span className={logData.notification !== 'none' ? 'text-amber-300 font-semibold' : 'text-neutral-400'}>
                    {logData.notification}
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <div className="flex items-baseline space-x-2 text-neutral-400">
                  <span className="text-neutral-500 text-xs font-mono select-none">
                    [{logData.time}:03]
                  </span>
                  <div className="text-[#05ff2b] font-semibold">Context Hierarchy -</div>
                </div>

                <div className="flex items-baseline space-x-2 pl-4 sm:pl-6 text-neutral-300 mt-1">
                  <span className="text-neutral-500 text-xs font-mono select-none">
                    [{logData.time}:03]
                  </span>
                  <div>
                    present context:{' '}
                    <span className="text-white font-medium">{logData.presentContext}</span>
                  </div>
                </div>

                <div className="flex items-baseline space-x-2 pl-4 sm:pl-6 text-neutral-300 mt-0.5">
                  <span className="text-neutral-500 text-xs font-mono select-none">
                    [{logData.time}:03]
                  </span>
                  <div>
                    income context:{' '}
                    <span className="text-white font-medium">{logData.incomeContext}</span>
                  </div>
                </div>

                <div className="flex items-baseline space-x-2 pl-4 sm:pl-6 text-neutral-300 mt-0.5">
                  <span className="text-neutral-500 text-xs font-mono select-none">
                    [{logData.time}:04]
                  </span>
                  <div>
                    new to memory:{' '}
                    <span className={logData.newToMemory !== 'none' ? 'text-fuchsia-300 font-medium' : 'text-neutral-400'}>
                      {logData.newToMemory}
                    </span>
                  </div>
                </div>
              </div>

              {/* Blinking Prompt */}
              <div className="flex items-center space-x-2 pt-2 text-xs text-neutral-400 border-t border-neutral-900 mt-2">
                <span className="text-neutral-600 font-mono select-none">
                  [{logData.time}:05]
                </span>
                <span className="text-[#05ff2b] animate-pulse select-none">
                  &gt; listening on BLE characteristic 0x2A37... ▌
                </span>
              </div>
            </div>
          ) : (
            /* Raw JSON Telemetry View */
            <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[220px] select-text">
              <pre>
                {JSON.stringify(
                  {
                    timestamp: logData.timestampIso,
                    pid: logData.pid,
                    sessionUser: 'Alice Smith (ID: AS-70-F)',
                    vitalsIngest: {
                      timeWindow: logData.time,
                      restingHr,
                      hrv,
                      spo2,
                      status: logData.status,
                      notificationDispatched: logData.notification,
                    },
                    semanticContext: {
                      present: logData.presentContext,
                      incoming: logData.incomeContext,
                      memoryGraphCommit: logData.newToMemory,
                    },
                    sensorHardware: logData.rawTelemetry,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. Right Column: AI Agent Actions                              */}
      {/* ============================================================== */}
      <div
        id="agent-actions-panel"
        className="bg-[#0b0d11] text-neutral-200 px-4 sm:px-7 lg:px-8 py-4 sm:py-5 flex flex-col justify-start border-t md:border-t-0 md:border-l border-neutral-800/90 select-text relative font-mono transition-colors shadow-inner"
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        }}
      >
        <div>
          {/* Agent Header & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-neutral-800/80">
            <div className="flex items-center space-x-2.5">
              <Cpu className="w-5 h-5 text-emerald-300" />
              <div className="flex items-center space-x-2">
                <h2 className="text-[17px] sm:text-[18px] lg:text-[19px] font-semibold tracking-tight text-white">
                  AI Agent Actions
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold tracking-wide border border-emerald-500/30 bg-emerald-950/50 text-emerald-300">
                  DECISION &amp; REASONING STREAM
                </span>
              </div>
            </div>

            {/* Architecture Inspector & Copy Controls */}
            <div className="flex items-center space-x-2">
              {onOpenArchitecture && (
                <button
                  type="button"
                  onClick={onOpenArchitecture}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 text-[11px] font-medium transition cursor-pointer shadow-xs"
                  title="Open interactive Agent Architecture, Context & Memory Drawer"
                >
                  <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Architecture</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyAgent}
                className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-300 border border-neutral-800 transition cursor-pointer flex items-center space-x-1 text-[11px] px-2.5 py-1"
                title="Copy agent action trace"
              >
                {copiedAgent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* StateGraph Architecture Flowchart Ribbon */}
          <div
            onClick={onOpenArchitecture}
            className="mb-3 p-2 rounded-lg bg-[#07090d] border border-neutral-800/90 hover:border-emerald-500/50 transition-all cursor-pointer group select-none shadow-inner"
            title="Click to expand architecture details"
          >
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mb-1.5 px-0.5">
              <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                <GitBranch className="w-3 h-3 text-emerald-400" />
                <span>COMPILED STATEGRAPH TOPOLOGY</span>
              </span>
              <span className="text-neutral-500 group-hover:text-emerald-300 transition-colors flex items-center space-x-1">
                <span>View Full Architecture &amp; Memory</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>

            <div className="flex items-center space-x-1 text-[10px] font-mono overflow-x-auto py-1 text-neutral-300">
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 shrink-0 font-bold">START</span>
              <span className="text-neutral-600">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-800/60 text-sky-300 shrink-0">sensor_ingest</span>
              <span className="text-neutral-600">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 shrink-0">rolling_analytics</span>
              <span className="text-neutral-600">&rarr;</span>
              <span className={`px-1.5 py-0.5 rounded border shrink-0 font-semibold ${isAbnormal ? 'bg-amber-950/80 border-amber-600 text-amber-300' : 'bg-neutral-900 border-neutral-700 text-neutral-300'}`}>
                [triage_router]
              </span>
              <span className="text-neutral-600">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-violet-950/70 border border-violet-800/60 text-violet-300 shrink-0">notification_dispatch</span>
              <span className="text-neutral-600">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-teal-950/70 border border-teal-800/60 text-teal-300 shrink-0">context_resolver</span>
              <span className="text-neutral-600">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 shrink-0">session_security</span>
              <span className="text-neutral-600">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-fuchsia-950/70 border border-fuchsia-800/60 text-fuchsia-300 shrink-0">memory_graph_sync</span>
              <span className="text-neutral-600">&rarr;</span>
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 shrink-0 font-bold">END</span>
            </div>
          </div>

          {/* Operational Runtime Ribbon */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 font-mono mb-3 bg-neutral-950/90 px-3 py-1.5 rounded-md border border-neutral-800/90 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
              <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>PIPELINE: ACTIVE (7 STEPS)</span>
              </span>
              <span className="text-neutral-600">•</span>
              <span>CYCLE: #{cycleCount}</span>
              <span className="text-neutral-600">•</span>
              <span>AVG LATENCY: 142ms</span>
              <span className="text-neutral-600">•</span>
              <span className={isPeakAbnormal ? 'text-rose-400 font-semibold' : isAbnormal ? 'text-amber-400 font-semibold' : 'text-neutral-300'}>
                DECISION: {isPeakAbnormal ? 'CRITICAL_TRIAGE' : isAbnormal ? 'ALERT_TRIAGED' : 'ROUTINE_MONITORING'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-neutral-400">
              <span className="hidden lg:inline text-neutral-500">Model: CLINICAL-REASONING-V2</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 mb-2.5 overflow-x-auto pb-1 text-[10.5px]">
            <span className="text-neutral-500 font-mono flex items-center space-x-1 mr-1">
              <Filter className="w-3 h-3 text-neutral-400" />
              <span>Filter:</span>
            </span>
            {(['ALL', 'INGEST', 'ANALYTICS', 'TRIAGE', 'NOTIFY', 'CONTEXT', 'IDENTITY', 'MEMORY'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setAgentFilter(cat)}
                className={`px-2 py-0.5 rounded cursor-pointer transition font-mono ${
                  agentFilter === cat
                    ? 'bg-neutral-200 text-black font-semibold shadow-sm'
                    : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Agent Action Steps Pipeline */}
          <div className="space-y-1.5">
            {filteredActionSteps.map((step, idx) => {
              const isStepActive = activeStepIndex === idx;
              const isExpanded = expandedStepId === step.id;

              return (
                <div
                  key={step.id}
                  className={`group rounded-md border transition-all p-2.5 sm:p-3 ${
                    isStepActive
                      ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
                      : 'border-neutral-800/70 bg-neutral-950/60 hover:bg-neutral-900/60 hover:border-neutral-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-baseline space-x-2 flex-wrap">
                      <span className="text-neutral-500 text-[11px] font-mono select-none">
                        [{step.timeOffsetMs}]
                      </span>
                      <span className="text-neutral-400 text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                        STEP {step.stepNumber}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide border ${step.badgeStyle}`}
                      >
                        {step.category}
                      </span>
                      <span className="text-emerald-400/90 text-[11px] font-mono select-none font-medium hidden sm:inline">
                        {step.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900/80 px-1.5 py-0.5 rounded border border-neutral-800">
                        {step.latencyMs}ms
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                        className="text-[10.5px] text-neutral-400 group-hover:text-neutral-200 font-mono hover:text-emerald-300 flex items-center space-x-1 cursor-pointer px-1.5 py-0.5 rounded bg-neutral-900/60 border border-neutral-800/60"
                      >
                        <span>{isExpanded ? 'Hide' : 'Params'}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Natural Language Easy-to-Read Format */}
                  <div className="text-[13.5px] sm:text-[14.5px] leading-relaxed text-neutral-200 font-sans pl-0.5">
                    {step.naturalText}
                  </div>

                  {/* Expandable Engineering Parameters */}
                  {isExpanded && (
                    <div className="mt-2.5 p-2.5 bg-black/90 rounded border border-neutral-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto shadow-inner space-y-1">
                      <div className="flex items-center justify-between text-neutral-400 pb-1 border-b border-neutral-900">
                        <span className="text-emerald-400 font-semibold">Method Signature:</span>
                        <span className="text-neutral-300">{step.signature}</span>
                      </div>
                      <div className="pt-1 text-neutral-300">
                        <span className="text-neutral-500">Output Preview: </span>
                        {step.outputPreview}
                      </div>
                      <div className="pt-1">
                        <span className="text-neutral-500">Payload:</span>
                        <pre className="mt-1 text-emerald-300/80">{JSON.stringify(step.payload, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Real-time Blinking Cursor Footer */}
          <div className="flex items-center space-x-2 pt-3 text-[11px] text-neutral-400 font-mono border-t border-neutral-900 mt-2.5">
            <span className="text-neutral-600 select-none">
              [{selectedTime}:00.320]
            </span>
            <span className="text-emerald-400 animate-pulse select-none">
              &gt; autonomous clinical loop active • awaiting next evaluation trigger ▌
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
