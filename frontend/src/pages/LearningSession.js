import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '@/App';
import axios from 'axios';
import { ArrowLeft, Volume2, VolumeX, ChevronLeft, ChevronRight, BookOpen, Lightbulb, Brain, Trophy, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import TutorAvatar from '@/components/TutorAvatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const LearningSession = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapterId = searchParams.get('chapter');
  
  const { currentStudent, API } = useContext(AppContext);
  const [chapterInfo, setChapterInfo] = useState(null);
  const [allChapters, setAllChapters] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const audioRef = useRef(null);
  // Removed unused audio context refs

  useEffect(() => {
    if (!currentStudent) {
      toast.error('Please select a student first');
      navigate('/profile');
      return;
    }
    
    if (chapterId) {
      loadChapterAndTextbook();
    }

    return () => {
      stopSpeaking();
    };
  }, [currentStudent, chapterId]);

  const loadChapterAndTextbook = async () => {
    try {
      // Load current chapter
      const chapterRes = await axios.get(`${API}/chapter/${chapterId}`);
      setChapterInfo(chapterRes.data);
      
      // Load all chapters from the textbook
      const chaptersRes = await axios.get(`${API}/textbooks/${chapterRes.data.textbook_id}/chapters`);
      setAllChapters(chaptersRes.data.chapters || []);
      
      // Find current chapter index
      const currentIndex = chaptersRes.data.chapters?.findIndex(ch => ch.id === chapterId) || 0;
      setCurrentChapterIndex(currentIndex);
      
      // Welcome message
      const welcomeMsg = `Hello my dear ${currentStudent.name}! Welcome to Chapter ${chapterRes.data.chapter_number}: ${chapterRes.data.chapter_title}. Let's explore this together!`;
      await speakWithTTS(welcomeMsg);
      
    } catch (error) {
      console.error('Error loading chapter:', error);
      toast.error('Failed to load chapter');
    }
  };

  const speakWithTTS = async (text) => {
    try {
      if (isSpeaking) {
        stopSpeaking();
      }

      setIsSpeaking(true);
      
      // Use browser's Speech Synthesis API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text.substring(0, 2000));
        
        // Try to get a female voice
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => 
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('nova') ||
          (v.lang.startsWith('en') && v.name.toLowerCase().includes('google'))
        );
        
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          setIsSpeaking(true);
          // Simulate audio level for animation
          const interval = setInterval(() => {
            setAudioLevel(Math.random() * 0.8 + 0.2);
          }, 100);
          utterance.onend = () => {
            clearInterval(interval);
            setIsSpeaking(false);
            setAudioLevel(0);
          };
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        toast.error('Speech synthesis not supported in your browser');
        setIsSpeaking(false);
      }
      
    } catch (error) {
      console.error('TTS error:', error);
      toast.error('Failed to generate speech');
      setIsSpeaking(false);
    }
  };

  // Audio visualization removed - now using Speech Synthesis API

  const stopSpeaking = () => {
    // Stop Speech Synthesis API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Legacy audio cleanup (if any)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setAudioLevel(0);
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl);
      setCurrentAudioUrl(null);
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (chapterInfo) {
      const text = `Chapter ${chapterInfo.chapter_number}: ${chapterInfo.chapter_title}. ${chapterInfo.chapter_summary || chapterInfo.content_preview}`;
      speakWithTTS(text);
    }
  };

  const goToNextChapter = () => {
    if (currentChapterIndex < allChapters.length - 1) {
      const nextChapter = allChapters[currentChapterIndex + 1];
      navigate(`/learn?chapter=${nextChapter.id}`);
      window.location.reload();
    }
  };

  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      const prevChapter = allChapters[currentChapterIndex - 1];
      navigate(`/learn?chapter=${prevChapter.id}`);
      window.location.reload();
    }
  };

  const explainConcept = async (concept) => {
    const explanation = `Let me explain ${concept} for you, sweetheart. ${concept} is an important concept in this chapter.`;
    await speakWithTTS(explanation);
  };

  if (!chapterInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/learning-path')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learning Path
          </Button>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              Chapter {chapterInfo.chapter_number}
            </Badge>
            <div className="text-sm text-gray-600">
              Student: <span className="font-medium">{currentStudent?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          
          {/* Left Side - Avatar (30%) */}
          <div className="lg:col-span-4">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-center">Your AI Tutor</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col items-center justify-center">
                <TutorAvatar isSpeaking={isSpeaking} audioLevel={audioLevel} />
                
                {/* Voice Controls */}
                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={toggleSpeaking}
                    variant={isSpeaking ? "destructive" : "default"}
                    className="flex items-center gap-2"
                  >
                    {isSpeaking ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Listen
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Quick Actions */}
                <div className="mt-8 w-full space-y-2">
                  <p className="text-xs text-gray-500 text-center mb-2">Quick Actions</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => explainConcept(chapterInfo.chapter_title)}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Explain Simply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => speakWithTTS(`Let's dive deeper into ${chapterInfo.chapter_title}`)}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Deep Dive
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => speakWithTTS(`Ready for a quiz on ${chapterInfo.chapter_title}?`)}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Take Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Content (70%) */}
          <div className="lg:col-span-8">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {chapterInfo.chapter_title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Chapter {chapterInfo.chapter_number}
                    </p>
                  </div>
                  
                  {/* Chapter Navigation */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToPreviousChapter}
                      disabled={currentChapterIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToNextChapter}
                      disabled={currentChapterIndex === allChapters.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto">
                {/* Chapter Summary */}
                {chapterInfo.chapter_summary && (
                  <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h3 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Summary
                    </h3>
                    <p className="text-sm text-gray-700">{chapterInfo.chapter_summary}</p>
                  </div>
                )}
                
                {/* Chapter Content */}
                <div className="prose prose-sm max-w-none">
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {chapterInfo.content_preview}
                  </div>
                </div>
                
                {/* Images */}
                {chapterInfo.images && chapterInfo.images.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Related Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {chapterInfo.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={`${process.env.REACT_APP_BACKEND_URL}${img}`}
                          alt={`Chapter ${chapterInfo.chapter_number} - Image ${idx + 1}`}
                          className="rounded-lg shadow-md w-full h-auto"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Interactive Learning Section */}
                <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-900 mb-3">
                    💡 Need Help Understanding?
                  </h3>
                  <Input
                    placeholder="Ask your tutor anything about this chapter..."
                    className="mb-2"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value) {
                        speakWithTTS(`Let me explain: ${e.target.value}`);
                        e.target.value = '';
                      }
                    }}
                  />
                  <p className="text-xs text-gray-600">
                    Press Enter to ask your question
                  </p>
                </div>
                
                {/* Progress Indicator */}
                <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Chapter Progress</span>
                    <span className="text-sm text-green-700">
                      {currentChapterIndex + 1} of {allChapters.length}
                    </span>
                  </div>
                  <Progress value={((currentChapterIndex + 1) / allChapters.length) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningSession;
