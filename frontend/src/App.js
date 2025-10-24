import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import Dashboard from '@/pages/Dashboard';
import TutorChat from '@/pages/TutorChat';
import StudentProfile from '@/pages/StudentProfile';
import TextbookUpload from '@/pages/TextbookUpload';
import LearningPath from '@/pages/LearningPath';
import VisualLearning from '@/pages/VisualLearning';
import { Toaster } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AppContext = React.createContext();

function App() {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [textbooks, setTextbooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [textbooksRes, studentsRes] = await Promise.all([
        axios.get(`${API}/textbooks`),
        axios.get(`${API}/students`)
      ]);
      
      setTextbooks(textbooksRes.data);
      setStudents(studentsRes.data);
      
      // Set first student as current if exists
      if (studentsRes.data.length > 0) {
        setCurrentStudent(studentsRes.data[0]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    currentStudent,
    setCurrentStudent,
    textbooks,
    setTextbooks,
    students,
    setStudents,
    API,
    fetchInitialData
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Virtual Tutor...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <BrowserRouter>
        <div className="App min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <Toaster position="top-center" richColors />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<TutorChat />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/upload" element={<TextbookUpload />} />
            <Route path="/learning-path" element={<LearningPath />} />
            <Route path="/learn" element={<InteractiveLearning />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;