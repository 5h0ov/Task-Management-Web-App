// holding all the types and interfaces for the application - a schema for type safety

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string | undefined;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
  userId: string;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
  project?: Project | null | undefined;
  categories?: Category[] | null | undefined; 
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface DashboardStats {
  totalTasks: number;
  totalTasksDiff: number;
  completedTasks: number;
  completedTasksDiff: number;
  overdueTasks: number;
  overdueTasksDiff: number;
  activeProjects: number;
  activeProjectsDiff: number;
}

export interface TaskFormValues {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  project?: string | null;
  categories?: string[]; 
  categoryColors?: Record<string, string>; 
}

export interface ProjectFormValues {
  name: string;
  description?: string;
  taskIds?: string[]; 
}

export interface ProjectWithStats extends Project {
  progress: number
  totalTasks: number
  completedTasks: number
  tasks: Task[]
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  project?: {
    id: string | null;
    name: string | null;
  } | null;
}