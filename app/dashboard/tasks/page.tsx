"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(6);

  const queryClient = useQueryClient();

  // fetching tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', currentPage, limit, projectFilter, categoryFilter, priorityFilter, activeTab],
    queryFn: async () => {
      // building URL with filter parameters
      let url = `/api/tasks?page=${currentPage}&limit=${limit}`;
      
      if (projectFilter !== "all") {
        url += `&project=${encodeURIComponent(projectFilter)}`;
      }
      
      if (categoryFilter !== "all") {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }
      
      if (priorityFilter !== "all") {
        url += `&priority=${encodeURIComponent(priorityFilter)}`;
      }


      if (activeTab !== "all") {
        url += `&status=${encodeURIComponent(activeTab)}`;
      }
      console.log("Fetching tasks from URL:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      console.log("task creation data:", data); 
      toast.loading("Creating...", { autoClose: false });

      let projectId: string | undefined;
      
      // to create a new project if it doesn't exist
      if(data.project)  {
        projectId = projects.find(p => p.id === data.project)?.id;
        console.log("found project id:", projectId);

        if (!projectId) {
          const projectResponse = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: data.project }),
          });
          console.log("project response:", projectResponse);
          if (!projectResponse.ok) throw new Error(projectResponse.statusText ||  "Failed to create project");
          const newProject = await projectResponse.json();
          projectId = newProject.id;
        }
      }
  
      const categoryIds: string[] = [];

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
            if (!categoryResponse.ok) throw new Error(categoryResponse.statusText || "Failed to create category");
            const newCategory = await categoryResponse.json();
            categoryId = newCategory.id;
          }
          if(categoryId)
            categoryIds.push(categoryId);
        }
      }
  
      const existingTask = tasks.find((task) => task.title === data.title);
      if (existingTask) {
        throw new Error("Task with this title already exists");
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
        throw new Error(response.statusText ||  "Failed to create task");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      toast.dismiss();
      toast.success("Task created successfully");
      setIsTaskDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error("Error creating task:", error);
      toast.dismiss();
      toast.error(error.message || "Failed to create task");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<TaskFormValues> }) => {
      toast.loading("Updating...", { autoClose: false });

      let projectId: string | undefined;
      
      if (data.project) {
        projectId = projects.find(p => p.id === data.project)?.id;
        console.log("found project id:", projectId);
        
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
  
      const categoryIds: string[] = [];
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
      
      
      const existingTask = tasks.find((task) => task.title === data.title && task.id !== taskId)
      if (existingTask) {
        throw new Error("Task with this title already exists");
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

      toast.dismiss();
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating task:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to update task');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      toast.loading('Deleting...', { autoClose: false });

      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      toast.dismiss();
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast.dismiss();
      toast.error('Failed to delete task');
    }
  });

  const handleEdit = (task: Task) => {
    setIsEditing(task);
    setIsTaskDialogOpen(true);
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (error: unknown) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      await updateTaskMutation.mutateAsync({ 
        taskId, 
        data: { status } 
      });
    } catch (error: unknown) {
      console.error('Error updating task status:', error);
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
    } catch (error: unknown) {
      console.error('Error creating/updating task:', error);
      toast.error(isEditing ? 'Failed to update task' : 'Failed to create task');
    }
  };

  // centralized filtering logic for tasks based on project, category, and priority
  // const filteredTasks = tasks.filter((task: Task) => {
  //   const matchesProject = projectFilter === "all" || task.project?.name === projectFilter;
  //   const matchesCategory = categoryFilter === "all" || 
  //     task.categories?.some(cat => cat.name === categoryFilter);
  //   const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
  //   return matchesProject && matchesCategory && matchesPriority;
  // });

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
      <div className="flex flex-col md:flex-row items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Tasks per page</p>
          <Select 
            value={limit.toString()} 
            onValueChange={(value) => {
              setLimit(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder={limit} />
            </SelectTrigger>
            <SelectContent>
              {[6, 12, 24, 42, 60].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={tasks?.length < limit || isLoading}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all"
       className="space-y-4"
       onValueChange={(value) => {
          setActiveTab(value);
          setCurrentPage(1); // reset pagination
        }}
      >
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
          tasks.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">No tasks found</div>
            </div>
          ) : (
          <>
            <TabsContent value="all" className="space-y-4">
              <TaskList 
                tasks={tasks}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>

            {["todo", "in_progress", "completed"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                <TaskList 
                  tasks={tasks}
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
