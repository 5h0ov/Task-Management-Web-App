"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Task, ProjectWithStats } from "@/lib/types/schema";
import { z } from "zod";
import { useState, useEffect } from "react";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  taskIds: z.array(z.string()).optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectFormValues) => void;
  initialData?: ProjectWithStats | null;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CreateProjectDialogProps) {
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [taskSearch, setTaskSearch] = useState("");

  // Fetch unassigned tasks
  const { data: availableTasks = [] } = useQuery({
    queryKey: ["unassigned-tasks", initialData?.id],
    queryFn: async () => {
      const url = initialData
        ? `/api/tasks/unassigned?projectId=${initialData.id}`
        : '/api/tasks/unassigned';
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    }
  });

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      taskIds: [],
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description || '',
        taskIds: initialData.tasks.map(task => task.id)
      });
      setSelectedTasks(initialData.tasks.map(task => task.id));
    }
  }, [initialData, form]);



  const handleSubmit = (data: ProjectFormValues) => {
    onSubmit({ ...data, taskIds: selectedTasks });
    form.reset();
    setSelectedTasks([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Project' : 'Create Project'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Edit your project details and assigned tasks.' : 'Create a new project and optionally assign existing tasks to it.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Project description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taskIds"
              render={() => (
                <FormItem>
                  <FormLabel>Assign Tasks</FormLabel>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between"
                      >
                        {selectedTasks.length > 0
                          ? `${selectedTasks.length} tasks selected`
                          : "Select tasks..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                      <CommandInput 
                        placeholder="Search tasks..."
                        value={taskSearch}
                        onValueChange={setTaskSearch}
                      />
                        <CommandEmpty>No unassigned tasks found.</CommandEmpty>
                        <CommandGroup className="">
                          {availableTasks.map((task: Task) => (
                            <CommandItem
                            key={task.id}
                            onSelect={() => {
                              setSelectedTasks(prev => 
                                prev.includes(task.id)
                                  ? prev.filter(id => id !== task.id)
                                  : [...prev, task.id]
                              );
                            }}
                            >
                              <Check
                                className={cn(
                                  "mr-1 h-4 w-4",
                                  selectedTasks.includes(task.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {task.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{initialData ? 'Edit Project' : 'Create Project'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}