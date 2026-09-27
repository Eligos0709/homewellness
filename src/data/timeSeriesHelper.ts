import { TimeSeriesAttributes, TimeSeriesPoint } from '../types';

/**
 * Generates realistic 30-second continuous time-series buffers for each timestamp snapshot,
 * modeling continuous PPG sampling at 25 Hz downsampled to 1 Hz evaluation windows.
 * 
 * HomeWellness attributes are time-series data:
 * - Sampling rate: 25Hz hardware, 1Hz downsampled evaluation window
 * - Window: 30 continuous seconds [t-29s ... t-0s]
 * - Derivatives: Trend slope d(bpm)/dt and acceleration d^2/dt^2
 * - Trajectory state: ACUTE_ASCENT, SUSTAINED_PEAK, VAGAL_DESCENT, CIRCADIAN_STABLE
 * - Temporal Anomaly Persistence: seconds exceeding clinical threshold
 */
export function generateTimeSeriesData(
  time: string,
  targetHr: number,
  targetSpo2: number,
  targetHrv: number
): TimeSeriesAttributes {
  const points: TimeSeriesPoint[] = [];
  const windowDurationSec = 30;

  let trendSlope = 0.0;
  let trendDirection: TimeSeriesAttributes['trendDirection'] = 'STABLE_FLAT';
  let trajectoryState: TimeSeriesAttributes['trajectoryState'] = 'CIRCADIAN_STABLE';
  let persistenceDurationSec = 0;

  if (time === '18:56') {
    // Acute Ascent: Resting HR climbing steeply from 65 to 78 bpm
    trendSlope = +4.8;
    trendDirection = 'RISING_STEEP';
    trajectoryState = 'ACUTE_ASCENT';
    persistenceDurationSec = 22; // Just breached threshold 22 seconds ago
    for (let i = 29; i >= 0; i--) {
      const progress = (29 - i) / 29;
      const baseHr = 65 + (78 - 65) * Math.pow(progress, 1.25);
      const noise = Math.sin(i * 1.4) * 0.8;
      const spo2Val = Math.round(95 - progress * 1.2);
      const hrvVal = Math.round(15 - progress * 4);
      points.push({
        offsetSec: -i,
        timestamp: `${time}:${(30 - i).toString().padStart(2, '0')}`,
        hr: Math.round(baseHr + noise),
        spo2: Math.max(93, spo2Val),
        hrv: Math.max(10, hrvVal),
        ppgPulseAmp: parseFloat((0.85 + progress * 0.35 + Math.sin(i * 2) * 0.05).toFixed(2)),
      });
    }
  } else if (time === '18:57') {
    // Sustained Peak Plateau: Resting HR hovered at 80-82 bpm
    trendSlope = +0.8;
    trendDirection = 'PEAK_PLATEAU';
    trajectoryState = 'SUSTAINED_PEAK';
    persistenceDurationSec = 82; // Persisted for 82s across continuous evaluation windows
    for (let i = 29; i >= 0; i--) {
      const baseHr = 81 + Math.sin(i * 0.8) * 1.4;
      points.push({
        offsetSec: -i,
        timestamp: `${time}:${(30 - i).toString().padStart(2, '0')}`,
        hr: Math.round(baseHr),
        spo2: 93,
        hrv: 12,
        ppgPulseAmp: parseFloat((1.18 + Math.sin(i * 2.2) * 0.06).toFixed(2)),
      });
    }
  } else if (time === '18:58') {
    // Vagal Descent: Rapid recovery from 82 bpm down to 65 bpm
    trendSlope = -9.4;
    trendDirection = 'FALLING_RECOVERY';
    trajectoryState = 'VAGAL_DESCENT';
    persistenceDurationSec = 0; // Anomaly cleared by vagal rebound
    for (let i = 29; i >= 0; i--) {
      const progress = (29 - i) / 29;
      const baseHr = 82 - (82 - 65) * Math.sin((progress * Math.PI) / 2);
      const noise = Math.cos(i * 1.5) * 0.6;
      const spo2Val = Math.round(93 + progress * 1.5);
      const hrvVal = Math.round(11 + progress * 2.5);
      points.push({
        offsetSec: -i,
        timestamp: `${time}:${(30 - i).toString().padStart(2, '0')}`,
        hr: Math.round(baseHr + noise),
        spo2: Math.min(95, spo2Val),
        hrv: hrvVal,
        ppgPulseAmp: parseFloat((1.15 - progress * 0.35 + Math.cos(i * 2) * 0.04).toFixed(2)),
      });
    }
  } else if (time === '19:01') {
    // Mild ambulatory bump as Alice walked to fetch water for 19:00 medication
    trendSlope = +0.6;
    trendDirection = 'STABLE_FLAT';
    trajectoryState = 'CIRCADIAN_STABLE';
    persistenceDurationSec = 0;
    for (let i = 29; i >= 0; i--) {
      const progress = (29 - i) / 29;
      const baseHr = 65 + progress * 2 + Math.sin(i * 0.9) * 0.8;
      points.push({
        offsetSec: -i,
        timestamp: `${time}:${(30 - i).toString().padStart(2, '0')}`,
        hr: Math.round(baseHr),
        spo2: targetSpo2,
        hrv: targetHrv,
        ppgPulseAmp: parseFloat((0.86 + Math.sin(i * 1.6) * 0.04).toFixed(2)),
      });
    }
  } else if (time >= '19:03' && time <= '19:12') {
    // Post-medication rest: parasympathetic stabilization between 62 and 65 bpm
    const hrVariance = time >= '19:08' ? -0.2 : +0.1;
    trendSlope = parseFloat(hrVariance.toFixed(1));
    trendDirection = 'STABLE_FLAT';
    trajectoryState = 'CIRCADIAN_STABLE';
    persistenceDurationSec = 0;
    for (let i = 29; i >= 0; i--) {
      const noise = Math.sin(i * 0.6 + parseInt(time.slice(-1), 10)) * 0.7;
      points.push({
        offsetSec: -i,
        timestamp: `${time}:${(30 - i).toString().padStart(2, '0')}`,
        hr: Math.round(targetHr + noise),
        spo2: targetSpo2,
        hrv: targetHrv,
        ppgPulseAmp: parseFloat((0.80 + Math.sin(i * 1.5) * 0.03).toFixed(2)),
      });
    }
  } else {
    // Circadian Stable baseline (18:54, 18:55, 18:59, 19:00, 19:02)
    trendSlope = parseFloat((Math.sin(parseInt(time.replace(':', ''), 10)) * 0.2).toFixed(1));
    trendDirection = 'STABLE_FLAT';
    trajectoryState = 'CIRCADIAN_STABLE';
    persistenceDurationSec = 0;
    for (let i = 29; i >= 0; i--) {
      const noise = Math.sin(i * 0.7) * 0.9;
      points.push({
        offsetSec: -i,
        timestamp: `${time}:${(30 - i).toString().padStart(2, '0')}`,
        hr: Math.round(targetHr + noise),
        spo2: targetSpo2,
        hrv: targetHrv,
        ppgPulseAmp: parseFloat((0.82 + Math.sin(i * 1.8) * 0.03).toFixed(2)),
      });
    }
  }

  const sumHr = points.reduce((acc, p) => acc + p.hr, 0);
  const rollingMeanHr = parseFloat((sumHr / points.length).toFixed(1));
  const variance = points.reduce((acc, p) => acc + Math.pow(p.hr - rollingMeanHr, 2), 0) / points.length;
  const rollingStdDev = parseFloat(Math.sqrt(variance).toFixed(2));

  return {
    samplingRateHz: 25,
    windowDurationSec,
    trendSlopeBpmPerMin: trendSlope,
    trendDirection,
    rollingMeanHr,
    rollingStdDev,
    trajectoryState,
    anomalyPersistenceSec: persistenceDurationSec,
    windowPoints: points,
  };
}

