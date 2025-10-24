import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const AnimatedSphere = ({ isSpeaking }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.position.y = Math.sin(time) * 0.1;
      meshRef.current.rotation.y += 0.01;
      
      if (isSpeaking) {
        const scale = 1 + Math.sin(time * 5) * 0.05;
        meshRef.current.scale.set(scale, scale, scale);
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color={isSpeaking ? '#8b5cf6' : '#6366f1'}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      <mesh position={[-0.4, 0.3, 1.3]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.4, 0.3, 1.3]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.4, 0.3, 1.4]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.4, 0.3, 1.4]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
};

const TutorAvatar = ({ isSpeaking = false }) => {
  return (
    <div className="w-full" data-testid="tutor-avatar">
      <div className="h-64 bg-gradient-to-b from-indigo-50 to-purple-50 rounded-lg overflow-hidden">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <AnimatedSphere isSpeaking={isSpeaking} />
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