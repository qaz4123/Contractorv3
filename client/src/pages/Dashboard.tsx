import { useQuery } from '@tanstack/react-query';
import { 
  Users, FolderOpen, FileText, DollarSign, 
  TrendingUp, Clock, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { StatCard, Card, PageLoader, Badge } from '../components';
import { analyticsService, leadsService, tasksService } from '../services';
import { formatCurrency, formatDate } from '../utils/format';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsService.getDashboardStats,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['recent-leads'],
    queryFn: () => leadsService.getAll({ limit: 5 }),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['upcoming-tasks'],
    queryFn: () => tasksService.getAll({ limit: 5, status: 'PENDING' }),
  });

  if (statsLoading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back! Here's an overview of your business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads || 0}
          change={stats?.leadGrowth ? `${stats.leadGrowth > 0 ? '+' : ''}${stats.leadGrowth}% from last month` : undefined}
          changeType={stats?.leadGrowth > 0 ? 'positive' : 'negative'}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Active Projects"
          value={stats?.activeProjects || 0}
          icon={<FolderOpen className="w-6 h-6" />}
        />
        <StatCard
          title="Pending Quotes"
          value={stats?.pendingQuotes || 0}
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          change={stats?.revenueGrowth ? `${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth}%` : undefined}
          changeType={stats?.revenueGrowth > 0 ? 'positive' : 'negative'}
          icon={<DollarSign className="w-6 h-6" />}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Leads
            </h2>
            <button
              onClick={() => navigate('/leads')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </button>
          </div>
          
          {leadsLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ) : leads?.leads?.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No leads yet. Start by adding your first lead.
            </p>
          ) : (
            <div className="space-y-3">
              {leads?.leads?.map((lead: { id: string; address: string; status: string; estimatedValue?: number; createdAt: string }) => (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {lead.address}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(lead.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge status={lead.status} />
                    {lead.estimatedValue && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatCurrency(lead.estimatedValue)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Tasks
            </h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </button>
          </div>
          
          {tasksLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ) : tasks?.tasks?.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No pending tasks.
            </p>
          ) : (
            <div className="space-y-3">
              {tasks?.tasks?.map((task: { id: string; title: string; priority: string; dueDate?: string }) => (
                <div
                  key={task.id}
                  onClick={() => navigate('/tasks')}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {task.priority === 'URGENT' ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : task.priority === 'HIGH' ? (
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Due {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge status={task.priority} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/leads?new=true')}
            className="flex flex-col items-center justify-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
          >
            <Users className="w-6 h-6 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
              Add Lead
            </span>
          </button>
          <button
            onClick={() => navigate('/quotes?new=true')}
            className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <FileText className="w-6 h-6 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Create Quote
            </span>
          </button>
          <button
            onClick={() => navigate('/tasks?new=true')}
            className="flex flex-col items-center justify-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <CheckCircle className="w-6 h-6 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
              Add Task
            </span>
          </button>
          <button
            onClick={() => navigate('/invoices?new=true')}
            className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <DollarSign className="w-6 h-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
              New Invoice
            </span>
          </button>
        </div>
      </Card>
    </div>
  );
}
