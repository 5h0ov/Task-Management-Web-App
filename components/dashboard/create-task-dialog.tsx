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
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Task } from "@/lib/types/schema";
import { z } from "zod";
import { useProjectsAndCategories } from "@/lib/hooks/useProjectAndCategory";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["todo", "in_progress", "completed"]),
  dueDate: z.string().optional(),
  project: z.string().optional(),
  category: z.string().optional(),
  categoryColor: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormValues) => void;
  initialData?: Task | null;
}


export function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CreateTaskDialogProps) {
  const { projects, categories } = useProjectsAndCategories();
  const [selectedProject, setSelectedProject] = useState<string | undefined>(initialData?.project?.id || undefined);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [openProject, setOpenProject] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [projectSearch, setProjectSearch] = useState(initialData?.project?.name || "");
  const [newCategoryColors, setNewCategoryColors] = useState<Record<string, string>>({});
  const [categorySearch, setCategorySearch] = useState("");

  // const [showColorPicker, setShowColorPicker] = useState(false);
  
  console.log("initial data: ", initialData);
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),

    defaultValues: {
        title: "",
        description: "",
        priority: "low",
        dueDate: "",
        status: "todo",
    }
  }); 
  
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        description: initialData.description || '',
        priority: initialData.priority,
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        status: initialData.status,
      });
    }

    if (initialData?.categories) {
      setSelectedCategories(initialData.categories.map(c => c.name));
    } else {
      setSelectedCategories([]);
    }
    if(initialData?.project) {
      setSelectedProject(initialData.project.id);
    } else {
      setSelectedProject(undefined);
    }

    if(!open) {
      form.reset();
      setSelectedProject(undefined);
      setSelectedCategories([]);
    }
  }, [initialData, form, open]);

  

  const handleSubmit = (data: TaskFormValues) => {
    // transforming the data before submitting
    const taskData = {
      ...data,
      project: selectedProject || undefined,
      categories: selectedCategories,
      categoryColors: newCategoryColors,
      dueDate: data.dueDate || undefined, 
    };

    console.log("Submitting task: ", taskData);
    
    onSubmit(taskData);
    form.reset();
    setSelectedProject(undefined);
    setSelectedCategories([]);
    setNewCategoryColors({});
    onOpenChange(false);
  };

  // as I have placed submit button outside the form
  const handleCreateClick = () => {
    formRef.current?.requestSubmit();
  };


  const handleProjectSelect = (value: string | undefined) => {
    if (value === selectedProject) {
      setSelectedProject(undefined);
      form.setValue("project", undefined);
    } else {
      setSelectedProject(value);
      form.setValue("project", value);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });

    // if (isNew) {
    //   setShowColorPicker(true);
    // }
  };

  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-none space-y-2 pb-4">
          <DialogTitle>{initialData ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Edit the details of your task below." :
            "Add a new task to your project. Fill in the details below."}
          </DialogDescription>
        </DialogHeader>

        
        <Form {...form}>
          <form ref={formRef} 
            onSubmit={form.handleSubmit(handleSubmit)}  
            className="flex-1 overflow-y-auto space-y-4 p-2"
            onChange={() => console.log("form: ", form.getValues())}
          >
          <div className="grid gap-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>  
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" required {...field} />
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
                      placeholder="Task description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "low"}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || "todo"}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Project Selection field here */}
            <FormField
              control={form.control}
              name="project"
              render={() => (
                <FormItem>
                  <FormLabel>Project (Optional)</FormLabel>
                  <Popover open={openProject} onOpenChange={setOpenProject}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedProject
                          ? projects.find((p) => p.id === selectedProject)?.name || "Select Project"
                          : "Select Project"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search projects..." 
                          value={projectSearch}
                          onValueChange={(e) => {
                            setProjectSearch(e);
                            setSelectedProject(undefined);
                          }}
                        />
                            <CommandEmpty>
                              {projectSearch ? (
                               <div 
                               className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                               onClick={() => handleProjectSelect(projectSearch)}
                             >
                               {selectedProject === projectSearch ? <Check className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
                               Create &quot;{projectSearch}&quot; Project
                             </div>
                              ) : (
                                "No projects found."
                              )}
                            </CommandEmpty>
                        <CommandGroup>
                          {projects.map((project) => (
                            <CommandItem 
                              key={project.id} 
                              onSelect={() => handleProjectSelect(project.id)}
                            >
                              <Check className={cn("mr-1 h-4 w-4", selectedProject === project.id ? "opacity-100" : "opacity-0")} />
                              {project.name}
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

            {/* Category Selection field here */}
            <FormField
              control={form.control}
              name="category"
              render={() => (
                <FormItem>
                  <FormLabel>Categories (Optional)</FormLabel>
                <Popover open={openCategory} onOpenChange={setOpenCategory}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedCategories.length > 0
                      ? `${selectedCategories.length} categories selected`
                      : "Select categories"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Search categories..."
                      value={categorySearch}
                      onValueChange={setCategorySearch}
                    />
                    <CommandEmpty>
                      {categorySearch ? (
                        <div 
                          className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                          onClick={() => handleCategorySelect(categorySearch)}
                        >
                          {selectedCategories.includes(categorySearch) ? <Check className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
                          Create &quot;{categorySearch}&quot; Category
                        </div>
                      ) : (
                        "No categories found."
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          onSelect={() => {
                            setSelectedCategories(prev => {
                              const isSelected = prev.includes(category.name);
                              return isSelected
                                ? prev.filter(name => name !== category.name)
                                : [...prev, category.name];
                            });
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCategories.includes(category.name)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {category.name}
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
            </div>
          </div>
          </form>
        </Form>

        {/* External Submit Button to fit the design */}
        <DialogFooter className="flex-none pt-4">
          <Button type="submit" onClick={handleCreateClick}>{initialData ? "Edit Task" : "Create Task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}