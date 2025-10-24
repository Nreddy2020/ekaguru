import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/App';
import { BookOpen, MessageSquare, User, Upload, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentStudent, textbooks, students } = useContext(AppContext);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-16 w-16 text-indigo-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Virtual Tutor
          </h1>
          <p className="text-xl text-gray-600">
            Your AI-powered learning companion
          </p>
        </div>

        {/* Welcome Section */}
        {currentStudent && (
          <Card className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none" data-testid="welcome-card">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome back, {currentStudent.name}! 👋</CardTitle>
              <CardDescription className="text-indigo-100">
                Ready to continue your learning journey?
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="students-stat">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Students</CardTitle>
              <User className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{students.length}</div>
            </CardContent>
          </Card>

          <Card data-testid="textbooks-stat">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Textbooks</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{textbooks.length}</div>
            </CardContent>
          </Card>

          <Card data-testid="chunks-stat">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Chunks</CardTitle>
              <MessageSquare className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {textbooks.reduce((sum, tb) => sum + tb.total_chunks, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/chat')} data-testid="start-learning-card">
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-indigo-600 mb-2" />
              <CardTitle>Start Learning</CardTitle>
              <CardDescription>
                Chat with your AI tutor and get personalized explanations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" data-testid="start-learning-btn">
                Open Tutor Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/upload')} data-testid="upload-textbook-card">
            <CardHeader>
              <Upload className="h-12 w-12 text-purple-600 mb-2" />
              <CardTitle>Upload Textbook</CardTitle>
              <CardDescription>
                Add new learning materials for your tutor to teach from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-purple-600 hover:bg-purple-700" data-testid="upload-textbook-btn">
                Upload Materials
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/profile')} data-testid="profile-card">
            <CardHeader>
              <User className="h-12 w-12 text-green-600 mb-2" />
              <CardTitle>Student Profile</CardTitle>
              <CardDescription>
                Manage profiles and track learning progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="profile-btn">
                View Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow" data-testid="textbooks-list-card">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-blue-600 mb-2" />
              <CardTitle>Available Textbooks</CardTitle>
              <CardDescription>
                {textbooks.length} textbooks ready for learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {textbooks.slice(0, 3).map((tb) => (
                  <div key={tb.id} className="text-sm p-2 bg-gray-50 rounded" data-testid={`textbook-item-${tb.id}`}>
                    <div className="font-medium">{tb.title}</div>
                    <div className="text-gray-500 text-xs">{tb.subject}</div>
                  </div>
                ))}
                {textbooks.length === 0 && (
                  <p className="text-sm text-gray-500" data-testid="no-textbooks">No textbooks uploaded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;