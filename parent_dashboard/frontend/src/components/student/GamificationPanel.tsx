import { Award, TrendingUp, Star } from 'lucide-react';

// Mock Data (matches backend mock)
const BADGES = [
    { id: "b1", name: "First Step", icon: "🦶", earned: true },
    { id: "b2", name: "Math Wizard", icon: "🧙‍♂️", earned: false },
    { id: "b3", name: "On Fire", icon: "🔥", earned: true },
];

export default function GamificationPanel() {
    return (
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-indigo-100 shadow-sm w-full max-w-sm">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                <Award className="w-4 h-4 mr-2" /> Trophy Room
            </h3>

            {/* Streak Counter */}
            <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg mb-4 border border-orange-100">
                <div className="flex items-center text-orange-700">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    <span className="font-bold">7 Day Streak!</span>
                </div>
                <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                        <div key={d} className="w-2 h-6 bg-orange-400 rounded-full opacity-80" />
                    ))}
                </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-4 gap-2">
                {BADGES.map(badge => (
                    <div
                        key={badge.id}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 border ${badge.earned
                            ? 'bg-indigo-50 border-indigo-200 opacity-100'
                            : 'bg-slate-50 border-slate-200 opacity-50 grayscale'
                            }`}
                        title={badge.name}
                    >
                        <span className="text-2xl">{badge.icon}</span>
                        {badge.earned && <Star className="w-3 h-3 text-yellow-400 mt-1 fill-yellow-400" />}
                    </div>
                ))}
                {/* Placeholders */}
                <div className="aspect-square rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-300">?</div>
            </div>
        </div>
    );
}
