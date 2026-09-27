import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Activity,
  Terminal,
  Filter,
  GitBranch,
  ArrowRight,
  ShieldCheck,
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  BarChart2,
  Sliders,
} from 'lucide-react';
import { SystemLogData, AgentActionStep, VitalData } from '../types';
import { generateTimeSeriesData, formatSlope, getTrajectoryBadge } from '../data/timeSeriesHelper';

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
  const [logViewMode, setLogViewMode] = useState<'natural' | 'compact' | 'timeseries' | 'raw'>('natural');
  const [logFilter, setLogFilter] = useState<
    'ALL' | 'INGEST' | 'ANALYTICS' | 'EVAL' | 'PRINCIPLE' | 'GUARDRAIL' | 'NOTIFY' | 'CONTEXT' | 'MEMORY'
  >('ALL');
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
    'ALL' | 'INGEST' | 'ANALYTICS' | 'TRIAGE' | 'PRINCIPLE' | 'GUARDRAIL' | 'NOTIFY' | 'CONTEXT' | 'IDENTITY' | 'MEMORY'
  >('ALL');

  // Selected point hover state in time-series visualizer
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // Time-series telemetry extraction
  const restingHr = selectedWatch ? selectedWatch.restingHr : 65;
  const hrv = selectedWatch ? selectedWatch.hrv : 15;
  const spo2 = selectedWatch ? selectedWatch.spo2 : 95;

  const ts = selectedWatch?.timeSeries || generateTimeSeriesData(selectedTime, restingHr, spo2, hrv);
  const samplingRateHz = ts.samplingRateHz;
  const windowDurationSec = ts.windowDurationSec;
  const trendSlope = ts.trendSlopeBpmPerMin;
  const trajectoryState = ts.trajectoryState;
  const rollingMeanHr = ts.rollingMeanHr;
  const rollingStdDev = ts.rollingStdDev;
  const persistenceSec = ts.anomalyPersistenceSec;
  const windowPoints = ts.windowPoints;
  const trajBadge = getTrajectoryBadge(trajectoryState);

  const isAbnormal = selectedTime === '18:56' || selectedTime === '18:57';
  const isPeakAbnormal = selectedTime === '18:57';
  const isRecovering = selectedTime === '18:58';
  const isMedRecord = selectedTime === '19:02';

  const deltaBpm = restingHr - 64;
  const zScore = isPeakAbnormal ? 3.12 : isAbnormal ? 2.68 : isRecovering ? 0.31 : 0.12;

  // Copy handler for System Log
  const handleCopyLog = () => {
    let textToCopy = '';
    if (logViewMode === 'raw') {
      textToCopy = JSON.stringify(logData, null, 2);
    } else if (logViewMode === 'timeseries') {
      textToCopy = `[TIME-SERIES CONTINUOUS TELEMETRY STREAM - ${selectedTime}:00 UTC]
Sampling Rate: ${samplingRateHz} Hz (25Hz hardware, 1Hz downsampled evaluation window)
Sliding Window Duration: ${windowDurationSec} seconds (30 continuous samples)
Trend Velocity d(bpm)/dt: ${formatSlope(trendSlope)}
Trajectory State: ${trajectoryState} (${trajBadge.label})
Rolling Mean (EWMA): ${rollingMeanHr} bpm | Variance (StdDev): ${rollingStdDev} bpm
Anomaly Persistence Duration: ${persistenceSec} seconds
Window Samples:
${windowPoints
  .map(
    (p) =>
      `  [offset: ${p.offsetSec}s, ts: ${p.timestamp}] HR: ${p.hr} bpm, SpO2: ${p.spo2}%, HRV: ${p.hrv}ms, PulseAmp: ${p.ppgPulseAmp}`
  )
  .join('\n')}`;
    } else if (logViewMode === 'compact') {
      textToCopy = `System log (Compact Engineering View) - ${logData.time}
> Continuous Time-Series Stream: 30s Window @ 25Hz PPG
> Trend Velocity d(bpm)/dt: ${formatSlope(trendSlope)} | Trajectory: ${trajectoryState}
> Rolling EWMA: ${rollingMeanHr} bpm | Variance (σ): ${rollingStdDev} | Persistence (τ): ${persistenceSec}s
Status: ${logData.status}
Notification: ${logData.notification}
Context -
  present context: ${logData.presentContext}
  income context: ${logData.incomeContext}
  new to memory: ${logData.newToMemory}`;
    } else {
      textToCopy = `[SYSTEM LOG - ${logData.time}:00 UTC - PID ${logData.pid}]
[${selectedTime}:00.124] [INGEST]     Ingested 30s continuous time-series buffer (25Hz raw PPG, 30 samples): HR ${restingHr} bpm, HRV ${hrv} ms, SpO2 ${spo2}%.
[${selectedTime}:00.162] [ANALYTICS]  Time-series windowing: Trend slope d(bpm)/dt = ${formatSlope(trendSlope)}, rolling EWMA = ${rollingMeanHr} bpm, variance = ${rollingStdDev}, persistence = ${persistenceSec}s.
[${selectedTime}:00.198] [EVAL]       Trajectory evaluation: ${trajectoryState} (${isPeakAbnormal ? 'Critical tachycardia (82 bpm, z-score: 3.12, SpO2: 93%)' : isAbnormal ? 'HR abnormal (78 bpm, z-score: 2.68)' : isRecovering ? 'Stabilized (65 bpm, anomaly cleared)' : 'Normal vitals (delta: ' + (deltaBpm >= 0 ? '+' : '') + deltaBpm.toFixed(1) + ' bpm, z-score: ' + zScore.toFixed(2) + ')'}).
[${selectedTime}:00.245] [NOTIFY]     Notification dispatch: ${logData.notification !== 'none' ? 'Dispatched "' + logData.notification + '"' : 'Ambient vitals nominal; active banners suppressed'}.
[${selectedTime}:00.312] [CONTEXT]    Context engine: Present: "${logData.presentContext}", Incoming: "${logData.incomeContext}".
[${selectedTime}:00.380] [MEMORY]     Semantic memory: ${logData.newToMemory !== 'none' ? 'Committed episodic node "' + logData.newToMemory + '"' : 'Graph topology nominal; zero delta commits'}.`;
    }

    navigator.clipboard?.writeText(textToCopy);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 1800);
  };

  // Copy handler for AI Agent Actions
  const handleCopyAgent = () => {
    const textToCopy = `[AI AGENT ACTIONS - ${logData.time}:00 UTC - CYCLE #${cycleCount} - TIME-SERIES MODEL BASIS]
[${selectedTime}:00.142] [INGEST]    sensor.readTimeSeriesBuffer() (14ms)
  -> Ingested 30-second continuous sliding buffer (25Hz PPG downsampled to 1Hz, 30 points): HR span ${restingHr} bpm, SpO2 ${spo2}%, SNR 28.4 dB.
[${selectedTime}:00.180] [ANALYTICS] analytics.temporalWindowAnalysis() (38ms)
  -> First-order derivative slope d(bpm)/dt: ${formatSlope(trendSlope)}, EWMA: ${rollingMeanHr} bpm, variance: ${rollingStdDev}, anomaly persistence: ${persistenceSec}s.
[${selectedTime}:00.192] [TRIAGE]    triage.classifyTrajectoryState() (12ms)
  -> Classified temporal trajectory as ${trajectoryState} (${isPeakAbnormal ? 'P1_URGENT' : isAbnormal ? 'P2_ALERT' : 'P0_ROUTINE'}).
[${selectedTime}:00.198] [PRINCIPLE] principle.applyGovernance() (15ms)
  -> Enforced PRIN-01 (Non-Doctor Boundary) and PRIN-03 (120s Transient Vagal Surge Tolerance on time-series trajectories).
[${selectedTime}:00.202] [GUARDRAIL] safety.clinicalGuardrail() (6ms)
  -> Non-doctor medical safety boundary verified; medication and diagnostic advice strictly blocked.
[${selectedTime}:00.210] [NOTIFY]    dispatch.evaluateNotificationRules() (18ms)
  -> Verified persistence criterion (τ >= 20s) before dispatching: ${logData.notification !== 'none' ? '"' + logData.notification + '"' : 'None (suppressed nominal)'}.
[${selectedTime}:00.237] [CONTEXT]   contextStore.resolveActiveVectors() (27ms)
  -> Context envelope: Present: "${logData.presentContext}", Incoming: "${logData.incomeContext}".
[${selectedTime}:00.245] [IDENTITY]  security.verifySessionScope() (8ms)
  -> Verified patient session token for Alice Smith (AS-70-F) with clock ${logData.time}:00 UTC.
[${selectedTime}:00.299] [MEMORY]    semanticStore.syncMemoryGraph() (54ms)
  -> Committed time-series trajectory vector: ${logData.newToMemory !== 'none' ? '"' + logData.newToMemory + '"' : 'Nominal topology'}.`;

    navigator.clipboard?.writeText(textToCopy);
    setCopiedAgent(true);
    setTimeout(() => setCopiedAgent(false), 1800);
  };

  const actionSteps: AgentActionStep[] = [
    {
      id: 'step-1',
      stepNumber: '01',
      name: 'sensor.readTimeSeriesBuffer',
      category: 'INGEST',
      badgeStyle: 'bg-sky-950/90 border-sky-700/90 text-sky-300',
      timeOffsetMs: `${selectedTime}:00.142`,
      signature: 'sensor.readTimeSeriesBuffer({ patientId: "AS-70-F", rateHz: 25, windowSec: 30 })',
      latencyMs: 14,
      status: 'SUCCESS',
      outputPreview: `{ points: 30, samplingHz: 25, ppgPulseAmp: ${windowPoints[windowPoints.length - 1]?.ppgPulseAmp ?? 0.85}, snrDb: 28.4, motion: "LOW" }`,
      naturalText: (
        <span>
          Polled continuous 25Hz BLE telemetry buffer:{' '}
          Ingested 30-second sliding evaluation window (30 continuous time-series samples) with current resting HR at{' '}
          <strong className="text-white font-semibold">{restingHr} bpm</strong>, HRV at{' '}
          <strong className="text-white font-semibold">{hrv} ms</strong>, and SpO2 at{' '}
          <strong className="text-white font-semibold">{spo2}%</strong> with optimal PPG pulse amplitude.
        </span>
      ),
      payload: {
        sensor: 'HW-BLE-WATCH-01',
        hardwareSampleRateHz: 25,
        windowPointsCaptured: 30,
        ppgSnrDb: isAbnormal ? 24.1 : 28.4,
        confidence: isAbnormal ? 0.962 : 0.994,
        motionArtifact: isAbnormal ? 'MODERATE_TRANSITION' : 'LOW (stationary)',
      },
    },
    {
      id: 'step-2',
      stepNumber: '02',
      name: 'analytics.temporalWindowAnalysis',
      category: 'ANALYTICS',
      badgeStyle: isPeakAbnormal
        ? 'bg-rose-950/90 border-rose-600 text-rose-300'
        : isAbnormal
        ? 'bg-amber-950/90 border-amber-600 text-amber-300'
        : 'bg-emerald-950/90 border-emerald-600 text-emerald-300',
      timeOffsetMs: `${selectedTime}:00.180`,
      signature: 'analytics.temporalWindowAnalysis({ windowPoints: 30, baselineHr: 64.0 })',
      latencyMs: 38,
      status: isAbnormal ? 'ALERT' : 'SUCCESS',
      outputPreview: `d(bpm)/dt: ${formatSlope(trendSlope)}, EWMA: ${rollingMeanHr} bpm, σ: ${rollingStdDev}, persistence: ${persistenceSec}s, zScore: ${zScore}`,
      naturalText: isPeakAbnormal ? (
        <span>
          Computed temporal derivatives over sliding window:{' '}
          Trend velocity plateaued at <strong className="text-rose-400 font-semibold">{formatSlope(trendSlope)}</strong> with{' '}
          <strong className="text-amber-300 font-semibold">82 seconds of continuous threshold breach</strong> (z-score: 3.12, EWMA: {rollingMeanHr} bpm).{' '}
          Confirmed sustained tachycardia trajectory.
        </span>
      ) : isAbnormal ? (
        <span>
          Computed temporal derivatives over sliding window:{' '}
          Steep positive velocity detected at <strong className="text-rose-400 font-semibold">{formatSlope(trendSlope)}</strong> with{' '}
          <strong className="text-amber-300 font-semibold">22 seconds of continuous anomaly persistence</strong> (EWMA: {rollingMeanHr} bpm, z-score: 2.68).{' '}
          Flagged acute physiological ascent.
        </span>
      ) : isRecovering ? (
        <span>
          Computed temporal derivatives over sliding window:{' '}
          Steep vagal descent detected at <strong className="text-sky-300 font-semibold">{formatSlope(trendSlope)}</strong>;{' '}
          Resting HR recovered down to <strong className="text-emerald-400 font-semibold">65 bpm</strong> (normalized within 95% CI of 30-day baseline).{' '}
          Anomaly state cleared.
        </span>
      ) : (
        <span>
          Computed temporal derivatives over sliding window:{' '}
          Time-series velocity flat at <strong className="text-emerald-400 font-semibold">{formatSlope(trendSlope)}</strong> with zero anomaly persistence{' '}
          (EWMA: {rollingMeanHr} bpm, σ: {rollingStdDev}, z-score: {zScore.toFixed(2)}).
        </span>
      ),
      payload: {
        trendSlopeBpmPerMin: trendSlope,
        trendDirection: ts.trendDirection,
        rollingMeanHr,
        rollingStdDev,
        anomalyPersistenceSec: persistenceSec,
        baselineMean: 64.0,
        zScore,
        trajectoryState,
      },
    },
    {
      id: 'step-3',
      stepNumber: '03',
      name: 'triage.classifyTrajectoryState',
      category: 'TRIAGE',
      badgeStyle: isPeakAbnormal
        ? 'bg-rose-950/90 border-rose-600 text-rose-300'
        : isAbnormal
        ? 'bg-amber-950/90 border-amber-600 text-amber-300'
        : 'bg-emerald-950/90 border-emerald-600 text-emerald-300',
      timeOffsetMs: `${selectedTime}:00.192`,
      signature: `triage.classifyTrajectoryState({ slope: ${trendSlope}, persistenceSec: ${persistenceSec} })`,
      latencyMs: 12,
      status: isAbnormal ? 'ALERT' : 'SUCCESS',
      outputPreview: `trajectory: "${trajectoryState}", priority: "${isPeakAbnormal ? 'P1_URGENT' : isAbnormal ? 'P2_ALERT' : 'P0_ROUTINE'}"`,
      naturalText: isPeakAbnormal ? (
        <span>
          Model basis classified temporal trajectory as <strong className="text-rose-400 font-semibold">SUSTAINED PEAK (P1 Urgent)</strong>.{' '}
          Persistence duration (&gt;80s) verified sustained physiological demand; bypassed motion artifact filters. Clinical risk score: 85/100.
        </span>
      ) : isAbnormal ? (
        <span>
          Model basis classified temporal trajectory as <strong className="text-amber-400 font-semibold">ACUTE ASCENT (P2 Alert)</strong>.{' '}
          Steep upward velocity confirmed genuine tachycardia rather than transient noise. Clinical risk score: 72/100.
        </span>
      ) : isRecovering ? (
        <span>
          Model basis classified temporal trajectory as <strong className="text-emerald-400 font-semibold">VAGAL RECOVERY</strong>.{' '}
          Rapid negative slope verified active parasympathetic rebound; avoided redundant emergency dispatch.
        </span>
      ) : (
        <span>
          Model basis classified temporal trajectory as <strong className="text-emerald-400 font-semibold">CIRCADIAN STABLE (P0 Routine)</strong>.{' '}
          Zero clinical intervention required.
        </span>
      ),
      payload: {
        trajectoryState,
        riskScore: isAbnormal ? 72 : 12,
        anomalyPersistenceSec: persistenceSec,
        modelBasis: 'TEMPORAL_SEQUENCE_TRAJECTORY',
      },
    },
    {
      id: 'step-4',
      stepNumber: '04',
      name: 'principle.applyGovernance',
      category: 'PRINCIPLE',
      badgeStyle: 'bg-purple-950/90 border-purple-500 text-purple-300 ring-1 ring-purple-400/40',
      timeOffsetMs: `${selectedTime}:00.198`,
      signature: `principle.applyGovernance({ patient: "AS-70-F", activeInvariants: 4, trajectory: "${trajectoryState}" })`,
      latencyMs: 15,
      status: isAbnormal ? 'ALERT' : 'SUCCESS',
      outputPreview: isAbnormal
        ? 'enforced: ["PRIN-01", "PRIN-03"], temporal_invariant: "120S_TRANSIENT_VAGAL_TOLERANCE", memory_filter: "SUPPRESS_EPISODIC_CRISIS_COMMITS"'
        : 'enforced: ["PRIN-02", "PRIN-04"], tone_directive: "GENTLE_CONVERSATIONAL", meal_check: "VERIFY_DINNER_COMPLETION"',
      naturalText: isAbnormal ? (
        <span>
          Applied long-term compressed principles (<strong className="text-purple-300 font-semibold">PRIN-01 Non-Doctor Boundary</strong> &amp; <strong className="text-purple-300 font-semibold">PRIN-03 Vagal Tolerance</strong>):{' '}
          Enforced 120s transient surge tolerance window on time-series trajectory before short-term memory crisis escalation; conditioned present context with non-prescriptive boundaries.
        </span>
      ) : isRecovering ? (
        <span>
          Applied long-term compressed principles (<strong className="text-purple-300 font-semibold">PRIN-03 Vagal Recovery Tolerance</strong>):{' '}
          Validated return to baseline ({restingHr} bpm); screened episodic memory to prevent transient sinus spike from polluting chronic risk history.
        </span>
      ) : (
        <span>
          Applied long-term compressed principles (<strong className="text-purple-300 font-semibold">PRIN-02 Autonomy &amp; Gentle Tone</strong>, <strong className="text-purple-300 font-semibold">PRIN-04 Caregiver Protocol</strong>):{' '}
          Conditioned current context to respect dinner pacing before prompting 19:00 medication; primed gentle conversational tone.
        </span>
      ),
      payload: {
        activePrinciples: ['PRIN-01', 'PRIN-02', 'PRIN-03', 'PRIN-04'],
        temporalInvariantWindowSec: 120,
        governanceType: 'PERMANENT_DEFAULT_INVARIANT',
        compressionLineage: '180+ daily records distilled into invariant priors',
        toneModulation: 'GENTLE_CONVERSATIONAL',
        memoryFiltrationActive: true,
      },
    },
    {
      id: 'step-5',
      stepNumber: '05',
      name: 'safety.clinicalGuardrail',
      category: 'GUARDRAIL',
      badgeStyle: isAbnormal
        ? 'bg-amber-950/90 border-amber-500 text-amber-300 ring-1 ring-amber-400/50'
        : 'bg-emerald-950/90 border-emerald-600 text-emerald-300',
      timeOffsetMs: `${selectedTime}:00.202`,
      signature: 'safety.clinicalGuardrail({ role: "AI_WELLNESS_ASSISTANT", isDoctor: false, status: "' + logData.status + '" })',
      latencyMs: 6,
      status: isAbnormal ? 'ALERT' : 'SUCCESS',
      outputPreview: isAbnormal
        ? 'guardrail_verdict: "NON_DOCTOR_BOUNDARY_ENFORCED", diagnosis_prohibited: true, medication_advice_blocked: true, escalate_physician: true'
        : 'guardrail_verdict: "NOMINAL_SAFETY_PASSED", non_doctor_boundary_verified: true',
      naturalText: isAbnormal ? (
        <span>
          Enforced AI medical safety guardrail (<strong className="text-amber-300 font-semibold">Agent != Doctor</strong>):{' '}
          Strictly blocked speculative medical diagnosis and medication adjustments during resting HR elevation ({restingHr} bpm).{' '}
          Constrained responses to factual sensor data and mandated physician referral disclaimer.
        </span>
      ) : (
        <span>
          Enforced AI medical safety guardrail (<strong className="text-emerald-300 font-semibold">Agent != Doctor</strong>):{' '}
          Validated safe conversational boundaries. Autonomous loop restricted to wellness monitoring; medical prescription and diagnostic advice remain hard-blocked.
        </span>
      ),
      payload: {
        guardrailPolicy: 'AGENT_IS_NOT_A_DOCTOR',
        medicalDiagnosisAllowed: false,
        medicationAdviceAllowed: false,
        physicianEscalationActive: isAbnormal,
        policyReference: 'FDA_CDS_WELLNESS_BOUNDARY_2026',
      },
    },
    {
      id: 'step-6',
      stepNumber: '06',
      name: 'dispatch.evaluateNotificationRules',
      category: 'NOTIFY',
      badgeStyle: 'bg-violet-950/90 border-violet-700/90 text-violet-300',
      timeOffsetMs: `${selectedTime}:00.210`,
      signature: `dispatch.evaluateNotificationRules({ trajectory: "${trajectoryState}", persistenceSec: ${persistenceSec} })`,
      latencyMs: 18,
      status: 'SUCCESS',
      outputPreview: logData.notification !== 'none'
        ? `pushWatchBanner: "${logData.notification}"${isAbnormal ? ' & audioBeep: true' : ''}`
        : 'notification: none (suppress mute)',
      naturalText: logData.notification.includes('Warn: HR abnormal') ? (
        <span>
          Evaluated notification rules under temporal persistence:{' '}
          Verified persistence &gt; 20s; dispatched urgent alert banner <strong className="text-rose-300 font-semibold">"Warn: HR abnormal"</strong> to watch display with triple-pulse haptic vibration.
        </span>
      ) : logData.notification.includes('Warn: HR back to normal') ? (
        <span>
          Evaluated notification rules under vagal recovery:{' '}
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
        persistenceVerified: persistenceSec >= 20,
      },
    },
    {
      id: 'step-7',
      stepNumber: '07',
      name: 'contextStore.resolveActiveVectors',
      category: 'CONTEXT',
      badgeStyle: 'bg-teal-950/90 border-teal-700/90 text-teal-300',
      timeOffsetMs: `${selectedTime}:00.237`,
      signature: `contextStore.resolveActiveVectors({ userId: "AS-70-F", slope: ${trendSlope}, trajectory: "${trajectoryState}" })`,
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
          Resolved active semantic context graph with time-series trajectory:{' '}
          Patient is resting with elevated HR trending at <strong className="text-teal-300 font-semibold">{formatSlope(trendSlope)}</strong>; cross-referenced tachycardia with upcoming medication (<strong className="text-teal-300 font-semibold">{logData.incomeContext}</strong>).
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
        trendVelocity: trendSlope,
      },
    },
    {
      id: 'step-8',
      stepNumber: '08',
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
      id: 'step-9',
      stepNumber: '09',
      name: 'semanticStore.syncMemoryGraph',
      category: 'MEMORY',
      badgeStyle: 'bg-fuchsia-950/90 border-fuchsia-700/90 text-fuchsia-300',
      timeOffsetMs: `${selectedTime}:00.299`,
      signature: `semanticStore.syncMemoryGraph({ activeNodes: 5, trajectory: "${trajectoryState}", slope: ${trendSlope} })`,
      latencyMs: 54,
      status: 'SUCCESS',
      outputPreview: logData.newToMemory !== 'none'
        ? `Memory synced: ${logData.newToMemory}. Time-series feature vector synchronized.`
        : 'Memory state nominal. Standby for time-series stream updates.',
      naturalText: logData.newToMemory !== 'none' ? (
        <span>
          Synchronized semantic memory graph:{' '}
          Committed episodic time-series vector <strong className="text-fuchsia-300 font-semibold">"{logData.newToMemory}"</strong> (vector encoding: [mean: {rollingMeanHr}, slope: {trendSlope}, persist: {persistenceSec}s]) to long-term clinical care vector storage.
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
        temporalFeaturesVector: [rollingMeanHr, trendSlope, persistenceSec, rollingStdDev],
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
          Ingested 30-second continuous time-series buffer from watch sensor:{' '}
          Resting HR is <strong className="text-white font-semibold">{restingHr} bpm</strong>,{' '}
          HRV is <strong className="text-white font-semibold">{hrv} ms</strong>, and{' '}
          SpO2 is <strong className="text-white font-semibold">{spo2}%</strong> polled at 25 Hz hardware frequency (SNR 28.4 dB).
        </span>
      ),
      payloadSnippet: {
        sensorId: 'HW-BLE-WATCH-01',
        restingHr,
        hrv,
        spo2,
        samplingRateHz,
        windowDurationSec,
        batteryPct: logData.rawTelemetry?.batteryPct ?? 84,
        ppgSignalQuality: logData.rawTelemetry?.ppgSignalQuality ?? 'OPTIMAL',
        motionArtifact: logData.rawTelemetry?.motionArtifact ?? 'LOW',
        confidenceScore: logData.rawTelemetry?.confidenceScore ?? (isAbnormal ? 0.962 : 0.994),
        bleRssi: `${logData.rawTelemetry?.bleRssi ?? -54} dBm`,
      },
    },
    {
      id: 'log-analytics',
      timeMs: `${selectedTime}:00.162`,
      category: 'ANALYTICS' as const,
      subsystem: 'analytics.temporal_windowing',
      levelLabel: 'TIME_SERIES',
      badgeStyle: 'bg-cyan-950/90 border-cyan-600 text-cyan-300',
      naturalSentence: (
        <span>
          Time-series temporal extraction: Evaluated 30-second continuous sliding buffer (25 Hz raw PPG downsampled to 1 Hz).{' '}
          Trend velocity: <strong className="text-white font-semibold">d(bpm)/dt = {formatSlope(trendSlope)}</strong>;{' '}
          Rolling EWMA: <strong className="text-white font-semibold">{rollingMeanHr} bpm</strong> (σ: {rollingStdDev});{' '}
          Trajectory state: <strong className="text-cyan-300 font-semibold">{trajectoryState}</strong>;{' '}
          Anomaly persistence: <strong className="text-amber-300 font-semibold">{persistenceSec}s</strong>.
        </span>
      ),
      payloadSnippet: {
        samplingRateHz,
        windowDurationSec,
        trendSlopeBpmPerMin: trendSlope,
        trendDirection: ts.trendDirection,
        rollingMeanHr,
        rollingStdDev,
        trajectoryState,
        anomalyPersistenceSec: persistenceSec,
        windowPointsCount: windowPoints.length || 30,
        modelBasis: 'TEMPORAL_SEQUENCE_CONTINUOUS',
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
      id: 'log-principle',
      timeMs: `${selectedTime}:00.198`,
      category: 'PRINCIPLE' as const,
      subsystem: 'principle.governance_filter',
      levelLabel: 'PRINCIPLE',
      badgeStyle: 'bg-purple-950/90 border-purple-500 text-purple-300 ring-1 ring-purple-400/40',
      naturalSentence: isAbnormal ? (
        <span>
          Long-term principles enforced (<strong className="text-purple-300 font-semibold">PRIN-01 Non-Doctor Boundary</strong> &amp; <strong className="text-purple-300 font-semibold">PRIN-03 Arrhythmia Tolerance</strong>):{' '}
          Permanently conditioned present context with non-prescriptive boundary; initiated 120s transient surge window before short-term memory crisis escalation.
        </span>
      ) : isRecovering ? (
        <span>
          Long-term principles enforced (<strong className="text-purple-300 font-semibold">PRIN-03 Vagal Recovery Tolerance</strong>):{' '}
          Validated return to baseline ({restingHr} bpm); screened episodic memory to prevent transient sinus spike from polluting chronic risk history.
        </span>
      ) : (
        <span>
          Long-term principles enforced (<strong className="text-purple-300 font-semibold">PRIN-02 Autonomy &amp; Gentle Tone</strong>, <strong className="text-purple-300 font-semibold">PRIN-04 Caregiver Protocol</strong>):{' '}
          Conditioned current context to respect dinner pacing before prompting 19:00 medication; primed gentle conversational tone.
        </span>
      ),
      payloadSnippet: {
        activePrinciples: ['PRIN-01', 'PRIN-02', 'PRIN-03', 'PRIN-04'],
        temporalInvariantWindowSec: 120,
        principleLongevity: 'PERMANENT_DEFAULT_INVARIANT',
        compressionLineage: '180+ daily records distilled into invariant priors',
        toneModulation: 'GENTLE_CONVERSATIONAL',
        memoryFiltrationActive: true,
      },
    },
    {
      id: 'log-guardrail',
      timeMs: `${selectedTime}:00.202`,
      category: 'GUARDRAIL' as const,
      subsystem: 'safety.clinical_guardrail',
      levelLabel: isAbnormal ? 'GUARDRAIL_ALERT' : 'GUARDRAIL_NOMINAL',
      badgeStyle: isAbnormal
        ? 'bg-amber-950/90 border-amber-500 text-amber-300 ring-1 ring-amber-400/50'
        : 'bg-emerald-950/90 border-emerald-600 text-emerald-300',
      naturalSentence: isAbnormal ? (
        <span>
          Safety guardrail enforced (<strong className="text-amber-300 font-semibold">Agent != Doctor</strong>):{' '}
          Detected abnormal resting HR ({restingHr} bpm). Strictly prohibited diagnostic speculation and medication adjustments.{' '}
          Enforced patient disclaimer to consult doctor/emergency services.
        </span>
      ) : (
        <span>
          Safety guardrail active (<strong className="text-emerald-300 font-semibold">Agent != Doctor</strong>):{' '}
          Verified non-doctor boundary. Diagnostic and medication advice hard-blocked in autonomous loop.
        </span>
      ),
      payloadSnippet: {
        guardrailActive: true,
        isDoctor: false,
        medicalDiagnosisProhibited: true,
        medicationAdviceProhibited: true,
        physicianEscalationRequired: isAbnormal,
        policyVerdict: isAbnormal ? 'NON_DOCTOR_BOUNDARY_ENFORCED' : 'NOMINAL_SAFETY_PASSED',
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
          Context engine correlated multi-stream state with time-series trend:{' '}
          Cross-referencing acute tachycardia event (trend: {formatSlope(trendSlope)}) with upcoming scheduled medication (<strong className="text-teal-300 font-semibold">{logData.incomeContext}</strong>).
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
        trendVelocity: trendSlope,
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
          Committed episodic node <strong className="text-fuchsia-300 font-semibold">"{logData.newToMemory}"</strong> into patient care loop vector graph with temporal sequence metrics.
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
        temporalFeaturesVector: [rollingMeanHr, trendSlope, persistenceSec, rollingStdDev],
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
          }, 450);
        }
      }, idx * 170);
    });
  };

  return (
    <div
      id="console-bottom-container"
      className="w-full bg-[#050608] border-t border-neutral-800 text-neutral-300 min-h-[360px] flex flex-col justify-between select-none shadow-2xl relative z-10"
    >
      {/* Top Banner Ribbon showing Time-Series Attributes Status */}
      <div className="bg-[#090c10] border-b border-neutral-800/80 px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono text-neutral-400 gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
          <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#05ff2b] animate-pulse" />
            <span>TIME-SERIES TELEMETRY STREAM</span>
          </span>
          <span className="text-neutral-600">•</span>
          <span>Window: 30s (25Hz Dual-PPG)</span>
          <span className="text-neutral-600">•</span>
          <span className="text-white">
            Velocity:{' '}
            <strong
              className={
                trendSlope > 0.5 ? 'text-rose-400' : trendSlope < -0.5 ? 'text-sky-300' : 'text-emerald-400'
              }
            >
              {formatSlope(trendSlope)}
            </strong>
          </span>
          <span className="text-neutral-600">•</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trajBadge.bg} ${trajBadge.text}`}>
            {trajBadge.label}
          </span>
          <span className="text-neutral-600">•</span>
          <span className="text-purple-300">Principles: PRIN-01..04 (Invariants Active)</span>
        </div>

        <div className="flex items-center space-x-2">
          {persistenceSec > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600 text-amber-300 text-[10px] font-bold">
              ANOMALY PERSISTENCE: {persistenceSec}s
            </span>
          )}
          <span className="text-neutral-500 text-[11px]">Snapshot {selectedTime}:00 UTC</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-800/90 flex-1">
        {/* ============================================================== */}
        {/* 1. Left Column: System Log                                     */}
        {/* ============================================================== */}
        <div
          id="system-log-panel"
          className="bg-[#08090c] text-neutral-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col justify-start relative select-text font-mono transition-colors shadow-inner"
        >
          {/* Header & Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-neutral-800/80">
            <div className="flex items-center space-x-2.5">
              <Terminal className="w-5 h-5 text-[#05ff2b]" />
              <div className="flex items-center space-x-2">
                <h2 className="text-[17px] sm:text-[18px] lg:text-[19px] font-semibold tracking-tight text-white">
                  System Log
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold tracking-wide border border-[#05ff2b]/30 bg-[#05ff2b]/10 text-[#05ff2b]">
                  {logViewMode === 'timeseries'
                    ? 'CONTINUOUS TIME-SERIES BUFFER'
                    : logViewMode === 'compact'
                    ? 'COMPACT KV VIEW'
                    : logViewMode === 'raw'
                    ? 'RAW JSON TELEMETRY'
                    : 'NATURAL LANGUAGE STREAM'}
                </span>
              </div>
            </div>

            {/* View Switcher: Natural vs Compact vs Time-Series vs Raw */}
            <div className="flex items-center space-x-2">
              <div className="flex bg-neutral-900 border border-neutral-800 rounded-md p-0.5 text-[11px] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setLogViewMode('natural')}
                  className={`px-2 py-1 rounded transition cursor-pointer font-medium ${
                    logViewMode === 'natural'
                      ? 'bg-[#05ff2b] text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Natural
                </button>
                <button
                  type="button"
                  onClick={() => setLogViewMode('compact')}
                  className={`px-2 py-1 rounded transition cursor-pointer font-medium ${
                    logViewMode === 'compact'
                      ? 'bg-[#05ff2b] text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Compact KV
                </button>
                <button
                  type="button"
                  onClick={() => setLogViewMode('timeseries')}
                  className={`px-2 py-1 rounded transition cursor-pointer font-medium flex items-center space-x-1 ${
                    logViewMode === 'timeseries'
                      ? 'bg-[#05ff2b] text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-[#05ff2b]'
                  }`}
                  title="Inspect continuous 30-second time-series evaluation buffer"
                >
                  <Activity className="w-3 h-3" />
                  <span>Time-Series</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLogViewMode('raw')}
                  className={`px-2 py-1 rounded transition cursor-pointer font-medium ${
                    logViewMode === 'raw'
                      ? 'bg-[#05ff2b] text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  JSON
                </button>
              </div>

              {/* Copy Log Button */}
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
              <span>BUFFER: 30s @ 25Hz</span>
              <span className="text-neutral-600">•</span>
              <span
                className={
                  isPeakAbnormal
                    ? 'text-rose-400 font-semibold'
                    : isAbnormal
                    ? 'text-amber-400 font-semibold'
                    : 'text-neutral-300'
                }
              >
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

          {/* Log Body Content based on View Mode */}
          {logViewMode === 'natural' ? (
            <div>
              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1.5 mb-2.5 overflow-x-auto pb-1 text-[10.5px]">
                <span className="text-neutral-500 font-mono flex items-center space-x-1 mr-1">
                  <Filter className="w-3 h-3 text-neutral-400" />
                  <span>Filter:</span>
                </span>
                {(
                  [
                    'ALL',
                    'INGEST',
                    'ANALYTICS',
                    'EVAL',
                    'PRINCIPLE',
                    'GUARDRAIL',
                    'NOTIFY',
                    'CONTEXT',
                    'MEMORY',
                  ] as const
                ).map((cat) => (
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
                        onClick={() =>
                          setExpandedLogId(expandedLogId === item.id ? null : item.id)
                        }
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
                  &gt; listening on continuous time-series buffer (25Hz PPG downsampled to 1Hz) ▌
                </span>
              </div>
            </div>
          ) : logViewMode === 'timeseries' ? (
            /* ============================================================== */
            /* 1B. Dedicated Time-Series Telemetry Stream View                */
            /* ============================================================== */
            <div className="space-y-4">
              {/* Telemetry Architecture Overview Card */}
              <div className="bg-[#0b0e14] p-3.5 rounded-xl border border-neutral-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between text-xs border-b border-neutral-800/80 pb-2">
                  <div className="flex items-center space-x-2 text-white font-semibold">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>30-Second Sliding Window Buffer [t-29s ... t-0s]</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-mono">
                    25Hz Optical PPG Downsampled to 1Hz
                  </span>
                </div>

                {/* Key Time-Series Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                    <div className="text-neutral-500 text-[10px]">Trend Velocity (d/dt)</div>
                    <div className="text-white font-bold text-sm mt-0.5 flex items-center space-x-1">
                      {trendSlope > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                      ) : trendSlope < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span className={trendSlope > 0 ? 'text-rose-400' : trendSlope < 0 ? 'text-sky-300' : 'text-emerald-400'}>
                        {formatSlope(trendSlope)}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                    <div className="text-neutral-500 text-[10px]">Rolling EWMA Mean (μ)</div>
                    <div className="text-white font-bold text-sm mt-0.5">
                      {rollingMeanHr} <span className="text-neutral-400 text-xs font-normal">bpm</span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                    <div className="text-neutral-500 text-[10px]">Rolling StdDev (σ)</div>
                    <div className="text-white font-bold text-sm mt-0.5">
                      {rollingStdDev} <span className="text-neutral-400 text-xs font-normal">bpm</span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                    <div className="text-neutral-500 text-[10px]">Anomaly Persistence (τ)</div>
                    <div className="text-amber-400 font-bold text-sm mt-0.5">
                      {persistenceSec} <span className="text-neutral-400 text-xs font-normal">seconds</span>
                    </div>
                  </div>
                </div>

                {/* SVG Visualizer with Interactive Data Point Inspection */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Continuous PPG Heart Rate Waveform</span>
                    <span className="text-neutral-500 text-[10px]">
                      Hover points to inspect instantaneous sample
                    </span>
                  </div>

                  <div className="relative w-full h-[70px] bg-black/80 rounded-lg p-2 border border-neutral-800 overflow-hidden flex items-end">
                    {/* SVG Line Chart */}
                    <svg viewBox="0 0 300 60" className="w-full h-full" preserveAspectRatio="none">
                      {/* Gridlines */}
                      <line x1="0" y1="15" x2="300" y2="15" stroke="#333" strokeDasharray="3 3" />
                      <line x1="0" y1="40" x2="300" y2="40" stroke="#222" strokeDasharray="2 2" />

                      {/* Sparkline Path */}
                      {(() => {
                        const hrs = windowPoints.map((p) => p.hr);
                        const min = Math.min(...hrs) - 2;
                        const max = Math.max(...hrs) + 2;
                        const range = Math.max(1, max - min);
                        const coords = windowPoints.map((p, i) => ({
                          x: (i / 29) * 300,
                          y: 55 - ((p.hr - min) / range) * 50,
                          hr: p.hr,
                          offset: p.offsetSec,
                        }));
                        const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
                        const color =
                          trajectoryState === 'ACUTE_ASCENT'
                            ? '#f43f5e'
                            : trajectoryState === 'SUSTAINED_PEAK'
                            ? '#f59e0b'
                            : trajectoryState === 'VAGAL_DESCENT'
                            ? '#38bdf8'
                            : '#05ff2b';

                        return (
                          <>
                            <path d={pathD} fill="none" stroke={color} strokeWidth="2.2" />
                            {coords.map((c, i) => (
                              <circle
                                key={i}
                                cx={c.x}
                                cy={c.y}
                                r={hoveredPointIdx === i ? '4.5' : i === 29 ? '3.5' : '1.8'}
                                fill={color}
                                className="cursor-pointer hover:scale-150 transition-all"
                                onMouseEnter={() => setHoveredPointIdx(i)}
                                onMouseLeave={() => setHoveredPointIdx(null)}
                              />
                            ))}
                          </>
                        );
                      })()}
                    </svg>

                    {/* Point Hover Tooltip */}
                    {hoveredPointIdx !== null && windowPoints[hoveredPointIdx] && (
                      <div className="absolute top-1 left-3 bg-neutral-900 border border-neutral-700 px-2 py-0.5 rounded text-[10px] text-white shadow-md">
                        Offset {windowPoints[hoveredPointIdx].offsetSec}s ({windowPoints[hoveredPointIdx].timestamp}):{' '}
                        <strong className="text-emerald-400">{windowPoints[hoveredPointIdx].hr} bpm</strong>,{' '}
                        SpO2: {windowPoints[hoveredPointIdx].spo2}%, Pulse: {windowPoints[hoveredPointIdx].ppgPulseAmp}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabular 30-Second Buffer Inspector */}
              <div className="bg-[#0b0e14] p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between text-xs text-neutral-300 font-semibold mb-2">
                  <span>Sliding Buffer Samples (30 Points • Downsampled 1Hz)</span>
                  <span className="text-[10px] text-neutral-500 font-normal">
                    Scroll down for full window history
                  </span>
                </div>

                <div className="max-h-[140px] overflow-y-auto font-mono text-[11px] border border-neutral-800/80 rounded">
                  <table className="w-full text-left">
                    <thead className="bg-neutral-900 text-neutral-400 sticky top-0 text-[10px] uppercase">
                      <tr>
                        <th className="py-1 px-2">Offset</th>
                        <th className="py-1 px-2">Timestamp</th>
                        <th className="py-1 px-2">HR (bpm)</th>
                        <th className="py-1 px-2">SpO2</th>
                        <th className="py-1 px-2">HRV (ms)</th>
                        <th className="py-1 px-2">Pulse Amp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900 text-neutral-300">
                      {windowPoints.map((pt, i) => (
                        <tr
                          key={i}
                          className={`hover:bg-neutral-900/60 ${
                            i === 29 ? 'bg-emerald-950/30 text-emerald-300 font-semibold' : ''
                          }`}
                        >
                          <td className="py-1 px-2 text-neutral-500">{pt.offsetSec}s</td>
                          <td className="py-1 px-2">{pt.timestamp}</td>
                          <td className="py-1 px-2 font-bold">{pt.hr}</td>
                          <td className="py-1 px-2">{pt.spo2}%</td>
                          <td className="py-1 px-2">{pt.hrv}</td>
                          <td className="py-1 px-2 text-neutral-400">{pt.ppgPulseAmp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Agent Model Basis Explanation Banner */}
              <div className="bg-neutral-900/90 p-3 rounded-xl border border-emerald-500/40 text-xs space-y-1.5">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Why Time-Series Data Fundamentally Changes the AI Agent Model Basis</span>
                </div>
                <p className="text-neutral-300 leading-relaxed text-[11.5px]">
                  Unlike a naive agent that evaluates point-in-time scalar numbers (e.g. <code>if (hr &gt; 75) alert()</code> which triggers false alarms from momentary arm movements), HomeWellness processes continuous sliding temporal windows. The model basis computes first derivative velocity <span className="text-emerald-300">d(bpm)/dt</span>, second derivative curvature, rolling EWMA, and enforces an <span className="text-amber-300">anomaly persistence threshold (τ &ge; 20s)</span> before escalating, while long-term Principles establish a 120s vagal surge tolerance window.
                </p>
              </div>
            </div>
          ) : logViewMode === 'compact' ? (
            /* ============================================================== */
            /* 1C. Compact Structured KV View                                 */
            /* ============================================================== */
            <div className="text-[14px] sm:text-[15px] leading-relaxed font-mono space-y-2 select-text bg-neutral-950/70 p-3 sm:p-4 rounded-md border border-neutral-800">
              <div className="flex items-baseline space-x-2">
                <span className="text-neutral-500 text-xs font-mono select-none">
                  [{logData.time}:02]
                </span>
                <div className="text-[#05ff2b] font-medium">
                  &gt; Get the real time vital data: <span className="text-white font-semibold">{logData.time}</span>
                </div>
              </div>

              <div className="flex items-baseline space-x-2 text-xs text-neutral-400 pl-4">
                <span>&bull; continuous stream: 30s sliding evaluation window @ 25Hz hardware PPG</span>
              </div>
              <div className="flex items-baseline space-x-2 text-xs text-neutral-400 pl-4">
                <span>&bull; trend velocity d(bpm)/dt: <strong className="text-white">{formatSlope(trendSlope)}</strong></span>
                <span>| trajectory: <strong className="text-cyan-300">{trajectoryState}</strong></span>
              </div>
              <div className="flex items-baseline space-x-2 text-xs text-neutral-400 pl-4">
                <span>&bull; rolling EWMA: <strong className="text-white">{rollingMeanHr} bpm</strong> (σ: {rollingStdDev})</span>
                <span>| persistence (τ): <strong className="text-amber-300">{persistenceSec}s</strong></span>
              </div>

              <div className="flex items-baseline space-x-2 pt-1">
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

                <div className="flex items-baseline space-x-2 pl-4 sm:pl-6 text-neutral-300 mt-0.5">
                  <span className="text-neutral-500 text-xs font-mono select-none">
                    [{logData.time}:04]
                  </span>
                  <div>
                    principles active:{' '}
                    <span className="text-purple-300 font-medium">PRIN-01..04 (4 invariant long-term rules)</span>
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
            /* ============================================================== */
            /* 1D. Raw JSON Telemetry View                                    */
            /* ============================================================== */
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
                    timeSeriesStream: {
                      samplingRateHz,
                      windowDurationSec,
                      trendSlopeBpmPerMin: trendSlope,
                      trendDirection: ts.trendDirection,
                      rollingMeanHr,
                      rollingStdDev,
                      trajectoryState,
                      anomalyPersistenceSec: persistenceSec,
                      pointsCount: windowPoints.length,
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

        {/* ============================================================== */}
        {/* 2. Right Column: AI Agent Actions                              */}
        {/* ============================================================== */}
        <div
          id="agent-actions-panel"
          className="bg-[#0b0d11] text-neutral-200 px-4 sm:px-7 lg:px-8 py-4 sm:py-5 flex flex-col justify-start border-t md:border-t-0 md:border-l border-neutral-800/90 select-text relative font-mono transition-colors shadow-inner"
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
                    TIME-SERIES MODEL BASIS
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
                  <span>COMPILED TIME-SERIES STATEGRAPH</span>
                </span>
                <span className="text-neutral-500 group-hover:text-emerald-300 transition-colors flex items-center space-x-1">
                  <span>View Full Architecture &amp; Memory</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>

              <div className="flex items-center space-x-1 text-[10px] font-mono overflow-x-auto py-1 text-neutral-300">
                <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 shrink-0 font-bold">START</span>
                <span className="text-neutral-600">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-800/60 text-sky-300 shrink-0">
                  sensor_ingest (25Hz)
                </span>
                <span className="text-neutral-600">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 shrink-0">
                  rolling_analytics (d/dt)
                </span>
                <span className="text-neutral-600">&rarr;</span>
                <span
                  className={`px-1.5 py-0.5 rounded border shrink-0 font-semibold ${
                    isAbnormal
                      ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-300'
                  }`}
                >
                  [triage_router]
                </span>
                <span className="text-neutral-600">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/80 text-purple-300 shrink-0 font-semibold flex items-center space-x-1">
                  <Scale className="w-2.5 h-2.5 text-purple-400" />
                  <span>principle_governor</span>
                </span>
                <span className="text-neutral-600">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 shrink-0 font-semibold flex items-center space-x-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  <span>clinical_guardrail</span>
                </span>
                <span className="text-neutral-600">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-violet-950/70 border border-violet-800/60 text-violet-300 shrink-0">
                  notification_dispatch
                </span>
                <span className="text-neutral-600">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-teal-950/70 border border-teal-800/60 text-teal-300 shrink-0">
                  context_resolver
                </span>
                <span className="text-neutral-600">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 shrink-0">
                  session_security
                </span>
                <span className="text-neutral-600">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-fuchsia-950/70 border border-fuchsia-800/60 text-fuchsia-300 shrink-0">
                  memory_graph_sync
                </span>
                <span className="text-neutral-600">&rarr;</span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 shrink-0 font-bold">END</span>
              </div>
            </div>

            {/* Operational Runtime Ribbon */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 font-mono mb-3 bg-neutral-950/90 px-3 py-1.5 rounded-md border border-neutral-800/90 gap-2">
              <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
                <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PIPELINE: ACTIVE (9 STEPS • TIME-SERIES GOVERNED)</span>
                </span>
                <span className="text-neutral-600">•</span>
                <span>CYCLE: #{cycleCount}</span>
                <span className="text-neutral-600">•</span>
                <span>AVG LATENCY: 152ms</span>
                <span className="text-neutral-600">•</span>
                <span
                  className={
                    isPeakAbnormal
                      ? 'text-rose-400 font-semibold'
                      : isAbnormal
                      ? 'text-amber-400 font-semibold'
                      : 'text-neutral-300'
                  }
                >
                  DECISION: {isPeakAbnormal ? 'CRITICAL_TRIAGE' : isAbnormal ? 'ALERT_TRIAGED' : 'ROUTINE_MONITORING'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-neutral-400">
                <button
                  type="button"
                  onClick={runAgentCycle}
                  disabled={isExecutingCycle}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer border shadow-xs ${
                    isExecutingCycle
                      ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse cursor-wait'
                      : 'bg-emerald-950 hover:bg-emerald-900 border-emerald-600 text-emerald-300'
                  }`}
                  title="Run agent decision pipeline cycle"
                >
                  <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>{isExecutingCycle ? 'Evaluating Cycle...' : 'Run Cycle'}</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 mb-2.5 overflow-x-auto pb-1 text-[10.5px]">
              <span className="text-neutral-500 font-mono flex items-center space-x-1 mr-1">
                <Filter className="w-3 h-3 text-neutral-400" />
                <span>Filter:</span>
              </span>
              {(
                [
                  'ALL',
                  'INGEST',
                  'ANALYTICS',
                  'TRIAGE',
                  'PRINCIPLE',
                  'GUARDRAIL',
                  'NOTIFY',
                  'CONTEXT',
                  'IDENTITY',
                  'MEMORY',
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAgentFilter(cat)}
                  className={`px-2 py-0.5 rounded cursor-pointer transition font-mono ${
                    agentFilter === cat
                      ? 'bg-emerald-400 text-black font-semibold shadow-sm'
                      : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Action Step Stream */}
            <div className="space-y-2">
              {filteredActionSteps.map((step, idx) => {
                const isCurrentlyActive = activeStepIndex === idx;
                const isExpanded = expandedStepId === step.id;

                return (
                  <div
                    key={step.id}
                    className={`rounded-md border p-2.5 sm:p-3 transition-all ${
                      isCurrentlyActive
                        ? 'border-emerald-400 bg-emerald-950/40 ring-1 ring-emerald-400/50'
                        : 'border-neutral-800/70 bg-neutral-950/60 hover:bg-neutral-900/60 hover:border-neutral-700/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-baseline space-x-2 flex-wrap">
                        <span className="text-neutral-500 text-[11px] font-mono select-none">
                          [{step.timeOffsetMs}]
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide border bg-neutral-800 text-neutral-300 border-neutral-700">
                          STEP {step.stepNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide border ${step.badgeStyle}`}
                        >
                          {step.category}
                        </span>
                        <span className="text-emerald-300 text-[12px] font-bold font-mono">
                          {step.name}()
                        </span>
                        <span className="text-neutral-500 text-[11px]">
                          ({step.latencyMs}ms)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                        className="text-[10.5px] text-neutral-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer px-1.5 py-0.5 rounded bg-neutral-900/60 border border-neutral-800/60"
                      >
                        <span>{isExpanded ? 'Hide' : 'Payload'}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Step Description / Natural Interpretation */}
                    <div className="text-[13px] sm:text-[14px] leading-relaxed text-neutral-200 font-sans pl-0.5">
                      {step.naturalText}
                    </div>

                    {/* Code Output Snippet Preview */}
                    <div className="mt-1.5 text-[11px] font-mono text-neutral-400 bg-black/60 px-2 py-1 rounded border border-neutral-800/60 overflow-x-auto truncate">
                      <span className="text-emerald-400">&rarr; </span>
                      <span>{step.outputPreview}</span>
                    </div>

                    {/* Expandable JSON Payload */}
                    {isExpanded && (
                      <div className="mt-2.5 p-2.5 bg-black/90 rounded border border-neutral-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto shadow-inner">
                        <pre>{JSON.stringify(step.payload, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
