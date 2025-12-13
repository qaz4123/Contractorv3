import { useQuery } from '@tanstack/react-query';
import { TrendingUp, DollarSign, PieChart, BarChart3, Zap, Clock, Target, Users, Briefcase, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, PageLoader, Button } from '../components';
import { analyticsService } from '../services';
import { formatCurrency } from '../utils/format';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Suggestion {
  type: 'follow_up' | 'send_quote' | 'schedule_visit' | 'order_materials';
  priority: 'high' | 'medium' | 'low';
  description: string;
  relatedId: string;
}

export function Analytics() {
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsService.getRevenue(),
  });

  const { data: profitData, isLoading: loadingProfit } = useQuery({
    queryKey: ['analytics', 'profit'],
    queryFn: () => analyticsService.getProfitMargins(),
  });

  const { data: costData, isLoading: loadingCosts } = useQuery({
    queryKey: ['analytics', 'costs'],
    queryFn: () => analyticsService.getCosts(),
  });

  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['analytics', 'suggestions'],
    queryFn: () => analyticsService.getSuggestions(),
  });

  const isLoading = loadingRevenue || loadingProfit || loadingCosts || loadingSuggestions;

  if (isLoading) {
    return <PageLoader message="Loading analytics..." />;
  }

  // Prepare chart data
  const revenueByTypeData = Object.entries(revenueData?.byProjectType || {}).map(([type, value]) => ({
    name: type,
    value: value as number,
  }));

  const profitByTypeData = Object.entries(profitData?.byProjectType || {}).map(([type, margin]) => ({
    name: type,
    margin: margin as number,
  }));

  const costBreakdownData = [
    { name: 'Materials', value: costData?.materials || 0, color: COLORS[0] },
    { name: 'Labor', value: costData?.labor || 0, color: COLORS[1] },
    { name: 'Overhead', value: costData?.overhead || 0, color: COLORS[2] },
  ].filter(d => d.value > 0);

  const totalCosts = costBreakdownData.reduce((sum, d) => sum + d.value, 0);

  // Calculate revenue change
  const revenueChange = revenueData?.previousTotal 
    ? ((revenueData.total - revenueData.previousTotal) / revenueData.previousTotal * 100) 
    : 0;

  const highPrioritySuggestions = (suggestions || []).filter((s: Suggestion) => s.priority === 'high');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Advanced Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400">Deep insights into your business performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 opacity-80" />
            {revenueChange !== 0 && (
              <div className={`flex items-center text-sm ${revenueChange > 0 ? 'text-green-200' : 'text-red-200'}`}>
                {revenueChange > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(revenueChange).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-sm font-medium opacity-90 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold">
            {formatCurrency(revenueData?.total || 0)}
          </div>
        </div>

        {/* Avg Profit Margin */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <PieChart className="w-10 h-10 opacity-80" />
            <TrendingUp className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-sm font-medium opacity-90 mb-1">Avg Profit Margin</div>
          <div className="text-3xl font-bold">
            {(profitData?.overall || 0).toFixed(1)}%
          </div>
        </div>

        {/* Avg Per Project */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Briefcase className="w-10 h-10 opacity-80" />
            <BarChart3 className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-sm font-medium opacity-90 mb-1">Avg Per Project</div>
          <div className="text-3xl font-bold">
            {formatCurrency(revenueData?.avgPerProject || 0)}
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-10 h-10 opacity-80" />
            <Clock className="w-6 h-6 opacity-60" />
          </div>
          <div className="text-sm font-medium opacity-90 mb-1">High Priority Actions</div>
          <div className="text-3xl font-bold">
            {highPrioritySuggestions.length}
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Project Type */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Revenue by Project Type
          </h3>
          {revenueByTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No revenue data available
            </div>
          )}
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Cost Breakdown
          </h3>
          {costBreakdownData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdownData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No cost data available
            </div>
          )}
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Margins by Type */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Profit Margins by Project Type
          </h3>
          {profitByTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitByTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Bar dataKey="margin" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No profit data available
            </div>
          )}
        </Card>

        {/* Monthly Revenue Trend */}
        <Card>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Revenue Trend (Last 6 Months)
          </h3>
          {revenueData?.byMonth && revenueData.byMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData.byMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No monthly data available
            </div>
          )}
        </Card>
      </div>

      {/* AI Suggestions */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI-Powered Suggestions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automated recommendations to grow your business</p>
          </div>
        </div>

        {suggestions && suggestions.length > 0 ? (
          <div className="space-y-3">
            {(suggestions as Suggestion[]).map((suggestion, index) => (
              <div
                key={index}
                className={`bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 ${
                  suggestion.priority === 'high'
                    ? 'border-red-500'
                    : suggestion.priority === 'medium'
                    ? 'border-yellow-500'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          suggestion.priority === 'high'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                            : suggestion.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        }`}
                      >
                        {suggestion.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                        {suggestion.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">{suggestion.description}</p>
                  </div>
                  <Button size="sm" className="ml-4">
                    Take Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Zap className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No suggestions at the moment. Keep up the great work!</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Object.keys(profitData?.byClientRating || {}).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Client Segments</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <Briefcase className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Object.keys(revenueData?.byProjectType || {}).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Project Types</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(costData?.byProject || []).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Tracked Projects</div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <DollarSign className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalCosts)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Costs</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
