/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, X, GitBranch } from 'lucide-react';
import { Smartwatch } from './components/Smartwatch';
import { ConsoleBottom } from './components/ConsoleBottom';
import { VoiceTalkBlock } from './components/VoiceTalkBlock';
import { LangGraphDrawer } from './components/LangGraphDrawer';
import { IdentitySelector } from './components/IdentitySelector';
import { BobCaregiverView } from './components/BobCaregiverView';
import {
  VitalData,
  SystemLogData,
  IdentityId,
  CaregiverContextItem,
  CaregiverAlert,
  CaregiverChatMessage,
} from './types';

export default function App() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const initialWatches: VitalData[] = [
    {
      time: '18:54',
      restingHr: 65,
      hrv: 15,
      spo2: 95,
      avgSleep: 5.5,
      cardColor: 'cyan',
    },
    {
      time: '18:55',
      restingHr: 64,
      hrv: 14,
      spo2: 95,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Reminder: 1900 to take medication',
    },
    {
      time: '18:56',
      restingHr: 78,
      hrv: 11,
      spo2: 94,
      avgSleep: 5.5,
      cardColor: 'pink',
      warning: 'Warn: HR abnormal',
      reminder: 'Reminder: 1900 to take medication',
      isAbnormal: true,
    },
    {
      time: '18:57',
      restingHr: 82,
      hrv: 12,
      spo2: 93,
      avgSleep: 5.5,
      cardColor: 'pink',
      warning: 'Warn: HR abnormal',
      isAbnormal: true,
    },
    {
      time: '18:58',
      restingHr: 65,
      hrv: 13,
      spo2: 94,
      avgSleep: 5.5,
      cardColor: 'cyan',
      warning: 'Warn: HR back to normal',
      isAbnormal: false,
    },
    {
      time: '18:59',
      restingHr: 63,
      hrv: 14,
      spo2: 95,
      avgSleep: 5.5,
      cardColor: 'cyan',
    },
    {
      time: '19:00',
      restingHr: 64,
      hrv: 16,
      spo2: 96,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Reminder: 1900 to take medication',
    },
    {
      time: '19:01',
      restingHr: 67,
      hrv: 15,
      spo2: 95,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Reminder: 1900 to take medication',
    },
    {
      time: '19:02',
      restingHr: 65,
      hrv: 16,
      spo2: 96,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Record: Take medication',
    },
  ];

  const extendedWatchesForBob: VitalData[] = [
    {
      time: '19:03',
      restingHr: 64,
      hrv: 16,
      spo2: 96,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Status: Metoprolol taken with water',
    },
    {
      time: '19:04',
      restingHr: 63,
      hrv: 17,
      spo2: 96,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Resting: Seated at dinner table',
    },
    {
      time: '19:05',
      restingHr: 65,
      hrv: 16,
      spo2: 96,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Activity: Light stroll to living room',
    },
    {
      time: '19:06',
      restingHr: 64,
      hrv: 18,
      spo2: 97,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Resting: Relaxing in armchair',
    },
    {
      time: '19:07',
      restingHr: 63,
      hrv: 19,
      spo2: 97,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Status: Watching evening news',
    },
    {
      time: '19:08',
      restingHr: 62,
      hrv: 20,
      spo2: 97,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Status: Parasympathetic tone optimal',
    },
    {
      time: '19:09',
      restingHr: 63,
      hrv: 19,
      spo2: 97,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Status: Normal sinus rhythm',
    },
    {
      time: '19:10',
      restingHr: 62,
      hrv: 21,
      spo2: 97,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Status: Reading book in armchair',
    },
    {
      time: '19:11',
      restingHr: 63,
      hrv: 20,
      spo2: 97,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Status: Steady recovery baseline',
    },
    {
      time: '19:12',
      restingHr: 64,
      hrv: 21,
      spo2: 97,
      avgSleep: 5.5,
      cardColor: 'cyan',
      reminder: 'Alert Checked: Bob accessed console',
    },
  ];

  const logDataMap: Record<string, SystemLogData> = {
    '18:54': {
      time: '18:54',
      timestampIso: '2026-09-18T18:54:02.148Z',
      pid: 8412,
      status: 'normal',
      notification: 'none',
      presentContext: 'none',
      incomeContext: '1900 to take medication.',
      newToMemory: 'none',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 86,
        ppgSignalQuality: 'OPTIMAL (SNR: 28.4 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.994,
        bleRssi: -54,
      },
    },
    '18:55': {
      time: '18:55',
      timestampIso: '2026-09-18T18:55:00.021Z',
      pid: 8412,
      status: 'normal',
      notification: 'Reminder: 1900 to take medication',
      presentContext: '1900 to take medication.',
      incomeContext: 'none',
      newToMemory: 'scheduled_reminder_active',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 85,
        ppgSignalQuality: 'OPTIMAL (SNR: 27.9 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.991,
        bleRssi: -55,
      },
    },
    '18:56': {
      time: '18:56',
      timestampIso: '2026-09-18T18:56:01.882Z',
      pid: 8412,
      status: 'HR abnormal (Resting HR: 78 bpm)',
      notification: 'Warn: HR abnormal',
      presentContext: 'resting HR elevated (78 bpm, HRV: 11 ms)',
      incomeContext: '1900 to take medication.',
      newToMemory: 'alert_flagged_urgent_vitals',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 85,
        ppgSignalQuality: 'FLAGGED (elevated sinus tach)',
        motionArtifact: 'MODERATE_TRANSITION',
        confidenceScore: 0.962,
        bleRssi: -57,
      },
    },
    '18:57': {
      time: '18:57',
      timestampIso: '2026-09-18T18:57:01.450Z',
      pid: 8412,
      status: 'HR abnormal (Resting HR: 82 bpm, SpO2: 93%)',
      notification: 'Warn: HR abnormal',
      presentContext: 'peak resting HR elevation (82 bpm)',
      incomeContext: 'none',
      newToMemory: 'anomaly_persistence_tracked',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 84,
        ppgSignalQuality: 'FLAGGED (peak sinus tachycardia)',
        motionArtifact: 'LOW (seated)',
        confidenceScore: 0.971,
        bleRssi: -56,
      },
    },
    '18:58': {
      time: '18:58',
      timestampIso: '2026-09-18T18:58:02.311Z',
      pid: 8412,
      status: 'normal (HR recovering)',
      notification: 'Warn: HR back to normal',
      presentContext: 'resting HR returned to 65 bpm baseline',
      incomeContext: 'none',
      newToMemory: 'recovery_event_logged',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 84,
        ppgSignalQuality: 'OPTIMAL (vagal recovery detected)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.993,
        bleRssi: -54,
      },
    },
    '18:59': {
      time: '18:59',
      timestampIso: '2026-09-18T18:59:00.119Z',
      pid: 8412,
      status: 'normal',
      notification: 'none',
      presentContext: 'resting HR nominal (63 bpm, HRV: 14 ms)',
      incomeContext: 'none',
      newToMemory: 'none',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 83,
        ppgSignalQuality: 'OPTIMAL (SNR: 28.6 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.995,
        bleRssi: -53,
      },
    },
    '19:00': {
      time: '19:00',
      timestampIso: '2026-09-18T19:00:00.002Z',
      pid: 8412,
      status: 'normal',
      notification: 'Reminder: 1900 to take medication',
      presentContext: '1900 scheduled medication trigger',
      incomeContext: 'none',
      newToMemory: 'medication_window_opened',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 83,
        ppgSignalQuality: 'OPTIMAL (SNR: 28.5 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.994,
        bleRssi: -54,
      },
    },
    '19:01': {
      time: '19:01',
      timestampIso: '2026-09-18T19:01:00.820Z',
      pid: 8412,
      status: 'normal',
      notification: 'Reminder: 1900 to take medication',
      presentContext: '1900 to take medication (pending confirmation)',
      incomeContext: 'none',
      newToMemory: 'adherence_timer_running',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 82,
        ppgSignalQuality: 'OPTIMAL (SNR: 27.8 dB)',
        motionArtifact: 'AMBULATORY_ACTIVITY',
        confidenceScore: 0.988,
        bleRssi: -55,
      },
    },
    '19:02': {
      time: '19:02',
      timestampIso: '2026-09-18T19:02:01.054Z',
      pid: 8412,
      status: 'normal',
      notification: 'Record: Take medication',
      presentContext: 'medication dose ingested: Metoprolol 25mg / Aspirin 81mg',
      incomeContext: 'none',
      newToMemory: 'medication_adherence_confirmed',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 82,
        ppgSignalQuality: 'OPTIMAL (SNR: 28.2 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.996,
        bleRssi: -53,
      },
    },
    '19:03': {
      time: '19:03',
      timestampIso: '2026-09-18T19:03:00.312Z',
      pid: 8412,
      status: 'normal (medication ingested)',
      notification: 'none',
      presentContext: 'post-medication rest: Metoprolol 25mg & Aspirin 81mg ingested with water',
      incomeContext: 'none',
      newToMemory: 'medication_adherence_verified',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 82,
        ppgSignalQuality: 'OPTIMAL (SNR: 28.3 dB)',
        motionArtifact: 'LOW (seated)',
        confidenceScore: 0.995,
        bleRssi: -53,
      },
    },
    '19:04': {
      time: '19:04',
      timestampIso: '2026-09-18T19:04:00.128Z',
      pid: 8412,
      status: 'normal',
      notification: 'none',
      presentContext: 'resting HR nominal (63 bpm); seated quietly at dining table',
      incomeContext: 'none',
      newToMemory: 'telemetry_stable',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 82,
        ppgSignalQuality: 'OPTIMAL (SNR: 28.5 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.996,
        bleRssi: -54,
      },
    },
    '19:05': {
      time: '19:05',
      timestampIso: '2026-09-18T19:05:01.004Z',
      pid: 8412,
      status: 'normal (ambulatory)',
      notification: 'none',
      presentContext: 'transition to living room (slow walk; HR: 65 bpm)',
      incomeContext: 'none',
      newToMemory: 'postprandial_mobility_optimal',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 81,
        ppgSignalQuality: 'OPTIMAL (SNR: 27.9 dB)',
        motionArtifact: 'LIGHT_AMBULATORY',
        confidenceScore: 0.991,
        bleRssi: -56,
      },
    },
    '19:06': {
      time: '19:06',
      timestampIso: '2026-09-18T19:06:00.871Z',
      pid: 8412,
      status: 'normal',
      notification: 'none',
      presentContext: 'seated in armchair; resting HR 64 bpm, SpO2 97%',
      incomeContext: 'none',
      newToMemory: 'rest_state_active',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 81,
        ppgSignalQuality: 'OPTIMAL (SNR: 28.6 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.997,
        bleRssi: -52,
      },
    },
    '19:07': {
      time: '19:07',
      timestampIso: '2026-09-18T19:07:00.220Z',
      pid: 8412,
      status: 'normal',
      notification: 'none',
      presentContext: 'watching evening news; resting HR 63 bpm',
      incomeContext: 'none',
      newToMemory: 'autonomic_balance_restored',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 81,
        ppgSignalQuality: 'OPTIMAL (SNR: 28.7 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.998,
        bleRssi: -52,
      },
    },
    '19:08': {
      time: '19:08',
      timestampIso: '2026-09-18T19:08:00.590Z',
      pid: 8412,
      status: 'normal',
      notification: 'none',
      presentContext: 'parasympathetic vagal tone optimal (HRV: 20 ms, HR: 62 bpm)',
      incomeContext: 'none',
      newToMemory: 'telemetry_calm',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 80,
        ppgSignalQuality: 'OPTIMAL (SNR: 28.8 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.998,
        bleRssi: -53,
      },
    },
    '19:09': {
      time: '19:09',
      timestampIso: '2026-09-18T19:09:00.115Z',
      pid: 8412,
      status: 'normal',
      notification: 'none',
      presentContext: 'sinus rhythm completely regular; SpO2: 97%',
      incomeContext: 'none',
      newToMemory: 'arrhythmia_absence_confirmed',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 80,
        ppgSignalQuality: 'OPTIMAL (SNR: 28.9 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.998,
        bleRssi: -51,
      },
    },
    '19:10': {
      time: '19:10',
      timestampIso: '2026-09-18T19:10:00.442Z',
      pid: 8412,
      status: 'normal',
      notification: 'none',
      presentContext: 'reading book in armchair; resting HR 62 bpm, HRV 21 ms',
      incomeContext: 'none',
      newToMemory: 'evening_routine_steady',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 80,
        ppgSignalQuality: 'OPTIMAL (SNR: 29.0 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.999,
        bleRssi: -52,
      },
    },
    '19:11': {
      time: '19:11',
      timestampIso: '2026-09-18T19:11:00.910Z',
      pid: 8412,
      status: 'normal',
      notification: 'none',
      presentContext: 'steady post-medication baseline confirmed across 10 min window',
      incomeContext: 'none',
      newToMemory: 'adherence_window_closed',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 79,
        ppgSignalQuality: 'OPTIMAL (SNR: 29.1 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.999,
        bleRssi: -51,
      },
    },
    '19:12': {
      time: '19:12',
      timestampIso: '2026-09-18T19:12:01.000Z',
      pid: 8412,
      status: 'normal (caregiver alert review)',
      notification: 'Alert Reviewed: Bob Smith checked phone at 19:12 UTC',
      presentContext: 'Alice in green zone (64 bpm, SpO2 97%); caregiver Bob checked in at 19:12 UTC after work',
      incomeContext: 'Caregiver check-in initiated',
      newToMemory: 'bob_1912_alert_checkin_logged',
      rawTelemetry: {
        sensorId: 'HW-BLE-WATCH-01',
        batteryPct: 79,
        ppgSignalQuality: 'OPTIMAL (SNR: 29.2 dB)',
        motionArtifact: 'LOW (stationary)',
        confidenceScore: 0.999,
        bleRssi: -50,
      },
    },
  };

  const [selectedTime, setSelectedTime] = useState<string>('18:54');
  const [activeTalkWatch, setActiveTalkWatch] = useState<VitalData | null>(null);
  const [isTalkHidden, setIsTalkHidden] = useState<boolean>(false);
  const [isLangGraphOpen, setIsLangGraphOpen] = useState<boolean>(false);

  // Identity & Caregiver State (Alice Smith vs. Bob Smith)
  const [currentIdentity, setCurrentIdentity] = useState<IdentityId>('alice');
  const [aliceAgreedToShare, setAliceAgreedToShare] = useState<boolean>(true);
  const [watches, setWatches] = useState<VitalData[]>(initialWatches);
  const [extendedWatches, setExtendedWatches] = useState<VitalData[]>(extendedWatchesForBob);
  const bobWatches = [...watches, ...extendedWatches];

  // Bob's injected contexts & memories
  const [caregiverContexts, setCaregiverContexts] = useState<CaregiverContextItem[]>([
    {
      id: 'ctx-1',
      type: 'REMINDER',
      title: 'Reminder: 1900 to take medication (Metoprolol 25mg & Aspirin 81mg)',
      time: '19:00',
      addedBy: "Bob Smith (Alice's Son)",
      timestampIso: '2026-09-18T18:50:00Z',
      targetChannel: 'incomeContext',
      status: 'ACTIVE',
    },
    {
      id: 'ctx-2',
      type: 'CLINICAL_NOTE',
      title: 'Cardiologist instructions: Monitor recovery post-dinner and check HR stability',
      addedBy: "Bob Smith (Alice's Son)",
      timestampIso: '2026-09-18T18:40:00Z',
      targetChannel: 'presentContext',
      status: 'SYNCED',
    },
  ]);

  // Alerts & Notifications sent to Bob
  const [caregiverAlerts, setCaregiverAlerts] = useState<CaregiverAlert[]>([
    {
      id: 'alert-1',
      time: '18:56',
      timestampIso: '2026-09-18T18:56:04Z',
      type: 'URGENT_VITAL',
      title: 'HR Elevated: 78 bpm (Z-score +2.68)',
      description: "Alice's resting HR exceeded baseline (64 bpm). Watch alert banner dispatched.",
      severity: 'warning',
      isRead: true,
      relatedWatchTime: '18:56',
    },
    {
      id: 'alert-2',
      time: '18:57',
      timestampIso: '2026-09-18T18:57:08Z',
      type: 'URGENT_VITAL',
      title: 'Peak Sinus Tachycardia: 82 bpm, SpO2 93%',
      description: 'Persistent tachycardia detected. Agent initiated autonomous duplex voice check-in.',
      severity: 'critical',
      isRead: true,
      relatedWatchTime: '18:57',
    },
    {
      id: 'alert-3',
      time: '18:58',
      timestampIso: '2026-09-18T18:58:30Z',
      type: 'VITAL_RECOVERY',
      title: 'Vagal Recovery: HR Stabilized to 65 bpm',
      description: 'Sinus rhythm normalized; SpO2 recovered to 94%. Voice loop confirmed patient calm.',
      severity: 'success',
      isRead: true,
      relatedWatchTime: '18:58',
    },
    {
      id: 'alert-4',
      time: '19:00',
      timestampIso: '2026-09-18T19:00:00Z',
      type: 'MEDICATION_SCHEDULED',
      title: '19:00 Medication Window Opened',
      description: 'Reminder dispatched for Metoprolol 25mg & Aspirin 81mg (Injected by Bob).',
      severity: 'info',
      isRead: true,
      relatedWatchTime: '19:00',
    },
    {
      id: 'alert-5',
      time: '19:02',
      timestampIso: '2026-09-18T19:02:15Z',
      type: 'MEDICATION_TAKEN',
      title: 'Medication Adherence Confirmed',
      description: 'Alice took evening dose with water after dinner. Adherence recorded in MemorySaver.',
      severity: 'success',
      isRead: true,
      relatedWatchTime: '19:02',
    },
    {
      id: 'alert-6',
      time: '19:12',
      timestampIso: '2026-09-18T19:12:00Z',
      type: 'INFO',
      title: 'Alerts Reviewed by Bob (Post-Work Sync)',
      description: 'Bob concluded work shift and opened phone alerts at 19:12 UTC. Alice stream synced through 19:12 UTC.',
      severity: 'info',
      isRead: true,
      relatedWatchTime: '19:12',
    },
  ]);

  // Bob's independent conversational chat messages with the Agent
  // Bob was busy at work and discovered the health alert on his phone at 19:12 UTC
  const [caregiverMessages, setCaregiverMessages] = useState<CaregiverChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bob',
      text: "Hi Agent, I was busy at work and just saw the alert on my phone now. How is Mom doing right now? Did her heart rate calm down?",
      time: '19:12',
      timestampIso: '2026-09-18T19:12:08Z',
    },
    {
      id: 'msg-2',
      sender: 'agent',
      text: "Hello Bob. Alice experienced a brief sinus tachycardia spike reaching 82 bpm earlier at 18:57 UTC, with SpO2 at 93%. I initiated a voice check-in via her smartwatch. She rested at the dinner table, and by 18:58 UTC her heart rate recovered to 65 bpm. She took her evening medication at 19:02 UTC, and all her vitals have remained completely stable throughout the last 15 minutes up to 19:12 UTC.",
      time: '19:12',
      timestampIso: '2026-09-18T19:12:25Z',
    },
    {
      id: 'msg-3',
      sender: 'bob',
      text: "Did she take her 19:00 blood pressure medication?",
      time: '19:13',
      timestampIso: '2026-09-18T19:13:05Z',
    },
    {
      id: 'msg-4',
      sender: 'agent',
      text: "Yes, Bob. At 19:00 UTC, I displayed your medication reminder for Metoprolol 25mg and Aspirin 81mg. At 19:02 UTC, Alice confirmed she took both pills with a full glass of water. Her resting heart rate is currently 64 bpm and SpO2 is 97% at 19:12 UTC.",
      time: '19:13',
      timestampIso: '2026-09-18T19:13:22Z',
    },
  ]);

  const [isAgentTyping, setIsAgentTyping] = useState<boolean>(false);

  // Handler for Bob adding context / memory
  const handleAddCaregiverContext = (
    item: Omit<CaregiverContextItem, 'id' | 'timestampIso' | 'status'>
  ) => {
    const newItem: CaregiverContextItem = {
      ...item,
      id: `ctx-${Date.now()}`,
      timestampIso: new Date().toISOString(),
      status: 'ACTIVE',
    };

    setCaregiverContexts((prev) => [newItem, ...prev]);

    // If time matches a watch, reflect the reminder on that watch snapshot
    if (item.time) {
      setWatches((prevWatches) =>
        prevWatches.map((w) => {
          if (w.time === item.time) {
            return {
              ...w,
              reminder: item.title,
            };
          }
          return w;
        })
      );
      setExtendedWatches((prevWatches) =>
        prevWatches.map((w) => {
          if (w.time === item.time) {
            return {
              ...w,
              reminder: item.title,
            };
          }
          return w;
        })
      );
    }

    // Add alert notification for Bob's injected context
    setCaregiverAlerts((prev) => [
      {
        id: `alert-inj-${Date.now()}`,
        time: item.time || selectedTime,
        timestampIso: new Date().toISOString(),
        type: 'INFO',
        title: `Memory Node Injected: ${item.type}`,
        description: `"${item.title}" successfully bound to Agent LangGraph state and Alice's device.`,
        severity: 'info',
        isRead: false,
        relatedWatchTime: item.time || selectedTime,
      },
      ...prev,
    ]);
  };

  const handleRemoveCaregiverContext = (id: string) => {
    setCaregiverContexts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAcknowledgeAlert = (id: string) => {
    setCaregiverAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  // Handler for Bob sending a message in his independent channel
  const handleSendMessageToAgent = (text: string) => {
    const nowTime = selectedTime && selectedTime >= '19:12' ? selectedTime : '19:14';
    const userMsg: CaregiverChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'bob',
      text,
      time: nowTime,
      timestampIso: new Date().toISOString(),
    };

    setCaregiverMessages((prev) => [...prev, userMsg]);
    setIsAgentTyping(true);

    // Simulate Agent AI response based on Alice's telemetry & consent status
    setTimeout(() => {
      let replyText = '';

      if (!aliceAgreedToShare) {
        replyText =
          "I apologize, Bob. For patient privacy and clinical compliance, I cannot disclose Alice's vitals or health details without her explicit agreement. Alice can enable this in the Voice & Context Channel on her HomeWellness device.";
      } else {
        const lower = text.toLowerCase();
        if (lower.includes('heart') || lower.includes('hr') || lower.includes('spike') || lower.includes('82') || lower.includes('rate')) {
          replyText = `Alice experienced an elevated resting HR spike starting at 18:56 UTC (78 bpm, Z-score +2.68) and peaking at 18:57 UTC (82 bpm, SpO2 93%). During our voice check-in, she noted feeling a mild flutter after finishing dinner. By 18:58 UTC, her heart rate returned to normal resting baseline at 65 bpm with SpO2 at 94%. Her vitals remained completely steady across 19:02 to 19:12 UTC, with resting HR currently at ${currentWatch.restingHr} bpm and HRV at ${currentWatch.hrv} ms.`;
        } else if (lower.includes('summary') || lower.includes('stream') || lower.includes('timeline') || (lower.includes('19:02') && lower.includes('19:12'))) {
          replyText = `Here is a summary of Alice's smartwatch timeline stream between 19:02 and 19:12 UTC: Following her medication confirmation at 19:02 UTC, Alice rested at the dining table, walked gently to the living room at 19:05, and settled comfortably in her armchair to read the evening news. Her resting heart rate stabilized between 62 and 64 bpm, SpO2 held steady at 96–97%, and HRV reached 21 ms, demonstrating healthy parasympathetic recovery while you completed your work shift.`;
        } else if (lower.includes('medication') || lower.includes('pill') || lower.includes('19:00') || lower.includes('dose') || lower.includes('take')) {
          replyText = `Your reminder for her 19:00 medication was queued in the incoming context. At 18:59 UTC, Alice asked me about taking her pill. At 19:00 UTC, the reminder flashed on her smartwatch, and at 19:02 UTC Alice confirmed taking her prescribed Metoprolol (25mg) and Aspirin (81mg) with water. Her post-dose telemetry has remained completely stable through 19:12 UTC.`;
        } else if (lower.includes('sleep') || lower.includes('night') || lower.includes('rest')) {
          replyText = `Alice recorded 5.5 hours of sleep last night, which represents a mild deficit compared to her 7.0-hour baseline. Our biometric analytics indicate that short sleep slightly heightened her adrenergic sensitivity during dinner, but she recovered quickly without signs of arrhythmia.`;
        } else if (lower.includes('doctor') || lower.includes('dr') || lower.includes('miller') || lower.includes('instruction')) {
          replyText = `Dr. Miller's clinical instructions advise monitoring her post-dinner heart rate and ensuring Metoprolol 25mg is taken consistently at 19:00. If her resting heart rate stays above 85 bpm for more than 15 continuous minutes, an urgent alert is automatically escalated to you and the clinic.`;
        } else {
          replyText = `Thank you for checking in after work, Bob. Alice is currently resting comfortably. Her resting HR is ${currentWatch.restingHr} bpm, SpO2 is ${currentWatch.spo2}%, and her 19:00 evening medication was verified taken. The 19:02–19:12 post-medication timeline stream shows complete stability. Please let me know if you would like to add any reminders or clinical notes.`;
        }
      }

      const agentMsg: CaregiverChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text: replyText,
        time: nowTime,
        timestampIso: new Date().toISOString(),
      };

      setCaregiverMessages((prev) => [...prev, agentMsg]);
      setIsAgentTyping(false);
    }, 700);
  };

  const currentLog = logDataMap[selectedTime] || logDataMap['18:54'];
  const activeWatchList = currentIdentity === 'bob' ? bobWatches : watches;
  const currentWatch =
    activeWatchList.find((w) => w.time === selectedTime) ||
    (currentIdentity === 'bob' ? bobWatches[bobWatches.length - 1] : watches[0]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div
      id="homewellness-app"
      className="min-h-screen w-full flex flex-col bg-[#e3e4e7] text-black antialiased select-none"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* 1. Header Bar matching reference with Agent Status next to user name */}
      <header
        id="app-header"
        className="w-full bg-[#e3e4e7] px-6 sm:px-10 lg:px-14 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 z-20 shrink-0"
      >
        <h1
          id="app-brand-title"
          className="text-[26px] sm:text-[32px] lg:text-[34px] font-normal tracking-tight text-black"
        >
          HomeWellness
        </h1>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
          {/* Agent Status Pill in Header */}
          <div
            id="agent-status-pill"
            role="button"
            tabIndex={0}
            onClick={() => setIsLangGraphOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsLangGraphOpen(true);
              }
            }}
            className="bg-neutral-900 hover:bg-neutral-800 text-white px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[12px] sm:text-[13px] font-normal shadow-xs flex items-center space-x-1.5 border border-neutral-700/60 hover:border-emerald-500/70 hover:ring-2 hover:ring-emerald-500/25 transition-all cursor-pointer group select-none active:scale-95"
            title="Click to open Agent Architecture, Context & Memory panel"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#05ff2b] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#05ff2b]" />
            </span>
            <span className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Agent Status:</span>
            <span className="text-[#05ff2b] font-medium">Continuous Health Loop Active</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Dynamic Identity Selector Component */}
          <IdentitySelector
            currentIdentity={currentIdentity}
            onSelectIdentity={(id) => {
              setCurrentIdentity(id);
              if (id === 'bob' && (selectedTime < '19:02' || selectedTime === '18:54')) {
                setSelectedTime('19:12');
              } else if (id === 'alice' && selectedTime > '19:02') {
                setSelectedTime('19:00');
              }
            }}
            aliceAgreedToShare={aliceAgreedToShare}
          />
        </div>
      </header>

      {/* Main View: Alice Smith View vs Bob Smith Caregiver View */}
      {currentIdentity === 'alice' ? (
        <>
          {/* 2. Middle Main Section with 9 Smartwatches & Horizontal Scroll */}
          <main
            id="watches-main-stage"
            className="flex-1 w-full bg-[#f3f4f6] flex flex-col justify-center py-4 sm:py-6 px-3 sm:px-6 relative overflow-hidden"
          >
            {/* Scroll Bar Navigation Controls */}
            <div className="w-full flex items-center justify-between max-w-7xl mx-auto px-2 mb-2 text-xs text-neutral-600">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-neutral-800">
                  9 Timestamp Telemetry Snapshots (18:54 – 19:02)
                </span>
                <span className="hidden md:inline text-neutral-400">
                  • Scroll right to inspect full chronological timeline • Click any watch to update console
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="p-1.5 rounded-full bg-white hover:bg-neutral-100 active:bg-neutral-200 border border-neutral-300 shadow-xs text-neutral-700 hover:text-black transition cursor-pointer"
                  title="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="p-1.5 rounded-full bg-white hover:bg-neutral-100 active:bg-neutral-200 border border-neutral-300 shadow-xs text-neutral-700 hover:text-black transition cursor-pointer"
                  title="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Scrollable Track */}
            <div
              ref={scrollContainerRef}
              id="watches-scroll-container"
              className="w-full overflow-x-auto scroll-smooth py-2 px-2 sm:px-4"
              style={{
                scrollbarWidth: 'thin',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div
                id="watches-grid"
                className="flex flex-row items-center gap-6 sm:gap-8 min-w-max pb-2 px-2"
              >
                {watches.map((watch) => (
                  <Smartwatch
                    key={watch.time}
                    data={watch}
                    isSelected={selectedTime === watch.time}
                    onSelect={() => setSelectedTime(watch.time)}
                    onTalkClick={() => {
                      setActiveTalkWatch({ ...watch, _talkClickId: Date.now() });
                      setSelectedTime(watch.time);
                      setIsTalkHidden(false);
                    }}
                  />
                ))}
              </div>
            </div>
          </main>

          {/* 3. Interactive Voice & Communication Block (Embedded between Watches and Console) */}
          {activeTalkWatch && !isTalkHidden && (
            <VoiceTalkBlock
              data={activeTalkWatch}
              onClose={() => setActiveTalkWatch(null)}
              onHide={() => setIsTalkHidden(true)}
              aliceAgreedToShare={aliceAgreedToShare}
              onToggleAliceAgree={() => setAliceAgreedToShare((prev) => !prev)}
              caregiverContexts={caregiverContexts}
              onSwitchToBob={() => setCurrentIdentity('bob')}
            />
          )}

          {/* Minimized / Hidden State Bar for the Voice Talk Block */}
          {activeTalkWatch && isTalkHidden && (
            <div
              id="voice-talk-minimized-bar"
              className="w-full bg-[#0b0e14] border-t border-b border-neutral-800 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs text-neutral-300 font-mono select-none"
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white">Voice &amp; Context Channel</span>
                <span className="text-neutral-500">•</span>
                <span className="text-emerald-400">Snapshot: {activeTalkWatch.time}:00 UTC</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400 italic">Conversation Hidden</span>
              </div>
              <div className="flex items-center space-x-2 font-sans">
                <button
                  id="unhide-talk-block-btn"
                  type="button"
                  onClick={() => setIsTalkHidden(false)}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 text-xs font-medium transition cursor-pointer"
                  title="Show voice talk block"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Show Conversation</span>
                </button>
                <button
                  id="dismiss-minimized-talk-btn"
                  type="button"
                  onClick={() => setActiveTalkWatch(null)}
                  className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
                  title="Close voice channel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Bob Smith (Son) Caregiver View */
        <main id="caregiver-main-stage" className="flex-1 w-full bg-[#f3f4f6] py-2 overflow-y-auto">
          <BobCaregiverView
            aliceAgreedToShare={aliceAgreedToShare}
            onToggleAliceAgree={() => setAliceAgreedToShare((prev) => !prev)}
            onSwitchToAlice={() => {
              setCurrentIdentity('alice');
              if (selectedTime > '19:02') setSelectedTime('19:00');
            }}
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
            selectedWatch={currentWatch}
            allWatches={bobWatches}
            currentLog={currentLog}
            caregiverContexts={caregiverContexts}
            onAddContext={handleAddCaregiverContext}
            onRemoveContext={handleRemoveCaregiverContext}
            alerts={caregiverAlerts}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            messages={caregiverMessages}
            onSendMessage={handleSendMessageToAgent}
            isAgentTyping={isAgentTyping}
          />
        </main>
      )}

      {/* 4. Bottom Console with System Log & AI Agent Actions (Alice's page only; hidden on Bob's caregiver page) */}
      {currentIdentity === 'alice' && (
        <footer id="app-footer" className="w-full shrink-0">
          <ConsoleBottom
            logData={currentLog}
            selectedTime={selectedTime}
            selectedWatch={currentWatch}
            onOpenArchitecture={() => setIsLangGraphOpen(true)}
          />
        </footer>
      )}

      {/* 5. Agent Architecture, Context & Memory Side Drawer */}
      <LangGraphDrawer
        isOpen={isLangGraphOpen}
        onClose={() => setIsLangGraphOpen(false)}
        currentLog={currentLog}
        selectedWatch={currentWatch}
        selectedTime={selectedTime}
      />
    </div>
  );
}
