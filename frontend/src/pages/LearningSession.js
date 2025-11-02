import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '@/App';
import axios from 'axios';
import { ArrowLeft, Volume2, VolumeX, ChevronLeft, ChevronRight, BookOpen, Lightbulb, Brain, Trophy, Play, Pause, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // <-- ADDED: Label import for QuizOverlay
import { toast } from 'sonner';
import TutorAvatar from '@/components/TutorAvatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const LearningSession = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const chapterId = searchParams.get('chapter');
    
    // Using audioRef as placeholder, although not fully implemented
    const audioRef = useRef(null); 
    
    const { currentStudent, API } = useContext(AppContext);
    // Note: allChapters was removed in previous code update, but may be needed for chapter nav.
    // Assuming chapterInfo has the textbook_id and chapter title.

    const [chapterInfo, setChapterInfo] = useState(null);
    const [allBookPages, setAllBookPages] = useState([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0); 
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [quizData, setQuizData] = useState(null);
    const [progressMetrics, setProgressMetrics] = useState({ mastery: 0, accuracy: 0, fluency: 0 });
    const [inputMessage, setInputMessage] = useState('');

    const totalPages = allBookPages.length;
    const currentImageUrl = allBookPages[currentPageIndex];

    // --- NAVIGATION HELPERS (FIXING ReferenceError) ---
    // Note: We need a placeholder for allChapters length for the disabled state to work.
    // Assuming the page navigation buttons should use the page index, not chapter index.

    const goToNextPage = () => {
        if (currentPageIndex < totalPages - 1) {
            setCurrentPageIndex(currentPageIndex + 1);
            // Assuming speakWithTTS is defined below
            // speakWithTTS(`Moving to page ${currentPageIndex + 2}`); 
        }
    };

    const goToPreviousPage = () => {
        if (currentPageIndex > 0) {
            setCurrentPageIndex(currentPageIndex - 1);
            // Assuming speakWithTTS is defined below
            // speakWithTTS(`Going back to page ${currentPageIndex}`); 
        }
    };
    
    const handleBack = () => {
        stopSpeaking();
        navigate('/learning-path');
    };
    // --- END NAVIGATION HELPERS ---


    useEffect(() => {
        if (!currentStudent) {
            toast.error('Please select a student first');
            navigate('/profile');
            return;
        }
        
        if (chapterId) {
            loadChapterAndBookData();
            fetchProgressMetrics(); 
            const metricInterval = setInterval(fetchProgressMetrics, 15000); 
            return () => clearInterval(metricInterval);
        }

        return () => {
            stopSpeaking();
        };
    }, [currentStudent, chapterId]);

    const fetchProgressMetrics = async () => {
        if (!currentStudent) return;
        try {
            // Note: This endpoint is a placeholder and must be implemented in server.py
            const response = await axios.get(`${API}/students/${currentStudent.id}/metrics`); 
            setProgressMetrics(response.data); 
        } catch (error) {
            console.error('Error fetching progress metrics:', error);
        }
    };
    
    const loadChapterAndBookData = async () => {
        // ... (existing implementation for loading chapter and all book pages)
        try {
            const chapterRes = await axios.get(`${API}/chapter/${chapterId}`);
            const textbookId = chapterRes.data.textbook_id;
            setChapterInfo(chapterRes.data);
            
            const pagesRes = await axios.get(`${API}/textbooks/${textbookId}/pages`);
            const pages = pagesRes.data.page_paths || [];
            setAllBookPages(pages);

            const chapterStartImage = chapterRes.data.images[0];
            const startIndex = pages.findIndex(path => path === chapterStartImage);
            if (startIndex !== -1) {
                setCurrentPageIndex(startIndex);
            }
            
            const welcomeMsg = `Hello my dear ${currentStudent.name}! We're starting Chapter ${chapterRes.data.chapter_number}: ${chapterRes.data.chapter_title}. Let's explore the first page!`;
            await speakWithTTS(welcomeMsg);
            
        } catch (error) {
            console.error('Error loading book data:', error);
            toast.error('Failed to load book pages or chapter data');
        }
    };

    const speakWithTTS = async (text) => {
        try {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
            }

            setIsSpeaking(true);
            
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text.substring(0, 2000));
                
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

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
        setAudioLevel(0);
    };

    const toggleSpeaking = () => {
        if (isSpeaking) {
            stopSpeaking();
        } else if (chapterInfo) {
            const text = `Now viewing page ${currentPageIndex + 1} of the book. Let's start with the summary: ${chapterInfo.chapter_summary || chapterInfo.content_preview}`;
            speakWithTTS(text);
        }
    };

    const handleAskQuestion = async (query) => {
        if (!query.trim()) return;
        stopSpeaking();

        try {
            // Note: response_type 'explanation' triggers structured real-world explanation in backend
            const response = await axios.post(`${API}/chat`, {
                student_id: currentStudent.id,
                message: query,
                textbook_ids: [chapterInfo.textbook_id],
                response_type: 'explanation' 
            });

            const responseText = response.data.response;
            toast.success("Mama is explaining!");
            await speakWithTTS(responseText);

            setTimeout(() => {
                speakWithTTS("Did mama explain that clearly, sweetheart? If you still feel confused, press the 'Deep Dive' button, and we can explore a bit more!");
            }, 8000);

        } catch (error) {
            toast.error('Failed to get explanation');
        } finally {
            setInputMessage('');
        }
    };

    const startDeepDive = async () => {
        stopSpeaking();
        setQuizData(null); 
        
        try {
            const response = await axios.post(`${API}/chat/interactive`, null, {
                params: {
                    student_id: currentStudent.id,
                    chapter_id: chapterId,
                    action: 'deep_dive', 
                    word: chapterInfo.chapter_title 
                }
            });
            const deepDiveContent = response.data.response;
            
            toast.info("Deep Dive Explanation Started!");
            await speakWithTTS(deepDiveContent);
            
            setTimeout(() => {
                speakWithTTS("Now that we went deeper, sweetheart, ready for a challenging quiz? Press the 'Take Quiz' button when you are ready!");
            }, 5000); 
            
        } catch (error) {
            console.error('Failed to start Deep Dive session.');
            toast.error('Failed to start Deep Dive session.');
        }
    };

    const startQuizMode = async () => {
        stopSpeaking();
        
        try {
            const response = await axios.post(`${API}/chat`, {
                student_id: currentStudent.id,
                message: chapterInfo.chapter_title, 
                textbook_ids: [chapterInfo.textbook_id],
                response_type: 'quiz' 
            });
            
            const jsonMatch = response.data.response.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const parsedQuiz = JSON.parse(jsonMatch[0]);
                setQuizData({
                    id: parsedQuiz.topic_area + Date.now(),
                    ...parsedQuiz
                });
                toast.success("Ready for a challenging quiz!");
                speakWithTTS(`Ready for a quiz, my dear! I've prepared a challenging question for you!`);
            } else {
                speakWithTTS("I'm sorry, I couldn't create the quiz question right now. Let's try again in a moment!");
            }
            
        } catch (error) {
            console.error('Error generating quiz:', error);
        } 
    };

    const handleQuizSubmission = (selectedAnswer, correctAnswer) => {
        const isCorrect = selectedAnswer === correctAnswer;
        handleAnswerSubmission(isCorrect);
    };

    const handleAnswerSubmission = (isCorrect) => {
        setQuizData(null);
        fetchProgressMetrics(); 
        
        if (isCorrect) {
            toast.success("That's correct, sweetheart! You're so smart!");
        } else {
            toast.error("That's okay, my dear! Let's review the topic together.");
        }
        
        speakWithTTS("Shall we try a new question, or would you like to review this topic with mama?");
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAskQuestion(inputMessage);
            setInputMessage(''); 
        }
    };
    
    // --- QUIZ Component (Integrated directly into render for simplicity) ---
    const QuizOverlay = () => {
        if (!quizData) return null;
        
        const [selectedOption, setSelectedOption] = useState(null);
        
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                <Card className="w-full max-w-lg p-6 animate-in fade-in-0 zoom-in-95">
                    <CardTitle className="text-purple-600 flex items-center gap-2 mb-4">
                        <Trophy className="h-6 w-6" /> Challenging Quiz Time!
                    </CardTitle>
                    <CardContent className="p-0">
                        <p className="text-lg font-medium mb-4">{quizData.question}</p>
                        
                        <RadioGroup onValueChange={setSelectedOption} className="space-y-3">
                            {quizData.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option.substring(0, 1)} id={`option-${index}`} />
                                    <Label htmlFor={`option-${index}`}>{option}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                        
                        <div className="flex justify-end mt-6 gap-3">
                            <Button variant="outline" onClick={() => setQuizData(null)}>Cancel</Button>
                            <Button 
                                onClick={() => handleQuizSubmission(selectedOption, quizData.correct_answer)}
                                disabled={!selectedOption}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                Submit Answer
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };
    // --- END QUIZ COMPONENT ---


    if (!chapterInfo || allBookPages.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your textbook pages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {QuizOverlay()}
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Learning Path
                    </Button>

                    <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                            Textbook: {chapterInfo.textbook_title}
                        </Badge>
                        <div className="text-sm text-gray-600">
                            Student: <span className="font-medium">{currentStudent?.name}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Page Viewer Layout */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">

                    {/* Left Side - Avatar & Controls (30%) */}
                    <div className="lg:col-span-4">
                        <Card className="h-full flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-center">Your AI Tutor</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col items-center justify-start pt-6">
                                <TutorAvatar isSpeaking={isSpeaking} audioLevel={audioLevel} />

                                {/* Voice Controls */}
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={toggleSpeaking}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${isSpeaking ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                    >
                                        {isSpeaking ? (
                                            <>
                                                <Pause className="h-4 w-4" />
                                                Stop Reading
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-4 w-4" />
                                                Read Page
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Analytics (Req 5) */}
                                <div className="mt-8 w-full px-4">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                                        <Lightbulb className="h-4 w-4 text-green-600" />
                                        Your Real-Time Progress (Req 5)
                                    </h3>

                                    <div className="space-y-3">
                                        {/* Mastery Level (Req 5) */}
                                        <div className="text-xs">
                                            <div className="flex justify-between font-medium">
                                                <span>Mastery of Topics</span>
                                                <span className={progressMetrics.mastery > 0.7 ? "text-green-600" : "text-orange-500"}>
                                                    {(progressMetrics.mastery * 100).toFixed(0) || 0}%
                                                </span>
                                            </div>
                                            <Progress value={(progressMetrics.mastery || 0) * 100} className="h-2 mt-1" />
                                        </div>

                                        {/* Fluency/Clarity Score (Req 10) */}
                                        <div className="text-xs">
                                            <div className="flex justify-between font-medium">
                                                <span>Fluency & Clarity Score</span>
                                                <span className={progressMetrics.fluency > 0.7 ? "text-green-600" : "text-indigo-500"}>
                                                    {(progressMetrics.fluency * 100).toFixed(0) || 0}%
                                                </span>
                                            </div>
                                            <Progress value={(progressMetrics.fluency || 0) * 100} className="h-2 mt-1" />
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6 w-11/12" />

                                {/* Quick Actions (Req 3, 4) */}
                                <div className="w-full space-y-2 px-4">
                                    <p className="text-xs text-gray-500 text-center mb-2">Advanced Learning</p>
                                    <Button
                                        size="sm"
                                        className="w-full bg-purple-600 hover:bg-purple-700"
                                        onClick={startDeepDive} // Req 3
                                    >
                                        <Brain className="h-4 w-4 mr-2" />
                                        Deep Dive Explanation
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        onClick={startQuizMode} // Req 4
                                        disabled={!!quizData}
                                    >
                                        <Trophy className="h-4 w-4 mr-2" />
                                        Take Challenging Quiz
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side - High-Clarity Page Viewer (70%) */}
                    <div className="lg:col-span-8 flex flex-col justify-between">
                        <Card className="h-full flex flex-col">
                            <CardHeader className="flex-row items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {chapterInfo.chapter_title} 
                                </h2>

                                {/* Page Navigation */}
                                <div className="flex gap-2 items-center">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={goToPreviousPage}
                                        disabled={currentPageIndex === 0}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium text-gray-700">
                                        Page {currentPageIndex + 1} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={goToNextPage}
                                        disabled={currentPageIndex === totalPages - 1}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-hidden p-0 flex items-center justify-center bg-gray-100">
                                {/* High-Resolution Image Viewer Area */}
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {currentImageUrl ? (
                                        <img
                                            src={`${process.env.REACT_APP_BACKEND_URL}${currentImageUrl}`}
                                            alt={`Textbook Page ${currentPageIndex + 1}`}
                                            className="max-w-full max-h-full object-contain shadow-2xl"
                                        />
                                    ) : (
                                        <div className="text-gray-500">No Image Found for this Page.</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Input Area (Moved outside of the Card to allow full chat interaction) */}
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="flex gap-2">
                        <Input
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask mama anything about this page or answer her question..."
                            className="flex-1"
                        />
                        <Button
                            onClick={() => handleAskQuestion(inputMessage)}
                            disabled={!inputMessage.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        💡 Tip: After an explanation, try answering "Tell mama what you learned!" (Req 9, 10)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LearningSession;
