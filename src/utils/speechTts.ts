/**
 * Voice & Context Channel Text-to-Speech (TTS) Engine
 * 
 * Features:
 * - Lifelike Prosodic Phrasal Synthesis for Alice (70yo female):
 *   * Dynamic pitch contours: warm greeting onset (~1.06), clause flow (~0.98), rising question inflection (~1.12), gentle concluding cadence (~0.91).
 *   * Natural human cadence: comfortable conversational pacing (0.89x - 0.95x) replacing the unnatural flat 0.83x drone.
 *   * Natural breath & cognitive pauses: 140ms-200ms comma pauses, 340ms-450ms sentence pauses, 500ms ellipses pauses.
 *   * Text humanization: expands timestamps ("7:00 PM", "8:15 AM"), numbers ("five and a half hours"), and medical abbreviations into natural spoken English.
 * 
 * - Professional Physician / Doctor Prosodic Synthesis for Agent:
 *   * Empathetic Bedside Manner: warm clinical validation openers (~1.05 pitch, 0.94x pacing).
 *   * Caring Clinical Directives: measured, attentive instructions for "Please take it easy", "check your prescription", "stay alert" (~1.03 pitch, 0.93x rate, 240ms pause).
 *   * Articulate Diagnostic Observations: objective, authoritative vital & telemetry correlations (~1.01 pitch, 0.97x rate).
 *   * Clinical Reassurance Concluding Settling: grounded, calming physician resolution (~0.96 pitch, 0.91x rate, 420ms breath pause).
 *   * Inquiring Diagnostic Intonation: natural upward clinical inquiry curve (~1.12 pitch).
 * 
 * - Prioritized Neural / Natural voice selection for both roles:
 *   * Scores Microsoft Online Natural voices (Jenny, Aria, Sonia, Libby for Alice; Ryan, Guy, Christopher, Steffan for Agent),
 *     Google Neural voices (Google UK English Male/Female, Google US English), and Apple Enhanced/Premium voices (Daniel, Oliver, Alex).
 *   * Actively penalizes legacy robotic desktop synthesizers (Zira, Desktop, eSpeak).
 * - Full audio controls: sequential queue playback, single-message play, pause/resume, cancel, persona switching, and sample preview.
 */

export interface DialogueItem {
  sender: 'alice' | 'agent';
  speakerLabel: string;
  text: string;
  time: string;
}

export interface VoiceProfiles {
  aliceVoice: SpeechSynthesisVoice | null;
  agentVoice: SpeechSynthesisVoice | null;
}

export interface ProsodicSegment {
  text: string;
  rate: number;
  pitch: number;
  pauseAfterMs: number;
}

export const isTTSSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

/**
 * Audio Context primer to ensure the browser's audio hardware is awake
 * and prevents the first syllable from being clipped by power-saving audio gates.
 */
let sharedAudioCtx: AudioContext | null = null;

export const primeAudioContext = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
  } catch {
    // Ignore audio context initialization failures
  }
};

/**
 * Text humanization: convert numbers, clock times, abbreviations and awkward punctuation
 * into fluid spoken English so speech engines don't stumble or read numbers mechanically.
 */
export const humanizeSpokenText = (text: string): string => {
  let cleaned = text;

  // Convert clock times
  cleaned = cleaned.replace(/\b19:00\b/g, 'seven PM');
  cleaned = cleaned.replace(/\b18:57\b/g, 'six fifty-seven PM');
  cleaned = cleaned.replace(/\b8:15\s*AM\b/gi, 'eight fifteen AM');
  cleaned = cleaned.replace(/\b8:15\b/g, 'eight fifteen');

  // Convert numbers & durations
  cleaned = cleaned.replace(/\b5\.5\s*hours\b/gi, 'five and a half hours');
  cleaned = cleaned.replace(/\b5\.5\b/g, 'five and a half');
  cleaned = cleaned.replace(/\btwo minutes\b/gi, 'two minutes');
  cleaned = cleaned.replace(/\bthree minutes\b/gi, 'three minutes');

  // Expand medical / clinical abbreviations
  cleaned = cleaned.replace(/\bHR\b/g, 'heart rate');
  cleaned = cleaned.replace(/\bHRV\b/g, 'heart rate variability');
  cleaned = cleaned.replace(/\bSpO2\b/g, 'blood oxygen');
  cleaned = cleaned.replace(/\bbpm\b/gi, 'beats per minute');
  cleaned = cleaned.replace(/\bms\b/g, 'milliseconds');
  cleaned = cleaned.replace(/\bDr\.\b/g, 'Doctor');
  cleaned = cleaned.replace(/\bapprox\.\b/g, 'approximately');
  cleaned = cleaned.replace(/\bmin\.\b/g, 'minutes');
  cleaned = cleaned.replace(/\bsec\.\b/g, 'seconds');

  // Smooth out ellipses to spaced dots for smoother phoneme transitions
  cleaned = cleaned.replace(/\.{3,}/g, '... ');

  return cleaned.trim();
};

