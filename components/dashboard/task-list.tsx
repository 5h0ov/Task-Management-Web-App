"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar, MoreVertical, Tag, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Task } from "@/lib/types/schema";

const priorityColors = {
  low: "bg-green-500/10 text-green-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-red-500/10 text-red-500",
};

const statusColors = {
  todo: "bg-gray-500/10 text-gray-500",
  in_progress: "bg-blue-500/10 text-blue-500",
  completed: "bg-green-500/10 text-green-500",
};

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

export function TaskList({ tasks, onEdit, onDelete, onStatusChange}: TaskListProps) {
  console.log("tasks:", tasks);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <Card key={`task-${task.id}`}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="space-y-2">
              <CardTitle>{task.title}</CardTitle>
              <CardDescription>{task.description}</CardDescription>
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
              <DropdownMenuItem onClick={() => onEdit(task)}>
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => onStatusChange(task.id, "todo")}>
                    To Do
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(task.id, "in_progress")}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(task.id, "completed")}>
                    Completed
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem 
                className="text-red-500 font-semibold"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this task?')) {
                    onDelete(task.id);
                  }
                }}
              >
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className={cn(priorityColors[task.priority as keyof typeof priorityColors])}
              >
                {task.priority}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(statusColors[task.status as keyof typeof statusColors])}
              >
                {task.status?.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
              </div>
              {task.project?.name && (
                <div className="flex items-center gap-1">
                  <FolderKanban className="h-4 w-4" />
                  <span>{task.project?.name}</span>
                </div>
              )}

              {task.categories && task.categories.length > 0 && task.categories.map((category, i) => (
                <div key={`${task.id}-${category.id}-${i}`}  className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span>{category.name}</span>
                </div>
              )
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}