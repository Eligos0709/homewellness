/**
 * ==============================================================================
 * AGENT ARCHITECTURE & LANGGRAPH DRAWER
 * ==============================================================================
 * This component visualizes the LangGraph workflow, state channels,
 * and episodic memory vectors for Alice's home wellness agent.
 * ==============================================================================
 */

import React, { useState } from 'react';
import {
  X,
  Play,
  Share2,
  Database,
  Cpu,
  Activity,
  Layers,
  Code2,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Scale,
  BookmarkCheck,
  Compass,
  Sliders,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { SystemLogData, VitalData, AgentPrinciple } from '../types';
import { INITIAL_AGENT_PRINCIPLES } from '../data/principlesData';
import { generateTimeSeriesData, formatSlope, getTrajectoryBadge } from '../data/timeSeriesHelper';

interface LangGraphDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLog: SystemLogData;
  selectedWatch: VitalData;
  selectedTime: string;
}

interface GraphNodeInfo {
  id: string;
  label: string;
  category: 'INGEST' | 'ANALYTICS' | 'ROUTER' | 'TRIAGE' | 'PRINCIPLE' | 'GUARDRAIL' | 'NOTIFY' | 'CONTEXT' | 'SECURITY' | 'MEMORY';
  description: string;
  inputs: string[];
  outputs: string[];
  latency: number;
  snippet: string;
}

