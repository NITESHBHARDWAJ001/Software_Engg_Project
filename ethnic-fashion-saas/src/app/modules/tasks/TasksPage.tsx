import { useEffect, useState } from 'react';
import {
  FiPlus,
  FiList,
  FiGrid,
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiEdit,
  FiTrash2,
  FiEye,
} from 'react-icons/fi';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useOrganizationStore } from '../../../store/organizationStore';
import { Task, TaskStatus, TaskPriority } from '../../../types';
import { taskService } from '../../../services/mock/taskService';
import { formatDate, getRelativeTime } from '../../../utils/helpers';

type ViewMode = 'list' | 'kanban' | 'calendar';

export default function TasksPage() {
  const { currentOrganization } = useOrganizationStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');

  useEffect(() => {
    if (currentOrganization) {
      loadTasks();
    }
  }, [currentOrganization]);

  const loadTasks = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const data = await taskService.getAllTasks(currentOrganization.id);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'danger';
      case TaskPriority.MEDIUM:
        return 'warning';
      case TaskPriority.LOW:
        return 'info';
      default:
        return 'neutral';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.IN_PROGRESS:
        return 'primary';
      case TaskStatus.REVIEW:
        return 'warning';
      case TaskStatus.CANCELLED:
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return FiCheckCircle;
      case TaskStatus.IN_PROGRESS:
        return FiClock;
      case TaskStatus.REVIEW:
        return FiEye;
      default:
        return FiAlertCircle;
    }
  };

  const filteredTasks = selectedStatus === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === selectedStatus);

  const tasksByStatus = {
    [TaskStatus.TODO]: tasks.filter(t => t.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.REVIEW]: tasks.filter(t => t.status === TaskStatus.REVIEW),
    [TaskStatus.COMPLETED]: tasks.filter(t => t.status === TaskStatus.COMPLETED),
  };

  const stats = {
    total: tasks.length,
    todo: tasksByStatus[TaskStatus.TODO].length,
    inProgress: tasksByStatus[TaskStatus.IN_PROGRESS].length,
    inReview: tasksByStatus[TaskStatus.REVIEW].length,
    completed: tasksByStatus[TaskStatus.COMPLETED].length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">Manage and track your team's tasks</p>
        </div>
        <Button>
          <FiPlus className="w-4 h-4" />
          New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card hover className={selectedStatus === 'all' ? 'ring-2 ring-primary-500' : ''}>
          <CardBody>
            <button 
              onClick={() => setSelectedStatus('all')}
              className="w-full text-left"
            >
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </button>
          </CardBody>
        </Card>

        <Card hover className={selectedStatus === TaskStatus.TODO ? 'ring-2 ring-primary-500' : ''}>
          <CardBody>
            <button 
              onClick={() => setSelectedStatus(TaskStatus.TODO)}
              className="w-full text-left"
            >
              <p className="text-sm font-medium text-gray-600">To Do</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todo}</p>
            </button>
          </CardBody>
        </Card>

        <Card hover className={selectedStatus === TaskStatus.IN_PROGRESS ? 'ring-2 ring-primary-500' : ''}>
          <CardBody>
            <button 
              onClick={() => setSelectedStatus(TaskStatus.IN_PROGRESS)}
              className="w-full text-left"
            >
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{stats.inProgress}</p>
            </button>
          </CardBody>
        </Card>

        <Card hover className={selectedStatus === TaskStatus.REVIEW ? 'ring-2 ring-primary-500' : ''}>
          <CardBody>
            <button 
              onClick={() => setSelectedStatus(TaskStatus.REVIEW)}
              className="w-full text-left"
            >
              <p className="text-sm font-medium text-gray-600">In Review</p>
              <p className="text-2xl font-bold text-warning-600 mt-1">{stats.inReview}</p>
            </button>
          </CardBody>
        </Card>

        <Card hover className={selectedStatus === TaskStatus.COMPLETED ? 'ring-2 ring-primary-500' : ''}>
          <CardBody>
            <button 
              onClick={() => setSelectedStatus(TaskStatus.COMPLETED)}
              className="w-full text-left"
            >
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-success-600 mt-1">{stats.completed}</p>
            </button>
          </CardBody>
        </Card>
      </div>

      {/* View Mode Selector */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <FiList className="w-4 h-4" />
                List
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <FiGrid className="w-4 h-4" />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <FiCalendar className="w-4 h-4" />
                Calendar
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Task Views */}
      {viewMode === 'list' && (
        <Card>
          <CardBody>
            {filteredTasks.length === 0 ? (
              <EmptyState
                title="No tasks found"
                description="Create your first task to get started"
                actionLabel="Create Task"
                onAction={() => console.log('Create task')}
              />
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const StatusIcon = getStatusIcon(task.status);
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;
                  
                  return (
                    <div
                      key={task.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{task.title}</h3>
                            <Badge variant={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge variant={getStatusColor(task.status)}>
                              <StatusIcon className="w-3 h-3" />
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <FiClock className="w-4 h-4" />
                                <span className={isOverdue ? 'text-danger-600 font-medium' : ''}>
                                  Due {formatDate(task.dueDate)}
                                  {isOverdue && ' (Overdue)'}
                                </span>
                              </div>
                            )}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex gap-2">
                                {task.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 rounded text-xs"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <FiEdit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <Card key={status}>
              <CardHeader 
                title={status.replace('_', ' ')} 
                subtitle={`${statusTasks.length} tasks`}
              />
              <CardBody>
                <div className="space-y-3">
                  {statusTasks.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                      No tasks
                    </div>
                  ) : (
                    statusTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getPriorityColor(task.priority)} >
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          {task.dueDate && (
                            <>
                              <FiClock className="w-3 h-3" />
                              {getRelativeTime(new Date(task.dueDate))}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'calendar' && (
        <Card>
          <CardBody>
            <div className="text-center py-16">
              <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Calendar View</h3>
              <p className="text-gray-600 mb-4">Calendar integration coming soon</p>
              <p className="text-sm text-gray-500">Tasks will be displayed in a calendar format</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
