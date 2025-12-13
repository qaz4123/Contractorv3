import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, FolderOpen, Clock, CheckCircle, Pause } from 'lucide-react';
import { Button, Card, Badge, Table, Pagination, Modal, PageLoader, EmptyState, Input } from '../components';
import { projectsService } from '../services';
import { formatCurrency, formatDate } from '../utils/format';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  clientName?: string;
  budget?: number;
  actualCost?: number;
  startDate?: string;
  endDate?: string;
  completionPercentage?: number;
  createdAt: string;
  lead?: { address: string };
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PLANNING', label: 'Planning' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function Projects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(searchParams.get('new') === 'true');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    clientName: '',
    budget: '',
    startDate: '',
  });

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['projects', { page: currentPage, status: statusFilter }],
    queryFn: () => {
      return projectsService.getAll({
        page: currentPage,
        pageSize: 10,
        status: statusFilter || undefined,
      });
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['projects-stats'],
    queryFn: () => projectsService.getStats(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => projectsService.create(data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsNewModalOpen(false);
      setNewProject({ name: '', description: '', clientName: '', budget: '', startDate: '' });
      // Stay on projects list - project detail page not implemented
    },
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...newProject,
      budget: newProject.budget ? parseFloat(newProject.budget) : undefined,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ON_HOLD':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return <FolderOpen className="w-4 h-4 text-gray-400" />;
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Project',
      render: (project: Project) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(project.status)}
          <div>
            <p className="font-medium">{project.name}</p>
            {project.clientName && (
              <p className="text-sm text-gray-500">{project.clientName}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (project: Project) => <Badge status={project.status} />,
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (project: Project) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
            <div 
              className="h-full bg-primary-600 rounded-full"
              style={{ width: `${project.completionPercentage || 0}%` }}
            />
          </div>
          <span className="text-sm text-gray-500">{project.completionPercentage || 0}%</span>
        </div>
      ),
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (project: Project) => (
        <span className="font-medium">
          {project.budget ? formatCurrency(project.budget) : '-'}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Timeline',
      render: (project: Project) => (
        <span className="text-gray-500 text-sm">
          {project.startDate ? formatDate(project.startDate) : 'TBD'}
          {project.endDate && ` - ${formatDate(project.endDate)}`}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return <PageLoader message="Loading projects..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your construction projects
          </p>
        </div>
        <Button onClick={() => setIsNewModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {data?.data?.length === 0 ? 'Create Your First Project' : 'New Project'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Projects</p>
          <p className="text-2xl font-semibold">{stats?.total || 0}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-semibold text-blue-600">{stats?.inProgress || 0}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-semibold text-green-600">{stats?.completed || 0}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Budget</p>
          <p className="text-2xl font-semibold">{formatCurrency(stats?.totalBudget || 0)}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                     dark:bg-gray-800 dark:text-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <PageLoader message="Loading projects..." />
      ) : isError ? (
        <EmptyState
          icon={<FolderOpen className="w-12 h-12 text-red-400" />}
          title="Error loading projects"
          description={error instanceof Error ? error.message : "Failed to load projects. Please try again."}
          action={
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      ) : (data?.data?.length === 0 || !data?.data) ? (
        <EmptyState
          icon={<FolderOpen className="w-12 h-12 text-gray-400" />}
          title="No projects yet"
          description="Projects help you track construction work from start to finish. Create your first project to get started."
          action={
            <Button onClick={() => setIsNewModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          }
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={data?.data || []}
            keyExtractor={(project) => project.id}
            onRowClick={(project) => {
              // Project detail page doesn't exist - could show modal or stay on list
              // For demo, we'll just stay on the list (detail view not implemented)
            }}
          />
          {data?.totalPages && data.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={data.totalPages}
              totalItems={data.total}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* New Project Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          searchParams.delete('new');
          setSearchParams(searchParams);
        }}
        title="Create New Project"
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="e.g., Kitchen Renovation - Smith Residence"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                       dark:bg-gray-800 dark:text-white"
              placeholder="Project description..."
            />
          </div>

          <Input
            label="Client Name"
            value={newProject.clientName}
            onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
            placeholder="John Smith"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Budget"
              type="number"
              value={newProject.budget}
              onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
              placeholder="50000"
            />
            <Input
              label="Start Date"
              type="date"
              value={newProject.startDate}
              onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
