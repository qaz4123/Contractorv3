/**
 * Usage Widget Component
 * Display user's current usage and limits
 */

import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from './Card';
import api from '../services/api';

interface UsageData {
  aiCallsUsed: number;
  aiCallsLimit: number;
  storageUsed: number;
  storageLimit: number;
  monthlyCost: number;
  subscriptionPrice: number;
  profitability: {
    revenue: number;
    costs: number;
    profit: number;
    profitMargin: number;
  };
  shouldUpgrade: boolean;
  upgradeMessage?: string;
}

export function UsageWidget() {
  const { data: usage, isLoading } = useQuery<UsageData>({
    queryKey: ['usage'],
    queryFn: async () => {
      const response = await api.get('/usage/current');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || !usage) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  const aiUsagePercent = usage.aiCallsLimit > 0 
    ? (usage.aiCallsUsed / usage.aiCallsLimit) * 100 
    : 0;
  
  const storagePercent = (usage.storageUsed / usage.storageLimit) * 100;

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Usage This Month
          </h3>
          {usage.shouldUpgrade && (
            <span className="text-xs text-orange-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Consider upgrading
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* AI Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-purple-600" />
                AI Analyses
              </span>
              <span className="font-medium">
                {usage.aiCallsUsed} / {usage.aiCallsLimit === -1 ? '∞' : usage.aiCallsLimit}
              </span>
            </div>
            {usage.aiCallsLimit !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(aiUsagePercent)}`}
                  style={{ width: `${Math.min(aiUsagePercent, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Storage Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Database className="w-4 h-4 text-blue-600" />
                Storage
              </span>
              <span className="font-medium">
                {usage.storageUsed.toFixed(2)} GB / {usage.storageLimit} GB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(storagePercent)}`}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Monthly Cost */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Cost</span>
              <span className="text-lg font-semibold text-gray-900">
                ${usage.monthlyCost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                Your plan: ${usage.subscriptionPrice}/mo
              </span>
              {usage.profitability.profit > 0 && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Profitable
                </span>
              )}
            </div>
          </div>

          {usage.shouldUpgrade && usage.upgradeMessage && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-800">{usage.upgradeMessage}</p>
              <button className="mt-2 text-xs text-orange-600 hover:text-orange-700 font-medium">
                View Plans →
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
