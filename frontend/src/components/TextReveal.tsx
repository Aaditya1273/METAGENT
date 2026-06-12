'use client';

import { useEffect, useState } from 'react';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export function TextReveal({ text, className = '', delay = 0 }: TextRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const letters = text.split('');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`inline-block ${className}`}>
      {letters.map((letter, index) => (
        <span
          key={index}
          className="inline-block"
          style={{
            whiteSpace: 'pre',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) rotateX(0)' : 'translateY(50px) rotateX(-90deg)',
            transition: `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay * 1000 + index * 50}ms`,
            transformOrigin: 'center bottom',
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </div>
  );
}

export function WordReveal({ text, className = '', delay = 0 }: TextRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const words = text.split(' ');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`inline-block ${className}`}>
      {words.map((word, index) => (
        <span
          key={index}
          className="inline-block mr-3"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.8)',
            transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay * 1000 + index * 100}ms`,
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}
