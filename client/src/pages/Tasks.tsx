import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Calendar, CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { Button, Card, Badge, Modal, PageLoader, EmptyState, Input, Select } from '../components';
import { tasksService } from '../services';
import { formatDate, formatRelativeTime } from '../utils/format';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
  leadId?: string;
  lead?: { address: string };
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export function Tasks() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(searchParams.get('new') === 'true');
  const [statusFilter, setStatusFilter] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { status: statusFilter }],
    queryFn: () => tasksService.getAll({
      status: statusFilter || undefined,
      limit: 100,
    }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsNewModalOpen(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => 
      tasksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newTask);
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    updateMutation.mutate({ id: task.id, data: { status: newStatus } });
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'HIGH':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const groupedTasks = (data?.tasks || []).reduce((acc: Record<string, Task[]>, task: Task) => {
    const group = task.status === 'COMPLETED' ? 'completed' : 'active';
    if (!acc[group]) acc[group] = [];
    acc[group].push(task);
    return acc;
  }, {});

  if (isLoading) {
    return <PageLoader message="Loading tasks..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your to-do list and follow-ups
          </p>
        </div>
        <Button onClick={() => setIsNewModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Tasks List */}
      {data?.tasks?.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-12 h-12 text-gray-400" />}
          title="No tasks found"
          description="Create your first task to get started"
          action={
            <Button onClick={() => setIsNewModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Active Tasks */}
          {groupedTasks.active && groupedTasks.active.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Active ({groupedTasks.active.length})
              </h2>
              <div className="space-y-2">
                {groupedTasks.active.map((task: Task) => (
                  <Card key={task.id} padding="sm">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTaskStatus(task)}
                        className="mt-0.5 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </h3>
                          {getPriorityIcon(task.priority)}
                          <Badge status={task.priority} />
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Due {formatDate(task.dueDate)}
                            </span>
                          )}
                          {task.lead && (
                            <span
                              className="text-primary-600 hover:text-primary-700 cursor-pointer"
                              onClick={() => navigate(`/leads/${task.leadId}`)}
                            >
                              {task.lead.address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {groupedTasks.completed && groupedTasks.completed.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-3">
                Completed ({groupedTasks.completed.length})
              </h2>
              <div className="space-y-2">
                {groupedTasks.completed.map((task: Task) => (
                  <Card key={task.id} padding="sm" className="opacity-60">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleTaskStatus(task)}
                        className="mt-0.5 text-green-500 hover:text-gray-400 transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-500 dark:text-gray-400 line-through">
                          {task.title}
                        </h3>
                        {task.completedAt && (
                          <p className="text-sm text-gray-400 mt-1">
                            Completed {formatRelativeTime(task.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Task Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          searchParams.delete('new');
          setSearchParams(searchParams);
        }}
        title="Add New Task"
        size="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="e.g., Follow up with client"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                       dark:bg-gray-800 dark:text-white"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              options={PRIORITY_OPTIONS}
            />
            <Input
              label="Due Date"
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
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
              Add Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
