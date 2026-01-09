import { useState } from 'react';
import { Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// Mock Data for MVP
const MOCK_CLASSES = [
    { id: 'c1', name: "5th Grade Math - AM", count: 24, at_risk: 3 },
    { id: 'c2', name: "5th Grade Science - PM", count: 22, at_risk: 0 },
];

const MOCK_STUDENTS = [
    { id: 's1', name: "Alice Johnson", status: 'mastered', topic: "Fractions", score: 92 },
    { id: 's2', name: "Bob Smith", status: 'stuck', topic: "Fractions", score: 45 },
    { id: 's3', name: "Charlie Brown", status: 'progressing', topic: "Decimals", score: 78 },
    { id: 's4', name: "Diana Prince", status: 'stuck', topic: "Geometry", score: 50 },
    { id: 's5', name: "Evan Wright", status: 'mastered', topic: "Fractions", score: 88 },
];

export default function TeacherDashboard() {
    const [selectedClass, setSelectedClass] = useState(MOCK_CLASSES[0]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Teacher Dashboard</h1>
                    <p className="text-slate-500">Manage your classrooms and track student progress.</p>
                </div>
                <div className="space-x-4">
                    <button
                        onClick={() => alert("Simulating CSV Upload...\n\nSelected File: roster.csv\nProcessed: 24 Students")}
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
                    >
                        📂 Import Roster (CSV)
                    </button>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                        + Add Class
                    </button>
                </div>
            </header>

            {/* Class Selector */}
            <div className="flex space-x-4 overflow-x-auto pb-2">
                {MOCK_CLASSES.map(cls => (
                    <button
                        key={cls.id}
                        onClick={() => setSelectedClass(cls)}
                        className={`p-4 rounded-xl border flex flex-col items-start min-w-[200px] transition-all ${selectedClass.id === cls.id
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-slate-200 bg-white hover:border-indigo-200'
                            }`}
                    >
                        <h3 className="font-semibold text-slate-800">{cls.name}</h3>
                        <div className="flex justify-between w-full mt-2 text-sm text-slate-500">
                            <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {cls.count}</span>
                            {cls.at_risk > 0 && <span className="flex items-center text-red-500"><AlertTriangle className="w-4 h-4 mr-1" /> {cls.at_risk} At Risk</span>}
                        </div>
                    </button>
                ))}
            </div>

            {/* Student Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800">Student Roster: {selectedClass.name}</h2>
                    <div className="flex space-x-2 text-sm">
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> Stuck</span>
                        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 flex items-center"><Clock className="w-3 h-3 mr-1" /> Progressing</span>
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Mastered</span>
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                        <tr>
                            <th className="px-6 py-4 font-medium">Student Name</th>
                            <th className="px-6 py-4 font-medium">Current Topic</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Mastery Score</th>
                            <th className="px-6 py-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {MOCK_STUDENTS.map(student => (
                            <tr key={student.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{student.name}</td>
                                <td className="px-6 py-4 text-slate-600">{student.topic}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={student.status} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[100px]">
                                        <div
                                            className={`h-2.5 rounded-full ${student.score < 60 ? 'bg-red-500' : student.score < 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${student.score}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1 block">{student.score}%</span>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View Report</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'stuck') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Stuck</span>;
    if (status === 'mastered') return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Mastered</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Progressing</span>;
}
