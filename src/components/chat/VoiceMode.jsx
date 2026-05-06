const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const FALCON_IMG = "https://media.db.com/images/public/69ef66fe4f340c1dcd4f7578/da900615d_generated_image.png";

export default function VoiceMode({ onClose, onSend }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusText, setStatusText] = useState('Tap the mic to start speaking');
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setStatusText('Voice not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      const combined = (final + interim).trim();
      transcriptRef.current = combined;
      setTranscript(combined);
    };

    recognition.onstart = () => {
      setStatusText('Listening… speak now 🎙️');
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatusText(transcriptRef.current ? 'Tap send or speak again' : 'Tap the mic to start speaking');
    };

    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error === 'not-allowed') {
        setStatusText('Microphone access denied. Check browser permissions.');
      } else {
        setStatusText('Could not hear you. Try again.');
      }
    };

    recognitionRef.current = recognition;
    return () => { try { recognitionRef.current?.stop(); } catch {} };
  }, []);

  const toggleListen = () => {
    const rec = recognitionRef.current;
    if (!rec || !supported) return;
    if (isListening) {
      rec.stop();
      setIsListening(false);
    } else {
      transcriptRef.current = '';
      setTranscript('');
      try {
        rec.start();
        setIsListening(true);
      } catch (e) {
        setStatusText('Could not start microphone. Try again.');
      }
    }
  };

  const handleSend = () => {
    if (!transcript.trim()) return;
    onSend(transcript.trim());
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between py-10 px-6"
      style={{
        background: 'linear-gradient(170deg, #0a1628 0%, #0f2a1a 50%, #0a1628 100%)',
      }}
    >
      {/* Close */}
      <div className="w-full flex justify-end">
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-center"
      >
        <p className="text-primary/80 text-xs font-semibold uppercase tracking-widest mb-2">✦ Voice Mode</p>
        <h2 className="text-3xl font-bold text-white leading-tight">
          Your AI<br />
          <span className="text-primary">Tutor</span> is Ready
        </h2>
      </motion.div>

      {/* Falcon */}
      <div className="relative flex flex-col items-center flex-1 justify-center w-full">
        {/* Glow rings when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-primary/30"
                  style={{ width: 120 + i * 60, height: 120 + i * 60 }}
                  initial={{ opacity: 0.6, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.4 }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Subtle glow under falcon */}
        <div className={cn(
          "absolute bottom-4 w-48 h-10 rounded-full blur-2xl transition-all duration-500",
          isListening ? "bg-primary/60" : "bg-primary/20"
        )} />

        <motion.img
          src={FALCON_IMG}
          alt="UAE Falcon"
          className="relative z-10 object-contain drop-shadow-2xl"
          style={{ width: 280, height: 280 }}
          animate={isListening
            ? { y: [0, -14, 0], scale: [1, 1.05, 1] }
            : { y: [0, -6, 0] }
          }
          transition={{ duration: isListening ? 1.2 : 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Transcript */}
      <div className="w-full max-w-sm min-h-[52px] flex items-center justify-center mb-4">
        <AnimatePresence mode="wait">
          {transcript ? (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 text-center border border-white/15"
            >
              <p className="text-white text-sm leading-relaxed">"{transcript}"</p>
            </motion.div>
          ) : (
            <motion.p
              key="status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/40 text-sm text-center"
            >
              {statusText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8">
        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!transcript.trim()}
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-all",
            transcript.trim()
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "bg-white/10 text-white/30"
          )}
        >
          <Send className="h-5 w-5" />
        </button>

        {/* Mic — main button */}
        <div className="relative">
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/40"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
          <button
            onClick={toggleListen}
            disabled={!supported}
            className={cn(
              "h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-2xl",
              isListening
                ? "bg-primary scale-110 shadow-primary/50"
                : "bg-white text-foreground"
            )}
          >
            {isListening
              ? <MicOff className="h-7 w-7 text-white" />
              : <Mic className="h-7 w-7 text-primary" />
            }
          </button>
        </div>

        {/* Spacer to balance layout */}
        <div className="h-12 w-12" />
      </div>

      <p className="text-white/30 text-xs mt-4">
        {isListening ? 'Tap to stop' : 'Tap mic to speak'}
      </p>
    </motion.div>
  );
}