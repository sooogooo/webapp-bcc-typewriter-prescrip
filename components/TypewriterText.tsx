import React, { useState, useEffect, useRef } from 'react';
import { playTypewriterSound, playDing } from '../services/audioService';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  startDelay?: number;
  onComplete?: () => void;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 30, 
  startDelay = 0,
  onComplete,
  className = "" 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const lastCharCount = useRef(0);

  // Update ref when prop changes to avoid stale closures in effects
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset state when text changes
    setDisplayedText('');
    setStarted(false);
    lastCharCount.current = 0;

    let timeoutId: ReturnType<typeof setTimeout>;
    let intervalId: ReturnType<typeof setInterval>;

    timeoutId = setTimeout(() => {
      setStarted(true);
      const startTime = Date.now();
      
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = now - startTime;
        // Calculate how many characters should be shown based on time elapsed
        const charCount = Math.max(1, Math.floor(elapsed / speed));
        
        if (charCount <= text.length) {
          // Play sound if a new character is added
          if (charCount > lastCharCount.current && speed > 0) {
            const char = text[charCount - 1];
            // Don't play sound for every char if speed is super fast (e.g. < 10ms), maybe throttle
            playTypewriterSound(char);
            lastCharCount.current = charCount;
          }
          setDisplayedText(text.substring(0, charCount));
        } else {
          setDisplayedText(text);
          clearInterval(intervalId);
          // Play ding on finish if typing actually happened
          if (speed > 0 && text.length > 0) {
              playDing();
          }
          if (onCompleteRef.current) onCompleteRef.current();
        }
      }, speed);

    }, startDelay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return (
    <span className={`${className} whitespace-pre-wrap`}>
      {displayedText}
      {started && displayedText.length < text.length && (
        <span className="animate-pulse border-r-2 border-black ml-0.5 h-4 inline-block align-middle"></span>
      )}
    </span>
  );
};