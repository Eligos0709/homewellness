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
} from 'lucide-react';
import { SystemLogData, VitalData } from '../types';

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
  category: 'INGEST' | 'ANALYTICS' | 'ROUTER' | 'TRIAGE' | 'NOTIFY' | 'CONTEXT' | 'SECURITY' | 'MEMORY';
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
  const [activeTab, setActiveTab] = useState<'graph' | 'state' | 'context_memory' | 'code'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('triage_router');
  const [isRunningFlow, setIsRunningFlow] = useState(false);
  const [activeExecutingNode, setActiveExecutingNode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const isAbnormal = selectedTime === '18:56' || selectedTime === '18:57';
  const isPeak = selectedTime === '18:57';
  const isRecovering = selectedTime === '18:58';

  const graphNodes: GraphNodeInfo[] = [
    {
      id: 'sensor_ingest',
      label: 'sensor_ingest',
      category: 'INGEST',
      description: 'Ingests BLE 25Hz streaming biometric packet from hardware watch sensor.',
      inputs: ['__start__.telemetry_stream'],
      outputs: ['state.vitals', 'state.hardware_health'],
      latency: 14,
      snippet: `async def sensor_ingest(state: HomeWellnessState) -> dict:
    packet = await ble_client.read_characteristics("0x2A37")
    return {"vitals": packet.vitals, "sensor_rssi": packet.rssi}`,
    },
    {
      id: 'rolling_analytics',
      label: 'rolling_analytics',
      category: 'ANALYTICS',
      description: 'Computes statistical variance, 30-day baseline moving averages, and z-score.',
      inputs: ['state.vitals'],
      outputs: ['state.baseline_delta', 'state.z_score'],
      latency: 38,
      snippet: `async def rolling_analytics(state: HomeWellnessState) -> dict:
    delta = state["vitals"]["restingHr"] - 64.0
    z_score = delta / 3.2
    return {"delta_bpm": delta, "z_score": z_score}`,
    },
    {
      id: 'triage_router',
      label: 'triage_router',
      category: 'ROUTER',
      description: 'Conditional router node evaluating biometric thresholds to branch pipeline.',
      inputs: ['state.z_score', 'state.baseline_delta'],
      outputs: ['branch: escalate_critical | route_nominal'],
      latency: 12,
      snippet: `def triage_router(state: HomeWellnessState) -> str:
    if state["z_score"] >= 2.5:
        return "escalate_critical"
    return "route_nominal"`,
    },
    {
      id: 'clinical_triage',
      label: 'clinical_triage',
      category: 'TRIAGE',
      description: 'Clinical priority classifier and risk scoring engine.',
      inputs: ['state.z_score', 'state.vitals'],
      outputs: ['state.triage_status', 'state.risk_score'],
      latency: 16,
      snippet: `async def clinical_triage(state: HomeWellnessState) -> dict:
    verdict = "HR abnormal" if state["z_score"] > 2.0 else "normal"
    return {"triage_status": verdict, "risk_score": 72 if verdict != "normal" else 12}`,
    },
    {
      id: 'notification_dispatch',
      label: 'notification_dispatch',
      category: 'NOTIFY',
      description: 'Evaluates push rules, anti-fatigue suppression, and watch haptic patterns.',
      inputs: ['state.triage_status', 'state.incoming_context'],
      outputs: ['state.dispatched_notification', 'state.haptic_pattern'],
      latency: 18,
      snippet: `async def notification_dispatch(state: HomeWellnessState) -> dict:
    if state["triage_status"] == "HR abnormal":
        return {"notification": "Warn: HR abnormal", "haptic": "TRIPLE_PULSE"}
    return {"notification": "none", "haptic": "NONE"}`,
    },
    {
      id: 'context_resolver',
      label: 'context_resolver',
      category: 'CONTEXT',
      description: 'Maintains situational awareness graph and calendar adherence deadlines.',
      inputs: ['state.dispatched_notification', 'state.patient_id'],
      outputs: ['state.present_context', 'state.incoming_context'],
      latency: 27,
      snippet: `async def context_resolver(state: HomeWellnessState) -> dict:
    context = await semantic_graph.query(user_id=state["patient_id"])
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
      description: 'Commits episodic memory vectors into vector database for long-term recall.',
      inputs: ['state.triage_status', 'state.present_context'],
      outputs: ['state.memory_node_id', 'state.committed_vector'],
      latency: 54,
      snippet: `async def memory_graph_sync(state: HomeWellnessState) -> dict:
    if state["triage_status"] != "normal":
        node = await vector_store.upsert_node(state["triage_status"])
        return {"new_to_memory": node.label}
    return {"new_to_memory": "none"}`,
    },
  ];

  const selectedNode = graphNodes.find((n) => n.id === selectedNodeId) || graphNodes[2];

  const runWorkflowExecution = () => {
    if (isRunningFlow) return;
    setIsRunningFlow(true);

    const sequence = [
      'sensor_ingest',
      'rolling_analytics',
      'triage_router',
      'clinical_triage',
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
      }, idx * 400);
    });
  };

  const handleCopyCode = () => {
    const code = `# HomeWellness Continuous Health Loop - LangGraph StateGraph Definition
from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

class VitalTelemetry(TypedDict):
    restingHr: int
    hrv: int
    spo2: int
    batteryPct: int

class HomeWellnessState(TypedDict):
    patient_id: str
    vitals: VitalTelemetry
    delta_bpm: float
    z_score: float
    triage_status: str
    risk_score: int
    notification: str
    haptic: str
    present_context: str
    income_context: str
    new_to_memory: str

# 1. Instantiate Graph
builder = StateGraph(HomeWellnessState)

# 2. Register Processing Nodes
builder.add_node("sensor_ingest", sensor_ingest)
builder.add_node("rolling_analytics", rolling_analytics)
builder.add_node("clinical_triage", clinical_triage)
builder.add_node("notification_dispatch", notification_dispatch)
builder.add_node("context_resolver", context_resolver)
builder.add_node("session_security", session_security)
builder.add_node("memory_graph_sync", memory_graph_sync)

# 3. Add Edges & Conditional Routing
builder.add_edge(START, "sensor_ingest")
builder.add_edge("sensor_ingest", "rolling_analytics")

def triage_router(state: HomeWellnessState) -> Literal["clinical_triage", "notification_dispatch"]:
    if state.get("z_score", 0) >= 2.0:
        return "clinical_triage"
    return "notification_dispatch"

builder.add_conditional_edges("rolling_analytics", triage_router)
builder.add_edge("clinical_triage", "notification_dispatch")
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
            <span>NODES: 8</span>
            <span className="text-neutral-600">•</span>
            <span>EDGES: 9 (1 CONDITIONAL)</span>
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
                      if (isSelected) {
                        borderClass = 'border-emerald-500 ring-1 ring-emerald-500/50';
                        bgClass = 'bg-emerald-950/20';
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
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                              {node.category}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">
                              {node.latency}ms
                            </span>
                          </div>
                          <div className="font-semibold text-[13px] text-white font-mono truncate">
                            {node.label}
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-tight">
                            {node.description}
                          </p>

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
                      step_index: 7,
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
                <pre>{`from typing import TypedDict, Annotated, Literal
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

# 1. State Channels Definition
class VitalTelemetry(TypedDict):
    restingHr: int
    hrv: int
    spo2: int
    batteryPct: int

class HomeWellnessState(TypedDict):
    patient_id: str
    vitals: VitalTelemetry
    delta_bpm: float
    z_score: float
    triage_status: str
    risk_score: int
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
builder.add_node("notification_dispatch", notification_dispatch)
builder.add_node("context_resolver", context_resolver)
builder.add_node("session_security", session_security)
builder.add_node("memory_graph_sync", memory_graph_sync)

# 4. Wire Edges & Conditional Routing
builder.add_edge(START, "sensor_ingest")
builder.add_edge("sensor_ingest", "rolling_analytics")

def triage_router(state: HomeWellnessState) -> Literal["clinical_triage", "notification_dispatch"]:
    """Conditional Edge: Route to clinical triage if acute z-score spike detected."""
    if state.get("z_score", 0) >= 2.0:
        return "clinical_triage"
    return "notification_dispatch"

builder.add_conditional_edges("rolling_analytics", triage_router)
builder.add_edge("clinical_triage", "notification_dispatch")
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
