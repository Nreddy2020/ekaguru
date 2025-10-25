import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/App';
import axios from 'axios';
import { ArrowLeft, BookOpen, Play, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const LearningPath = () => {
  const navigate = useNavigate();
  const { currentStudent, API } = useContext(AppContext);
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStudent) {
      toast.error('Please select a student first');
      navigate('/profile');
      return;
    }
    fetchLearningPath();
  }, [currentStudent]);

  const fetchLearningPath = async () => {
    if (!currentStudent) return;
    
    try {
      const response = await axios.get(`${API}/students/${currentStudent.id}/learning-path`);
      setLearningPath(response.data);
    } catch (error) {
      console.error('Error fetching learning path:', error);
      toast.error('Failed to load learning path');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChapter = async (chapterId, chapterTitle) => {
    try {
      await axios.post(`${API}/learning/start-chapter`, null, {
        params: {
          student_id: currentStudent.id,
          chapter_id: chapterId
        }
      });
      
      toast.success(`Starting: ${chapterTitle}`);
      // Navigate to interactive chat with chapter context
      navigate(`/learn?chapter=${chapterId}`);
    } catch (error) {
      console.error('Error starting chapter:', error);
      toast.error('Failed to start chapter');
    }
  };

  const handleDeleteTextbook = async (textbookId, textbookTitle) => {
    try {
      await axios.delete(`${API}/textbooks/${textbookId}`);
      toast.success(`Deleted: ${textbookTitle}`);
      fetchLearningPath();
    } catch (error) {
      console.error('Error deleting textbook:', error);
      toast.error('Failed to delete textbook');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5" />;
      case 'in_progress': return <Clock className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your learning path...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-4"
            data-testid="back-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📚 Your Learning Journey
          </h1>
          <p className="text-gray-600">
            Choose a chapter to start learning, {currentStudent?.name}!
          </p>
        </div>

        {/* Learning Path */}
        {learningPath && learningPath.textbooks.length > 0 ? (
          <div className="space-y-6">
            {learningPath.textbooks.map((textbook) => (
              <Card key={textbook.textbook_id} data-testid={`textbook-${textbook.textbook_id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-6 w-6 text-indigo-600" />
                      <div>
                        <CardTitle>{textbook.title}</CardTitle>
                        <CardDescription>
                          {textbook.subject} • {textbook.total_chapters} chapters
                        </CardDescription>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-textbook-${textbook.textbook_id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Textbook?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{textbook.title}"? This will remove all chapters and images. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTextbook(textbook.textbook_id, textbook.title)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {textbook.chapters.length > 0 ? (
                    <div className="space-y-3">
                      {textbook.chapters.map((chapter) => (
                        <div
                          key={chapter.chapter_id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          data-testid={`chapter-${chapter.chapter_id}`}
                        >
                          <div className={`p-2 rounded-lg ${getStatusColor(chapter.status)}`}>
                            {getStatusIcon(chapter.status)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                Chapter {chapter.chapter_number}
                              </span>
                              <span className="text-gray-600">{chapter.chapter_title}</span>
                            </div>
                            
                            {chapter.status === 'in_progress' && (
                              <div className="mt-2">
                                <Progress value={chapter.completion_percentage} className="h-2" />
                                <p className="text-xs text-gray-500 mt-1">
                                  {chapter.completion_percentage}% complete
                                </p>
                              </div>
                            )}
                            
                            {chapter.status === 'completed' && (
                              <p className="text-sm text-green-600 mt-1">
                                ✓ Completed!
                              </p>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => handleStartChapter(chapter.chapter_id, chapter.chapter_title)}
                            className={`${
                              chapter.status === 'completed'
                                ? 'bg-green-600 hover:bg-green-700'
                                : chapter.status === 'in_progress'
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                            data-testid={`start-chapter-${chapter.chapter_id}`}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {chapter.status === 'completed'
                              ? 'Review'
                              : chapter.status === 'in_progress'
                              ? 'Continue'
                              : 'Start'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8" data-testid="no-chapters">
                      No chapters available in this textbook
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card data-testid="no-textbooks">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No textbooks uploaded yet</p>
              <Button
                onClick={() => navigate('/upload')}
                className="bg-indigo-600 hover:bg-indigo-700"
                data-testid="upload-first-textbook-btn"
              >
                Upload Your First Textbook
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LearningPath;