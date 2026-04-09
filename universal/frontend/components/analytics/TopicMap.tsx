import { CheckCircle, Circle, Play, BookOpen } from 'lucide-react';

interface TopicMapProps {
    masteredTopics: string[];
}

export function TopicMap({ masteredTopics }: TopicMapProps) {
    // Mock topic progression data - in production this would come from the API
    const topicProgression = [
        { id: '1', name: 'Pods', status: masteredTopics.includes('Pods') ? 'mastered' : 'in-progress' },
        { id: '2', name: 'ReplicaSets', status: masteredTopics.includes('ReplicaSets') ? 'mastered' : 'pending' },
        { id: '3', name: 'Deployments', status: masteredTopics.includes('Deployments Basics') ? 'mastered' : 'pending' },
        { id: '4', name: 'Services', status: masteredTopics.includes('Services') ? 'mastered' : 'pending' },
        { id: '5', name: 'Ingress', status: 'pending' },
        { id: '6', name: 'ConfigMaps', status: 'pending' },
        { id: '7', name: 'Secrets', status: 'pending' },
        { id: '8', name: 'StatefulSets', status: 'pending' },
        { id: '9', name: 'Helm', status: 'pending' },
        { id: '10', name: 'Service Mesh', status: 'pending' }
    ];

    const getTopicIcon = (status: string) => {
        switch (status) {
            case 'mastered': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'in-progress': return <Play className="w-5 h-5 text-blue-500 animate-pulse" />;
            default: return <Circle className="w-5 h-5 text-gray-400" />;
        }
    };

    const getTopicColor = (status: string) => {
        switch (status) {
            case 'mastered': return 'bg-green-100 text-green-700 border-green-200';
            case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                Topic Mastery Map
            </h3>
            <div className="space-y-3">
                {topicProgression.map((topic, index) => (
                    <div key={topic.id} className="flex items-center gap-3">
                        {/* Progress Line */}
                        {index < topicProgression.length - 1 && (
                            <div className={`w-6 h-0.5 ${topic.status === 'mastered' ? 'bg-green-300' : 'bg-gray-200'}`}></div>
                        )}
                        
                        {/* Topic Badge */}
                        <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${getTopicColor(topic.status)} transition-all hover:shadow-md`}>
                            {getTopicIcon(topic.status)}
                            <div>
                                <div className="font-bold text-sm">{topic.name}</div>
                                <div className="text-xs opacity-75 capitalize">{topic.status}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Progress Summary */}
            <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm text-slate-600">
                    <span>Mastered: {masteredTopics.length}</span>
                    <span>Total: {topicProgression.length}</span>
                    <span>Progress: {Math.round((masteredTopics.length / topicProgression.length) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(masteredTopics.length / topicProgression.length) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
