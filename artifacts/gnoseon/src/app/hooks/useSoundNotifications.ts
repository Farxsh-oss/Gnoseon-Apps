import { useEffect, useRef } from 'react';

export function useSoundNotifications() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef(true);

  useEffect(() => {
    // Initialize AudioContext on user interaction
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    document.addEventListener('click', initAudioContext, { once: true });
    return () => document.removeEventListener('click', initAudioContext);
  }, []);

  const playNotificationSound = (type: 'message' | 'file' | 'error' = 'message') => {
    if (!isEnabledRef.current || !audioContextRef.current) return;

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Different sounds for different notification types
    switch (type) {
      case 'message':
        // Pleasant notification sound (C major chord)
        oscillator.frequency.setValueAtTime(523.25, context.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, context.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, context.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.3);
        break;

      case 'file':
        // File upload/download sound (ascending tones)
        oscillator.frequency.setValueAtTime(440, context.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.2); // A5
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.3);
        break;

      case 'error':
        // Error sound (dissonant)
        oscillator.frequency.setValueAtTime(220, context.currentTime); // A3
        oscillator.frequency.setValueAtTime(207.65, context.currentTime + 0.1); // G#3
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.2);
        break;
    }
  };

  const toggleSound = () => {
    isEnabledRef.current = !isEnabledRef.current;
    return isEnabledRef.current;
  };

  const isSoundEnabled = () => isEnabledRef.current;

  return {
    playNotificationSound,
    toggleSound,
    isSoundEnabled,
  };
}
