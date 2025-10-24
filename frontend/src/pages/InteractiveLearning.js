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
      // Load chapter info (you'll need to create this endpoint or get it from textbooks)
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
      
      // After explanation, check understanding
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
    <div className=\"min-h-screen p-4 md:p-8\">\n      <div className=\"max-w-7xl mx-auto\">\n        {/* Header */}\n        <div className=\"mb-6 flex items-center justify-between\">\n          <Button\n            variant=\"ghost\"\n            onClick={() => navigate('/learning-path')}\n            className=\"flex items-center gap-2\"\n            data-testid=\"back-btn\"\n          >\n            <ArrowLeft className=\"h-4 w-4\" />\n            Back to Learning Path\n          </Button>\n          \n          {isSpeaking && (\n            <Button\n              variant=\"outline\"\n              onClick={stopSpeaking}\n              className=\"flex items-center gap-2\"\n              data-testid=\"stop-speaking-btn\"\n            >\n              <VolumeX className=\"h-4 w-4\" />\n              Stop Speaking\n            </Button>\n          )}\n        </div>\n\n        <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">\n          {/* Chat Area */}\n          <div className=\"lg:col-span-2\">\n            <Card className=\"h-[calc(100vh-12rem)]\" data-testid=\"learning-container\">\n              <CardHeader className=\"border-b bg-gradient-to-r from-indigo-50 to-purple-50\">\n                <CardTitle className=\"flex items-center gap-2\">\n                  <Sparkles className=\"h-5 w-5 text-indigo-600\" />\n                  Interactive Learning Session\n                </CardTitle>\n                <p className=\"text-sm text-gray-600\">Your AI tutor is here to guide you!</p>\n              </CardHeader>\n              <CardContent className=\"p-4 flex flex-col h-full\">\n                {/* Messages */}\n                <div className=\"flex-1 overflow-y-auto space-y-4 mb-4\" data-testid=\"messages-container\">\n                  {messages.map((msg, idx) => (\n                    <div\n                      key={idx}\n                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}\n                      data-testid={`message-${idx}`}\n                    >\n                      <div\n                        className={`max-w-[80%] p-4 rounded-lg ${\n                          msg.role === 'user'\n                            ? 'bg-indigo-600 text-white'\n                            : msg.response_type === 'greeting'\n                            ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-gray-900 border-2 border-indigo-200'\n                            : msg.response_type === 'check_understanding'\n                            ? 'bg-yellow-50 text-gray-900 border-2 border-yellow-200'\n                            : 'bg-gray-100 text-gray-900'\n                        }`}\n                      >\n                        {msg.role === 'assistant' && msg.response_type && (\n                          <div className=\"text-xs mb-2 font-semibold opacity-75\">\n                            {msg.response_type === 'greeting' && '👋 Welcome!'}\n                            {msg.response_type === 'explanation' && '📚 Explaining...'}\n                            {msg.response_type === 'quiz' && '📝 Quiz Time!'}\n                            {msg.response_type === 'check_understanding' && '🤔 Quick Check!'}\n                            {msg.response_type === 'suggest_chapter' && '📖 Chapter Introduction'}\n                          </div>\n                        )}\n                        <div className=\"whitespace-pre-wrap\">{msg.content}</div>\n                        {msg.sources && msg.sources.length > 0 && (\n                          <div className=\"mt-2 pt-2 border-t border-gray-300 text-xs\">\n                            <div className=\"font-medium mb-1\">Sources:</div>\n                            {msg.sources.map((src, i) => (\n                              <div key={i} className=\"text-gray-600\">\n                                • {src.textbook} ({src.subject})\n                              </div>\n                            ))}\n                          </div>\n                        )}\n                      </div>\n                    </div>\n                  ))}\n                  \n                  {loading && (\n                    <div className=\"flex justify-start\" data-testid=\"loading-indicator\">\n                      <div className=\"bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-lg\">\n                        <div className=\"flex items-center gap-2\">\n                          <div className=\"animate-bounce\">💭</div>\n                          <span className=\"text-gray-700\">Thinking...</span>\n                        </div>\n                      </div>\n                    </div>\n                  )}\n                  <div ref={messagesEndRef} />\n                </div>\n\n                {/* Input */}\n                <div className=\"flex gap-2\" data-testid=\"input-container\">\n                  <Input\n                    value={inputMessage}\n                    onChange={(e) => setInputMessage(e.target.value)}\n                    onKeyPress={handleKeyPress}\n                    placeholder=\"Ask your tutor anything or answer their question...\"\n                    disabled={loading}\n                    className=\"flex-1\"\n                    data-testid=\"message-input\"\n                  />\n                  <Button\n                    onClick={handleSendMessage}\n                    disabled={loading || !inputMessage.trim()}\n                    className=\"bg-indigo-600 hover:bg-indigo-700\"\n                    data-testid=\"send-btn\"\n                  >\n                    <Send className=\"h-4 w-4\" />\n                  </Button>\n                </div>\n              </CardContent>\n            </Card>\n          </div>\n\n          {/* Sidebar with Avatar */}\n          <div className=\"space-y-6\">\n            <Card data-testid=\"avatar-card\">\n              <CardHeader>\n                <CardTitle className=\"text-center\">Your Tutor</CardTitle>\n              </CardHeader>\n              <CardContent>\n                <TutorAvatar isSpeaking={isSpeaking} />\n                \n                <div className=\"mt-4 text-center text-sm text-gray-600\">\n                  <p className=\"font-medium mb-2\">Learning with {currentStudent.name}</p>\n                  <p className=\"text-xs\">Your tutor adapts to your learning pace!</p>\n                </div>\n              </CardContent>\n            </Card>\n\n            {/* Quick Tips */}\n            <Card data-testid=\"tips-card\">\n              <CardHeader>\n                <CardTitle className=\"text-sm\">💡 Learning Tips</CardTitle>\n              </CardHeader>\n              <CardContent>\n                <ul className=\"space-y-2 text-xs text-gray-600\">\n                  <li>✓ Your tutor will check your understanding</li>\n                  <li>✓ Ask questions anytime</li>\n                  <li>✓ Request deeper explanations</li>\n                  <li>✓ Take quizzes to test knowledge</li>\n                  <li>✓ Review chapters as needed</li>\n                </ul>\n              </CardContent>\n            </Card>\n          </div>\n        </div>\n      </div>\n    </div>
  );
};

export default InteractiveLearning;