/**
 * Smart voice scoring system for Alice (70yo female):
 * Prioritizes high-fidelity Neural, Natural, and Enhanced human voices.
 * Strongly filters out legacy mechanical robotic engines (Zira, generic desktop synthesizers).
 */
export const scoreVoiceForAlice = (voice: SpeechSynthesisVoice): number => {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();

  let score = 0;

  // English language preference
  if (lang.startsWith('en')) {
    score += 150;
    if (lang === 'en-us' || lang === 'en-gb') {
      score += 50;
    }
  } else {
    // Non-English gets heavy penalty unless no English exists
    score -= 400;
  }

  // 1. High-Definition Neural / Natural Cloud Voice keywords
  if (name.includes('natural')) score += 600;
  if (name.includes('neural')) score += 600;
  if (name.includes('online')) score += 350;
  if (name.includes('enhanced')) score += 450;
  if (name.includes('premium')) score += 450;

  // 2. Specific top lifelike female voices
  if (name.includes('jenny')) score += 500; // Microsoft Jenny Natural (Warm, empathetic)
  if (name.includes('aria')) score += 420;
  if (name.includes('sonia')) score += 400;
  if (name.includes('libby')) score += 400;
  if (name.includes('clara')) score += 380;
  if (name.includes('google uk english female')) score += 480;
  if (name.includes('google us english')) score += 360;
  if (name.includes('samantha')) score += 320;
  if (name.includes('victoria')) score += 350; // Victoria has great elder-appropriate warmth
  if (name.includes('karen')) score += 300;
  if (name.includes('moira')) score += 320;
  if (name.includes('fiona')) score += 300;
  if (name.includes('tessa')) score += 280;
  if (name.includes('serena')) score += 300;
  if (name.includes('hazel')) score += 280;
  if (name.includes('susan')) score += 270;
  if (name.includes('catherine')) score += 270;

  // Female indicator
  if (name.includes('female')) score += 180;

  // 3. Heavy Penalties for robotic / low quality synthesizers
  if (name.includes('desktop')) score -= 450; // Legacy Windows Desktop synth
  if (name.includes('zira')) score -= 550;    // Robotic mechanical voice
  if (name.includes('espeak')) score -= 700;  // Monotone robotic synth
  if (name.includes('robot')) score -= 700;

  // Male voice penalty for Alice
  const maleKeywords = ['male', 'david', 'george', 'mark', 'alex', 'guy', 'ryan', 'daniel', 'oliver', 'christopher'];
  if (maleKeywords.some((kw) => name.includes(kw)) && !name.includes('female')) {
    score -= 800;
  }

  return score;
};

/**
 * Smart voice scoring system for Agent (Clinical Healthcare Professional / Physician):
 * Prioritizes articulate, authoritative, warm, and professional neural voices.
 */
