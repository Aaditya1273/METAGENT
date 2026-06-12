'use client';

import { useRef, useEffect, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
}

export function ScrollReveal({ 
  children, 
  className = '', 
  direction = 'up',
  delay = 0,
  duration = 0.6
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '-100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const getInitialTransform = () => {
    switch (direction) {
      case 'up': return 'translateY(100px)';
      case 'down': return 'translateY(-100px)';
      case 'left': return 'translateX(-100px)';
      case 'right': return 'translateX(100px)';
      default: return 'translateY(100px)';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0, 0)' : getInitialTransform(),
        transition: `all ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1)`,
      }}
    >
      {children}
    </div>
  );
}

export function StaggeredReveal({ 
  children, 
  className = '', 
  staggerDelay = 0.1 
}: { 
  children: React.ReactNode[]; 
  className?: string; 
  staggerDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '-100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.9)',
            transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * staggerDelay}s`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
