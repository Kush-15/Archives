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
    // Letter-spacing breathe after scramble resolves
    setTimeout(() => {
      setBreathe(true);
      setTimeout(() => setBreathe(false), 80);
    }, 450); // 420ms scramble + 30ms pause
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
        letterSpacing: breathe ? '0.20em' : undefined,
        transition: breathe ? 'letter-spacing 0.08s ease' : 'letter-spacing 0.08s ease',
      }}
    >
      {display}
    </span>
  );
}