export const LangGraphDrawer: React.FC<LangGraphDrawerProps> = ({
  isOpen,
  onClose,
  currentLog,
  selectedWatch,
  selectedTime,
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'model_basis' | 'principles' | 'state' | 'context_memory' | 'code'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('principle_governor');
  const [isRunningFlow, setIsRunningFlow] = useState(false);
  const [activeExecutingNode, setActiveExecutingNode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Principles state & compression simulation
  const [principlesList, setPrinciplesList] = useState<AgentPrinciple[]>(INITIAL_AGENT_PRINCIPLES);
  const [selectedPrincipleId, setSelectedPrincipleId] = useState<string>('prin-02');
  const [isCompressingHistory, setIsCompressingHistory] = useState(false);
  const [compressionSuccessMsg, setCompressionSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAbnormal = selectedTime === '18:56' || selectedTime === '18:57';
  const isPeak = selectedTime === '18:57';
  const isRecovering = selectedTime === '18:58';

  const tsMetrics = selectedWatch.timeSeries || generateTimeSeriesData(selectedTime, selectedWatch.restingHr, selectedWatch.spo2, selectedWatch.hrv);

  const graphNodes: GraphNodeInfo[] = [
    {
      id: 'sensor_ingest',
      label: 'sensor_ingest',
      category: 'INGEST',
      description: 'Ingests continuous 25Hz streaming time-series buffer (30 continuous samples, SNR 28.4 dB) from hardware watch sensor.',
      inputs: ['__start__.telemetry_stream'],
      outputs: ['state.time_series', 'state.vitals', 'state.hardware_health'],
      latency: 14,
      snippet: `async def sensor_ingest(state: HomeWellnessState) -> dict:
    # Continuous Time-Series Sampling (25Hz hardware, 30s sliding buffer)
    packet = await ble_client.read_timeseries_buffer(window_sec=30, rate_hz=25)
    return {"time_series": packet.time_series_buffer, "vitals": packet.latest, "sensor_rssi": packet.rssi}`,
    },
    {
      id: 'rolling_analytics',
      label: 'rolling_analytics',
      category: 'ANALYTICS',
      description: 'Extracts temporal derivatives over 30s sliding window: trend velocity d(bpm)/dt, rolling EWMA, variance, and anomaly persistence.',
      inputs: ['state.time_series'],
      outputs: ['state.trend_slope', 'state.rolling_mean_hr', 'state.rolling_std_dev', 'state.anomaly_persistence_sec', 'state.z_score'],
      latency: 38,
      snippet: `async def rolling_analytics(state: HomeWellnessState) -> dict:
    ts = state["time_series"]
    trend_slope = compute_slope_bpm_per_min(ts.window_points)  # d(bpm)/dt
    rolling_ewma = compute_ewma(ts.window_points, alpha=0.2)
    rolling_variance = compute_variance(ts.window_points)
    persistence_sec = compute_anomaly_persistence(ts.window_points, threshold_z=2.5)
    return {
        "trend_slope": trend_slope,
        "rolling_mean_hr": rolling_ewma,
        "rolling_std_dev": rolling_variance ** 0.5,
        "anomaly_persistence_sec": persistence_sec,
        "z_score": (rolling_ewma - 64.0) / 3.2,
    }`,
    },
    {
      id: 'triage_router',
      label: 'triage_router',
      category: 'ROUTER',
      description: 'Temporal trajectory router: evaluates anomaly persistence (>=20s) and positive velocity to filter motion artifacts.',
      inputs: ['state.trend_slope', 'state.anomaly_persistence_sec', 'state.z_score'],
      outputs: ['branch: escalate_critical | route_nominal'],
      latency: 12,
      snippet: `def triage_router(state: HomeWellnessState) -> str:
    # Temporal Model Basis: verifies anomaly persistence >= 20s before escalating
    if state["anomaly_persistence_sec"] >= 20 and state["trend_slope"] > 3.0:
        return "escalate_critical"
    return "route_nominal"`,
    },
    {
      id: 'clinical_triage',
      label: 'clinical_triage',
      category: 'TRIAGE',
      description: 'Multi-variate trajectory classifier correlating HR slope, SpO2 desaturation lag, and HRV suppression.',
      inputs: ['state.trend_slope', 'state.anomaly_persistence_sec', 'state.vitals'],
      outputs: ['state.trajectory_state', 'state.triage_status', 'state.risk_score'],
      latency: 16,
      snippet: `async def clinical_triage(state: HomeWellnessState) -> dict:
    # Phase trajectory classification (ACUTE_ASCENT vs SUSTAINED_PEAK vs VAGAL_DESCENT)
    trajectory = classify_phase_trajectory(state["trend_slope"], state["anomaly_persistence_sec"])
    verdict = "HR abnormal" if state["anomaly_persistence_sec"] >= 20 else "normal"
    return {"trajectory_state": trajectory, "triage_status": verdict, "risk_score": 72 if verdict != "normal" else 12}`,
    },
    {
      id: 'principle_governor',
      label: 'principle_governor',
      category: 'PRINCIPLE',
      description: 'LONG-TERM PRINCIPLE ENGINE: Applies 120s transient vagal surge window on time-series trajectories to condition short-term memory and real-time context.',
      inputs: ['state.trajectory_state', 'state.anomaly_persistence_sec', 'state.vitals', 'storage.principles_registry'],
      outputs: ['state.active_principles', 'state.memory_filtration_mask', 'state.context_prior'],
      latency: 15,
      snippet: `async def principle_governor(state: HomeWellnessState) -> dict:
    """Evaluate enduring principles (PRIN-01..04) compressed from historical records.
    PRIN-03 enforces the 120s transient surge tolerance window on time-series trajectories."""
    principles = await principle_registry.get_active(user_id=state["patient_id"])
    context_prior = principles.compute_context_directive(state["vitals"])
    memory_mask = principles.compute_temporal_persistence_filter(state["anomaly_persistence_sec"])
    return {
        "active_principles": [p.code for p in principles],
        "context_prior": context_prior,
        "memory_filtration_mask": memory_mask,
    }`,
    },
    {
      id: 'clinical_guardrail',
      label: 'clinical_guardrail',
      category: 'GUARDRAIL',
      description: 'SAFETY GUARDRAIL (Agent != Doctor): Strictly prohibits medication advice and medical diagnosis during abnormal vitals; enforces physician escalation disclaimer.',
      inputs: ['state.triage_status', 'state.vitals', 'state.active_principles'],
      outputs: ['state.guardrail_passed', 'state.medical_advice_prohibited', 'state.doctor_referral'],
      latency: 6,
      snippet: `async def clinical_guardrail(state: HomeWellnessState) -> dict:
    """SAFETY GUARDRAIL POLICY: Agent is an AI wellness assistant, NOT a doctor.
    Governed by long-term Principle PRIN-01:
    - Strictly block medical diagnosis and causality claims.
    - Strictly block medication dosage, intake changes, or drug recommendations.
    - Mandate licensed physician / emergency contact referral disclaimer.
    """
    is_abnormal = state.get("triage_status") != "normal"
    return {
        "guardrail_active": True,
        "is_doctor": False,
        "medical_diagnosis_blocked": True,
        "medication_advice_blocked": True,
        "doctor_referral_required": is_abnormal,
        "guardrail_verdict": "NON_DOCTOR_BOUNDARY_ENFORCED" if is_abnormal else "NOMINAL_SAFETY_PASSED"
    }`,
    },
    {
      id: 'notification_dispatch',
      label: 'notification_dispatch',
      category: 'NOTIFY',
      description: 'Evaluates push rules, anti-fatigue suppression, and watch haptic patterns with principle tone modulation.',
      inputs: ['state.triage_status', 'state.incoming_context', 'state.guardrail_passed', 'state.active_principles'],
      outputs: ['state.dispatched_notification', 'state.haptic_pattern'],
      latency: 18,
      snippet: `async def notification_dispatch(state: HomeWellnessState) -> dict:
    # Governed by Principle PRIN-02 (Autonomy & Gentle Tone)
    if state["triage_status"] == "HR abnormal":
        return {"notification": "Warn: HR abnormal", "haptic": "TRIPLE_PULSE"}
    return {"notification": "none", "haptic": "NONE"}`,
    },
    {
      id: 'context_resolver',
      label: 'context_resolver',
      category: 'CONTEXT',
      description: 'Maintains situational awareness graph and calendar adherence deadlines, continuously conditioned by Principles.',
      inputs: ['state.dispatched_notification', 'state.patient_id', 'state.active_principles'],
      outputs: ['state.present_context', 'state.incoming_context'],
      latency: 27,
      snippet: `async def context_resolver(state: HomeWellnessState) -> dict:
    # Conditioned by Principles (e.g. PRIN-02: Dinner verification before medication prompt)
    context = await semantic_graph.query(user_id=state["patient_id"], principles=state["active_principles"])
    return {"present_context": context.present, "income_context": context.incoming}`,
    },
    {
      id: 'session_security',
      label: 'session_security',
      category: 'SECURITY',
      description: 'Verifies zero-trust cryptographic session tokens and authoritative clock.',
      inputs: ['state.patient_id', 'state.timestamp'],
      outputs: ['state.token_valid', 'state.claims'],
      latency: 8,
      snippet: `async def session_security(state: HomeWellnessState) -> dict:
    claims = await auth_service.verify_session(state["patient_id"])
    return {"auth_ok": True, "claims": claims}`,
    },
    {
      id: 'memory_graph_sync',
      label: 'memory_graph_sync',
      category: 'MEMORY',
      description: 'Commits episodic memory vectors into vector database, filtered by long-term Principles.',
      inputs: ['state.triage_status', 'state.present_context', 'state.memory_filtration_mask'],
      outputs: ['state.memory_node_id', 'state.committed_vector'],
      latency: 54,
      snippet: `async def memory_graph_sync(state: HomeWellnessState) -> dict:
    # Governed by Principle PRIN-03 (Transient Arrhythmia Smoothing):
    # Only commit non-transient, clinically significant anomalies to episodic memory.
    if state["triage_status"] != "normal" and state.get("memory_filtration_mask", {}).get("allow_commit", True):
        node = await vector_store.upsert_node(state["triage_status"])
        return {"new_to_memory": node.label}
    return {"new_to_memory": "none"}`,
    },
  ];

  const selectedNode = graphNodes.find((n) => n.id === selectedNodeId) || graphNodes[4];

  const handleSimulateCompression = () => {
    if (isCompressingHistory) return;
    setIsCompressingHistory(true);
    setCompressionSuccessMsg(null);
    setTimeout(() => {
      const newPrinciple: AgentPrinciple = {
        id: `prin-05-${Date.now()}`,
        code: 'PRIN-05',
        title: 'Post-Meal Digestion & Evening Ambulation Protocol',
        category: 'PHYSIOLOGICAL_BASELINE',
        statement:
          'Alice exhibits a recurring mild resting heart rate uptick (+6–8 bpm) during 15 minutes of kitchen dinner cleanup. Classify this as normal postprandial activity; suppress false tachycardia alarms during 19:00–19:30 UTC.',
        distilledFrom: 'Compressed from 14 verified evening activity episodes (dinner cleanup & light ambulation) over the past 2 weeks.',
        temporalLifespan: 'LONG_TERM_ACTIVE',
        compressionRatio: '14:1 episode compression',
        influenceTarget: ['SHORT_TERM_MEMORY', 'PRESENT_CONTEXT'],
        activeSince: '2026-09-18',
        lastReinforced: new Date().toISOString(),
        confidenceScore: 0.94,
        isActive: true,
      };
      setPrinciplesList((prev) => [newPrinciple, ...prev]);
      setSelectedPrincipleId(newPrinciple.id);
      setIsCompressingHistory(false);
      setCompressionSuccessMsg('Successfully distilled 14 episodic records into new enduring Principle: PRIN-05');
      setTimeout(() => setCompressionSuccessMsg(null), 5000);
    }, 1200);
  };

  const runWorkflowExecution = () => {
    if (isRunningFlow) return;
    setIsRunningFlow(true);

    const sequence = [
      'sensor_ingest',
      'rolling_analytics',
      'triage_router',
      'clinical_triage',
      'principle_governor',
      'clinical_guardrail',
      'notification_dispatch',
      'context_resolver',
      'session_security',
      'memory_graph_sync',
    ];

    sequence.forEach((nodeId, idx) => {
      setTimeout(() => {
        setActiveExecutingNode(nodeId);
        setSelectedNodeId(nodeId);
        if (idx === sequence.length - 1) {
          setTimeout(() => {
            setIsRunningFlow(false);
            setActiveExecutingNode(null);
          }, 600);
        }
      }, idx * 350);
    });
  };

  const handleCopyCode = () => {
    const code = `# HomeWellness Continuous Health Loop - LangGraph StateGraph Definition with Principle Engine & Time-Series Model Basis
from typing import TypedDict, Annotated, Literal, List
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

class TimeSeriesPoint(TypedDict):
    offset_sec: int
    timestamp: str
    hr: int
    spo2: int
    hrv: int
    ppg_pulse_amp: float

class TimeSeriesBuffer(TypedDict):
    sampling_rate_hz: int           # 25Hz hardware sampling
    window_duration_sec: int        # 30s evaluation window
    trend_slope_bpm_per_min: float  # Velocity d(bpm)/dt
    trend_direction: str            # 'RISING_STEEP' | 'PEAK_PLATEAU' | 'FALLING_RECOVERY' | 'STABLE_FLAT'
    rolling_mean_hr: float          # Sliding EWMA
    rolling_std_dev: float          # Temporal variance
    trajectory_state: str           # 'ACUTE_ASCENT' | 'SUSTAINED_PEAK' | 'VAGAL_DESCENT' | 'CIRCADIAN_STABLE'
    anomaly_persistence_sec: int    # Continuous seconds above threshold
    window_points: List[TimeSeriesPoint]

class VitalTelemetry(TypedDict):
    restingHr: int
    hrv: int
    spo2: int
    batteryPct: int

class GuardrailChannel(TypedDict):
    guardrail_active: bool
    is_doctor: bool
    medical_diagnosis_blocked: bool
    medication_advice_blocked: bool
    doctor_referral_required: bool
    guardrail_verdict: str

class HomeWellnessState(TypedDict):
    patient_id: str
    time_series: TimeSeriesBuffer         # <-- Continuous time-series evaluation buffer
    vitals: VitalTelemetry
    trend_slope: float
    trajectory_state: str
    anomaly_persistence_sec: int
    delta_bpm: float
    z_score: float
    triage_status: str
    risk_score: int
    active_principles: List[str]          # <-- Invariant long-term compressed principles
    memory_filtration_mask: dict          # <-- Governs short-term memory commits (120s vagal window)
    guardrail: GuardrailChannel
    notification: str
    haptic: str
    present_context: str
    income_context: str
    new_to_memory: str

# 1. Instantiate Graph
builder = StateGraph(HomeWellnessState)

# 2. Register Processing Nodes (Time-Series Sequence Model Basis)
builder.add_node("sensor_ingest", sensor_ingest)
builder.add_node("rolling_analytics", rolling_analytics)
builder.add_node("clinical_triage", clinical_triage)
builder.add_node("principle_governor", principle_governor)  # <-- PRINCIPLE MODULE (Long-Term Invariant Guidance)
builder.add_node("clinical_guardrail", clinical_guardrail)  # <-- SAFETY GUARDRAIL (Agent != Doctor)
builder.add_node("notification_dispatch", notification_dispatch)
builder.add_node("context_resolver", context_resolver)
builder.add_node("session_security", session_security)
builder.add_node("memory_graph_sync", memory_graph_sync)

# 3. Add Edges & Conditional Routing
builder.add_edge(START, "sensor_ingest")
builder.add_edge("sensor_ingest", "rolling_analytics")

def triage_router(state: HomeWellnessState) -> Literal["clinical_triage", "principle_governor"]:
    # Temporal Model Basis: verifies anomaly persistence >= 20s before escalating
    if state.get("anomaly_persistence_sec", 0) >= 20 and state.get("trend_slope", 0) > 3.0:
        return "clinical_triage"
    return "principle_governor"

builder.add_conditional_edges("rolling_analytics", triage_router)
builder.add_edge("clinical_triage", "principle_governor")
builder.add_edge("principle_governor", "clinical_guardrail")
builder.add_edge("clinical_guardrail", "notification_dispatch")
builder.add_edge("notification_dispatch", "context_resolver")
builder.add_edge("context_resolver", "session_security")
builder.add_edge("session_security", "memory_graph_sync")
builder.add_edge("memory_graph_sync", END)

# 4. Compile with State Checkpointer
checkpointer = MemorySaver()
homewellness_agent = builder.compile(checkpointer=checkpointer)
`;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      id="langgraph-drawer-overlay"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        id="langgraph-architecture-panel"
        className="w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl h-full bg-[#0d1015] text-white flex flex-col shadow-2xl border-l border-neutral-800 transition-transform duration-300 overflow-hidden font-mono select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Bar */}
        <div className="px-5 sm:px-7 py-4 bg-[#090b0e] border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-600/60 flex items-center justify-center text-emerald-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-[17px] sm:text-[19px] font-semibold text-white tracking-tight font-sans">
                  Agent Architecture &amp; Workflow
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                  Compiled StateGraph
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Thread: <span className="text-emerald-400">thread_as70f_continuous</span> • Checkpoint: <span className="text-neutral-300">chk_{selectedTime.replace(':', '')}</span> • Time: <span className="text-white font-semibold">{selectedTime}:00 UTC</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={runWorkflowExecution}
              disabled={isRunningFlow}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-sans font-medium transition cursor-pointer shadow-xs"
              title="Run live StateGraph execution"
            >
              <Play className={`w-3.5 h-3.5 ${isRunningFlow ? 'animate-spin' : ''}`} />
              <span>{isRunningFlow ? 'Executing Flow...' : 'Execute Flow'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
              title="Close panel (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Diagnostic Pipeline Badge Bar */}
        <div className="px-5 sm:px-7 py-2 bg-[#0b0e12] border-b border-neutral-800/80 text-[11px] text-neutral-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-3 overflow-x-auto">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>GRAPH: COMPILED &amp; ACTIVE</span>
            </span>
            <span className="text-neutral-600">•</span>
            <span>NODES: 10</span>
            <span className="text-neutral-600">•</span>
            <span>EDGES: 11 (1 CONDITIONAL)</span>
            <span className="text-neutral-600">•</span>
            <span className="text-purple-400 font-semibold flex items-center space-x-1">
              <Scale className="w-3.5 h-3.5" />
              <span>PRINCIPLES: {principlesList.length} INVARIANTS ACTIVE</span>
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-emerald-400 font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GUARDRAIL: ACTIVE (NON-DOCTOR POLICY)</span>
            </span>
            <span className="text-neutral-600">•</span>
            <span className={isAbnormal ? 'text-amber-400 font-semibold' : 'text-neutral-300'}>
              BRANCH: {isAbnormal ? 'ESCALATE_CRITICAL' : 'NOMINAL_MONITOR'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-neutral-400">
            <span>Checkpointer: MemorySaver</span>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="px-5 sm:px-7 bg-[#0b0e12] border-b border-neutral-800 flex items-center space-x-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            className={`py-2.5 px-3 border-b-2 text-xs font-sans font-medium flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'graph'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>StateGraph Visualizer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('model_basis')}
            className={`py-2.5 px-3 border-b-2 text-xs font-sans font-medium flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'model_basis'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Time-Series Model Basis</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('principles')}
            className={`py-2.5 px-3 border-b-2 text-xs font-sans font-medium flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'principles'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            <span>Principle Engine ({principlesList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('state')}
            className={`py-2.5 px-3 border-b-2 text-xs font-sans font-medium flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'state'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Agent State Channels</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('context_memory')}
            className={`py-2.5 px-3 border-b-2 text-xs font-sans font-medium flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'context_memory'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Context &amp; Semantic Memory</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`py-2.5 px-3 border-b-2 text-xs font-sans font-medium flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'code'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>StateGraph Definition</span>
          </button>
        </div>

        {/* 4. Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {activeTab === 'graph' && (
            <div className="space-y-6">
              {/* StateGraph Flow Diagram */}
              <div className="bg-[#08090c] rounded-xl p-5 border border-neutral-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-xs text-neutral-400">
                    <span className="font-semibold text-white">Interactive StateGraph Workflow Diagram</span>
                    <span>• Click any node to inspect execution contract</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                    Graph ID: homewellness_care_v2
                  </div>
                </div>

                {/* Node Pipeline Layout */}
                <div className="flex flex-col space-y-3">
                  {/* Safety Guardrail Policy Strip */}
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/50 flex items-start space-x-3 text-xs">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-emerald-300">
                          Active Clinical Safety Guardrail (Agent != Doctor Policy)
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-200 text-[10px] font-mono font-bold border border-emerald-700">
                          HARD CONSTRAINT ENFORCED
                        </span>
                      </div>
                      <p className="text-neutral-300 leading-relaxed font-sans text-[11.5px]">
                        The Agent is an AI wellness assistant and is <strong className="text-white">NOT equal to a doctor</strong>. When abnormal vitals occur (e.g. resting HR 78–82 bpm), the <code className="text-emerald-300 font-mono">clinical_guardrail</code> node intercepts execution: it strictly blocks medical diagnosis and medication advice/prescription, mandating referral to licensed medical professionals.
                      </p>
                    </div>
                  </div>

                  {/* START block */}
                  <div className="flex items-center space-x-3">
                    <div className="px-3 py-1 rounded bg-neutral-800 text-neutral-300 text-xs font-mono font-bold border border-neutral-700">
                      __START__
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-600" />
                    <span className="text-[11px] text-neutral-500 font-mono">
                      BLE Telemetry Trigger (every 1000ms)
                    </span>
                  </div>

                  {/* Nodes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                    {graphNodes.map((node) => {
                      const isSelected = selectedNodeId === node.id;
                      const isSimActive = activeExecutingNode === node.id;

                      let borderClass = 'border-neutral-800';
                      let bgClass = 'bg-[#11151c]';
                      const isGuardrailNode = node.id === 'clinical_guardrail';
                      const isPrincipleNode = node.id === 'principle_governor';

                      if (isGuardrailNode) {
                        borderClass = 'border-emerald-600/80 ring-1 ring-emerald-500/40';
                        bgClass = 'bg-gradient-to-b from-emerald-950/40 to-[#11151c]';
                      } else if (isPrincipleNode) {
                        borderClass = 'border-purple-600/80 ring-1 ring-purple-500/40';
                        bgClass = 'bg-gradient-to-b from-purple-950/40 to-[#11151c]';
                      }
                      if (isSelected) {
                        borderClass = isPrincipleNode
                          ? 'border-purple-400 ring-2 ring-purple-400/80 shadow-lg shadow-purple-950/50'
                          : isGuardrailNode
                          ? 'border-emerald-400 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-950/50'
                          : 'border-emerald-500 ring-1 ring-emerald-500/50';
                        bgClass = isPrincipleNode ? 'bg-purple-950/50' : isGuardrailNode ? 'bg-emerald-950/50' : 'bg-emerald-950/20';
                      }
                      if (isSimActive) {
                        borderClass = 'border-amber-400 ring-2 ring-amber-400/80 animate-pulse';
                        bgClass = 'bg-amber-950/30';
                      }

                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer select-none relative ${borderClass} ${bgClass} hover:border-neutral-600`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                                isPrincipleNode
                                  ? 'bg-purple-900/80 border-purple-600 text-purple-200 font-bold'
                                  : isGuardrailNode
                                  ? 'bg-emerald-900/80 border-emerald-600 text-emerald-200 font-bold'
                                  : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                              }`}
                            >
                              {node.category}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">
                              {node.latency}ms
                            </span>
                          </div>
                          <div className="font-semibold text-[13px] text-white font-mono truncate flex items-center space-x-1.5">
                            {isPrincipleNode && (
                              <Scale className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            )}
                            {isGuardrailNode && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                            <span className={isPrincipleNode ? 'text-purple-300' : isGuardrailNode ? 'text-emerald-300' : ''}>
                              {node.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-tight">
                            {node.description}
                          </p>

                          {/* Principle badge indicator */}
                          {isPrincipleNode && (
                            <div className="mt-2 pt-1.5 border-t border-purple-900/60 flex items-center justify-between text-[10px] text-purple-300">
                              <span className="font-mono">Invariant Priors</span>
                              <span className="text-purple-400 font-semibold">{principlesList.length} Active Rules</span>
                            </div>
                          )}

                          {/* Guardrail badge indicator */}
                          {isGuardrailNode && (
                            <div className="mt-2 pt-1.5 border-t border-emerald-900/60 flex items-center justify-between text-[10px] text-emerald-300">
                              <span className="font-mono">Policy: Agent != Doctor</span>
                              <span className="text-emerald-400 font-semibold">Active</span>
                            </div>
                          )}

                          {/* Conditional routing indicator */}
                          {node.id === 'triage_router' && (
                            <div className="mt-2 pt-1.5 border-t border-neutral-800 flex items-center space-x-1 text-[10px] text-amber-400">
                              <GitBranch className="w-3 h-3" />
                              <span>
                                {isAbnormal ? '-> Branch: Escalate' : '-> Branch: Nominal'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* END block */}
                  <div className="flex items-center space-x-3 pt-2">
                    <ArrowRight className="w-4 h-4 text-neutral-600" />
                    <div className="px-3 py-1 rounded bg-neutral-800 text-neutral-300 text-xs font-mono font-bold border border-neutral-700">
                      __END__
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      State Checkpointed to MemorySaver (Cycle Complete)
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Node Deep Inspector */}
              <div className="bg-[#0e1218] rounded-xl p-5 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h3 className="text-base font-semibold text-white font-mono">
                      Node Inspector: {selectedNode.label}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                      Category: {selectedNode.category}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">
                    Execution Latency: <strong className="text-white">{selectedNode.latency}ms</strong>
                  </span>
                </div>

                <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                  {selectedNode.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#090b0e] p-3 rounded-lg border border-neutral-800 text-xs">
                    <span className="text-neutral-500 font-semibold block mb-1">
                      Input Channels (Read from State):
                    </span>
                    <ul className="space-y-1">
                      {selectedNode.inputs.map((inp) => (
                        <li key={inp} className="text-emerald-400 font-mono flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{inp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#090b0e] p-3 rounded-lg border border-neutral-800 text-xs">
                    <span className="text-neutral-500 font-semibold block mb-1">
                      Output Channels (Written / Reduced to State):
                    </span>
                    <ul className="space-y-1">
                      {selectedNode.outputs.map((out) => (
                        <li key={out} className="text-sky-300 font-mono flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          <span>{out}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-xs text-neutral-400 font-mono block mb-1">
                    Node Implementation Snippet:
                  </span>
                  <div className="bg-[#060709] p-3 rounded-lg border border-neutral-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                    <pre>{selectedNode.snippet}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'model_basis' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-md bg-cyan-950/80 border border-cyan-600/70 flex items-center justify-center text-cyan-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white font-sans">
                      Time-Series Model Basis: Continuous Physiological Sequences
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 font-sans leading-relaxed">
                    HomeWellness data attributes are continuous <strong className="text-cyan-300">time-series sequences</strong>, not static scalar numbers. The AI agent operates on sliding evaluation windows, first-order velocity derivatives <code className="text-cyan-300 font-mono">d(bpm)/dt</code>, and anomaly persistence thresholds.
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono font-bold">
                    25Hz PPG • 30s SLIDING WINDOW
                  </span>
                </div>
              </div>

              {/* Architectural Paradigm Comparison Card */}
              <div className="bg-[#090b0f] p-5 rounded-xl border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Paradigm Shift: Point-in-Time Scalar vs. Temporal Sequence Model Basis</span>
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Model Foundation
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Naive Point-in-Time Scalar */}
                  <div className="p-4 rounded-xl bg-[#0e1218] border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                      <span className="text-rose-400 font-semibold text-xs font-mono uppercase">
                        Naive Point-in-Time Scalar Model
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                        FRAGILE / NOISY
                      </span>
                    </div>

                    <ul className="text-xs space-y-2 text-neutral-300 font-sans">
                      <li className="flex items-start space-x-2">
                        <span className="text-rose-400 font-bold shrink-0">&bull;</span>
                        <span>
                          <strong>Single-Token Thresholding:</strong> Evaluates isolated scalar values like <code className="text-neutral-400">if (hr &gt; 75) alert()</code> without historical continuity.
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-rose-400 font-bold shrink-0">&bull;</span>
                        <span>
                          <strong>Motion Artifact False Positives:</strong> Momentary sensor displacement or picking up a glass triggers immediate false alarm cascades.
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-rose-400 font-bold shrink-0">&bull;</span>
                        <span>
                          <strong>Zero Velocity Awareness:</strong> Cannot differentiate between a rapidly accelerating tachycardia surge versus a safe, steady recovery descent.
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Right: HomeWellness Temporal Sequence Model Basis */}
                  <div className="p-4 rounded-xl bg-gradient-to-b from-cyan-950/30 to-[#0e1218] border border-cyan-500/50 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                      <span className="text-cyan-300 font-semibold text-xs font-mono uppercase flex items-center space-x-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>HomeWellness Temporal Sequence Model Basis</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-200 border border-cyan-700 font-bold">
                        CLINICAL GRADE
                      </span>
                    </div>

                    <ul className="text-xs space-y-2 text-neutral-200 font-sans">
                      <li className="flex items-start space-x-2">
                        <span className="text-cyan-400 font-bold shrink-0">&bull;</span>
                        <span>
                          <strong>Sliding Window Integration:</strong> Continuously streams 25Hz optical PPG into 30-second temporal evaluation arrays (30 points).
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-cyan-400 font-bold shrink-0">&bull;</span>
                        <span>
                          <strong>First &amp; Second Order Derivatives:</strong> Computes instantaneous slope velocity <code className="text-cyan-300">d(bpm)/dt</code> and curvature to detect trajectory acceleration.
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-cyan-400 font-bold shrink-0">&bull;</span>
                        <span>
                          <strong>Anomaly Persistence Criterion (τ):</strong> Suppresses transient spikes (&lt;20s); triggers escalation only when physiological deviation persists continuously across windows.
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-cyan-400 font-bold shrink-0">&bull;</span>
                        <span>
                          <strong>Principle-Governed Surge Windows:</strong> Long-term Principle PRIN-03 sets a 120-second vagal surge tolerance window before committing persistent episodic risk vectors.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 4 Phase Trajectory State Machine */}
              <div className="bg-[#090b0f] p-5 rounded-xl border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white font-mono flex items-center space-x-1.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Four-Phase Physiological Trajectory State Machine</span>
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Current: <strong className="text-cyan-300">{tsMetrics.trajectoryState}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Phase 1 */}
                  <div
                    className={`p-3.5 rounded-lg border space-y-1.5 transition ${
                      tsMetrics.trajectoryState === 'CIRCADIAN_STABLE'
                        ? 'bg-sky-950/50 border-sky-500 ring-1 ring-sky-400'
                        : 'bg-[#0e1218] border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-sky-300">CIRCADIAN_STABLE</span>
                      {tsMetrics.trajectoryState === 'CIRCADIAN_STABLE' && (
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400">
                      Slope: ~0.0 bpm/min • τ = 0s
                    </div>
                    <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                      Resting biometrics oscillate gently within expected 95% confidence intervals (62–66 bpm). Zero intervention required.
                    </p>
                  </div>

                  {/* Phase 2 */}
                  <div
                    className={`p-3.5 rounded-lg border space-y-1.5 transition ${
                      tsMetrics.trajectoryState === 'ACUTE_ASCENT'
                        ? 'bg-rose-950/50 border-rose-500 ring-1 ring-rose-400'
                        : 'bg-[#0e1218] border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-rose-300">ACUTE_ASCENT</span>
                      {tsMetrics.trajectoryState === 'ACUTE_ASCENT' && (
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400">
                      Slope: &ge; +4.0 bpm/min • τ &ge; 20s
                    </div>
                    <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                      Rapid resting HR climb (18:56: 65 &rarr; 78 bpm). Triggered urgent triage branch after 22 seconds of confirmed persistence.
                    </p>
                  </div>

                  {/* Phase 3 */}
                  <div
                    className={`p-3.5 rounded-lg border space-y-1.5 transition ${
                      tsMetrics.trajectoryState === 'SUSTAINED_PEAK'
                        ? 'bg-amber-950/50 border-amber-500 ring-1 ring-amber-400'
                        : 'bg-[#0e1218] border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-300">SUSTAINED_PEAK</span>
                      {tsMetrics.trajectoryState === 'SUSTAINED_PEAK' && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400">
                      Plateau Slope: +0.8 bpm/min • τ = 82s
                    </div>
                    <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                      Sustained peak tachycardia (18:57: 82 bpm, SpO2 93%). Proactively triggered duplex voice channel check-in with Alice.
                    </p>
                  </div>

                  {/* Phase 4 */}
                  <div
                    className={`p-3.5 rounded-lg border space-y-1.5 transition ${
                      tsMetrics.trajectoryState === 'VAGAL_DESCENT'
                        ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-400'
                        : 'bg-[#0e1218] border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-300">VAGAL_DESCENT</span>
                      {tsMetrics.trajectoryState === 'VAGAL_DESCENT' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400">
                      Slope: &le; -5.0 bpm/min • τ &rarr; 0s
                    </div>
                    <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                      Steep recovery descent (18:58: 82 &rarr; 65 bpm). Verified parasympathetic stabilization; cleared anomaly alert state.
                    </p>
                  </div>
                </div>
              </div>

              {/* Continuous Signal Processing Pipeline Flow */}
              <div className="bg-[#090b0f] p-5 rounded-xl border border-neutral-800 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 font-mono block">
                  Continuous Time-Series Signal Flow
                </span>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-neutral-300">
                  <span className="px-2 py-1 rounded bg-sky-950 border border-sky-800 text-sky-300">
                    25Hz Hardware PPG
                  </span>
                  <span className="text-neutral-600">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800">
                    FIR Bandpass (0.5–4.0 Hz)
                  </span>
                  <span className="text-neutral-600">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800">
                    30s Sliding Resampler (1Hz)
                  </span>
                  <span className="text-neutral-600">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                    Velocity Extractor d(bpm)/dt
                  </span>
                  <span className="text-neutral-600">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-amber-950 border border-amber-800 text-amber-300">
                    Persistence Gate (τ &ge; 20s)
                  </span>
                  <span className="text-neutral-600">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-purple-950 border border-purple-800 text-purple-300">
                    Principle Invariant (PRIN-03: 120s)
                  </span>
                  <span className="text-neutral-600">&rarr;</span>
                  <span className="px-2 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                    Episodic Vector Memory
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'principles' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-md bg-purple-950/80 border border-purple-600/70 flex items-center justify-center text-purple-400">
                      <Scale className="w-4 h-4" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white font-sans">
                      Principle Module: Long-term Wisdom &amp; Invariant Rules
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 font-sans leading-relaxed">
                    Long-term important contexts distilled from past behaviors &amp; records are compressed into permanent <strong className="text-purple-300">Principles</strong> that continuously condition all short-term memories and current contexts.
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSimulateCompression}
                    disabled={isCompressingHistory}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-sans font-medium transition cursor-pointer shadow-xs"
                    title="Simulate background distillation: compress 14 episodic records into a new Principle"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isCompressingHistory ? 'animate-spin' : ''}`} />
                    <span>{isCompressingHistory ? 'Distilling Memories...' : 'Compress History -> Principle'}</span>
                  </button>
                </div>
              </div>

              {/* Compression feedback banner */}
              {compressionSuccessMsg && (
                <div className="p-3 rounded-lg bg-purple-950/80 border border-purple-500 text-purple-200 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>{compressionSuccessMsg}</span>
                </div>
              )}

              {/* Cognitive Triad Comparison Diagram */}
              <div className="bg-[#090b0f] p-5 rounded-xl border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 font-mono flex items-center space-x-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Cognitive Architecture Hierarchy: Context vs. Memory vs. Principle</span>
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    Tri-Level Temporal Hierarchy
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 1. Context */}
                  <div className="p-3.5 rounded-lg bg-[#0e1218] border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-teal-300 font-mono">1. Current Context</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-950 border border-teal-800 text-teal-300 font-mono">
                        Ephemeral (mins)
                      </span>
                    </div>
                    <p className="text-[11.5px] text-neutral-300 font-sans leading-relaxed">
                      Instantaneous situational awareness (<code className="text-teal-400 font-mono text-[10px]">presentContext</code>, <code className="text-teal-400 font-mono text-[10px]">incomeContext</code>) sourced from real-time telemetry and calendar.
                    </p>
                    <div className="text-[10.5px] text-neutral-400 font-mono pt-1 border-t border-neutral-800/80">
                      Decay: Immediate on state transition.
                    </div>
                  </div>

                  {/* 2. Short-Term Memory */}
                  <div className="p-3.5 rounded-lg bg-[#0e1218] border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-fuchsia-300 font-mono">2. Episodic Memory</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-fuchsia-950 border border-fuchsia-800 text-fuchsia-300 font-mono">
                        Episodic (days/weeks)
                      </span>
                    </div>
                    <p className="text-[11.5px] text-neutral-300 font-sans leading-relaxed">
                      High-signal records (<code className="text-fuchsia-400 font-mono text-[10px]">newToMemory</code>) committed into vector database (e.g. tachycardia anomalies, adherence logs).
                    </p>
                    <div className="text-[10.5px] text-neutral-400 font-mono pt-1 border-t border-neutral-800/80">
                      Decay: Logarithmic decay unless reinforced.
                    </div>
                  </div>

                  {/* 3. Principles */}
                  <div className="p-3.5 rounded-lg bg-purple-950/30 border border-purple-700/60 space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-300 font-mono flex items-center space-x-1">
                        <Scale className="w-3 h-3 text-purple-400" />
                        <span>3. Principle Module</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900 border border-purple-600 text-purple-200 font-mono font-bold">
                        Permanent (t = ∞)
                      </span>
                    </div>
                    <p className="text-[11.5px] text-neutral-200 font-sans leading-relaxed">
                      Compressed long-term invariants distilled from history. <strong className="text-white">Never disappears</strong>; continuously acts like a default context conditioning all memories and current contexts.
                    </p>
                    <div className="text-[10.5px] text-purple-300 font-mono pt-1 border-t border-purple-900/60">
                      Influence: Global governor across all cycles.
                    </div>
                  </div>
                </div>

                {/* Continuous Influence Flow Ribbon */}
                <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-800/40 text-xs text-neutral-300 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <span className="text-purple-400 font-bold">PRINCIPLE INFLUENCE FLOW:</span>
                    <span className="text-neutral-400">Principle Invariants</span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-teal-300">Conditions Current Context</span>
                    <span className="text-neutral-600">&amp;</span>
                    <span className="text-fuchsia-300">Filters Episodic Memory Commits</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded">
                    Active Governor at {selectedTime}:00
                  </span>
                </div>
              </div>

              {/* Active Principles Catalog */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white font-mono flex items-center space-x-1.5">
                    <BookmarkCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Active Enduring Principles ({principlesList.length} Invariants)</span>
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    All principles enforced in compiled StateGraph
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {principlesList.map((prin) => {
                    const isSelected = selectedPrincipleId === prin.id;

                    return (
                      <div
                        key={prin.id}
                        onClick={() => setSelectedPrincipleId(prin.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50 shadow-md shadow-purple-950/50'
                            : 'bg-[#0e1218] border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-900/80 border border-purple-600 text-purple-200">
                              {prin.code}
                            </span>
                            <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                              {prin.category.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-[10.5px] font-mono text-emerald-400 flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{prin.temporalLifespan === 'PERMANENT_DEFAULT' ? 'Permanent' : 'Long-Term'}</span>
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white font-sans">
                            {prin.title}
                          </h4>
                          <p className="text-xs text-neutral-200 font-sans mt-1 leading-relaxed bg-[#07090c] p-2.5 rounded-md border border-neutral-800/80">
                            "{prin.statement}"
                          </p>
                        </div>

                        {/* Distillation Heritage Metadata */}
                        <div className="text-[11px] font-mono space-y-1 text-neutral-400 pt-1">
                          <div className="flex items-center justify-between text-neutral-400">
                            <span className="text-neutral-500">Distillation Origin:</span>
                            <span className="text-purple-300 font-semibold">{prin.compressionRatio}</span>
                          </div>
                          <p className="text-[10.5px] text-neutral-400 font-sans line-clamp-1 italic">
                            {prin.distilledFrom}
                          </p>
                        </div>

                        {/* Influence Targets */}
                        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10.5px] font-mono">
                          <div className="flex items-center space-x-1">
                            <span className="text-neutral-500">Governs:</span>
                            {prin.influenceTarget.map((tgt) => (
                              <span
                                key={tgt}
                                className="px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 text-[9.5px]"
                              >
                                {tgt === 'PRESENT_CONTEXT'
                                  ? 'Context'
                                  : tgt === 'SHORT_TERM_MEMORY'
                                  ? 'Memory'
                                  : 'Dispatch'}
                              </span>
                            ))}
                          </div>
                          <span className="text-neutral-400">Conf: {(prin.confidenceScore * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'state' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white font-sans flex items-center space-x-2">
                    <span>Agent State Channels (<span className="font-mono text-emerald-400">HomeWellnessState</span>)</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Live channel reducer values at timestamp {selectedTime}:00 UTC.
                  </p>
                </div>
                <span className="text-xs font-mono text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
                  Schema: TypedDict Reducer
                </span>
              </div>

              {/* State Channel Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Time-Series Stream Channel Card */}
                <div className="bg-[#0e1218] p-4 rounded-xl border border-cyan-900/60 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800/80 pb-1.5">
                    <span className="text-cyan-400 font-semibold flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>channel: time_series_stream</span>
                    </span>
                    <span className="text-cyan-300 font-mono text-[10px] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 font-bold">
                      30-SECOND SLIDING BUFFER (25Hz PPG)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-neutral-300">
                    <div>samplingRate: <strong className="text-white">25 Hz (1Hz resampled)</strong></div>
                    <div>trendVelocity (d/dt): <strong className="text-cyan-300">{formatSlope(tsMetrics.trendSlopeBpmPerMin)}</strong></div>
                    <div>trajectoryState: <strong className="text-white">{tsMetrics.trajectoryState}</strong></div>
                    <div>anomalyPersistence: <strong className="text-amber-300">{tsMetrics.anomalyPersistenceSec}s</strong></div>
                    <div>rollingMeanHr (EWMA): <strong className="text-white">{tsMetrics.rollingMeanHr} bpm</strong></div>
                    <div>rollingStdDev (σ): <strong className="text-white">{tsMetrics.rollingStdDev} bpm</strong></div>
                    <div>windowPoints: <strong className="text-white">{tsMetrics.windowPoints.length} samples</strong></div>
                    <div>ppgSignalQuality: <strong className="text-emerald-300">OPTIMAL (28.4 dB)</strong></div>
                  </div>
                </div>

                <div className="bg-[#0e1218] p-4 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800/80 pb-1.5">
                    <span className="text-emerald-400 font-semibold">channel: vitals</span>
                    <span>Type: VitalTelemetry</span>
                  </div>
                  <div className="text-xs font-mono space-y-1 text-neutral-300">
                    <div>restingHr: <strong className="text-white">{selectedWatch.restingHr} bpm</strong></div>
                    <div>hrv: <strong className="text-white">{selectedWatch.hrv} ms</strong></div>
                    <div>spo2: <strong className="text-white">{selectedWatch.spo2}%</strong></div>
                    <div>batteryPct: <strong className="text-white">{currentLog.rawTelemetry?.batteryPct ?? 84}%</strong></div>
                  </div>
                </div>

                <div className="bg-[#0e1218] p-4 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800/80 pb-1.5">
                    <span className="text-sky-400 font-semibold">channel: rolling_analytics</span>
                    <span>Type: AnalyticsDict</span>
                  </div>
                  <div className="text-xs font-mono space-y-1 text-neutral-300">
                    <div>baselineDelta: <strong className={isAbnormal ? 'text-amber-400' : 'text-emerald-400'}>{selectedWatch.restingHr - 64} bpm</strong></div>
                    <div>zScore: <strong className={isAbnormal ? 'text-amber-400' : 'text-emerald-400'}>{isPeak ? '3.12' : isAbnormal ? '2.68' : isRecovering ? '0.31' : '0.12'}</strong></div>
                    <div>baseline30DayMean: <strong className="text-white">64.0 bpm</strong></div>
                    <div>standardDeviation: <strong className="text-white">3.2</strong></div>
                  </div>
                </div>

                <div className="bg-[#0e1218] p-4 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800/80 pb-1.5">
                    <span className="text-rose-400 font-semibold">channel: triage_verdict</span>
                    <span>Type: Literal</span>
                  </div>
                  <div className="text-xs font-mono space-y-1 text-neutral-300">
                    <div>status: <span className={`px-1.5 py-0.5 rounded font-bold ${isAbnormal ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>{currentLog.status.replace(/\[Simulation\]\s*/gi, '')}</span></div>
                    <div>notification: <strong className="text-white">{currentLog.notification.replace(/\[Simulation\]\s*/gi, '')}</strong></div>
                    <div>escalationBranch: <strong className="text-white">{isAbnormal ? 'escalate_critical' : 'nominal'}</strong></div>
                  </div>
                </div>

                <div className="bg-[#0e1218] p-4 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800/80 pb-1.5">
                    <span className="text-purple-400 font-semibold">channel: context_and_memory</span>
                    <span>Type: SemanticGraph</span>
                  </div>
                  <div className="text-xs font-mono space-y-1 text-neutral-300">
                    <div>presentContext: <strong className="text-white">{currentLog.presentContext.replace(/\[Simulation\]\s*/gi, '')}</strong></div>
                    <div>incomeContext: <strong className="text-white">{currentLog.incomeContext.replace(/\[Simulation\]\s*/gi, '')}</strong></div>
                    <div>newToMemory: <strong className="text-fuchsia-300">{currentLog.newToMemory.replace(/\[Simulation\]\s*/gi, '')}</strong></div>
                  </div>
                </div>

                {/* Principle Engine Channel Card */}
                <div className="bg-[#0e1218] p-4 rounded-xl border border-purple-900/60 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800/80 pb-1.5">
                    <span className="text-purple-400 font-semibold flex items-center space-x-1.5">
                      <Scale className="w-3.5 h-3.5 text-purple-400" />
                      <span>channel: active_principles</span>
                    </span>
                    <span className="text-purple-300 font-mono text-[10px] bg-purple-950 px-2 py-0.5 rounded border border-purple-800 font-bold">
                      {principlesList.length} INVARIANTS LOADED
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono text-neutral-300">
                    <div>activeRules: <strong className="text-purple-300">{principlesList.map((p) => p.code).join(', ')}</strong></div>
                    <div>memoryFiltration: <strong className="text-emerald-300">TRANSIENT_FILTER_ACTIVE</strong></div>
                    <div>toneModulation: <strong className="text-sky-300">GENTLE_CONVERSATIONAL</strong></div>
                    <div>contextDirective: <strong className="text-amber-300">MEAL_PRIORITY_VERIFIED</strong></div>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-sans pt-1">
                    Continuous Invariant: Long-term compressed principles permanently persist across all threads, providing constitutional guidance that conditions every present context and screens all episodic memory commits.
                  </p>
                </div>

                {/* Safety Guardrail Channel Card */}
                <div className="bg-[#0e1218] p-4 rounded-xl border border-emerald-900/60 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800/80 pb-1.5">
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>channel: clinical_guardrail</span>
                    </span>
                    <span className="text-emerald-300 font-mono text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      SAFETY_POLICY_ENFORCED
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono text-neutral-300">
                    <div>agentIdentity: <strong className="text-emerald-300">AI_ASSISTANT (NOT_DOCTOR)</strong></div>
                    <div>medicalDiagnosis: <strong className="text-rose-400">BLOCKED (0%)</strong></div>
                    <div>medicationAdvice: <strong className="text-rose-400">BLOCKED (0%)</strong></div>
                    <div>physicianReferral: <strong className={isAbnormal ? 'text-amber-400 font-bold' : 'text-emerald-300'}>{isAbnormal ? 'MANDATED (ACTIVE)' : 'STANDBY'}</strong></div>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-sans pt-1">
                    Constraint Rule: When biometric anomalies are detected, the agent is hard-restricted to reporting factual sensor readings, emergency guidance, and deferring medication decisions or diagnostic causality to a licensed physician.
                  </p>
                </div>
              </div>

              {/* Complete JSON Payload */}
              <div className="bg-[#090b0e] p-4 rounded-xl border border-neutral-800 text-xs font-mono text-emerald-300 overflow-x-auto">
                <div className="text-neutral-400 font-semibold mb-2">
                  // Complete LangGraph State Snapshot at {selectedTime}:
                </div>
                <pre>
                  {JSON.stringify(
                    {
                      thread_id: 'thread_as70f_continuous',
                      checkpoint_id: `chk_${selectedTime.replace(':', '')}_${currentLog.pid}`,
                      step_index: 8,
                      values: {
                        patient_id: 'AS-70-F',
                        timestamp: currentLog.timestampIso,
                        vitals: {
                          restingHr: selectedWatch.restingHr,
                          hrv: selectedWatch.hrv,
                          spo2: selectedWatch.spo2,
                        },
                        analytics: {
                          deltaBpm: selectedWatch.restingHr - 64,
                          zScore: isPeak ? 3.12 : isAbnormal ? 2.68 : isRecovering ? 0.31 : 0.12,
                          baseline30DayMean: 64.0,
                        },
                        triage_status: currentLog.status.replace(/\[Simulation\]\s*/gi, ''),
                        principles: {
                          active_principles: principlesList.map((p) => p.code),
                          total_invariants: principlesList.length,
                          memory_filter_active: true,
                          tone_governance: "GENTLE_CONVERSATIONAL",
                          influence: "CONTINUOUS_CONDITIONING",
                        },
                        guardrail: {
                          guardrail_active: true,
                          is_doctor: false,
                          medical_diagnosis_blocked: true,
                          medication_advice_blocked: true,
                          doctor_referral_mandated: isAbnormal,
                          guardrail_verdict: isAbnormal ? "NON_DOCTOR_BOUNDARY_ENFORCED" : "NOMINAL_SAFETY_PASSED",
                        },
                        notification: currentLog.notification.replace(/\[Simulation\]\s*/gi, ''),
                        context: {
                          present: currentLog.presentContext.replace(/\[Simulation\]\s*/gi, ''),
                          incoming: currentLog.incomeContext.replace(/\[Simulation\]\s*/gi, ''),
                        },
                        memory_commit: currentLog.newToMemory.replace(/\[Simulation\]\s*/gi, ''),
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'context_memory' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white font-sans">
                  Context Graph &amp; Episodic Memory Store
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Semantic embeddings, temporal context hierarchy, and care loop memory persistence.
                </p>
              </div>

              {/* Context Hierarchy */}
              <div className="bg-[#0e1218] p-5 rounded-xl border border-neutral-800 space-y-4">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
                  <Activity className="w-4 h-4" />
                  <span>Real-time Semantic Context Hierarchy</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#090b0e] p-3.5 rounded-lg border border-neutral-800">
                    <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold block mb-1">
                      Present Context Vector
                    </span>
                    <p className="text-sm font-sans text-neutral-200">
                      {currentLog.presentContext !== 'none'
                        ? currentLog.presentContext.replace(/\[Simulation\]\s*/gi, '')
                        : 'Resting baseline nominal; no acute situational stressors detected.'}
                    </p>
                    <div className="mt-2 text-[11px] text-neutral-500 font-mono">
                      Decay Half-Life: 15 mins • Confidence: 0.982
                    </div>
                  </div>

                  <div className="bg-[#090b0e] p-3.5 rounded-lg border border-neutral-800">
                    <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold block mb-1">
                      Incoming Scheduled Context
                    </span>
                    <p className="text-sm font-sans text-neutral-200">
                      {currentLog.incomeContext !== 'none'
                        ? currentLog.incomeContext.replace(/\[Simulation\]\s*/gi, '')
                        : 'No pending scheduled medications or external calendar triggers.'}
                    </p>
                    <div className="mt-2 text-[11px] text-neutral-500 font-mono">
                      Target Window: 19:00 UTC (Adherence Protocol: Metoprolol/Aspirin)
                    </div>
                  </div>
                </div>
              </div>

              {/* Episodic Memory Store */}
              <div className="bg-[#0e1218] p-5 rounded-xl border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-fuchsia-400 font-semibold text-sm">
                    <Database className="w-4 h-4" />
                    <span>Episodic Vector Memory Graph (Care Loop)</span>
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">
                    Vector Dimensions: 768 • Cosine Threshold: 0.85
                  </span>
                </div>

                <div className="bg-[#090b0e] p-4 rounded-lg border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Current Commit at {selectedTime}:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
                        currentLog.newToMemory !== 'none'
                          ? 'bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {currentLog.newToMemory !== 'none'
                        ? `Node: ${currentLog.newToMemory.replace(/\[Simulation\]\s*/gi, '')}`
                        : 'Nominal (Zero Commit Required)'}
                    </span>
                  </div>

                  {/* Historical nodes timeline */}
                  <div className="text-xs text-neutral-400 pt-2 border-t border-neutral-800/80">
                    <span className="font-semibold text-neutral-300 block mb-2">
                      Recent Episodic Nodes Committed across Session:
                    </span>
                    <div className="space-y-1.5 font-mono">
                      <div className="flex items-center justify-between p-2 rounded bg-neutral-900/80">
                        <span className="text-neutral-300">[18:55] scheduled_reminder_active</span>
                        <span className="text-emerald-400">Synced</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-neutral-900/80">
                        <span className="text-amber-300">[18:56] alert_flagged_urgent_vitals</span>
                        <span className="text-amber-400">Tachycardia Alert</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-neutral-900/80">
                        <span className="text-rose-300">[18:57] anomaly_persistence_tracked</span>
                        <span className="text-rose-400">Peak Anomaly</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-neutral-900/80">
                        <span className="text-emerald-300">[18:58] recovery_event_logged</span>
                        <span className="text-emerald-400">Vagal Recovery</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-neutral-900/80">
                        <span className="text-sky-300">[19:02] medication_adherence_confirmed</span>
                        <span className="text-sky-400">Adherence Logged</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-neutral-900/80">
                        <span className="text-purple-300">[19:12] bob_1912_alert_checkin_logged</span>
                        <span className="text-purple-400">Caregiver Synced</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white font-sans">
                    StateGraph Architecture Source Code
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Compiled asynchronous state graph construction and node execution contracts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-sans transition cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#07090c] p-4 rounded-xl border border-neutral-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed shadow-inner">
                <pre>{`from typing import TypedDict, Annotated, Literal, List
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

# 1. State Channels Definition with Principle Governance
class VitalTelemetry(TypedDict):
    restingHr: int
    hrv: int
    spo2: int
    batteryPct: int

class GuardrailChannel(TypedDict):
    guardrail_active: bool
    is_doctor: bool
    medical_diagnosis_blocked: bool
    medication_advice_blocked: bool
    doctor_referral_required: bool
    guardrail_verdict: str

class HomeWellnessState(TypedDict):
    patient_id: str
    vitals: VitalTelemetry
    delta_bpm: float
    z_score: float
    triage_status: str
    risk_score: int
    active_principles: List[str]          # <-- Invariant long-term compressed principles
    memory_filtration_mask: dict          # <-- Governs short-term memory commits
    guardrail: GuardrailChannel
    notification: str
    haptic: str
    present_context: str
    income_context: str
    new_to_memory: str

# 2. Instantiate StateGraph
builder = StateGraph(HomeWellnessState)

# 3. Add Graph Nodes
builder.add_node("sensor_ingest", sensor_ingest)
builder.add_node("rolling_analytics", rolling_analytics)
builder.add_node("clinical_triage", clinical_triage)
builder.add_node("principle_governor", principle_governor)  # <-- PRINCIPLE MODULE (Long-Term Invariant Guidance)
builder.add_node("clinical_guardrail", clinical_guardrail)  # <-- SAFETY GUARDRAIL (Agent != Doctor)
builder.add_node("notification_dispatch", notification_dispatch)
builder.add_node("context_resolver", context_resolver)
builder.add_node("session_security", session_security)
builder.add_node("memory_graph_sync", memory_graph_sync)

# 4. Wire Edges & Conditional Routing
builder.add_edge(START, "sensor_ingest")
builder.add_edge("sensor_ingest", "rolling_analytics")

def triage_router(state: HomeWellnessState) -> Literal["clinical_triage", "principle_governor"]:
    """Conditional Edge: Route to clinical triage if acute z-score spike detected."""
    if state.get("z_score", 0) >= 2.0:
        return "clinical_triage"
    return "principle_governor"

builder.add_conditional_edges("rolling_analytics", triage_router)
builder.add_edge("clinical_triage", "principle_governor")
builder.add_edge("principle_governor", "clinical_guardrail")
builder.add_edge("clinical_guardrail", "notification_dispatch")
builder.add_edge("notification_dispatch", "context_resolver")
builder.add_edge("context_resolver", "session_security")
builder.add_edge("session_security", "memory_graph_sync")
builder.add_edge("memory_graph_sync", END)

# 5. Compile with State Checkpointer
checkpointer = MemorySaver()
homewellness_agent = builder.compile(checkpointer=checkpointer)
`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* 5. Footer Bar */}
        <div className="px-5 sm:px-7 py-3 bg-[#080a0d] border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 font-mono shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>StateGraph thread: thread_as70f_continuous</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition cursor-pointer font-sans"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
