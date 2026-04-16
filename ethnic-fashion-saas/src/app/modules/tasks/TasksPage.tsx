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
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Input } from '../../../components/ui/Input';
import { useOrganizationStore } from '../../../store/organizationStore';
import { Task, TaskStatus, TaskPriority } from '../../../types';
import { useAuthStore } from '../../../store/authStore';
import { UserRole } from '../../../types';
import { taskService, type TaskBoardScope } from '../../../services/api/taskService';
import { formatDate, getRelativeTime } from '../../../utils/helpers';
import { employeeService, type Employee } from '../../../services/api/employeeService';
import { toast } from 'sonner';

type ViewMode = 'list' | 'kanban' | 'calendar';

type CreateTaskForm = {
  title: string;
  description: string;
  priority: TaskPriority;
  assignedTo: string;
  dueDate: string;
  tags: string;
};

const initialCreateTaskForm: CreateTaskForm = {
  title: '',
  description: '',
  priority: TaskPriority.MEDIUM,
  assignedTo: '',
  dueDate: '',
  tags: '',
};

const kanbanStatusOrder: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.COMPLETED,
];

const toDateKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function TasksPage() {
  const { currentOrganization } = useOrganizationStore();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskForm, setCreateTaskForm] = useState<CreateTaskForm>(initialCreateTaskForm);
  const [activeCalendarDate, setActiveCalendarDate] = useState<string>('');
  const [boardScope, setBoardScope] = useState<TaskBoardScope>('GLOBAL');

  const isStaffUser = user?.role === UserRole.STAFF;

  useEffect(() => {
    if (isStaffUser) {
      setBoardScope('MY');
    }
  }, [isStaffUser]);

  useEffect(() => {
    if (currentOrganization) {
      loadTasks();
    }
  }, [currentOrganization, user?.id, user?.role, boardScope]);

  const loadTasks = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const [data, employeeData] = await Promise.all([
        boardScope === 'MY' && user?.id
          ? taskService.getTasksByUser(user.id)
          : taskService.getAllTasks(currentOrganization.id, boardScope),
        employeeService.getEmployees().catch(() => []),
      ]);
      setTasks(data);
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const setCreateTaskField = (field: keyof CreateTaskForm, value: string) => {
    setCreateTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!createTaskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setCreating(true);
    try {
      const createdTask = await taskService.createTask({
        title: createTaskForm.title.trim(),
        description: createTaskForm.description.trim(),
        priority: createTaskForm.priority,
        assignedTo: createTaskForm.assignedTo || undefined,
        dueDate: createTaskForm.dueDate || undefined,
        tags: createTaskForm.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      setTasks((prev) => [createdTask, ...prev]);
      setCreateTaskForm(initialCreateTaskForm);
      setShowCreateTask(false);
      toast.success('Task created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const moveTaskStatus = async (task: Task, targetStatus: TaskStatus) => {
    if (task.status === targetStatus) return;

    const previous = task.status;
    setTasks((prev) =>
      prev.map((row) => (row.id === task.id ? { ...row, status: targetStatus } : row)),
    );

    try {
      const updated = await taskService.updateTaskStatus(task.id, targetStatus);
      setTasks((prev) => prev.map((row) => (row.id === task.id ? updated : row)));
    } catch (error) {
      setTasks((prev) =>
        prev.map((row) => (row.id === task.id ? { ...row, status: previous } : row)),
      );
      toast.error(error instanceof Error ? error.message : 'Failed to update task status');
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
    [TaskStatus.TODO]: filteredTasks.filter(t => t.status === TaskStatus.TODO),
    [TaskStatus.IN_PROGRESS]: filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
    [TaskStatus.REVIEW]: filteredTasks.filter(t => t.status === TaskStatus.REVIEW),
    [TaskStatus.COMPLETED]: filteredTasks.filter(t => t.status === TaskStatus.COMPLETED),
  };

  const tasksWithDueDate = tasks.filter((task) => Boolean(task.dueDate));
  const tasksByDate = tasksWithDueDate.reduce<Record<string, Task[]>>((acc, task) => {
    const key = toDateKey(task.dueDate as string);
    if (!key) return acc;
    acc[key] = acc[key] ? [...acc[key], task] : [task];
    return acc;
  }, {});

  const todayKey = toDateKey(new Date());
  const selectedCalendarDate = activeCalendarDate || todayKey;
  const selectedCalendarTasks = (tasksByDate[selectedCalendarDate] || []).sort((a, b) => {
    const left = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const right = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return left - right;
  });

  const statusIndexMap = kanbanStatusOrder.reduce<Record<TaskStatus, number>>((acc, status, index) => {
    acc[status] = index;
    return acc;
  }, {
    [TaskStatus.TODO]: 0,
    [TaskStatus.IN_PROGRESS]: 1,
    [TaskStatus.REVIEW]: 2,
    [TaskStatus.COMPLETED]: 3,
    [TaskStatus.CANCELLED]: 0,
  });

  const stats = {
    total: tasks.length,
    todo: tasksByStatus[TaskStatus.TODO].length,
    inProgress: tasksByStatus[TaskStatus.IN_PROGRESS].length,
    inReview: tasksByStatus[TaskStatus.REVIEW].length,
    completed: tasksByStatus[TaskStatus.COMPLETED].length,
  };

  const myTasks = user?.id
    ? tasks.filter((task) => task.assignedTo === user.id)
    : [];
  const newlyAssignedTasks = myTasks.filter((task) => {
    const createdAt = new Date(task.createdAt).getTime();
    return Number.isFinite(createdAt) && Date.now() - createdAt <= 24 * 60 * 60 * 1000;
  });
  const overdueMyTasks = myTasks.filter(
    (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED
  );
  const dueTodayMyTasks = myTasks.filter(
    (task) => task.dueDate && toDateKey(task.dueDate) === todayKey && task.status !== TaskStatus.COMPLETED
  );

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
          <p className="text-gray-600 mt-1">
            {isStaffUser ? 'View and update tasks assigned to you' : "Manage and track your team's tasks"}
          </p>
        </div>
        {!isStaffUser && (
          <Button onClick={() => setShowCreateTask(true)}>
            <FiPlus className="w-4 h-4" />
            New Task
          </Button>
        )}
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={boardScope === 'MY' ? 'primary' : 'outline'}
                onClick={() => setBoardScope('MY')}
              >
                My Allotted Tasks
              </Button>
              <Button
                size="sm"
                variant={boardScope === 'GLOBAL' ? 'primary' : 'outline'}
                onClick={() => setBoardScope('GLOBAL')}
              >
                Global Task Board
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Active board: {boardScope === 'MY' ? 'My Allotted Tasks' : 'Global Task Board'}
            </div>
          </div>
        </CardBody>
      </Card>

      {boardScope === 'MY' && (
        <Card>
          <CardHeader title="Task Allocation Notifications" subtitle="Updates from your allotted tasks" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <p className="text-sm text-gray-600">Newly assigned (24h)</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{newlyAssignedTasks.length}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm text-amber-800">Due today</p>
                <p className="text-2xl font-semibold text-amber-900 mt-1">{dueTodayMyTasks.length}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">Overdue</p>
                <p className="text-2xl font-semibold text-red-900 mt-1">{overdueMyTasks.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {showCreateTask && (
        <Card>
          <CardHeader
            title="Create New Task"
            subtitle="Assign tasks to employees and track due dates"
            action={
              <Button size="sm" variant="ghost" onClick={() => setShowCreateTask(false)}>
                <FiX className="w-4 h-4" />
              </Button>
            }
          />
          <CardBody>
            <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Title"
                value={createTaskForm.title}
                onChange={(e) => setCreateTaskField('title', e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900"
                  value={createTaskForm.priority}
                  onChange={(e) => setCreateTaskField('priority', e.target.value)}
                >
                  {Object.values(TaskPriority).map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={createTaskForm.description}
                  onChange={(e) => setCreateTaskField('description', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900"
                  placeholder="Task details"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign Employee</label>
                <select
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900"
                  value={createTaskForm.assignedTo}
                  onChange={(e) => setCreateTaskField('assignedTo', e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {employees
                    .filter((employee) => employee.isActive)
                    .map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {[employee.firstName, employee.lastName].filter(Boolean).join(' ').trim() || employee.email}
                      </option>
                    ))}
                </select>
              </div>
              <Input
                label="Due Date"
                type="date"
                value={createTaskForm.dueDate}
                onChange={(e) => setCreateTaskField('dueDate', e.target.value)}
              />
              <Input
                label="Tags"
                value={createTaskForm.tags}
                onChange={(e) => setCreateTaskField('tags', e.target.value)}
                helperText="Comma separated, e.g. followup,priority-client"
                className="md:col-span-2"
              />
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" isLoading={creating}>
                  <FiPlus className="w-4 h-4" />
                  Create Task
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

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
                onAction={() => setShowCreateTask(true)}
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
                            {task.assignedToName && (
                              <div className="flex items-center gap-1">
                                <FiUser className="w-4 h-4" />
                                <span>{task.assignedToName}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <FiClock className="w-4 h-4" />
                                <span className={isOverdue ? 'text-danger-600 font-medium' : ''}>
                                  Due {formatDate(task.dueDate)}
                                  {isOverdue && ' (Overdue)'}
                                </span>
                              </div>
                            )}
                            {isStaffUser && boardScope === 'MY' && task.assignedTo === user?.id && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Update:</span>
                                <select
                                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800"
                                  value={task.status}
                                  onChange={(e) => moveTaskStatus(task, e.target.value as TaskStatus)}
                                >
                                  {Object.values(TaskStatus).map((status) => (
                                    <option key={status} value={status}>
                                      {status.replace('_', ' ')}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {!isStaffUser && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Update:</span>
                                <select
                                  className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800"
                                  value={task.status}
                                  onChange={(e) => moveTaskStatus(task, e.target.value as TaskStatus)}
                                >
                                  {Object.values(TaskStatus).map((status) => (
                                    <option key={status} value={status}>
                                      {status.replace('_', ' ')}
                                    </option>
                                  ))}
                                </select>
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
                        {!isStaffUser && (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <FiEdit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <FiTrash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
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
                        {task.assignedToName && (
                          <p className="text-xs text-gray-600 mb-2">Assigned: {task.assignedToName}</p>
                        )}
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          {task.dueDate && (
                            <>
                              <FiClock className="w-3 h-3" />
                              {getRelativeTime(new Date(task.dueDate))}
                            </>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={
                              statusIndexMap[task.status] <= 0 ||
                              (isStaffUser && task.assignedTo !== user?.id)
                            }
                            onClick={() => {
                              const currentIndex = statusIndexMap[task.status];
                              const target = kanbanStatusOrder[Math.max(0, currentIndex - 1)];
                              moveTaskStatus(task, target);
                            }}
                          >
                            <FiChevronLeft className="w-4 h-4" />
                          </Button>
                          <select
                            className="text-xs rounded border border-gray-300 bg-white px-2 py-1 text-gray-800"
                            value={task.status}
                            disabled={isStaffUser && task.assignedTo !== user?.id}
                            onChange={(e) => moveTaskStatus(task, e.target.value as TaskStatus)}
                          >
                            {Object.values(TaskStatus).map((status) => (
                              <option key={status} value={status}>
                                {status.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={
                              statusIndexMap[task.status] >= kanbanStatusOrder.length - 1 ||
                              (isStaffUser && task.assignedTo !== user?.id)
                            }
                            onClick={() => {
                              const currentIndex = statusIndexMap[task.status];
                              const target = kanbanStatusOrder[Math.min(kanbanStatusOrder.length - 1, currentIndex + 1)];
                              moveTaskStatus(task, target);
                            }}
                          >
                            <FiChevronRight className="w-4 h-4" />
                          </Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader title="Due Dates" subtitle="Select a date to view tasks" />
            <CardBody>
              {Object.keys(tasksByDate).length === 0 ? (
                <div className="text-sm text-gray-500">No due dates available.</div>
              ) : (
                <div className="space-y-2">
                  {Object.keys(tasksByDate)
                    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                    .map((dateKey) => (
                      <button
                        key={dateKey}
                        onClick={() => setActiveCalendarDate(dateKey)}
                        className={`w-full text-left px-3 py-2 rounded-lg border ${
                          selectedCalendarDate === dateKey
                            ? 'border-primary bg-primary-50 text-primary'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-medium">{formatDate(dateKey)}</p>
                        <p className="text-xs text-gray-500">{tasksByDate[dateKey].length} tasks</p>
                      </button>
                    ))}
                </div>
              )}
            </CardBody>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader
              title="Calendar Tasks"
              subtitle={`Tasks due on ${selectedCalendarDate ? formatDate(selectedCalendarDate) : formatDate(todayKey)}`}
            />
            <CardBody>
              {selectedCalendarTasks.length === 0 ? (
                <div className="text-sm text-gray-500">No tasks scheduled for this date.</div>
              ) : (
                <div className="space-y-3">
                  {selectedCalendarTasks.map((task) => (
                    <div key={task.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{task.description || 'No description'}</p>
                          <div className="text-xs text-gray-500 mt-2 flex gap-3">
                            <span>{task.assignedToName || 'Unassigned'}</span>
                            <span>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
