'use client';

import { useState, useEffect, useRef } from 'react';

interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export function useSpringAnimation(
  toValue: number,
  config: SpringConfig = {}
) {
  const { stiffness = 100, damping = 15, mass = 1 } = config;
  
  const [value, setValue] = useState(toValue);
  const [velocity, setVelocity] = useState(0);
  const animationRef = useRef<number>();
  const targetRef = useRef(toValue);
  const currentRef = useRef(toValue);

  useEffect(() => {
    targetRef.current = toValue;
  }, [toValue]);

  useEffect(() => {
    const animate = () => {
      const target = targetRef.current;
      const current = currentRef.current;
      const displacement = target - current;
      
      // Spring physics: F = -kx - cv
      const springForce = stiffness * displacement;
      const dampingForce = damping * velocity;
      const acceleration = (springForce - dampingForce) / mass;
      
      const newVelocity = velocity + acceleration * 0.016; // 60fps
      const newValue = current + newVelocity * 0.016;
      
      setVelocity(newVelocity);
      setValue(newValue);
      currentRef.current = newValue;
      
      // Stop animation when close to target with low velocity
      if (Math.abs(displacement) > 0.01 || Math.abs(velocity) > 0.01) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stiffness, damping, mass, velocity]);

  return value;
}

export function useSpringTransform(
  mouseX: number,
  mouseY: number,
  centerX: number,
  centerY: number,
  intensity: number = 20
) {
  const rotateX = useSpringAnimation(
    ((mouseY - centerY) / centerY) * intensity,
    { stiffness: 200, damping: 25 }
  );
  
  const rotateY = useSpringAnimation(
    -((mouseX - centerX) / centerX) * intensity,
    { stiffness: 200, damping: 25 }
  );
  
  return { rotateX, rotateY };
}
