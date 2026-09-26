import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Mic,
  Volume2,
  VolumeX,
  Heart,
  Bell,
  AlertTriangle,
  ChevronUp,
  Send,
  Activity,
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
  MessageSquareOff,
  Clock,
  Navigation,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  Pill,
  Play,
  Pause,
  Square,
  Sliders,
  Sparkles,
  Check,
  Stethoscope,
  User,
} from 'lucide-react';
import { VitalData, CaregiverContextItem } from '../types';
import {
  isTTSSupported,
  findBestVoices,
  playNaturalTurn,
  scoreVoiceForAlice,
  scoreVoiceForAgent,
  VoiceProfiles,
  primeAudioContext,
} from '../utils/speechTts';

interface VoiceTalkBlockProps {
  data: VitalData;
  onClose: () => void;
  onHide: () => void;
  aliceAgreedToShare?: boolean;
  onToggleAliceAgree?: () => void;
  caregiverContexts?: CaregiverContextItem[];
  onSwitchToBob?: () => void;
}

interface ScriptDialogueItem {
  sender: 'alice' | 'agent';
  speakerLabel: string;
  text: string;
  timestamp: string;
}

// Elderly conversational cadence: paced gently with 20–34s pauses between turns
// Spans from 18:57:08 to 19:00:18, matching the 19:00 medication schedule
export const ELDERLY_TALK_SCRIPT: ScriptDialogueItem[] = [
  {
    sender: 'alice',
    speakerLabel: 'Alice (Watch Mic)',
    text: 'A notification just popped up. Is everything okay?',
    timestamp: '18:57:08',
  },
  {
    sender: 'agent',
    speakerLabel: 'Agent (Voice Stream)',
    text: 'Your heart rate spiked a bit two minutes ago. Please take it easy.',
    timestamp: '18:57:28',
  },
  {
    sender: 'alice',
    speakerLabel: 'Alice (Watch Mic)',
    text: "Oh dear... Could it be because I haven't taken my medicine yet? I think I saw a reminder earlier.",
    timestamp: '18:57:56',
  },
  {
    sender: 'agent',
    speakerLabel: 'Agent (Voice Stream)',
    text: "That's very likely. Your medication is scheduled for 19:00, which is in three minutes. Also, you only slept 5.5 hours last night. Lack of sleep can affect your vitals too.",
    timestamp: '18:58:28',
  },
  {
    sender: 'alice',
    speakerLabel: 'Alice (Watch Mic)',
    text: 'Should I take my pill right now, then?',
    timestamp: '18:59:02',
  },
  {
    sender: 'agent',
    speakerLabel: 'Agent (Voice Stream)',
    text: "Please check your prescription or doctor's advice. Just make sure if it needs to be taken with or without food.",
    timestamp: '18:59:26',
  },
  {
    sender: 'alice',
    speakerLabel: 'Alice (Watch Mic)',
    text: 'I just finished my dinner, so I should be good to take it.',
    timestamp: '18:59:50',
  },
  {
    sender: 'agent',
    speakerLabel: 'Agent (Voice Stream)',
    text: "Great. Once you take it, I'll keep a record and a close eye on your vitals. Please stay alert, and don't hesitate to contact your family or doctor if you feel unwell.",
    timestamp: '19:00:18',
  },
];

/**
 * Determine the exact dialogue turn to jump to based on watch timestamp
 */
export const getTargetTimestampForTime = (time: string): string | null => {
  if (time === '18:54' || time === '18:55') {
    return null; // Empty channel
  }
  if (time === '18:56' || time === '18:57') {
    return '18:57:08';
  }
  if (time === '18:58') {
    return '18:58:28';
  }
  if (time === '18:59') {
    return '18:59:02'; // Exactly 18:59:02 as requested
  }
  if (time === '19:00' || time === '19:01' || time === '19:02') {
    return '19:00:18';
  }
  const match = ELDERLY_TALK_SCRIPT.find((item) => item.timestamp.startsWith(time));
  return match ? match.timestamp : '18:57:08';
};