export const scoreVoiceForAgent = (voice: SpeechSynthesisVoice, excludeVoice?: SpeechSynthesisVoice | null): number => {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();

  if (excludeVoice && voice.name === excludeVoice.name) {
    return -999;
  }

  let score = 0;

  if (lang.startsWith('en')) {
    score += 150;
    if (lang === 'en-us' || lang === 'en-gb') {
      score += 50;
    }
  } else {
    score -= 400;
  }

  // Neural / Natural clarity
  if (name.includes('natural')) score += 600;
  if (name.includes('neural')) score += 600;
  if (name.includes('online')) score += 350;
  if (name.includes('enhanced')) score += 450;
  if (name.includes('premium')) score += 450;

  // Top physician / medical specialist voices
  // Microsoft Ryan / Guy / Christopher / Steffan Natural (Articulate, calm, reassuring doctor presence)
  if (name.includes('ryan')) score += 520;
  if (name.includes('guy')) score += 500;
  if (name.includes('christopher')) score += 490;
  if (name.includes('steffan')) score += 470;
  if (name.includes('andrew')) score += 460;
  if (name.includes('brian')) score += 450;
  if (name.includes('google uk english male')) score += 500;
  if (name.includes('google us english')) score += 420;
  if (name.includes('daniel')) score += 440; // Apple Daniel (Classic polished doctor tone)
  if (name.includes('oliver')) score += 430;
  if (name.includes('alex')) score += 400;
  if (name.includes('arthur')) score += 420;
  if (name.includes('aaron')) score += 380;
  if (name.includes('george')) score += 360;

  // If a neural female doctor voice is available (e.g. Sonia, Aria, Libby)
  if (name.includes('sonia') && name.includes('natural')) score += 450;
  if (name.includes('libby') && name.includes('natural')) score += 430;

  // Heavy penalties for robotic engines
  if (name.includes('desktop')) score -= 450;
  if (name.includes('david desktop')) score -= 550;
  if (name.includes('zira')) score -= 600;
  if (name.includes('espeak')) score -= 700;
  if (name.includes('robot')) score -= 700;

  return score;
};

/**
 * Select the highest scoring lifelike voices for Alice and Agent
 */
export const findBestVoices = (voices: SpeechSynthesisVoice[]): VoiceProfiles => {
  if (!voices || voices.length === 0) {
    return { aliceVoice: null, agentVoice: null };
  }

  // Sort candidate voices for Alice
  const sortedAlice = [...voices].sort((a, b) => scoreVoiceForAlice(b) - scoreVoiceForAlice(a));
  const aliceVoice = sortedAlice[0] || null;

  // Sort candidate voices for Agent (avoiding Alice's chosen voice)
  const sortedAgent = [...voices].sort(
    (a, b) => scoreVoiceForAgent(b, aliceVoice) - scoreVoiceForAgent(a, aliceVoice)
  );
  const agentVoice = sortedAgent[0] || sortedAlice[1] || voices[0] || null;

  return { aliceVoice, agentVoice };
};

/**
 * Breakdown text into natural prosodic phrase units with dynamic pitch, cadence, and breath pauses.
 * This completely eliminates the monotone "robot" drone and introduces human-like emotional contour.
 */
