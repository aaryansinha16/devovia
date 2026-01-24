"use client";

import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";

interface HeartBlastAnimationProps {
  isPlaying: boolean;
  onComplete?: () => void;
}

export function HeartBlastAnimation({ isPlaying, onComplete }: HeartBlastAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, onComplete]);

  if (!show) return null;

  // Lottie animation data for heart explosion
  const heartExplosionAnimation = {
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: 60,
    w: 200,
    h: 200,
    nm: "Heart Explosion",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Heart",
        sr: 1,
        ks: {
          o: {
            a: 1,
            k: [
              { t: 0, s: [100] },
              { t: 30, s: [100] },
              { t: 60, s: [0] }
            ]
          },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [0, 0, 100] },
              { t: 15, s: [150, 150, 100] },
              { t: 30, s: [120, 120, 100] },
              { t: 60, s: [200, 200, 100] }
            ]
          }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ty: "sh",
                d: 1,
                ks: {
                  a: 0,
                  k: {
                    i: [[0, 0], [-5.5, -5.5], [0, -7.8], [5.5, -5.5], [7.8, 0], [5.5, 5.5], [0, 7.8], [-5.5, 5.5], [-7.8, 0]],
                    o: [[7.8, 0], [5.5, 5.5], [0, 7.8], [-5.5, 5.5], [-7.8, 0], [-5.5, -5.5], [0, -7.8], [5.5, -5.5], [0, 0]],
                    v: [[0, -20], [20, -20], [28, -5], [20, 10], [0, 18], [-20, 10], [-28, -5], [-20, -20], [0, -20]],
                    c: true
                  }
                }
              },
              {
                ty: "fl",
                c: { a: 0, k: [0.937, 0.263, 0.314, 1] },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ],
        ip: 0,
        op: 60,
        st: 0
      }
    ]
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <Lottie
        animationData={heartExplosionAnimation}
        loop={false}
        autoplay={true}
        style={{ width: 200, height: 200 }}
      />
    </div>
  );
}

// CSS-based particle explosion with hearts
export function HeartParticles({ isPlaying }: { isPlaying: boolean }) {
  const [particles, setParticles] = useState<Array<{ 
    id: number; 
    angle: number; 
    delay: number;
    size: number;
    distance: number;
    isHeart: boolean;
  }>>([]);

  useEffect(() => {
    if (isPlaying) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: Date.now() + i,
        angle: (360 / 20) * i,
        delay: Math.random() * 0.15,
        size: Math.random() * 8 + 4, // Random size between 4-12px
        distance: Math.random() * 30 + 40, // Random distance 40-70px
        isHeart: i % 3 === 0, // Every 3rd particle is a heart
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => setParticles([]), 1200);
      return () => clearTimeout(timer);
    }
  }, [isPlaying]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-particle-burst"
          style={{
            width: particle.size,
            height: particle.size,
            transform: `rotate(${particle.angle}deg) translateY(-${particle.distance}px)`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          {particle.isHeart ? (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-red-500 drop-shadow-lg"
              style={{ width: '100%', height: '100%' }}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 to-pink-500 shadow-lg" />
          )}
        </div>
      ))}
    </div>
  );
}

// Floating hearts that rise up
export function FloatingHearts({ isPlaying }: { isPlaying: boolean }) {
  const [hearts, setHearts] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    if (isPlaying) {
      const newHearts = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        left: 30 + Math.random() * 40, // Random position 30-70%
        delay: Math.random() * 0.3,
        duration: 1 + Math.random() * 0.5, // 1-1.5s duration
      }));
      setHearts(newHearts);

      const timer = setTimeout(() => setHearts([]), 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying]);

  if (hearts.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute bottom-0 animate-float-up"
          style={{
            left: `${heart.left}%`,
            animationDelay: `${heart.delay}s`,
            animationDuration: `${heart.duration}s`,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 text-red-500 opacity-80"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ))}
    </div>
  );
}
