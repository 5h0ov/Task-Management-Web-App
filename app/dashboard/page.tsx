"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, LayoutDashboard, ListTodo } from "lucide-react";
import { DashboardStats } from "@/lib/types/schema";
import { useAuthStore } from "@/lib/store/auth-store";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics");
      }
      return response.json();
    },
  });

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome, {user?.name}
        </h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : stats?.totalTasks || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "..." : 
                    `${stats?.totalTasksDiff && stats?.totalTasksDiff > 0 ? "+" : ""}${stats?.totalTasksDiff || 0} from last week`
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : stats?.completedTasks || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "..." :
                    `${stats?.completedTasksDiff && stats?.completedTasksDiff > 0 ? "+" : ""}${stats?.completedTasksDiff || 0} from last week`
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : stats?.activeProjects || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "..." :
                    `${stats?.activeProjectsDiff && stats?.activeProjectsDiff > 0 ? "+" : ""}${stats?.activeProjectsDiff || 0} from last month`
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : stats?.overdueTasks || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "..." :
                    `${stats?.overdueTasksDiff && stats?.overdueTasksDiff > 0 ? "+" : ""}${stats?.overdueTasksDiff || 0} from last week`
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
            <div>To be added.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}