import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '@/App';
import axios from 'axios';
import { ArrowLeft, Send, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import TutorAvatar from '@/components/TutorAvatar';

const InteractiveLearning = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapterId = searchParams.get('chapter');
  
  const { currentStudent, API } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chapterInfo, setChapterInfo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentStudent) {
      toast.error('Please select a student first');
      navigate('/profile');
      return;
    }
    
    if (chapterId) {
      loadChapterAndGreet();
    } else {
      sendGreeting();
    }
  }, [currentStudent, chapterId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChapterAndGreet = async () => {
    try {
      const response = await axios.post(`${API}/chat/interactive`, null, {
        params: {
          student_id: currentStudent.id,
          chapter_id: chapterId,
          action: 'suggest_chapter'
        }
      });
      
      const tutorMessage = {
        role: 'assistant',
        content: response.data.response,
        response_type: response.data.action,
        timestamp: new Date().toISOString()
      };
      
      setMessages([tutorMessage]);
      speak(response.data.response);
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
        content: `Hello ${currentStudent.name}! 👋 I'm so excited to learn with you today! What subject or topic would you like to explore?`,
        response_type: 'greeting',
        timestamp: new Date().toISOString()
      };
      setMessages([fallbackMessage]);
      speak(fallbackMessage.content);
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
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

    try {
      const response = await axios.post(`${API}/chat`, {
        student_id: currentStudent.id,
        message: inputMessage,
        textbook_ids: null
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
        }, 2000);
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

  if (!currentStudent) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/learning-path')}
            className="flex items-center gap-2"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Learning Path
          </Button>
          
          {isSpeaking && (
            <Button
              variant="outline"
              onClick={stopSpeaking}
              className="flex items-center gap-2"
              data-testid="stop-speaking-btn"
            >
              <VolumeX className="h-4 w-4" />
              Stop Speaking
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-12rem)]" data-testid="learning-container">
              <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  Interactive Learning Session
                </CardTitle>
                <p className="text-sm text-gray-600">Your AI tutor is here to guide you!</p>
              </CardHeader>
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4" data-testid="messages-container">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${idx}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : msg.response_type === 'greeting'
                            ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-gray-900 border-2 border-indigo-200'
                            : msg.response_type === 'check_understanding'
                            ? 'bg-yellow-50 text-gray-900 border-2 border-yellow-200'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {msg.role === 'assistant' && msg.response_type && (
                          <div className="text-xs mb-2 font-semibold opacity-75">
                            {msg.response_type === 'greeting' && '👋 Welcome!'}
                            {msg.response_type === 'explanation' && '📚 Explaining...'}
                            {msg.response_type === 'quiz' && '📝 Quiz Time!'}
                            {msg.response_type === 'check_understanding' && '🤔 Quick Check!'}
                            {msg.response_type === 'suggest_chapter' && '📖 Chapter Introduction'}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                            <div className="font-medium mb-1">Sources:</div>
                            {msg.sources.map((src, i) => (
                              <div key={i} className="text-gray-600">
                                • {src.textbook} ({src.subject})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex justify-start" data-testid="loading-indicator">
                      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-bounce">💭</div>
                          <span className="text-gray-700">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2" data-testid="input-container">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask your tutor anything or answer their question..."
                    disabled={loading}
                    className="flex-1"
                    data-testid="message-input"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || !inputMessage.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    data-testid="send-btn"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card data-testid="avatar-card">
              <CardHeader>
                <CardTitle className="text-center">Your Tutor</CardTitle>
              </CardHeader>
              <CardContent>
                <TutorAvatar isSpeaking={isSpeaking} />
                
                <div className="mt-4 text-center text-sm text-gray-600">
                  <p className="font-medium mb-2">Learning with {currentStudent.name}</p>
                  <p className="text-xs">Your tutor adapts to your learning pace!</p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="tips-card">
              <CardHeader>
                <CardTitle className="text-sm">💡 Learning Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-gray-600">
                  <li>✓ Your tutor will check your understanding</li>
                  <li>✓ Ask questions anytime</li>
                  <li>✓ Request deeper explanations</li>
                  <li>✓ Take quizzes to test knowledge</li>
                  <li>✓ Review chapters as needed</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveLearning;