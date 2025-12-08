import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DataQualityBadgeProps {
  confidence: 'low' | 'moderate' | 'high';
  score?: number;
  missingFields?: string[];
  notes?: string;
  showDetails?: boolean;
}

export function DataQualityBadge({ 
  confidence, 
  score, 
  missingFields = [], 
  notes,
  showDetails = false 
}: DataQualityBadgeProps) {
  const config = {
    low: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      label: 'Low Confidence',
    },
    moderate: {
      icon: Info,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      label: 'Moderate Confidence',
    },
    high: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      label: 'High Confidence',
    },
  };

  const { icon: Icon, color, bgColor, borderColor, label } = config[confidence];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bgColor} ${borderColor}`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${color}`}>{label}</span>
          {score !== undefined && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({score}/100)
            </span>
          )}
        </div>
        {showDetails && (missingFields.length > 0 || notes) && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {missingFields.length > 0 && (
              <div>Missing: {missingFields.join(', ')}</div>
            )}
            {notes && <div className="mt-0.5">{notes}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
