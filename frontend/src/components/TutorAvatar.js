import React, { useEffect, useRef } from 'react';

const TutorAvatar = ({ isSpeaking = false, audioLevel = 0 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 60;
    let time = 0;
    
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient background
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 3);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (isSpeaking) {
        // Animated waves when speaking
        const waveCount = 4;
        const intensity = 0.5 + (audioLevel * 0.5);
        
        for (let i = 0; i < waveCount; i++) {
          const waveRadius = baseRadius + (i * 20) + (Math.sin(time * 0.05 + i) * 10 * intensity);
          const opacity = (1 - (i / waveCount)) * 0.3 * intensity;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        
        time += 1;
      }
      
      // Main circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      
      // Gradient for main circle
      const circleGradient = ctx.createLinearGradient(
        centerX - baseRadius, centerY - baseRadius,
        centerX + baseRadius, centerY + baseRadius
      );
      circleGradient.addColorStop(0, '#6366f1');
      circleGradient.addColorStop(0.5, '#8b5cf6');
      circleGradient.addColorStop(1, '#a855f7');
      
      ctx.fillStyle = circleGradient;
      ctx.fill();
      
      // Inner pulse effect when speaking
      if (isSpeaking) {
        const pulseRadius = baseRadius * (0.8 + Math.sin(time * 0.1) * 0.1);
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
      }
      
      // Microphone icon in center
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎙️', centerX, centerY);
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpeaking, audioLevel]);
  
  return (
    <div className="w-full flex flex-col items-center" data-testid="tutor-avatar">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="rounded-lg"
        />
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1 bg-white/90 px-3 py-1 rounded-full shadow-lg">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center mt-4">
        <p className="text-sm font-medium text-gray-700">
          {isSpeaking ? '🔊 Explaining...' : '👋 Ready to teach!'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Your AI Tutor
        </p>
      </div>
    </div>
  );
};

export default TutorAvatar;