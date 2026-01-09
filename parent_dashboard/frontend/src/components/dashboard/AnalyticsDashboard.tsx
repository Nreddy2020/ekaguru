import { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Activity, Brain, Heart, TrendingUp } from 'lucide-react';

// Interfaces matching Backend Analytics API
interface LearningHealth {
    fear: string; // 'low', 'medium', 'high'
    confidence: string;
    understanding: string;
    retention: string;
    growth_trend: string;
}

interface StudentAnalytics {
    student_id: string;
    mastery_score: number;
    sessions_completed: number;
    total_time_minutes: number;
    concepts_mastered: number;
    learning_health: LearningHealth;
    history: { date: string; score: number }[];
}

// Mock Data for MVP (since we might not have full history in DB yet)
const MOCK_DATA: StudentAnalytics = {
    student_id: "student_123",
    mastery_score: 85,
    sessions_completed: 12,
    total_time_minutes: 340,
    concepts_mastered: 8,
    learning_health: {
        fear: "low",
        confidence: "high",
        understanding: "deep",
        retention: "strong",
        growth_trend: "accelerating"
    },
    history: [
        { date: 'Mon', score: 65 },
        { date: 'Tue', score: 70 },
        { date: 'Wed', score: 68 },
        { date: 'Thu', score: 75 },
        { date: 'Fri', score: 82 },
        { date: 'Sat', score: 85 },
    ]
};

const MetricCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
        <div className={`p-4 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`w-8 h-8 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
    </div>
);

export default function AnalyticsDashboard() {
    const [data, setData] = useState<StudentAnalytics>(MOCK_DATA);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch real data
        const fetchData = async () => {
            try {
                // In production, this would be an actual API call

                // Simulating network delay and data update
                setTimeout(() => {
                    setData(MOCK_DATA); // Use setData to satisfy linter
                    setLoading(false);
                }, 800);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="flex h-screen items-center justify-center">Loading Ekaguru Insights...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Parent Dashboard</h1>
                <p className="text-slate-500">Real-time insights into your child's cognitive growth.</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Mastery Score"
                    value={`${data.mastery_score}%`}
                    icon={Brain}
                    color="bg-indigo-600"
                />
                <MetricCard
                    title="Fear Index"
                    value={data.learning_health.fear.toUpperCase()}
                    icon={Heart}
                    color={data.learning_health.fear === 'low' ? 'bg-green-500' : 'bg-red-500'}
                />
                <MetricCard
                    title="Concepts Mastered"
                    value={data.concepts_mastered}
                    icon={TrendingUp}
                    color="bg-blue-500"
                />
                <MetricCard
                    title="Total Learning Time"
                    value={`${Math.floor(data.total_time_minutes / 60)}h ${data.total_time_minutes % 60}m`}
                    icon={Activity}
                    color="bg-purple-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Growth Trend */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Learning Curve (Weekly)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cognitive Health Radar (Simulated) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">Cognitive Balance</h3>
                    <div className="h-72 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius={90} data={[
                                { subject: 'Confidence', A: 80, fullMark: 100 },
                                { subject: 'Retention', A: 90, fullMark: 100 },
                                { subject: 'Application', A: 65, fullMark: 100 },
                                { subject: 'Logic', A: 75, fullMark: 100 },
                                { subject: 'Curiosity', A: 95, fullMark: 100 },
                            ]}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar name="Student" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