export const VoiceTalkBlock: React.FC<VoiceTalkBlockProps> = ({
  data,
  onClose,
  onHide,
  aliceAgreedToShare = true,
  onToggleAliceAgree,
  caregiverContexts = [],
  onSwitchToBob,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAbnormal = data.cardColor === 'pink';
  const isPreAlert = data.time === '18:54' || data.time === '18:55';

  // Return empty messages for 18:54 & 18:55; return elderly-paced script for timestamps after 18:56
  const buildInitialMessages = (timeStr: string) => {
    if (timeStr === '18:54' || timeStr === '18:55') {
      return [];
    }
    return ELDERLY_TALK_SCRIPT.map((item) => ({
      sender: item.sender,
      speakerLabel: item.speakerLabel,
      text: item.text,
      time: item.timestamp,
    }));
  };

  const [messages, setMessages] = useState<
    Array<{ sender: 'alice' | 'agent'; speakerLabel: string; text: string; time: string }>
  >(() => buildInitialMessages(data.time));

  const [focusedTimestamp, setFocusedTimestamp] = useState<string | null>(() =>
    getTargetTimestampForTime(data.time)
  );
  const [justJumped, setJustJumped] = useState<boolean>(false);

  const [inputVal, setInputVal] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Text-To-Speech (TTS) Engine States
  const [voices, setVoices] = useState<VoiceProfiles>({ aliceVoice: null, agentVoice: null });
  const [allAvailableVoices, setAllAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [tuningTab, setTuningTab] = useState<'alice' | 'agent'>('agent');
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isPausedTTS, setIsPausedTTS] = useState(false);
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<number | null>(null);
  const [currentSpeakingRole, setCurrentSpeakingRole] = useState<'alice' | 'agent' | null>(null);

  const ttsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);

  // Initialize SpeechSynthesis Voices with Natural Prosody Priority
  useEffect(() => {
    if (!isTTSSupported()) return;

    const updateVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length > 0) {
        setAllAvailableVoices(list);
        const best = findBestVoices(list);
        
        // Restore custom preferences from localStorage
        const savedAliceName = localStorage.getItem('alice_selected_voice');
        if (savedAliceName) {
          const customAliceVoice = list.find((v) => v.name === savedAliceName);
          if (customAliceVoice) {
            best.aliceVoice = customAliceVoice;
          }
        }
        const savedAgentName = localStorage.getItem('agent_selected_voice');
        if (savedAgentName) {
          const customAgentVoice = list.find((v) => v.name === savedAgentName);
          if (customAgentVoice) {
            best.agentVoice = customAgentVoice;
          }
        }

        setVoices(best);
      }
    };

    updateVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (isTTSSupported()) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop active TTS audio stream
  const stopTTS = useCallback(() => {
    if (ttsTimeoutRef.current) {
      clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = null;
    }
    isPlayingRef.current = false;
    if (isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTTS(false);
    setIsPausedTTS(false);
    setCurrentSpeakingIndex(null);
    setCurrentSpeakingRole(null);
  }, []);

  // Speak a dialogue turn with lifelike prosodic contours, dynamic pitch, and respiratory phrasing
  const speakTurn = useCallback((
    item: { sender: 'alice' | 'agent'; text: string; time?: string },
    index: number,
    onFinish: () => void
  ) => {
    if (!isTTSSupported()) {
      onFinish();
      return;
    }

    primeAudioContext();

    playNaturalTurn(
      item,
      voices,
      () => {
        setCurrentSpeakingIndex(index);
        setCurrentSpeakingRole(item.sender);
      },
      () => {
        onFinish();
      },
      () => !isPlayingRef.current
    );
  }, [voices]);

  // Preview Alice's voice with a sample sentence demonstrating dynamic prosody
  const handlePreviewAliceVoice = (voiceToTest?: SpeechSynthesisVoice) => {
    if (!isTTSSupported()) return;
    stopTTS();
    isPlayingRef.current = true;
    setIsPlayingTTS(true);
    setCurrentSpeakingRole('alice');

    const testProfiles: VoiceProfiles = {
      aliceVoice: voiceToTest || voices.aliceVoice,
      agentVoice: voices.agentVoice,
    };

    playNaturalTurn(
      {
        sender: 'alice',
        text: "Oh, thank you dear. I did feel a bit lightheaded when getting out of bed, but I'm feeling steady now.",
        speakerLabel: 'Alice (Watch Mic)',
        time: data.time,
      },
      testProfiles,
      () => {},
      () => {
        isPlayingRef.current = false;
        setIsPlayingTTS(false);
        setCurrentSpeakingRole(null);
      },
      () => !isPlayingRef.current
    );
  };

  const handleSelectAliceVoice = (voiceName: string) => {
    const selected = allAvailableVoices.find((v) => v.name === voiceName);
    if (selected) {
      setVoices((prev) => ({ ...prev, aliceVoice: selected }));
      try {
        localStorage.setItem('alice_selected_voice', selected.name);
      } catch {
        // Ignore local storage error
      }
      handlePreviewAliceVoice(selected);
    }
  };

  // Preview Agent's voice with a sample clinical phrase demonstrating physician prosody
  const handlePreviewAgentVoice = (voiceToTest?: SpeechSynthesisVoice) => {
    if (!isTTSSupported()) return;
    stopTTS();
    isPlayingRef.current = true;
    setIsPlayingTTS(true);
    setCurrentSpeakingRole('agent');

    const testProfiles: VoiceProfiles = {
      aliceVoice: voices.aliceVoice,
      agentVoice: voiceToTest || voices.agentVoice,
    };

    playNaturalTurn(
      {
        sender: 'agent',
        text: "That's very likely, Alice. Your heart rate spiked a bit two minutes ago, but please take it easy. Once you take your scheduled medication, I will keep a close eye on your vitals.",
        speakerLabel: 'Agent (Physician Voice)',
        time: data.time,
      },
      testProfiles,
      () => {},
      () => {
        isPlayingRef.current = false;
        setIsPlayingTTS(false);
        setCurrentSpeakingRole(null);
      },
      () => !isPlayingRef.current
    );
  };

  const handleSelectAgentVoice = (voiceName: string) => {
    const selected = allAvailableVoices.find((v) => v.name === voiceName);
    if (selected) {
      setVoices((prev) => ({ ...prev, agentVoice: selected }));
      try {
        localStorage.setItem('agent_selected_voice', selected.name);
      } catch {
        // Ignore local storage error
      }
      handlePreviewAgentVoice(selected);
    }
  };

  // Sequential queue playback through dialog turns
  const playQueueFromIndex = useCallback((
    queue: Array<{ sender: 'alice' | 'agent'; speakerLabel: string; text: string; time: string }>,
    startIndex = 0
  ) => {
    if (!isTTSSupported() || queue.length === 0) return;

    stopTTS();
    isPlayingRef.current = true;
    setIsPlayingTTS(true);
    setIsPausedTTS(false);

    const playNext = (idx: number) => {
      if (!isPlayingRef.current || idx >= queue.length) {
        isPlayingRef.current = false;
        setIsPlayingTTS(false);
        setIsPausedTTS(false);
        setCurrentSpeakingIndex(null);
        setCurrentSpeakingRole(null);
        return;
      }

      const item = queue[idx];
      setFocusedTimestamp(item.time);

      // Smoothly bring the active spoken message into view
      const elId = `dialogue-msg-${item.time.replace(/:/g, '-')}`;
      const targetEl = document.getElementById(elId);
      targetEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      speakTurn(item, idx, () => {
        if (!isPlayingRef.current) return;
        // Natural conversational pause between Alice and Agent (550ms)
        ttsTimeoutRef.current = setTimeout(() => {
          if (isPlayingRef.current) {
            playNext(idx + 1);
          }
        }, 550);
      });
    };

    playNext(startIndex);
  }, [speakTurn, stopTTS]);

  // Play an individual dialogue message on demand
  const playSingleMessage = useCallback((
    msg: { sender: 'alice' | 'agent'; speakerLabel: string; text: string; time: string },
    index: number
  ) => {
    stopTTS();
    isPlayingRef.current = true;
    setIsPlayingTTS(true);
    setIsPausedTTS(false);
    setFocusedTimestamp(msg.time);

    speakTurn(msg, index, () => {
      isPlayingRef.current = false;
      setIsPlayingTTS(false);
      setCurrentSpeakingIndex(null);
      setCurrentSpeakingRole(null);
    });
  }, [speakTurn, stopTTS]);

  // Pause / Resume TTS speech
  const togglePauseResume = useCallback(() => {
    if (!isTTSSupported()) return;
    if (isPausedTTS) {
      window.speechSynthesis.resume();
      setIsPausedTTS(false);
    } else {
      window.speechSynthesis.pause();
      setIsPausedTTS(true);
    }
  }, [isPausedTTS]);

  // Jump to specific message timestamp with smooth scrolling and high-visibility focus
  const jumpToTimestamp = useCallback((targetTimestamp: string) => {
    setFocusedTimestamp(targetTimestamp);
    setJustJumped(true);

    const performScroll = () => {
      const elId = `dialogue-msg-${targetTimestamp.replace(/:/g, '-')}`;
      const targetEl = document.getElementById(elId);
      const container = scrollContainerRef.current;

      if (targetEl && container) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const currentScroll = container.scrollTop;
        const targetOffset =
          targetRect.top - containerRect.top + currentScroll - container.clientHeight / 2 + targetRect.height / 2;

        container.scrollTo({
          top: Math.max(0, targetOffset),
          behavior: 'smooth',
        });
      }
    };

    // Staggered frames to ensure smooth scrolling after DOM renders
    requestAnimationFrame(() => {
      performScroll();
      setTimeout(performScroll, 50);
      setTimeout(performScroll, 160);
    });

    // Remove flash pulse after 3.5 seconds
    const timer = setTimeout(() => {
      setJustJumped(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  // Whenever watch snapshot changes or "Click to Talk" is clicked, load script, jump, and trigger TTS if content exists
  useEffect(() => {
    const newMessages = buildInitialMessages(data.time);
    setMessages(newMessages);
    const target = getTargetTimestampForTime(data.time);

    if (target && newMessages.length > 0) {
      const scrollTimer = setTimeout(() => {
        jumpToTimestamp(target);
      }, 70);

      // Trigger TTS voice playback when chat has content
      const targetIndex = newMessages.findIndex((m) => m.time === target);
      const startIndex = targetIndex >= 0 ? targetIndex : 0;

      const audioTimer = setTimeout(() => {
        playQueueFromIndex(newMessages, startIndex);
      }, 250);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(audioTimer);
        stopTTS();
      };
    } else {
      setFocusedTimestamp(null);
      stopTTS();
    }
  }, [data.time, data._talkClickId, jumpToTimestamp, playQueueFromIndex, stopTTS]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputVal.trim();
    if (!text) return;

    stopTTS();

    const userMsg = {
      sender: 'alice' as const,
      speakerLabel: 'Alice (Watch Mic)',
      text,
      time: `${data.time}:${new Date().getSeconds().toString().padStart(2, '0')}`,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');

    // Speak Alice's message using Alice's 70yo voice
    speakTurn(userMsg, messages.length, () => {});

    // When ad-hoc message is sent, scroll to bottom to view new input
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    // Simulate agent voice response with elderly-friendly conversational timing
    setIsSpeaking(true);
    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();
      if (lower.includes('medicine') || lower.includes('pill') || lower.includes('took')) {
        reply =
          "I have recorded that you took your evening medication. I will track your resting heart rate over the next 10 minutes to verify stabilization.";
      } else if (lower.includes('water') || lower.includes('drink')) {
        reply =
          "Staying hydrated is very important for cardiac regulation. Please sit calmly and let me know if any dizziness occurs.";
      } else {
        reply =
          "Understood, Alice. The semantic clinical record has been updated. I am continuously monitoring your telemetry.";
      }

      const agentMsg = {
        sender: 'agent' as const,
        speakerLabel: 'Agent (Voice Stream)',
        text: reply,
        time: `${data.time}:${(new Date().getSeconds() + 20) % 60 < 10 ? '0' : ''}${(new Date().getSeconds() + 20) % 60}`,
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsSpeaking(false);

      // Speak Agent's message using Agent's neutral voice
      speakTurn(agentMsg, messages.length + 1, () => {});

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }, 1200);
  };

  const handleSimulateVoiceInput = () => {
    handleSend("I took the pill with a full glass of water, feeling comfortable now.");
  };

  const handleReplayScript = () => {
    stopTTS();
    setIsSpeaking(true);
    const initial = buildInitialMessages(data.time);
    setMessages(initial);
    setTimeout(() => {
      setIsSpeaking(false);
      const target = getTargetTimestampForTime(data.time);
      if (target) {
        jumpToTimestamp(target);
        if (initial.length > 0) {
          playQueueFromIndex(initial, 0);
        }
      }
    }, 400);
  };

  const handleSafeClose = () => {
    stopTTS();
    onClose();
  };

  const handleSafeHide = () => {
    stopTTS();
    onHide();
  };

  return (
    <section
      ref={sectionRef}
      id="voice-talk-block"
      aria-label="Active Voice & Clinical Context Channel"
      className="w-full bg-[#10141d] text-white border-t border-b border-neutral-700/80 shadow-xl transition-all duration-300 relative overflow-hidden"
    >
      {/* 1. Header Bar with Patient Summary, Voice Stream Status & Controls */}
      <div className="bg-[#0b0e14] px-4 sm:px-6 py-2.5 sm:py-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Patient and Watch Snapshot Info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 flex items-center justify-center font-medium text-xs font-mono">
            HW
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[14px] sm:text-[15px] font-semibold text-white">
                Voice &amp; Context Channel
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
                {data.time}:00 UTC
              </span>
              {isPreAlert ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800/90 text-neutral-400 border border-neutral-700 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>STANDBY • NO CALL</span>
                </span>
              ) : isAbnormal ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700/80 flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  <span>ALERT ACTIVE</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800/90 text-neutral-300 border border-neutral-700 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>CALL RECORDED</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center space-x-2 font-mono mt-0.5">
              <span>Patient: Alice Smith (70, F)</span>
              <span>•</span>
              <span className="text-emerald-400">Watch HW-BLE-01</span>
              <span>•</span>
              <span className={isAbnormal ? 'text-rose-400 font-semibold' : 'text-neutral-300'}>
                HR: {data.restingHr} bpm
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live TTS Stream & Interactive Audio Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isPreAlert ? (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs">
              <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
              <span className="text-neutral-400 text-[11px] font-mono">
                Standby • Channel Idle (No Dialogue at {data.time} UTC)
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs">
              <Volume2
                className={`w-3.5 h-3.5 ${
                  isPlayingTTS && !isPausedTTS
                    ? 'text-[#05ff2b] animate-pulse'
                    : 'text-emerald-400'
                }`}
              />
              <span className="text-neutral-200 text-[11px] font-mono">
                {isPlayingTTS && !isPausedTTS ? (
                  <span>
                    TTS Speaking:{' '}
                    <strong className="text-[#05ff2b]">
                      {currentSpeakingRole === 'alice'
                        ? 'Alice (70yo Senior • Lifelike Prosody)'
                        : 'Agent (Physician Persona • Clinical Prosody)'}
                    </strong>
                  </span>
                ) : isPausedTTS ? (
                  <span className="text-amber-300">TTS Paused</span>
                ) : (
                  <span>TTS: Alice (70yo Senior) • Agent (Physician Prosody)</span>
                )}
              </span>

              {/* Dynamic Equalizer Bars */}
              <div className="flex items-center space-x-1 h-3.5 ml-1">
                {[4, 12, 8, 16, 6, 14, 10, 18, 7, 13, 9].map((height, i) => (
                  <span
                    key={i}
                    className="w-0.5 sm:w-1 bg-[#05ff2b] rounded-full transition-all duration-300"
                    style={{
                      height: isPlayingTTS && !isPausedTTS ? `${height}px` : '4px',
                      opacity: isPlayingTTS && !isPausedTTS ? 1 : 0.35,
                    }}
                  />
                ))}
              </div>

              {/* Voice Persona Tuning Button */}
              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                className="ml-1 pl-1.5 border-l border-neutral-700 flex items-center space-x-1.5 text-neutral-300 hover:text-white text-[10px] font-mono transition cursor-pointer py-0.5"
                title="Open Voice Persona Settings for Alice and Physician Agent"
              >
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-neutral-400 hidden sm:inline">Voice Tuning:</span>
                <span className="text-emerald-300 font-medium truncate max-w-[130px]">
                  Alice &amp; Doctor
                </span>
                <Sliders className="w-2.5 h-2.5 text-neutral-400" />
              </button>

              {/* TTS Playback Controls */}
              {isPlayingTTS ? (
                <div className="flex items-center space-x-1 ml-1 pl-1.5 border-l border-neutral-700">
                  <button
                    type="button"
                    onClick={togglePauseResume}
                    className="p-1 px-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-mono flex items-center space-x-1 cursor-pointer transition"
                    title={isPausedTTS ? 'Resume speech' : 'Pause speech'}
                  >
                    {isPausedTTS ? (
                      <Play className="w-3 h-3 text-[#05ff2b]" />
                    ) : (
                      <Pause className="w-3 h-3 text-amber-400" />
                    )}
                    <span>{isPausedTTS ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopTTS}
                    className="p-1 px-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-rose-300 text-[10px] font-mono flex items-center space-x-1 cursor-pointer transition"
                    title="Stop TTS voice playback"
                  >
                    <Square className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
                    <span>Stop</span>
                  </button>
                </div>
              ) : (
                messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => playQueueFromIndex(messages, 0)}
                    className="ml-1 pl-1.5 border-l border-neutral-700 text-emerald-300 hover:text-emerald-200 text-[10px] font-mono flex items-center space-x-1 cursor-pointer transition"
                    title="Play entire dialogue via TTS"
                  >
                    <Play className="w-3 h-3 text-[#05ff2b]" />
                    <span>Play Audio</span>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Right: Reset Script, Hide & Close Actions */}
        <div className="flex items-center space-x-2">
          {!isPreAlert && (
            <button
              id="replay-script-btn"
              type="button"
              onClick={handleReplayScript}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-emerald-300 border border-neutral-700/80 text-xs font-medium transition cursor-pointer"
              title="Reset to original script and replay audio"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset &amp; Play</span>
            </button>
          )}
          <button
            id="hide-talk-block-btn"
            type="button"
            onClick={handleSafeHide}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 text-xs font-medium transition cursor-pointer"
            title="Hide this talk block (can be unhidden anytime)"
          >
            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            <span>Hide</span>
          </button>
          <button
            id="close-talk-block-btn"
            type="button"
            onClick={handleSafeClose}
            className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 border border-neutral-700/80 transition cursor-pointer"
            title="Close conversation session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Family Caregiver Access & Agree Button Section */}
      <div
        id="family-sharing-agreement-strip"
        className="px-4 sm:px-6 py-2.5 bg-[#090d14] border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-blue-400">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">
                Family Sharing Channel: Bob Smith (Alice's Son)
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                  aliceAgreedToShare
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}
              >
                {aliceAgreedToShare ? 'STATUS: AGREE / AUTHORIZED' : 'STATUS: CONSENT REQUIRED'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
              {aliceAgreedToShare
                ? "Alice has agreed to share her health situation. Bob can talk with the Agent to understand her heart rate, vitals, and medication adherence."
                : "Bob cannot discuss Alice's health situation with the Agent until Alice clicks Agree on this device."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            id="alice-agree-share-btn"
            type="button"
            onClick={onToggleAliceAgree}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-sans transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
              aliceAgreedToShare
                ? 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-600'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
            }`}
            title="Click to toggle Alice's agreement to share health situation with Bob Smith"
          >
            {aliceAgreedToShare ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>✓ Alice Agreed to Share (Click to Revoke)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Agree to Share Health Situation with Bob</span>
              </>
            )}
          </button>

          {onSwitchToBob && (
            <button
              id="switch-to-bob-from-voice-btn"
              type="button"
              onClick={onSwitchToBob}
              className="px-3 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-700/80 text-xs font-medium transition cursor-pointer flex items-center space-x-1"
              title="Switch to Bob's independent caregiver channel"
            >
              <span>Open Bob's Channel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Timeline Jump Navigation Strip */}
      <div
        id="timeline-jump-strip"
        className="px-4 sm:px-6 py-2 bg-[#080b10] border-b border-neutral-800/90 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono"
      >
        <div className="flex items-center space-x-2 text-neutral-400">
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-neutral-300 font-medium">Dialogue Jump:</span>
          {focusedTimestamp ? (
            <span className="text-emerald-300 font-semibold bg-emerald-950/70 border border-emerald-600/40 px-2 py-0.5 rounded">
              Focused on {focusedTimestamp} UTC
              {data.time === '18:59' && ' (Alice asks about taking pill)'}
            </span>
          ) : (
            <span className="text-neutral-500">Standby (No Dialogue at {data.time} UTC)</span>
          )}
        </div>

        {!isPreAlert && (
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] text-neutral-500 hidden md:inline">Jump to turn:</span>
            {[
              { ts: '18:57:08', label: '18:57:08 Check-in' },
              { ts: '18:58:28', label: '18:58:28 19:00 Med' },
              { ts: '18:59:02', label: '18:59:02 Taking Pill' },
              { ts: '19:00:18', label: '19:00:18 Adherence' },
            ].map((turn) => {
              const isActive = focusedTimestamp === turn.ts;
              return (
                <button
                  key={turn.ts}
                  type="button"
                  onClick={() => jumpToTimestamp(turn.ts)}
                  className={`px-2 py-1 rounded text-[11px] border transition cursor-pointer font-mono whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 font-bold shadow-[0_0_10px_rgba(52,211,153,0.35)]'
                      : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-700/60'
                  }`}
                  title={`Jump to ${turn.ts} dialogue`}
                >
                  {turn.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Main Content Grid (Biometric Snapshot sidebar + Conversation Transcript) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
        {/* Left Col: Biometric & Clinical Telemetry Context */}
        <div className="p-3.5 sm:p-4 bg-[#0d1017] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-neutral-400 pb-2 border-b border-neutral-800/80 text-[11px]">
            <span className="font-semibold text-neutral-300 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>TELEMETRY CONTEXT</span>
            </span>
            <span>{data.time}</span>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-xs ${
              isAbnormal
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
            }`}
          >
            <div className="flex items-center space-x-1.5 font-semibold mb-1">
              {isAbnormal ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Heart className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{isAbnormal ? 'Cardiac Elevation Flag' : 'Biometrics Nominal'}</span>
            </div>
            <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
              {isAbnormal
                ? `Resting HR elevated at ${data.restingHr} bpm. Verbal check-in underway regarding sleep deficiency (${data.avgSleep} hrs) and impending 19:00 medication.`
                : isPreAlert
                ? `Baseline vitals steady at ${data.restingHr} bpm. Autonomous loop is in passive background monitoring mode. No voice check-in triggered yet.`
                : data.time === '18:59'
                ? `Resting HR recovered to ${data.restingHr} bpm. Verbal inquiry active regarding 19:00 medication schedule and meal intake.`
                : `Resting HR steady at ${data.restingHr} bpm, HRV ${data.hrv} ms, SpO2 ${data.spo2}%. 19:00 medication window active.`}
            </p>
          </div>

          {/* Quick Biometrics Rows */}
          <div className="space-y-1.5 text-[11px] text-neutral-300">
            <div className="flex justify-between py-1 px-2 rounded bg-neutral-900/80 border border-neutral-800">
              <span className="text-neutral-400">Resting HR:</span>
              <span className="font-semibold text-white">{data.restingHr} bpm</span>
            </div>
            <div className="flex justify-between py-1 px-2 rounded bg-neutral-900/80 border border-neutral-800">
              <span className="text-neutral-400">Heart Rate Variability:</span>
              <span className="font-semibold text-white">{data.hrv} ms</span>
            </div>
            <div className="flex justify-between py-1 px-2 rounded bg-neutral-900/80 border border-neutral-800">
              <span className="text-neutral-400">Blood Oxygen (SpO2):</span>
              <span className="font-semibold text-white">{data.spo2}%</span>
            </div>
            <div className="flex justify-between py-1 px-2 rounded bg-neutral-900/80 border border-neutral-800">
              <span className="text-neutral-400">Last Night Sleep:</span>
              <span className="font-semibold text-amber-300">{data.avgSleep.toFixed(1)} Hrs (Deficit)</span>
            </div>
          </div>

          {data.reminder && (
            <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] flex items-center space-x-2">
              <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{data.reminder}</span>
            </div>
          )}

          {caregiverContexts && caregiverContexts.length > 0 && (
            <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/60 text-blue-200 text-[11px] space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-blue-300">
                <Pill className="w-3.5 h-3.5 text-blue-400" />
                <span>Memory &amp; Context from Bob (Son)</span>
              </div>
              <div className="space-y-1 font-sans text-neutral-200 text-[10.5px]">
                {caregiverContexts.slice(0, 3).map((ctx) => (
                  <div key={ctx.id} className="flex items-start space-x-1">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{ctx.title} {ctx.time ? `(${ctx.time} UTC)` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 text-[10px] text-neutral-500 font-sans border-t border-neutral-800">
            Elderly Voice Cadence: Paced with gentle 20-30s intervals for patient comprehension and low cognitive load.
          </div>
        </div>

        {/* Right Col: Conversation Transcript (Scripted Voice Dialogue) + Voice Input Bar */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-[#0e1219]">
          {/* Messages Scroll Area with precise ref for jumping */}
          <div
            ref={scrollContainerRef}
            id="voice-messages-scroll"
            className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[340px] select-text scroll-smooth"
          >
            {messages.length === 0 ? (
              /* Empty state for 18:54 and 18:55 as requested */
              <div
                id="voice-empty-state"
                className="flex flex-col items-center justify-center py-12 px-4 text-center select-none space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-neutral-900/90 border border-neutral-800 flex items-center justify-center text-neutral-500">
                  <MessageSquareOff className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-sm font-medium text-neutral-200 font-sans">
                    No Voice Dialogue Recorded at {data.time} UTC
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    The autonomous voice channel initiates after 18:56 UTC following the elevated heart rate notification. During {data.time} UTC, Alice's vitals were steady at baseline ({data.restingHr} bpm) with zero alert triggers.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-neutral-400">
                  <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Telemetry Nominal</span>
                  </span>
                  <span>•</span>
                  <span>Select watch at 18:56+ to review the conversation</span>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isUser = msg.sender === 'alice';
                const isTargetFocused = focusedTimestamp === msg.time;
                const isCurrentlySpeaking = currentSpeakingIndex === idx;
                const cleanTimeId = `dialogue-msg-${msg.time.replace(/:/g, '-')}`;

                return (
                  <div
                    key={`${msg.time}-${idx}`}
                    id={cleanTimeId}
                    className={`flex flex-col transition-all duration-300 rounded-2xl p-2.5 ${
                      isUser ? 'items-end' : 'items-start'
                    } ${
                      isCurrentlySpeaking
                        ? 'bg-emerald-950/60 ring-2 ring-[#05ff2b] shadow-[0_0_22px_rgba(5,255,43,0.35)]'
                        : isTargetFocused
                        ? 'bg-emerald-950/40 ring-2 ring-emerald-400/90 shadow-[0_0_18px_rgba(52,211,153,0.3)]'
                        : ''
                    }`}
                  >
                    <div className="text-[10px] text-neutral-400 font-mono mb-1.5 px-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={
                          isUser ? 'text-emerald-400 font-semibold' : 'text-sky-300 font-semibold'
                        }
                      >
                        {msg.speakerLabel}
                      </span>
                      <span>•</span>
                      <span
                        className={`font-medium ${
                          isTargetFocused ? 'text-emerald-300 font-bold' : 'text-neutral-400'
                        }`}
                      >
                        {msg.time} UTC
                      </span>

                      {/* Speaking now badge */}
                      {isCurrentlySpeaking && (
                        <span className="px-2 py-0.5 rounded-full bg-[#05ff2b] text-black font-semibold text-[10px] flex items-center space-x-1 animate-pulse shadow-[0_0_8px_#05ff2b]">
                          <Volume2 className="w-3 h-3 text-black" />
                          <span>Speaking ({isUser ? 'Alice • 70yo Senior' : 'Agent • Physician Prosody'})</span>
                        </span>
                      )}

                      {isTargetFocused && !isCurrentlySpeaking && (
                        <span
                          className={`px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 text-[10px] font-semibold border border-emerald-400/60 flex items-center space-x-1.5 ${
                            justJumped ? 'animate-pulse' : ''
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>
                            {data.time === '18:59'
                              ? 'Watch 18:59 Target (18:59:02)'
                              : `Watch ${data.time} Target`}
                          </span>
                        </span>
                      )}

                      {/* Listen button for individual message */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playSingleMessage(msg, idx);
                        }}
                        className={`p-1 px-2 rounded text-[10px] font-mono flex items-center space-x-1 transition cursor-pointer select-none ${
                          isCurrentlySpeaking
                            ? 'bg-[#05ff2b] text-black font-bold'
                            : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700/60'
                        }`}
                        title={`Listen to ${isUser ? "Alice's 70yo voice" : "Agent's physician voice"}`}
                      >
                        <Volume2 className="w-2.5 h-2.5" />
                        <span>{isCurrentlySpeaking ? 'Playing' : 'Listen'}</span>
                      </button>
                    </div>

                    <div
                      className={`max-w-[92%] sm:max-w-[84%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed font-sans shadow-xs transition-all ${
                        isCurrentlySpeaking
                          ? isUser
                            ? 'bg-[#223046] text-white border-2 border-[#05ff2b] rounded-tr-xs shadow-lg'
                            : 'bg-[#182a3d] text-white border-2 border-[#05ff2b] rounded-tl-xs shadow-lg'
                          : isTargetFocused
                          ? isUser
                            ? 'bg-[#1e2738] text-white border-2 border-emerald-400 rounded-tr-xs shadow-md'
                            : 'bg-[#15202e] text-white border-2 border-emerald-400 rounded-tl-xs shadow-md'
                          : isUser
                          ? 'bg-neutral-800 text-neutral-100 border border-neutral-700/80 rounded-tr-xs'
                          : 'bg-[#151b27] text-white border border-neutral-700/70 rounded-tl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}

            {isSpeaking && (
              <div className="flex items-center space-x-2 text-emerald-400 text-xs italic pl-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Agent voice stream speaking slowly and clearly...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Input Bar */}
          <div className="p-2.5 sm:p-3 bg-[#0b0e14] border-t border-neutral-800 flex items-center space-x-2">
            <button
              id="voice-talk-mic-btn"
              type="button"
              onClick={handleSimulateVoiceInput}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/70 text-xs font-medium font-mono transition cursor-pointer shrink-0"
              title="Speak into watch mic"
            >
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Watch Mic</span>
            </button>

            <div className="relative flex-1">
              <input
                id="voice-talk-input"
                type="text"
                placeholder={
                  isPreAlert
                    ? `Speak or type an ad-hoc inquiry for ${data.time} UTC...`
                    : "Speak or type Alice's response to the agent..."
                }
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                className="w-full bg-[#141824] border border-neutral-700/90 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans"
              />
            </div>

            <button
              id="voice-talk-send-btn"
              type="button"
              onClick={() => handleSend()}
              disabled={!inputVal.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium font-sans transition cursor-pointer flex items-center space-x-1 shrink-0"
            >
              <span>Send</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Voice Persona Tuning Modal for Physician Agent & Senior Alice */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-neutral-700/90 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative text-left max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowVoiceModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition cursor-pointer p-1 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Persona Tabs Header */}
            <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3 mb-3 pr-8">
              <button
                type="button"
                onClick={() => setTuningTab('agent')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  tuningTab === 'agent'
                    ? 'bg-sky-500/25 text-sky-200 border border-sky-400/50 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
                <span>Agent (Physician / Doctor)</span>
              </button>
              <button
                type="button"
                onClick={() => setTuningTab('alice')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  tuningTab === 'alice'
                    ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Alice (70yo Senior Patient)</span>
              </button>
            </div>

            {/* Modal Content Body based on selected Tab */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-3">
              {tuningTab === 'agent' ? (
                <>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Agent Physician Voice Prosody</h3>
                      <p className="text-xs text-neutral-400">Professional Clinical Specialist &amp; Doctor Tone</p>
                    </div>
                  </div>

                  {/* Doctor Prosody feature summary */}
                  <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 space-y-1.5">
                    <div className="text-[11px] font-mono text-sky-400 font-semibold flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Doctor Bedside Manner &amp; Clinical Phrasing Active</span>
                    </div>
                    <div className="text-[11.5px] text-neutral-400 leading-relaxed space-y-1">
                      <p>• <strong>Empathetic Bedside Manner:</strong> Warm validation openers (~1.06 pitch, 0.94x pacing) for calming patient anxiety.</p>
                      <p>• <strong>Doctor Advisory Directives:</strong> Clear, measured instructions for "Please take it easy", "check your prescription", and "stay alert" (~1.04 pitch, 0.93x rate, 240ms pause).</p>
                      <p>• <strong>Diagnostic Precision:</strong> Fluent, articulate analysis correlating heart rate, medication timing, and sleep deficit (~1.01 pitch, 0.97x rate).</p>
                      <p>• <strong>Reassuring Grounded Closure:</strong> Calming doctor cadence settling (~0.96 pitch, 0.91x rate, 420ms breath interval).</p>
                    </div>
                  </div>

                  {/* Agent Voice Selector */}
                  <div>
                    <label className="block text-xs font-mono text-neutral-300 mb-1.5">
                      Select Speech Synthesis Voice for Agent Doctor:
                    </label>
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-neutral-800 bg-[#0d1017] p-1.5 space-y-1">
                      {allAvailableVoices
                        .filter((v) => v.lang.toLowerCase().startsWith('en'))
                        .sort((a, b) => scoreVoiceForAgent(b, voices.aliceVoice) - scoreVoiceForAgent(a, voices.aliceVoice))
                        .map((voice) => {
                          const isSelected = voices.agentVoice?.name === voice.name;
                          const isNatural =
                            voice.name.toLowerCase().includes('natural') ||
                            voice.name.toLowerCase().includes('neural') ||
                            voice.name.toLowerCase().includes('google') ||
                            voice.name.toLowerCase().includes('enhanced') ||
                            voice.name.toLowerCase().includes('premium');

                          return (
                            <div
                              key={voice.name}
                              onClick={() => handleSelectAgentVoice(voice.name)}
                              className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition text-xs ${
                                isSelected
                                  ? 'bg-sky-950/80 border border-sky-500/70 text-white'
                                  : 'hover:bg-neutral-800/80 text-neutral-300 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-neutral-600 shrink-0" />
                                )}
                                <span className="font-medium truncate">{voice.name}</span>
                                {isNatural && (
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                                    Natural
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-500 font-mono shrink-0 ml-2">
                                {voice.lang}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Alice Voice Persona Tuning</h3>
                      <p className="text-xs text-neutral-400">70-Year-Old Female Senior Patient Voice</p>
                    </div>
                  </div>

                  {/* Alice Prosody feature summary */}
                  <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 space-y-1.5">
                    <div className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Lifelike Prosody &amp; Human Cadence Active</span>
                    </div>
                    <div className="text-[11.5px] text-neutral-400 leading-relaxed space-y-1">
                      <p>• <strong>Dynamic Pitch Contours:</strong> Warm greeting onset (~1.06), questioning inflection (~1.12), and reassuring cadence settling (~0.91).</p>
                      <p>• <strong>Natural Respiratory Breathing:</strong> Phrasal clause pauses (160ms–220ms) and cognitive reflection intervals.</p>
                      <p>• <strong>Anti-Robot Cadence:</strong> Conversational elderly pacing (0.89x–0.95x) replacing rigid monotone slowdowns.</p>
                    </div>
                  </div>

                  {/* Alice Voice Selector */}
                  <div>
                    <label className="block text-xs font-mono text-neutral-300 mb-1.5">
                      Select Speech Synthesis Voice for Alice:
                    </label>
                    <div className="max-h-52 overflow-y-auto rounded-xl border border-neutral-800 bg-[#0d1017] p-1.5 space-y-1">
                      {allAvailableVoices
                        .filter((v) => v.lang.toLowerCase().startsWith('en'))
                        .sort((a, b) => scoreVoiceForAlice(b) - scoreVoiceForAlice(a))
                        .map((voice) => {
                          const isSelected = voices.aliceVoice?.name === voice.name;
                          const isNatural =
                            voice.name.toLowerCase().includes('natural') ||
                            voice.name.toLowerCase().includes('neural') ||
                            voice.name.toLowerCase().includes('google') ||
                            voice.name.toLowerCase().includes('enhanced') ||
                            voice.name.toLowerCase().includes('premium');

                          return (
                            <div
                              key={voice.name}
                              onClick={() => handleSelectAliceVoice(voice.name)}
                              className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition text-xs ${
                                isSelected
                                  ? 'bg-emerald-950/80 border border-emerald-500/70 text-white'
                                  : 'hover:bg-neutral-800/80 text-neutral-300 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                {isSelected ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-neutral-600 shrink-0" />
                                )}
                                <span className="font-medium truncate">{voice.name}</span>
                                {isNatural && (
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                    Natural
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-neutral-500 font-mono shrink-0 ml-2">
                                {voice.lang}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Bottom Action Controls */}
            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between">
              {tuningTab === 'agent' ? (
                <button
                  type="button"
                  onClick={() => handlePreviewAgentVoice()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sky-200 text-xs font-mono flex items-center space-x-1.5 transition cursor-pointer"
                  title="Test current Doctor voice with sample phrase"
                >
                  <Play className="w-3.5 h-3.5 text-sky-400" />
                  <span>Test Doctor Voice</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePreviewAliceVoice()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono flex items-center space-x-1.5 transition cursor-pointer"
                  title="Test current Alice voice with sample phrase"
                >
                  <Play className="w-3.5 h-3.5 text-[#05ff2b]" />
                  <span>Test Alice Voice</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowVoiceModal(false)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
