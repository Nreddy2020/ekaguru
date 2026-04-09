import { Brain, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface Insight {
    id: string;
    type: 'success' | 'struggle' | 'pattern';
    message: string;
    date: string;
    relatedTopic?: string;
}

interface InsightFeedProps {
    insights: Insight[];
}

export function InsightFeed({ insights }: InsightFeedProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'struggle': return <AlertCircle className="w-5 h-5 text-orange-500" />;
            case 'pattern': return <Brain className="w-5 h-5 text-purple-500" />;
            default: return <TrendingUp className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold text-white">Tutor Insights Log</h3>
                <p className="text-sm text-gray-400">Real-time decisions made by the AI Tutor</p>
            </div>
            <div className="divide-y divide-gray-700 max-h-[300px] overflow-y-auto">
                {insights.map((insight) => (
                    <div key={insight.id} className="p-4 hover:bg-gray-750 transition-colors flex gap-4">
                        <div className="mt-1">{getIcon(insight.type)}</div>
                        <div>
                            <p className="text-gray-200 text-sm leading-relaxed">{insight.message}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs text-gray-500">{new Date(insight.date).toLocaleDateString()}</span>
                                {insight.relatedTopic && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-cyan-400">
                                        {insight.relatedTopic}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
