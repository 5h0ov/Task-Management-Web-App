"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Plus } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ProjectFormValues, ProjectWithStats } from "@/lib/types/schema"
import { useState } from "react"
import { toast } from "react-toastify"
import TimeAgo from "react-timeago"
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";

export default function ProjectsPage() {
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null)
  const queryClient = useQueryClient()

  // fetch projects with task statistics
  const { data: projects = [], isLoading } = useQuery<ProjectWithStats[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects/stats")
      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }
      const data = await response.json();
      
      // structure data for frontend
      return data.map((project: ProjectWithStats) => ({
        ...project,
        tasks: project.tasks || [],
        totalTasks: project.totalTasks || 0,
        completedTasks: project.completedTasks || 0,
        progress: project.progress || 0
      }));
    },
  })


  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          taskIds: data.taskIds
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
      setIsProjectDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: ProjectFormValues }) => {
      const response = await fetch(`/api/projects?id=${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          taskIds: data.taskIds
        }),
      });
      if (!response.ok) throw new Error("Failed to update project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated successfully");
      setIsProjectDialogOpen(false);
      setEditingProject(null);
    },
    onError: (error: any) => {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects?id=${projectId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
    },
    onError: (error: any) => {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  });
  
  const handleSubmit = async (data: ProjectFormValues) => {
    try {
      if (editingProject) {

        console.log("editingProject", editingProject)
        console.log("data", data)
        await updateProjectMutation.mutateAsync({
          projectId: editingProject.id,
          data
        });
      } else {
        await createProjectMutation.mutateAsync(data);
      }
    } catch (error) {
      toast.error(editingProject ? "Failed to update project" : "Failed to create project");
    }
  };


  const handleEdit = (project: ProjectWithStats) => {
    setEditingProject(project);
    setIsProjectDialogOpen(true);
  };


  const handleDelete = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProjectMutation.mutateAsync(projectId);
      } catch (error) {
        toast.error("Failed to delete project");
      }
    }
  };


  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <Button onClick={() => setIsProjectDialogOpen(true)} disabled={isLoading}>
          <Plus className="md:mr-2 h-5 w-5" /> 
          <span className="hidden md:block"> New Project </span>
        </Button>
      </div>

      {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading projects...</div>
          </div>
        ) : ( 
          projects.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">No projects found</div>
            </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div className="space-y-1">
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(project)}>
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(project.id)}
                            className="text-red-500"
                          >
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    {project.totalTasks === 0 ? (
                        <div className="text-muted-foreground text-sm">No tasks assigned</div>
                      ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span className="text-muted-foreground">
                              {project.progress}%
                            </span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            {project.completedTasks} of {project.totalTasks} tasks completed
                          </span>
                        </div>
                        <div className="mt-2">
                          {project?.tasks?.map((task) => (
                            <div key={task.id} className="text-xs text-gray-400">
                              {task.title}: Due {task.dueDate ? <TimeAgo date={task.dueDate} /> : "No due date"}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    </CardContent>
                  </Card>
                ))}
          </div>
      ))}
      
      <CreateProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={(open) => {
          setIsProjectDialogOpen(open);
          if (!open) setEditingProject(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingProject}
      />
    </div>
  )
}