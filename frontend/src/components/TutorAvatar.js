import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AnimatedAvatar = ({ isSpeaking }) => {
  const meshRef = useRef();
  const lightRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(time) * 0.1;
      
      // Speaking animation - rotation when speaking
      if (isSpeaking) {
        meshRef.current.rotation.y = Math.sin(time * 3) * 0.2;
        meshRef.current.scale.set(
          1 + Math.sin(time * 5) * 0.05,
          1 + Math.sin(time * 5) * 0.05,
          1 + Math.sin(time * 5) * 0.05
        );
      } else {
        meshRef.current.rotation.y += 0.005;
        meshRef.current.scale.set(1, 1, 1);
      }
    }
    
    if (lightRef.current) {
      lightRef.current.intensity = isSpeaking ? 2 : 1;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight ref={lightRef} position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-5, 5, 5]} intensity={0.5} />
      
      {/* Main head */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color={isSpeaking ? '#8b5cf6' : '#6366f1'}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.45, 0.3, 1.3]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.45, 0.3, 1.3]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Pupils */}
      <mesh position={[-0.45, 0.3, 1.45]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.45, 0.3, 1.45]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </>
  );
};

const TutorAvatar = ({ isSpeaking = false }) => {
  return (
    <div className="w-full" data-testid="tutor-avatar">
      <div className="h-64 bg-gradient-to-b from-indigo-50 to-purple-50 rounded-lg overflow-hidden">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: 'transparent' }}
        >
          <AnimatedAvatar isSpeaking={isSpeaking} />
        </Canvas>
      </div>
      <div className="text-center mt-2">
        <p className="text-sm text-gray-600">
          {isSpeaking ? '🔊 Speaking...' : '👋 Ready to help!'}
        </p>
      </div>
    </div>
  );
};

export default TutorAvatar;