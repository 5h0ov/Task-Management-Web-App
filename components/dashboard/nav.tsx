"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Home,
  LayoutDashboard,
  ListTodo,
  Settings,
} from "lucide-react";

const items = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Tasks",
    href: "/dashboard/tasks",
    icon: ListTodo,
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: LayoutDashboard,
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface DashboardNavProps {
  collapsed?: boolean
}

export function DashboardNav({ collapsed }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          title={collapsed ? item.title : undefined}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors",
            pathname === item.href && "bg-accent",
            collapsed && "justify-center px-2"
          )}
        >
          <item.icon className="h-4 w-4" />
          {!collapsed && item.title}
        </Link>
      ))}
    </nav>
  )
}