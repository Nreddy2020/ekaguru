import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '@/App';
import axios from 'axios';
import { ArrowLeft, Send, VolumeX, Sparkles, ChevronLeft, ChevronRight, ZoomIn, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import TutorAvatar from '@/components/TutorAvatar';
import { Progress } from '@/components/ui/progress';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const VisualLearning = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapterId = searchParams.get('chapter');
  
  const { currentStudent, API } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chapterInfo, setChapterInfo] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [completionProgress, setCompletionProgress] = useState(0);
  const messagesEndRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!currentStudent) {
      toast.error('Please select a student first');
      navigate('/profile');
      return;
    }
    
    if (chapterId) {
      loadChapterData();
    } else {
      sendGreeting();
    }

    // Cleanup function to stop speech on unmount
    return () => {
      stopSpeaking();
    };
  }, [currentStudent, chapterId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load available voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Chrome needs this to load voices
      window.speechSynthesis.getVoices();
    }
  }, []);

  const loadChapterData = async () => {
    try {
      const response = await axios.get(`${API}/chapters/${chapterId}`);
      setChapterInfo(response.data);
      
      // Start with chapter introduction
      const introResponse = await axios.post(`${API}/chat/interactive`, null, {
        params: {
          student_id: currentStudent.id,
          chapter_id: chapterId,
          action: 'suggest_chapter'
        }
      });
      
      const tutorMessage = {
        role: 'assistant',
        content: introResponse.data.response,
        response_type: 'suggest_chapter',
        timestamp: new Date().toISOString()
      };
      
      setMessages([tutorMessage]);
      speak(introResponse.data.response);
      
      // Update progress to started
      updateProgress(10);
    } catch (error) {
      console.error('Error loading chapter:', error);
      sendGreeting();
    }
  };

  const sendGreeting = async () => {
    try {
      const response = await axios.post(`${API}/chat/interactive`, null, {
        params: {
          student_id: currentStudent.id,
          action: 'greet'
        }
      });
      
      const tutorMessage = {
        role: 'assistant',
        content: response.data.response,
        response_type: 'greeting',
        timestamp: new Date().toISOString()
      };
      
      setMessages([tutorMessage]);
      speak(response.data.response);
    } catch (error) {
      console.error('Error sending greeting:', error);
      const fallbackMessage = {
        role: 'assistant',
        content: `Hello my dear ${currentStudent.name}! 👋 I'm so happy to see you today! What would you like to learn about? Mama is here to help you!`,
        response_type: 'greeting',
        timestamp: new Date().toISOString()
      };
      setMessages([fallbackMessage]);
      speak(fallbackMessage.content);
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get female voice
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('karen') ||
        v.name.toLowerCase().includes('zira') ||
        (v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('us') && !v.name.toLowerCase().includes('male'))
      ) || voices.find(v => v.lang.startsWith('en'));
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 0.85; // Slower, clearer
      utterance.pitch = 1.15; // Slightly higher, warm and motherly
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

  const updateProgress = async (percentage) => {
    if (!chapterId || !currentStudent) return;
    
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

  const handleWordClick = async (word) => {
    stopSpeaking();
    
    try {
      const response = await axios.post(`${API}/chat/interactive`, null, {
        params: {
          student_id: currentStudent.id,
          action: 'explain_word',
          word: word
        }
      });
      
      const explanation = {
        role: 'assistant',
        content: response.data.response,
        response_type: 'explain_word',
        word: word,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, explanation]);
      speak(response.data.response);
    } catch (error) {
      console.error('Error explaining word:', error);
      toast.error('Failed to explain word');
    }
  };

  const handleExplainWithImages = async () => {
    stopSpeaking();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/chat/interactive`, null, {
        params: {
          student_id: currentStudent.id,
          chapter_id: chapterId,
          action: 'explain_with_images'
        }
      });
      
      const explanation = {
        role: 'assistant',
        content: response.data.response,
        response_type: 'explain_with_images',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, explanation]);
      speak(response.data.response);
      
      // Update progress
      updateProgress(Math.min(completionProgress + 20, 90));
    } catch (error) {
      console.error('Error explaining:', error);
      toast.error('Failed to get explanation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentStudent) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setLoading(true);
    stopSpeaking();

    try {
      const response = await axios.post(`${API}/chat`, {
        student_id: currentStudent.id,
        message: inputMessage,
        textbook_ids: chapterInfo ? [chapterInfo.textbook_id] : null
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        response_type: response.data.response_type,
        sources: response.data.sources,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      speak(response.data.response);
      
      // Update progress
      updateProgress(Math.min(completionProgress + 10, 95));
      
      // Check understanding after explanation
      if (response.data.response_type === 'explanation') {
        setTimeout(async () => {
          try {
            const checkResponse = await axios.post(`${API}/chat/interactive`, null, {
              params: {
                student_id: currentStudent.id,
                action: 'check_understanding'
              }
            });
            
            const checkMessage = {
              role: 'assistant',
              content: checkResponse.data.response,
              response_type: 'check_understanding',
              timestamp: new Date().toISOString()
            };
            
            setMessages(prev => [...prev, checkMessage]);
            speak(checkResponse.data.response);
          } catch (error) {
            console.error('Error checking understanding:', error);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => {
    stopSpeaking();
    navigate('/learning-path');
  };

  if (!currentStudent) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          {isSpeaking && (
            <Button
              variant="outline"
              onClick={stopSpeaking}
              className="flex items-center gap-2 bg-red-50 border-red-200 hover:bg-red-100"
              data-testid="stop-speaking-btn"
            >
              <VolumeX className="h-4 w-4 text-red-600" />
              Stop Voice
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {chapterInfo && (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {chapterInfo.chapter_title}
                </span>
                <span className="text-sm text-gray-500">{completionProgress}%</span>
              </div>
              <Progress value={completionProgress} className="h-2" />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Image Viewer */}
          {chapterInfo && chapterInfo.images && chapterInfo.images.length > 0 && (
            <div className="lg:col-span-2">
              <Card className="mb-4" data-testid="image-viewer">
                <CardHeader>
                  <CardTitle className="text-center text-lg">📖 Let's Look at These Pictures Together!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-white rounded-lg p-4">
                    <img
                      src={`${BACKEND_URL}${chapterInfo.images[currentImageIndex]}`}
                      alt={`Page ${currentImageIndex + 1}`}
                      className="w-full h-auto rounded-lg shadow-lg"
                      style={{ maxHeight: '500px', objectFit: 'contain' }}
                    />
                    
                    {chapterInfo.images.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                          disabled={currentImageIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setCurrentImageIndex(Math.min(chapterInfo.images.length - 1, currentImageIndex + 1))}
                          disabled={currentImageIndex === chapterInfo.images.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Page {currentImageIndex + 1} of {chapterInfo.images.length}
                    </span>
                    <Button
                      onClick={handleExplainWithImages}
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={loading}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Explain This Picture
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chat Area */}
          <div className={chapterInfo && chapterInfo.images?.length > 0 ? 'lg:col-span-1' : 'lg:col-span-2'}>
            <Card className="h-[600px]" data-testid="learning-container">
              <CardHeader className="border-b bg-gradient-to-r from-pink-100 to-purple-100">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <MessageCircle className="h-5 w-5" />
                  Chat with Mama Tutor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-3 mb-4" data-testid="messages-container">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[90%] p-3 rounded-lg text-sm ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : msg.response_type === 'greeting' || msg.response_type === 'suggest_chapter'
                            ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-gray-900 border-2 border-purple-200'
                            : msg.response_type === 'check_understanding'
                            ? 'bg-yellow-50 text-gray-900 border-2 border-yellow-300'
                            : msg.response_type === 'explain_word'
                            ? 'bg-blue-50 text-gray-900 border-2 border-blue-200'
                            : 'bg-gray-50 text-gray-900'
                        }`}
                      >
                        {msg.role === 'assistant' && msg.response_type && (
                          <div className="text-xs mb-1 font-semibold opacity-75">
                            {msg.response_type === 'greeting' && '👋 Hello Sweetheart!'}
                            {msg.response_type === 'explanation' && '📚 Let me explain...'}
                            {msg.response_type === 'suggest_chapter' && '📖 Story Time!'}
                            {msg.response_type === 'explain_word' && `💡 About "${msg.word}"`}
                            {msg.response_type === 'check_understanding' && '🤔 Quick Check!'}
                            {msg.response_type === 'explain_with_images' && '🖼️ Looking at Pictures'}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-bounce">💭</div>
                          <span className="text-sm text-gray-700">Mama is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask mama anything or answer her question..."
                    disabled={loading}
                    className="flex-1"
                    data-testid="message-input"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || !inputMessage.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="send-btn"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Avatar Sidebar */}
          <div className={chapterInfo && chapterInfo.images?.length > 0 ? 'lg:col-span-3' : 'lg:col-span-1'}>
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-sm">Your Mama Tutor 💕</CardTitle>
              </CardHeader>
              <CardContent>
                <TutorAvatar isSpeaking={isSpeaking} />
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-600 italic">"I'm here to help you learn, my dear!"</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualLearning;