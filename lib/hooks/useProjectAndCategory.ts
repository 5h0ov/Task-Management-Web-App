import { useQuery } from "@tanstack/react-query";
import { Project, Category } from "@/lib/types/schema";

// Fetch Projects function
const fetchProjects = async () => {
  const response = await fetch("/api/projects");
  if (!response.ok) throw new Error("Failed to fetch projects");
  return response.json();
};

// Fetch Categories function
const fetchCategories = async () => {
  const response = await fetch("/api/categories");
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
};

// react query hook to fetch projects and categories
export function useProjectsAndCategories() {
  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return { projects, categories, isProjectsLoading, isCategoriesLoading };
}
