import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/App';
import axios from 'axios';
import { ArrowLeft, Send, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import TutorAvatar from '@/components/TutorAvatar';

const TutorChat = () => {
  const navigate = useNavigate();
  const { currentStudent, textbooks, API } = useContext(AppContext);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTextbooks, setSelectedTextbooks] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentStudent) {
      toast.error('Please select a student first');
      navigate('/profile');
    }
  }, [currentStudent, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
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
        textbook_ids: selectedTextbooks.length > 0 ? selectedTextbooks : null
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        response_type: response.data.response_type,
        sources: response.data.sources,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response
      speak(response.data.response);
      
      if (response.data.response_type === 'quiz') {
        toast.success('Time for a quiz! Test your knowledge!');
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
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
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
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-12rem)]" data-testid="chat-container">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-indigo-600" />
                  Chat with Your Tutor
                </CardTitle>
                <p className="text-sm text-gray-500">Ask questions and learn!</p>
              </CardHeader>
              <CardContent className="p-4 flex flex-col h-full">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4" data-testid="messages-container">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8" data-testid="welcome-message">
                      <p className="text-lg mb-2">👋 Hi {currentStudent.name}!</p>
                      <p>I'm your virtual tutor. Ask me anything about your textbooks!</p>
                    </div>
                  )}
                  
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
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {msg.role === 'assistant' && msg.response_type && (
                          <div className="text-xs mb-2 opacity-75">
                            {msg.response_type === 'quiz' ? '📝 Quiz Mode' : '📚 Explanation Mode'}
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
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="animate-bounce">●</div>
                          <div className="animate-bounce delay-100">●</div>
                          <div className="animate-bounce delay-200">●</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2" data-testid="input-container">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask your tutor anything..."
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Avatar */}
            <Card data-testid="avatar-card">
              <CardHeader>
                <CardTitle className="text-center">Your Tutor</CardTitle>
              </CardHeader>
              <CardContent>
                <TutorAvatar isSpeaking={isSpeaking} />
              </CardContent>
            </Card>

            {/* Textbook Selection */}
            <Card data-testid="textbook-selection-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Select Textbooks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {textbooks.map((tb) => (
                    <label
                      key={tb.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      data-testid={`textbook-checkbox-${tb.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTextbooks.includes(tb.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTextbooks([...selectedTextbooks, tb.id]);
                          } else {
                            setSelectedTextbooks(selectedTextbooks.filter(id => id !== tb.id));
                          }
                        }}
                        className="rounded"
                      />
                      <div>
                        <div className="text-sm font-medium">{tb.title}</div>
                        <div className="text-xs text-gray-500">{tb.subject}</div>
                      </div>
                    </label>
                  ))}
                  {textbooks.length === 0 && (
                    <p className="text-sm text-gray-500" data-testid="no-textbooks-message">
                      No textbooks available. Upload some first!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorChat;