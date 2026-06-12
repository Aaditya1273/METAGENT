'use client';

import { useRef, useState, useEffect } from 'react';

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
}

export function HolographicCard({ children, className = '' }: HolographicCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const [gradientPhase, setGradientPhase] = useState(0);
  const animationRef = useRef<number>();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateX = (mouseY / centerY) * 20;
    const rotateY = -(mouseX / centerX) * 20;
    
    setTransform({ rotateX, rotateY, scale: 1.02 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // Spring back animation
    const animateBack = () => {
      setTransform(prev => {
        const newRotateX = prev.rotateX * 0.85;
        const newRotateY = prev.rotateY * 0.85;
        const newScale = 1 + (prev.scale - 1) * 0.85;
        
        if (Math.abs(newRotateX) < 0.1 && Math.abs(newRotateY) < 0.1) {
          return { rotateX: 0, rotateY: 0, scale: 1 };
        }
        
        animationRef.current = requestAnimationFrame(animateBack);
        return { rotateX: newRotateX, rotateY: newRotateY, scale: newScale };
      });
    };
    
    animateBack();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setGlitchActive(true);
    setTimeout(() => setGlitchActive(false), 200);
  };

  // Animate gradient
  useEffect(() => {
    const animateGradient = () => {
      setGradientPhase(prev => (prev + 1) % 360);
      animationRef.current = requestAnimationFrame(animateGradient);
    };
    
    if (isHovered) {
      animationRef.current = requestAnimationFrame(animateGradient);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered]);

  const getGradient = () => {
    const angle = gradientPhase;
    return `linear-gradient(${angle}deg, transparent, rgba(14, 165, 233, 0.1), transparent)`;
  };

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s ease-out',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative"
        style={{ 
          transformStyle: 'preserve-3d',
          filter: glitchActive ? 'hue-rotate(90deg) blur(2px)' : 'hue-rotate(0deg) blur(0px)',
          transition: 'filter 0.1s',
        }}
      >
        {/* Holographic layers */}
        <div
          className="absolute inset-0 rounded-3xl transition-opacity duration-300"
          style={{
            background: getGradient(),
            transform: 'translateZ(10px)',
            opacity: isHovered ? 1 : 0,
          }}
        />
        
        <div
          className="absolute inset-0 rounded-3xl border transition-colors duration-300"
          style={{
            transform: 'translateZ(20px)',
            borderColor: isHovered ? 'rgba(14, 165, 233, 0.5)' : 'rgba(255, 255, 255, 0.1)',
          }}
        />
        
        {/* Scanline effect */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
          style={{ transform: 'translateZ(30px)' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(transparent 50%, rgba(14, 165, 233, 0.03) 50%)',
              backgroundSize: '100% 4px',
              animation: isHovered ? 'scanline 3s linear infinite' : 'none',
            }}
          />
        </div>

        {/* Content */}
        <div
          className="relative z-10"
          style={{
            transform: 'translateZ(40px)',
            textShadow: isHovered ? '0 0 20px rgba(14, 165, 233, 0.5)' : 'none',
            transition: 'text-shadow 0.3s',
          }}
        >
          {children}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}