/**
 * Format slope for concise UI badges
 */
export function formatSlope(slope: number): string {
  if (slope > 0) return `+${slope.toFixed(1)} bpm/min`;
  if (slope < 0) return `${slope.toFixed(1)} bpm/min`;
  return `0.0 bpm/min`;
}

/**
 * Return UI trajectory styling and labels
 */
export function getTrajectoryBadge(state: TimeSeriesAttributes['trajectoryState']) {
  switch (state) {
    case 'ACUTE_ASCENT':
      return {
        label: 'ACUTE ASCENT',
        bg: 'bg-rose-950/80',
        text: 'text-rose-300',
        border: 'border-rose-600/70',
        dot: 'bg-rose-500 animate-ping',
        description: 'Tachycardia onset: rapid resting HR acceleration',
      };
    case 'SUSTAINED_PEAK':
      return {
        label: 'SUSTAINED PEAK',
        bg: 'bg-amber-950/80',
        text: 'text-amber-300',
        border: 'border-amber-600/70',
        dot: 'bg-amber-500 animate-pulse',
        description: 'Persistent plateau: >80s continuous anomaly persistence',
      };
    case 'VAGAL_DESCENT':
      return {
        label: 'VAGAL RECOVERY',
        bg: 'bg-emerald-950/80',
        text: 'text-emerald-300',
        border: 'border-emerald-600/70',
        dot: 'bg-emerald-400',
        description: 'Steep parasympathetic descent back to baseline',
      };
    case 'CIRCADIAN_STABLE':
    default:
      return {
        label: 'CIRCADIAN STABLE',
        bg: 'bg-sky-950/80',
        text: 'text-sky-300',
        border: 'border-sky-700/70',
        dot: 'bg-sky-400',
        description: 'Nominal physiological homeostasis within 95% CI',
      };
  }
}
