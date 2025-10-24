import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedAvatar = ({ isSpeaking }) => {
  const meshRef = useRef();
  const lightRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(time) * 0.1;
      
      // Speaking animation - more distortion when speaking
      if (isSpeaking) {
        meshRef.current.rotation.y = Math.sin(time * 3) * 0.2;
      } else {
        meshRef.current.rotation.y += 0.005;
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
      
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.5}>
        <MeshDistortMaterial
          color={isSpeaking ? '#8b5cf6' : '#6366f1'}
          attach="material"
          distort={isSpeaking ? 0.6 : 0.3}
          speed={isSpeaking ? 2 : 1}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      
      {/* Eyes */}
      <Sphere position={[-0.3, 0.2, 1.2]} args={[0.1, 32, 32]}>
        <meshStandardMaterial color="white" />
      </Sphere>
      <Sphere position={[0.3, 0.2, 1.2]} args={[0.1, 32, 32]}>
        <meshStandardMaterial color="white" />
      </Sphere>
      
      {/* Pupils */}
      <Sphere position={[-0.3, 0.2, 1.3]} args={[0.05, 32, 32]}>
        <meshStandardMaterial color="#1e293b" />
      </Sphere>
      <Sphere position={[0.3, 0.2, 1.3]} args={[0.05, 32, 32]}>
        <meshStandardMaterial color="#1e293b" />
      </Sphere>
    </>
  );
};

const TutorAvatar = ({ isSpeaking = false }) => {
  return (
    <div className="w-full h-64 bg-gradient-to-b from-indigo-50 to-purple-50 rounded-lg overflow-hidden" data-testid="tutor-avatar">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <AnimatedAvatar isSpeaking={isSpeaking} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
      
      <div className="text-center mt-2">
        <p className="text-sm text-gray-600">
          {isSpeaking ? '🔊 Speaking...' : '👋 Ready to help!'}
        </p>
      </div>
    </div>
  );
};

export default TutorAvatar;