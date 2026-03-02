// Mock data service for Task Management
import { Task, TaskStatus, TaskPriority } from '../../types';
import { generateId } from '../../utils/helpers';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Follow up with VIP customers',
    description: 'Call premium customers from Mumbai Fashion Week',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'user-1',
    assignedToName: 'Rahul Sharma',
    createdBy: 'user-admin',
    createdByName: 'Admin User',
    organizationId: 'org-1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['sales', 'follow-up'],
  },
  {
    id: 'task-2',
    title: 'Update inventory for Silk Collection',
    description: 'Verify stock levels and update system',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'user-2',
    assignedToName: 'Priya Patel',
    createdBy: 'user-admin',
    createdByName: 'Admin User',
    organizationId: 'org-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['inventory'],
  },
  {
    id: 'task-3',
    title: 'Prepare exhibition booth design',
    description: 'Design layout for Delhi Textile Expo booth',
    status: TaskStatus.REVIEW,
    priority: TaskPriority.HIGH,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'user-3',
    assignedToName: 'Ankit Verma',
    createdBy: 'user-admin',
    createdByName: 'Admin User',
    organizationId: 'org-1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['exhibition', 'design'],
  },
  {
    id: 'task-4',
    title: 'Process pending invoices',
    description: 'Generate and send invoices for completed orders',
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'user-4',
    assignedToName: 'Sneha Reddy',
    createdBy: 'user-admin',
    createdByName: 'Admin User',
    organizationId: 'org-1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['finance'],
  },
  {
    id: 'task-5',
    title: 'Customer feedback survey',
    description: 'Send satisfaction survey to recent customers',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'user-1',
    assignedToName: 'Rahul Sharma',
    createdBy: 'user-admin',
    createdByName: 'Admin User',
    organizationId: 'org-1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['customer', 'survey'],
  },
  {
    id: 'task-6',
    title: 'Restock Designer Sarees',
    description: 'Order new stock from suppliers',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'user-2',
    assignedToName: 'Priya Patel',
    createdBy: 'user-admin',
    createdByName: 'Admin User',
    organizationId: 'org-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['inventory', 'urgent'],
  },
];

export const taskService = {
  async getAllTasks(organizationId: string): Promise<Task[]> {
    await delay(500);
    return mockTasks.filter(task => task.organizationId === organizationId);
  },

  async getTaskById(taskId: string): Promise<Task | null> {
    await delay(300);
    return mockTasks.find(task => task.id === taskId) || null;
  },

  async getTasksByStatus(organizationId: string, status: TaskStatus): Promise<Task[]> {
    await delay(400);
    return mockTasks.filter(
      task => task.organizationId === organizationId && task.status === status
    );
  },

  async getTasksByUser(userId: string): Promise<Task[]> {
    await delay(400);
    return mockTasks.filter(task => task.assignedTo === userId);
  },

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    await delay(600);
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTasks.push(newTask);
    return newTask;
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    await delay(500);
    const taskIndex = mockTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    mockTasks[taskIndex] = {
      ...mockTasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // If status changed to completed, add completedAt
    if (updates.status === TaskStatus.COMPLETED && !mockTasks[taskIndex].completedAt) {
      mockTasks[taskIndex].completedAt = new Date().toISOString();
    }

    return mockTasks[taskIndex];
  },

  async deleteTask(taskId: string): Promise<void> {
    await delay(400);
    const taskIndex = mockTasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
      mockTasks.splice(taskIndex, 1);
    }
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    return this.updateTask(taskId, { status });
  },
};
