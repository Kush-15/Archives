import { useState, useCallback } from 'react';
import { useTextScramble } from '@/hooks/useTextScramble';

interface ScrambleTextProps {
  text: string;
  className?: string;
}

export default function ScrambleText({ text, className }: ScrambleTextProps) {
  const { display, trigger, stop } = useTextScramble(text);
  const [breathe, setBreathe] = useState(false);

  const handleEnter = useCallback(() => {
    trigger();
    // Letter-spacing breathe fires just after scramble fully resolves (360ms + 20ms)
    setTimeout(() => {
      setBreathe(true);
      setTimeout(() => setBreathe(false), 120);
    }, 380);
  }, [trigger]);

  const handleLeave = useCallback(() => {
    stop();
    setBreathe(false);
  }, [stop]);

  return (
    <span
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={className}
      style={{
        letterSpacing: breathe ? '0.24em' : undefined,
        transition: 'letter-spacing 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {display}
    </span>
  );
}
