import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AuroraBackground = ({ style = {} }) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        backgroundColor: 'var(--bg-primary)',
        ...style,
      }}
    >
      {/* 
        PREMIUM VIDEO BACKGROUND
        Using a dark, sleek abstract network/particles video 
      */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          minWidth: '100%',
          minHeight: '100%',
          width: 'auto',
          height: 'auto',
          transform: 'translate(-50%, -50%)',
          objectFit: 'cover',
          opacity: 0.4,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-connections-background-27712-large.mp4" type="video/mp4" />
      </video>

      {/* Interactive Cursor Glow */}
      <div
        style={{
          position: 'absolute',
          top: `${mousePos.y}%`,
          left: `${mousePos.x}%`,
          width: '800px',
          height: '800px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, var(--green-subtle) 0%, transparent 60%)',
          transition: 'top 0.8s cubic-bezier(0.075, 0.82, 0.165, 1), left 0.8s cubic-bezier(0.075, 0.82, 0.165, 1)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating Orbs using framer-motion */}
      <motion.div
        animate={{
          y: ['-20%', '20%', '-20%'],
          x: ['-10%', '10%', '-10%'],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: '40vw',
          height: '40vw',
          background: 'radial-gradient(circle, var(--green-subtle) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <motion.div
        animate={{
          y: ['20%', '-20%', '20%'],
          x: ['10%', '-10%', '10%'],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '45vw',
          height: '45vw',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Grid overlay for tech feel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundSize: '40px 40px',
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
          pointerEvents: 'none',
        }}
      />

      {/* Grain Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default AuroraBackground;
