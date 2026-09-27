export interface VitalData {
  time: string;
  restingHr: number;
  hrv: number;
  spo2: number;
  avgSleep: number;
  isAbnormal?: boolean;
  warning?: string;
  reminder?: string;
  activity?: string;
  cardColor: 'cyan' | 'pink';
  _talkClickId?: number;
}

export interface AgentPrinciple {
  id: string;
  code: string;
  title: string;
  category: 'SAFETY_CLINICAL' | 'COMMUNICATION_TONE' | 'PHYSIOLOGICAL_BASELINE' | 'AUTONOMY_PRIVACY';
  statement: string;
  distilledFrom: string;
  temporalLifespan: 'PERMANENT_DEFAULT' | 'LONG_TERM_ACTIVE';
  compressionRatio: string;
  influenceTarget: ('SHORT_TERM_MEMORY' | 'PRESENT_CONTEXT' | 'DISPATCH_ACTION')[];
  activeSince: string;
  lastReinforced: string;
  confidenceScore: number;
  isActive: boolean;
}

export interface SystemLogData {
  time: string;
  timestampIso: string;
  pid: number;
  status: string;
  notification: string;
  presentContext: string;
  incomeContext: string;
  newToMemory: string;
  activePrinciplesCount?: number;
  activePrincipleCodes?: string[];
  principleGovernanceNote?: string;
  guardrailStatus?: string;
  guardrailActive?: boolean;
  medicalAdviceBlocked?: boolean;
  rawTelemetry?: {
    sensorId: string;
    batteryPct: number;
    ppgSignalQuality: string;
    motionArtifact: string;
    confidenceScore: number;
    bleRssi: number;
  };
}

export interface AgentActionStep {
  id: string;
  name: string;
  signature: string;
  latencyMs: number;
  status: 'SUCCESS' | 'RUNNING' | 'EVALUATING' | 'ALERT';
  outputPreview: string;
  payload: Record<string, any>;
  stepNumber?: string;
  category?: 'INGEST' | 'ANALYTICS' | 'TRIAGE' | 'PRINCIPLE' | 'GUARDRAIL' | 'NOTIFY' | 'CONTEXT' | 'IDENTITY' | 'MEMORY';
  badgeStyle?: string;
  timeOffsetMs?: string;
  naturalText?: React.ReactNode;
}

export type IdentityId = 'alice' | 'bob';

export interface UserIdentityProfile {
  id: IdentityId;
  name: string;
  role: string;
  relation: string;
  age: number;
  gender: string;
  deviceId?: string;
  description: string;
  badgeColor: string;
}

export interface CaregiverContextItem {
  id: string;
  type: 'REMINDER' | 'CLINICAL_NOTE' | 'LIFESTYLE' | 'MEMORY';
  title: string;
  time?: string;
  addedBy: string;
  timestampIso: string;
  targetChannel: 'incomeContext' | 'newToMemory' | 'presentContext';
  status: 'ACTIVE' | 'SYNCED' | 'ARCHIVED';
}

export interface CaregiverAlert {
  id: string;
  time: string;
  timestampIso: string;
  type: 'URGENT_VITAL' | 'VITAL_RECOVERY' | 'MEDICATION_SCHEDULED' | 'MEDICATION_TAKEN' | 'INFO';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'success' | 'info';
  isRead: boolean;
  relatedWatchTime: string;
}

export interface CaregiverChatMessage {
  id: string;
  sender: 'bob' | 'agent';
  text: string;
  time: string;
  timestampIso: string;
  isQuickPrompt?: boolean;
}

