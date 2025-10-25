import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '@/App';
import axios from 'axios';
import { ArrowLeft, User, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const StudentProfile = () => {
  const navigate = useNavigate();
  const { currentStudent, setCurrentStudent, students, setStudents, API, fetchInitialData } = useContext(AppContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    grade_level: '',
    avatar_preference: 'default'
  });
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentStudent) {
      fetchProgress();
    }
  }, [currentStudent]);

  const fetchProgress = async () => {
    if (!currentStudent) return;
    
    try {
      const response = await axios.get(`${API}/students/${currentStudent.id}/progress`);
      setProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleCreateStudent = async () => {
    if (!newStudent.name || !newStudent.grade_level) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/students`, newStudent);
      toast.success(`Welcome ${newStudent.name}!`);
      setStudents([...students, response.data]);
      setCurrentStudent(response.data);
      setIsDialogOpen(false);
      setNewStudent({ name: '', grade_level: '', avatar_preference: 'default' });
    } catch (error) {
      console.error('Error creating student:', error);
      toast.error('Failed to create student profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-student-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-student-dialog">
              <DialogHeader>
                <DialogTitle>Create Student Profile</DialogTitle>
                <DialogDescription>
                  Add a new student to start their learning journey
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter student name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    data-testid="student-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade Level</Label>
                  <Select
                    value={newStudent.grade_level}
                    onValueChange={(value) => setNewStudent({ ...newStudent, grade_level: value })}
                  >
                    <SelectTrigger data-testid="grade-select">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">1st Grade</SelectItem>
                      <SelectItem value="2nd">2nd Grade</SelectItem>
                      <SelectItem value="3rd">3rd Grade</SelectItem>
                      <SelectItem value="4th">4th Grade</SelectItem>
                      <SelectItem value="5th">5th Grade</SelectItem>
                      <SelectItem value="6th">6th Grade</SelectItem>
                      <SelectItem value="7th">7th Grade</SelectItem>
                      <SelectItem value="8th">8th Grade</SelectItem>
                      <SelectItem value="9th">9th Grade</SelectItem>
                      <SelectItem value="10th">10th Grade</SelectItem>
                      <SelectItem value="11th">11th Grade</SelectItem>
                      <SelectItem value="12th">12th Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="avatar">Avatar Preference</Label>
                  <Select
                    value={newStudent.avatar_preference}
                    onValueChange={(value) => setNewStudent({ ...newStudent, avatar_preference: value })}
                  >
                    <SelectTrigger data-testid="avatar-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleCreateStudent}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  data-testid="create-student-btn"
                >
                  {loading ? 'Creating...' : 'Create Profile'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Student Profile */}
          <div className="lg:col-span-2">
            {currentStudent ? (
              <Card data-testid="current-profile-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-6 w-6 text-indigo-600" />
                    {currentStudent.name}'s Profile
                  </CardTitle>
                  <CardDescription>Learning progress and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500">Grade Level</Label>
                        <p className="text-lg font-medium">{currentStudent.grade_level}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Avatar Style</Label>
                        <p className="text-lg font-medium capitalize">{currentStudent.avatar_preference}</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Member Since</Label>
                        <p className="text-lg font-medium">
                          {new Date(currentStudent.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <h3 className="text-lg font-semibold">Learning Progress</h3>
                      </div>
                      
                      {progress && progress.topics && progress.topics.length > 0 ? (
                        <div className="space-y-3" data-testid="progress-list">
                          {progress.topics.map((topic, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg" data-testid={`topic-${idx}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-sm">{topic.topic}</span>
                                <span className="text-sm text-gray-600">
                                  {topic.correct_answers}/{topic.total_attempts} correct
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full transition-all"
                                  style={{ width: `${topic.mastery_level * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 mt-1">
                                {(topic.mastery_level * 100).toFixed(0)}% mastery
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8" data-testid="no-progress">
                          No learning progress yet. Start chatting with your tutor!
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card data-testid="no-student-card">
                <CardContent className="py-12 text-center">
                  <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No student selected</p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    data-testid="create-first-student-btn"
                  >
                    Create Your First Student Profile
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* All Students List */}
          <div>
            <Card data-testid="all-students-card">
              <CardHeader>
                <CardTitle>All Students</CardTitle>
                <CardDescription>Switch between student profiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setCurrentStudent(student)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        currentStudent?.id === student.id
                          ? 'bg-indigo-100 border-2 border-indigo-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      data-testid={`student-item-${student.id}`}
                    >
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.grade_level} Grade</div>
                    </button>
                  ))}
                  {students.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4" data-testid="no-students">
                      No students yet
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

export default StudentProfile;