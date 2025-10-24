import React from 'react';

const TutorAvatar = ({ isSpeaking = false }) => {
  return (
    <div className="w-full" data-testid="tutor-avatar">
      <div className="h-64 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg overflow-hidden flex items-center justify-center relative">
        {/* Animated background */}
        <div className={`absolute inset-0 ${isSpeaking ? 'animate-pulse' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 opacity-50"></div>
        </div>
        
        {/* Avatar face */}
        <div className={`relative z-10 transition-transform duration-300 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
          {/* Head */}
          <div className="w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center">
            {/* Eyes */}
            <div className="flex gap-8 mb-4">
              <div className={`w-6 h-6 bg-gray-800 rounded-full transition-all ${isSpeaking ? 'animate-bounce' : ''}`}></div>
              <div className={`w-6 h-6 bg-gray-800 rounded-full transition-all ${isSpeaking ? 'animate-bounce' : ''}`}></div>
            </div>
          </div>
          
          {/* Smile */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className={`w-16 h-8 border-b-4 border-gray-800 rounded-b-full transition-all ${isSpeaking ? 'border-indigo-600' : ''}`}></div>
          </div>
        </div>
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute bottom-4 right-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center mt-2">
        <p className="text-sm text-gray-600 font-medium">
          {isSpeaking ? '🔊 Speaking...' : '👋 Ready to help!'}
        </p>
      </div>
    </div>
  );
};

export default TutorAvatar;