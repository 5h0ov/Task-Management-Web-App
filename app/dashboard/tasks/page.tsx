// app/dashboard/tasks/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskList } from "@/components/dashboard/task-list";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateTaskDialog } from "@/components/dashboard/create-task-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Task, TaskFormValues, Project, Category } from "@/lib/types/schema";
import { useProjectsAndCategories } from "@/lib/hooks/useProjectAndCategory";
import { TaskCardShimmer } from "@/components/dashboard/shimmer";

export default function TasksPage() {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<Task | null>(null);
  const [projectFilter, setProjectFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { projects, categories } = useProjectsAndCategories();
  const priorities = ["low", "medium", "high"];
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  const queryClient = useQueryClient();

  // fetching tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      return response.json();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      console.log("task creation data:", data); 

      let projectId: string | undefined;
      
      // to create a new project if it doesn't exist
      if(data.project)  {
        projectId = projects.find(p => p.name === data.project)?.id;
        if (!projectId) {
          const projectResponse = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: data.project }),
          });
          if (!projectResponse.ok) throw new Error("Failed to create project");
          const newProject = await projectResponse.json();
          projectId = newProject.id;
        }
      }
  
      let categoryIds: string[] = [];

      // to create a new category if it doesn't exist
      if (data.categories && data.categories.length > 0) {
        for (const categoryName of data.categories) {
          let categoryId = categories.find(c => c.name === categoryName)?.id;
          
          if (!categoryId) {
            // Create new category with color if provided
            const categoryResponse = await fetch("/api/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: categoryName,
                color: data.categoryColors?.[categoryName]
              }),
            });
            if (!categoryResponse.ok) throw new Error("Failed to create category");
            const newCategory = await categoryResponse.json();
            categoryId = newCategory.id;
          }
          if(categoryId)
            categoryIds.push(categoryId);
        }
      }
  
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          dueDate: data.dueDate || null,
          projectId,
          categoryIds,
        }),
      });
  

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Task created successfully");
      setIsTaskDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.messasge || "Failed to create task");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<TaskFormValues> }) => {
      let projectId: string | undefined;
      
      if (data.project) {
        const projectById = projects.find(p => p.id === data.project);
        if (projectById) {
          projectId = data.project;
        } else {
        projectId = projects.find(p => p.name === data.project)?.id;
        if (!projectId) {
          const projectResponse = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: data.project }),
          });
          if (!projectResponse.ok) throw new Error("Failed to create project");
          const newProject = await projectResponse.json();
          projectId = newProject.id;
        }
      }
    }
  
      let categoryIds: string[] = [];
      if (data.categories && data.categories.length > 0) {
        for (const categoryName of data.categories) {
          let categoryId = categories.find(c => c.name === categoryName)?.id;
          
          if (!categoryId) {
            const categoryResponse = await fetch("/api/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: categoryName,
                color: data.categoryColors?.[categoryName]
              }),
            });
            if (!categoryResponse.ok) throw new Error("Failed to create category");
            const newCategory = await categoryResponse.json();
            categoryId = newCategory.id;
          }
          
          if(categoryId)
            categoryIds.push(categoryId);
        }
      }
      
      
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          projectId,
          categoryIds,
        }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsTaskDialogOpen(false);
      setIsEditing(null);
      toast.success('Task updated successfully');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
  });

  const handleEdit = (task: Task) => {
    setIsEditing(task);
    setIsTaskDialogOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      await updateTaskMutation.mutateAsync({ 
        taskId, 
        data: { status } 
      });
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleSubmit = async (data: TaskFormValues) => {
    try {
      if (isEditing) {
        await updateTaskMutation.mutateAsync({
          taskId: isEditing.id,
          data: {
            ...data,
            dueDate: data.dueDate || null,
            project: data.project || undefined,
            categories: data.categories || undefined,
          }
        });
        setIsEditing(null);
      } else {
        await createTaskMutation.mutateAsync(data);
      }
      setIsTaskDialogOpen(false);
    } catch (error) {
      toast.error(isEditing ? 'Failed to update task' : 'Failed to create task');
    }
  };

  // centralized filtering logic for tasks based on project, category, and priority
  const filteredTasks = tasks.filter((task: Task) => {
    const matchesProject = projectFilter === "all" || task.project?.name === projectFilter;
    const matchesCategory = categoryFilter === "all" || 
      task.categories?.some(cat => cat.name === categoryFilter);
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    return matchesProject && matchesCategory && matchesPriority;
  });

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
        <Button onClick={() => setIsTaskDialogOpen(true)} disabled={isLoading}>
          <Plus className="md:mr-2 h-5 w-5" />  
          <span className="hidden md:block"> New Task </span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[280px] sm:w-[180px]">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project: Project) => (
              <SelectItem 
                key={project.id} 
                value={project.name || `project-${project.id}`}
              >
                {project.name || 'Unnamed Project'}
              </SelectItem>
            ))}

          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[280px] sm:w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category: Category) => (
              <SelectItem 
                key={category.id} 
                value={category.name}
              >
                {category.name || 'Unnamed Category'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[280px] sm:w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TaskCardShimmer key={`shimmer-${i}`} />
            ))}
          </div>
        ) : (
          filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">No tasks found</div>
            </div>
          ) : (
          <>
            <TabsContent value="all" className="space-y-4">
              <TaskList 
                tasks={filteredTasks}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>

            {["todo", "in_progress", "completed"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                <TaskList 
                  tasks={filteredTasks.filter((task: Task) => task.status === status)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              </TabsContent>
            ))}
          </>
        ))}


      </Tabs>

      <CreateTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open);
          if (!open) setIsEditing(null);
        }}
        onSubmit={handleSubmit}
        initialData={isEditing}
      />
    </div>
  );
}