export const buildProsodicSegments = (
  rawText: string,
  role: 'alice' | 'agent'
): ProsodicSegment[] => {
  const humanized = humanizeSpokenText(rawText);

  // ==========================================
  // Role: Agent (Professional Physician / Doctor)
  // ==========================================
  if (role === 'agent') {
    // Split into sentences preserving trailing punctuations
    const rawSentences = humanized.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [humanized];
    const segments: ProsodicSegment[] = [];

    rawSentences.forEach((rawSentence) => {
      const s = rawSentence.trim();
      if (!s) return;

      const isQuestion = s.endsWith('?');

      // Break sentence down into conversational medical clauses
      const parts = s.split(/(,\s*|\.\.\.\s*|;\s*|\s+-\s+)/).filter(Boolean);

      let phraseAccumulator = '';
      const clauseList: Array<{ text: string; delimiter: string }> = [];

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (/^(,\s*|\.\.\.\s*|;\s*|\s+-\s+)$/.test(part)) {
          clauseList.push({
            text: phraseAccumulator.trim(),
            delimiter: part.trim(),
          });
          phraseAccumulator = '';
        } else {
          phraseAccumulator += (phraseAccumulator ? ' ' : '') + part;
        }
      }
      if (phraseAccumulator.trim()) {
        clauseList.push({
          text: phraseAccumulator.trim(),
          delimiter: '',
        });
      }

      clauseList.forEach((item, clauseIdx) => {
        const clauseText = item.text;
        if (!clauseText) return;

        const isFirstClause = clauseIdx === 0;
        const isLastClause = clauseIdx === clauseList.length - 1;
        const lower = clauseText.toLowerCase();

        let rate = 0.96;
        let pitch = 1.01;
        let pauseAfterMs = 200;

        // 1. Bedside manner & empathetic acknowledgment opener
        // e.g. "Great.", "That's very likely.", "Understood, Alice.", "Good evening, Alice."
        const isBedsideOpener =
          isFirstClause &&
          /^(great|that's very likely|understood|good evening|hello|certainly|indeed|i see)/i.test(
            clauseText
          );

        // 2. Clinical advice / Care instructions
        // e.g. "Please take it easy.", "Please check your prescription or doctor's advice.",
        //      "Just make sure if it needs to be taken with or without food.", "Please stay alert",
        //      "don't hesitate to contact your family or doctor"
        const isCareDirective =
          /^(please|just make sure|remember to|don't hesitate|be sure to|take it easy|stay alert)/i.test(
            lower
          ) || lower.includes("doctor's advice") || lower.includes('prescription') || lower.includes('feel unwell');

        // 3. Clinical telemetry / Diagnostic correlation data
        // e.g. "Your heart rate spiked a bit two minutes ago", "Your medication is scheduled for seven PM",
        //      "which is in three minutes", "Also, you only slept five and a half hours last night",
        //      "Lack of sleep can affect your vitals too", "I'll keep a record and a close eye on your vitals"
        const isClinicalTelemetry =
          lower.includes('heart rate') ||
          lower.includes('medication') ||
          lower.includes('scheduled') ||
          lower.includes('slept') ||
          lower.includes('vitals') ||
          lower.includes('spiked') ||
          lower.includes('record');

        if (isBedsideOpener) {
          // Warm, empathetic bedside tone
          pitch = 1.06;
          rate = 0.94;
          pauseAfterMs = 280;
        } else if (isQuestion && isLastClause) {
          // Physician diagnostic inquiry: natural rising pitch
          pitch = 1.12;
          rate = 0.95;
          pauseAfterMs = 380;
        } else if (isCareDirective) {
          // Attentive, caring doctor instruction: measured cadence so patient absorbs guidance
          pitch = 1.04;
          rate = 0.93;
          pauseAfterMs = isLastClause ? 420 : 250;
        } else if (isClinicalTelemetry) {
          // Authoritative, clear, objective diagnostic observation
          pitch = 1.01;
          rate = 0.97;
          pauseAfterMs = 190;
        } else if (isLastClause) {
          // Concluding reassuring statement: gentle settling of pitch & relaxed deceleration
          pitch = 0.96;
          rate = 0.91;
          pauseAfterMs = 420; // Natural breath interval between sentences
        } else {
          // Conversational flow
          pitch = 1.02;
          rate = 0.96;
          pauseAfterMs = 180;
        }

        segments.push({
          text: clauseText + (item.delimiter && !item.delimiter.includes('...') ? item.delimiter : ''),
          rate,
          pitch,
          pauseAfterMs,
        });
      });
    });

    return segments.length > 0
      ? segments
      : [{ text: humanized, rate: 0.96, pitch: 1.02, pauseAfterMs: 350 }];
  }

  // ==========================================
  // Role: Alice (70-year-old female patient)
  // ==========================================
  // Human prosody:
  // - Warm greeting/concern opener: slightly higher pitch (1.06), gentle onset (0.94x)
  // - Comma breath pause: 160-220ms
  // - Rising intonation on questions: pitch climbs to 1.10 - 1.14
  // - Descriptive clauses: comfortable conversational pace (0.91x - 0.93x), pitch ~0.98
  // - Thoughtful ellipses: warm reflection, pause 450ms
  // - Concluding sentence resolution: pitch gently settles to 0.91, rate softens to 0.89x

  const rawSentences = humanized.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [humanized];
  const segments: ProsodicSegment[] = [];

  rawSentences.forEach((rawSentence) => {
    const s = rawSentence.trim();
    if (!s) return;

    const isQuestion = s.endsWith('?');

    // Split sentence into clauses by commas, semicolons, dashes, and ellipses
    // e.g. "Oh dear... Could it be because I haven't taken my medicine yet?"
    const parts = s.split(/(,\s*|\.\.\.\s*|;\s*|\s+-\s+)/).filter(Boolean);

    let phraseAccumulator = '';
    const clauseList: Array<{ text: string; delimiter: string }> = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (/^(,\s*|\.\.\.\s*|;\s*|\s+-\s+)$/.test(part)) {
        clauseList.push({
          text: phraseAccumulator.trim(),
          delimiter: part.trim(),
        });
        phraseAccumulator = '';
      } else {
        phraseAccumulator += (phraseAccumulator ? ' ' : '') + part;
      }
    }
    if (phraseAccumulator.trim()) {
      clauseList.push({
        text: phraseAccumulator.trim(),
        delimiter: '',
      });
    }

    // Assign tailored prosody to each clause in the sentence
    clauseList.forEach((item, clauseIdx) => {
      const clauseText = item.text;
      if (!clauseText) return;

      const isFirstClause = clauseIdx === 0;
      const isLastClause = clauseIdx === clauseList.length - 1;
      const hasEllipsis = item.delimiter.includes('...') || clauseText.includes('...');
      const hasComma = item.delimiter.includes(',');

      let rate = 0.92;
      let pitch = 0.98;
      let pauseAfterMs = 180;

      // 1. Emotional openers ("Oh dear", "Oh, thank you dear", "A notification popped up")
      const isEmotionalOpener =
        isFirstClause &&
        /^(oh|dear|well|yes|thank you|hello|a notification)/i.test(clauseText);

      if (isEmotionalOpener) {
        pitch = 1.06;
        rate = 0.94;
        pauseAfterMs = hasEllipsis ? 450 : hasComma ? 220 : 250;
      } else if (isQuestion && isLastClause) {
        // 2. Question clause: natural rising inflection
        pitch = 1.12; // Natural upward curve at end of question
        rate = 0.93;
        pauseAfterMs = 380;
      } else if (isLastClause) {
        // 3. Concluding resolution: gentle deceleration & pitch lowering
        pitch = 0.91; // Warm gentle settling
        rate = 0.89; // Relaxed cadence without robotic dragging
        pauseAfterMs = 400; // Sentence-ending breath
      } else if (hasEllipsis) {
        // 4. Cognitive reflection / hesitation
        pitch = 1.02;
        rate = 0.88;
        pauseAfterMs = 500;
      } else {
        // 5. Middle descriptive flow
        pitch = 0.97;
        rate = 0.91;
        pauseAfterMs = hasComma ? 170 : 200;
      }

      segments.push({
        text: clauseText + (item.delimiter && !item.delimiter.includes('...') ? item.delimiter : ''),
        rate,
        pitch,
        pauseAfterMs,
      });
    });
  });

  return segments.length > 0
    ? segments
    : [{ text: humanized, rate: 0.92, pitch: 0.98, pauseAfterMs: 350 }];
};

