"use client";

import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@/lib/types/schema";
import { Badge } from "@/components/ui/badge";
import { FolderKanban } from "lucide-react";
import { CalendarEvent } from "@/lib/types/schema";


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

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());


  // function to normalize date because of timezone issues
  function normalizeDate(date: Date): string {
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
    }

  // query for tasks on selected date
  const { data: selectedDateTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', date ? normalizeDate(date) : null],
    queryFn: async () => {
      if (!date) return [];
      const formattedDate = normalizeDate(date);
      const response = await fetch(`/api/tasks/dates?date=${formattedDate}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
    enabled: !!date,
  });
    

  // query for dates that have tasks (lighter query)
  const { data: taskDates = [], isLoading: calendarLoading } = useQuery<string[]>({
    queryKey: ['taskDates'],
    queryFn: async () => {
      const response = await fetch('/api/tasks/dates');
      if (!response.ok) throw new Error('Failed to fetch task dates');
      return response.json();
    },
  });

  const events: CalendarEvent[] = selectedDateTasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    project: task.project,
  }));

  
  return (
    <div className="flex flex-col space-y-4 sm:p-4 pt-6">
      <div className="flex items-center justify-center">
        <h2 className="text-3xl font-bold tracking-tight">Calendar</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader className="flex flex-col items-center">
            <CardTitle>Task Calendar</CardTitle>
            <CardDescription>
              View and manage your task deadlines
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {calendarLoading ? (
              <p className="text-sm text-muted-foreground flex items-center justify-center">Loading Calendar...</p>
            ) : (
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                // highlighting the dates with tasks
                modifiers={{
                  highlighted: (date) => 
                    taskDates.includes(normalizeDate(date))
                }}
                modifiersClassNames={{
                  highlighted: "border-4 border-highlight-border rounded-md font-medium text-highlight-date",
                }}
              />
            )}

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks Due</CardTitle>
            <CardDescription>
              {date ? date.toDateString() : "Select a date"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 overflow-y-auto max-h-[300px]">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading tasks...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks due on this date. Make sure to select a date for tasks.
              </p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col space-y-2 rounded-md border p-3"
                >
                  <div className="space-y-1">
                    <span className="font-medium">{event.title}</span>
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  {event.project?.name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FolderKanban className="h-4 w-4" />
                      <span>{event.project.name}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Badge
                      variant="secondary"
                      className={priorityColors[event.priority as keyof typeof priorityColors]}
                    >
                      {event.priority}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={statusColors[event.status as keyof typeof statusColors]}
                    >
                      {event.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))
            )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}