import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon: LucideIcon;
    color: string; // e.g., "text-green-500"
}

export function StatCard({ title, value, subValue, icon: Icon, color }: StatCardProps) {
    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 font-medium">{title}</span>
                <div className={`p-2 rounded-lg bg-gray-700/50 ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{value}</span>
                {subValue && (
                    <span className="text-sm font-medium text-gray-500">{subValue}</span>
                )}
            </div>
        </div>
    );
}