/**
 * Natural Prosodic Speech Engine
 * Speaks a turn by traversing prosodic segments with realistic human breath intervals.
 */
export const playNaturalTurn = (
  item: { sender: 'alice' | 'agent'; text: string; time?: string; speakerLabel?: string },
  voices: VoiceProfiles,
  onStart: () => void,
  onEnd: () => void,
  isCancelled: () => boolean
) => {
  if (!isTTSSupported()) {
    onEnd();
    return;
  }

  primeAudioContext();

  window.speechSynthesis.cancel();

  const selectedVoice =
    item.sender === 'alice' ? voices.aliceVoice : voices.agentVoice;

  const segments = buildProsodicSegments(item.text, item.sender);
  if (segments.length === 0) {
    onEnd();
    return;
  }

  onStart();

  let currentSegmentIdx = 0;
  let segmentPauseTimer: NodeJS.Timeout | null = null;

  const playNextSegment = () => {
    if (isCancelled() || currentSegmentIdx >= segments.length) {
      if (segmentPauseTimer) clearTimeout(segmentPauseTimer);
      onEnd();
      return;
    }

    const seg = segments[currentSegmentIdx];
    const utterance = new SpeechSynthesisUtterance(seg.text);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = seg.rate;
    utterance.pitch = seg.pitch;
    utterance.volume = 1.0;

    utterance.onend = () => {
      if (isCancelled()) {
        onEnd();
        return;
      }

      currentSegmentIdx++;
      if (currentSegmentIdx >= segments.length) {
        onEnd();
      } else {
        // Insert realistic human breath / cognitive pause
        segmentPauseTimer = setTimeout(() => {
          if (!isCancelled()) {
            playNextSegment();
          }
        }, seg.pauseAfterMs);
      }
    };

    utterance.onerror = (e) => {
      console.warn('Utterance segment error:', e);
      if (!isCancelled()) {
        currentSegmentIdx++;
        playNextSegment();
      } else {
        onEnd();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  playNextSegment();
};
