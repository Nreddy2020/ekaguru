import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '@/App';
import axios from 'axios';
import { ArrowLeft, Volume2, VolumeX, ChevronLeft, ChevronRight, BookOpen, Lightbulb, Brain, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import TutorAvatar from '@/components/TutorAvatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LearningSession = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapterId = searchParams.get('chapter');
  
  const { currentStudent, API } = useContext(AppContext);
  const [chapterInfo, setChapterInfo] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [learningMode, setLearningMode] = useState('welcome'); // welcome, learning, deep_dive, quiz
  const [currentMessage, setCurrentMessage] = useState('');
  const [studentInput, setStudentInput] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!currentStudent) {
      toast.error('Please select a student first');
      navigate('/profile');
      return;
    }
    
    if (chapterId) {
      loadChapterAndStart();
    }

    return () => {
      stopSpeaking();
    };
  }, [currentStudent, chapterId]);

  const loadChapterAndStart = async () => {
    try {
      const response = await axios.get(`${API}/chapters/${chapterId}`);
      setChapterInfo(response.data);
      
      // Welcome message
      const welcomeMsg = `Hello my dear ${currentStudent.name}! 👋 I see you want to learn about "${response.data.chapter_title}". Let me tell you about it first, and then you can choose how you'd like to learn!`;
      setCurrentMessage(welcomeMsg);
      speak(welcomeMsg);
      
      // Add to conversation
      setConversationHistory([{
        role: 'tutor',
        content: welcomeMsg,
        timestamp: new Date().toISOString()
      }]);
      
      // Show options after welcome
      setTimeout(() => {
        const optionsMsg = `\n\nNow, sweetheart, how would you like to learn this?\n\n📚 Start Learning - I'll explain everything step by step\n🧠 Deep Dive - Already know basics? Let's explore deeper!\n🏆 Take a Quiz - Test what you already know\n\nWhat would you like to do, my dear?`;
        setCurrentMessage(prev => prev + optionsMsg);
        speak(optionsMsg);
      }, 8000);
      
    } catch (error) {
      console.error('Error loading chapter:', error);
      toast.error('Failed to load chapter');
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('zira') ||
        (v.lang.startsWith('en') && v.name.toLowerCase().includes('google'))
      );
      
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.rate = 0.85;
      utterance.pitch = 1.15;
      utterance.volume = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const startLearningMode = async () => {
    setLearningMode('learning');
    stopSpeaking();
    
    const msg = `Wonderful choice, my dear! Let's learn together! I'm going to explain what's on this page. If you don't understand any word or want an example, just stop me and ask, okay?\n\nLet me start explaining...`;
    setCurrentMessage(msg);
    addToConversation('tutor', msg);
    speak(msg);
    
    // Start explaining the page content after a pause
    setTimeout(() => {
      explainCurrentPage();
    }, 6000);
  };

  const explainCurrentPage = async () => {
    try {
      setIsWaitingForResponse(true);
      const response = await axios.post(`${API}/chat/interactive`, null, {
        params: {
          student_id: currentStudent.id,
          chapter_id: chapterId,
          action: 'explain_with_images'
        }
      });
      
      setCurrentMessage(response.data.response);
      addToConversation('tutor', response.data.response);
      speak(response.data.response);
      updateProgress(30);
      
      // After explanation, offer next steps
      setTimeout(() => {
        const nextMsg = `\n\nDid you understand everything, sweetheart? You can:\n• Ask me about any word\n• Request more examples\n• Move to next page\n• Go deeper into this topic\n\nWhat would you like?`;
        setCurrentMessage(prev => prev + nextMsg);
        speak(nextMsg);
      }, 10000);
      
    } catch (error) {
      console.error('Error explaining:', error);
      toast.error('Sorry, I had trouble explaining');
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const startDeepDive = async () => {
    setLearningMode('deep_dive');
    stopSpeaking();
    
    const msg = `Excellent! You want to go deeper! That's wonderful, my dear! 🧠\n\nI'll explain this topic with more advanced concepts, real-world examples, and connections to other ideas. Let me prepare something special for you...`;
    setCurrentMessage(msg);
    addToConversation('tutor', msg);
    speak(msg);
    
    setTimeout(() => {
      provideDeepDive();
    }, 5000);
  };

  const provideDeepDive = async () => {
    try {
      setIsWaitingForResponse(true);
      
      // Request deep explanation
      const response = await axios.post(`${API}/chat`, {
        student_id: currentStudent.id,
        message: `Provide an advanced, detailed explanation of ${chapterInfo.chapter_title} with real-world applications, examples, and deeper concepts. Make it engaging and use analogies.`
      });
      
      const deepContent = response.data.response;
      setCurrentMessage(deepContent);
      addToConversation('tutor', deepContent);
      speak(deepContent);
      updateProgress(60);
      
    } catch (error) {
      console.error('Error in deep dive:', error);
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const startQuizMode = async () => {
    setLearningMode('quiz');
    stopSpeaking();
    
    const msg = `Great! Let's test your knowledge! 🏆 I'm preparing some questions for you...`;
    setCurrentMessage(msg);
    addToConversation('tutor', msg);
    speak(msg);
    
    setTimeout(() => {
      generateQuiz();
    }, 3000);
  };

  const generateQuiz = async () => {
    try {
      setIsWaitingForResponse(true);
      
      const response = await axios.post(`${API}/chat`, {
        student_id: currentStudent.id,
        message: `Create 5 quiz questions about ${chapterInfo.chapter_title}. Format each as: Question | Option A | Option B | Option C | Option D | Correct Answer`
      });
      
      // Parse quiz questions (simplified - would need better parsing)
      const quizMsg = `Here's your first question, sweetheart:\n\n${response.data.response}`;
      setCurrentMessage(quizMsg);
      addToConversation('tutor', quizMsg);
      speak(quizMsg);
      updateProgress(80);
      
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleStudentQuestion = async () => {
    if (!studentInput.trim()) return;
    
    stopSpeaking();
    addToConversation('student', studentInput);
    
    const question = studentInput;
    setStudentInput('');
    setIsWaitingForResponse(true);
    
    try {
      // Check if asking about a word
      const wordMatch = question.match(/what (is|does|means?) ([\w]+)/i);
      if (wordMatch) {
        const word = wordMatch[2];
        const response = await axios.post(`${API}/chat/interactive`, null, {
          params: {
            student_id: currentStudent.id,
            action: 'explain_word',
            word: word
          }
        });
        
        setCurrentMessage(response.data.response);
        addToConversation('tutor', response.data.response);
        speak(response.data.response);
      } else {
        // General question
        const response = await axios.post(`${API}/chat`, {
          student_id: currentStudent.id,
          message: question
        });
        
        setCurrentMessage(response.data.response);
        addToConversation('tutor', response.data.response);
        speak(response.data.response);
      }
      
      updateProgress(Math.min(completionProgress + 5, 95));
      
    } catch (error) {
      console.error('Error answering question:', error);
      toast.error('Sorry, I had trouble answering');
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const updateProgress = async (percentage) => {
    setCompletionProgress(percentage);
    try {
      await axios.post(`${API}/learning/update-progress`, null, {
        params: {
          student_id: currentStudent.id,
          chapter_id: chapterId,
          completion_percentage: percentage
        }
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const addToConversation = (role, content) => {
    setConversationHistory(prev => [...prev, {
      role,
      content,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleBack = () => {
    stopSpeaking();
    navigate('/learning-path');
  };

  if (!currentStudent || !chapterInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex-1 mx-4">
            <h2 className="text-sm font-semibold text-gray-800 truncate">{chapterInfo.chapter_title}</h2>
            <Progress value={completionProgress} className="h-1 mt-1" />
          </div>
          
          {isSpeaking ? (
            <Button size="sm" variant="destructive" onClick={stopSpeaking}>
              <VolumeX className="h-4 w-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Badge variant="outline" className="text-xs">Learning Mode</Badge>
          )}
        </div>
      </div>

      {/* Main Learning Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-80px)]">
        
        {/* LEFT: Avatar Tutor */}
        <div className="lg:col-span-3 bg-gradient-to-b from-purple-100 to-indigo-100 border-r border-purple-200 flex flex-col">
          <div className="p-4 flex-1 flex flex-col">
            {/* Avatar */}
            <div className="mb-4">
              <TutorAvatar isSpeaking={isSpeaking} />
              <div className="text-center mt-2">
                <p className="text-sm font-semibold text-purple-900">Mama Tutor</p>
                <p className="text-xs text-purple-600">Teaching {currentStudent.name}</p>
              </div>
            </div>
            
            {/* Mode Selector */}
            {learningMode === 'welcome' && (
              <div className="space-y-2 mt-4">
                <Button
                  onClick={startLearningMode}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isWaitingForResponse}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Start Learning
                </Button>
                <Button
                  onClick={startDeepDive}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isWaitingForResponse}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Deep Dive
                </Button>
                <Button
                  onClick={startQuizMode}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isWaitingForResponse}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Take Quiz
                </Button>
              </div>
            )}
            
            {/* Current Mode Badge */}
            {learningMode !== 'welcome' && (
              <div className="mt-4">
                <Badge className="w-full justify-center py-2">
                  {learningMode === 'learning' && '📚 Learning Mode'}
                  {learningMode === 'deep_dive' && '🧠 Deep Dive'}
                  {learningMode === 'quiz' && '🏆 Quiz Mode'}
                </Badge>
                
                <div className="mt-4 space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => explainCurrentPage()}
                    disabled={isWaitingForResponse}
                  >
                    <Lightbulb className="h-3 w-3 mr-2" />
                    Re-explain
                  </Button>
                  
                  {chapterInfo.images && chapterInfo.images.length > 1 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                        disabled={currentImageIndex === 0}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setCurrentImageIndex(Math.min(chapterInfo.images.length - 1, currentImageIndex + 1))}
                        disabled={currentImageIndex === chapterInfo.images.length - 1}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Tutor Message Box */}
            <Card className="mt-4 flex-1">
              <CardContent className="p-3 h-full overflow-y-auto">
                <div className="text-sm text-gray-800 whitespace-pre-wrap">
                  {currentMessage || 'Loading...'}
                </div>
                {isWaitingForResponse && (
                  <div className="mt-2 flex items-center gap-2 text-purple-600">
                    <div className="animate-bounce">💭</div>
                    <span className="text-xs">Thinking...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT: Content Pages */}
        <div className="lg:col-span-9 flex flex-col">
          {/* Page Display */}
          {chapterInfo.images && chapterInfo.images.length > 0 ? (
            <div className="flex-1 bg-white p-6 overflow-hidden flex items-center justify-center">
              <div className="relative max-w-4xl w-full">
                <img
                  src={`${BACKEND_URL}${chapterInfo.images[currentImageIndex]}`}
                  alt={`Page ${currentImageIndex + 1}`}
                  className="w-full h-auto rounded-lg shadow-2xl border-4 border-purple-200"
                  style={{ maxHeight: 'calc(100vh - 250px)', objectFit: 'contain' }}
                />
                <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                  Page {currentImageIndex + 1} / {chapterInfo.images.length}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No visual content available</p>
              </div>
            </div>
          )}

          {/* Student Input Area */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <Input
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleStudentQuestion();
                    }
                  }}
                  placeholder="Ask mama anything: 'What is...?', 'Can you explain...?', 'Give me an example...'"
                  className="flex-1"
                  disabled={isWaitingForResponse}
                />
                <Button
                  onClick={handleStudentQuestion}
                  disabled={isWaitingForResponse || !studentInput.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Ask
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 Tip: You can interrupt mama anytime to ask questions or request examples!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningSession;