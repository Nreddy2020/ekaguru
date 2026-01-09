import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AnalyticsDashboard from './components/dashboard/AnalyticsDashboard';
import StudentInterface from './components/student/StudentInterface';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">
        {/* Simple Nav for MVP */}
        <nav className="fixed top-4 right-4 z-50 flex space-x-2">
          <Link to="/" className="bg-white px-4 py-2 rounded-lg shadow text-sm font-medium hover:bg-slate-100">Parent View</Link>
          <Link to="/student" className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow text-sm font-medium hover:bg-indigo-500">Student Mode</Link>
        </nav>

        <Routes>
          <Route path="/" element={<AnalyticsDashboard />} />
          <Route path="/student" element={<StudentInterface />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
