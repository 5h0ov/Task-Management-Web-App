"use client"

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/store/auth-store";
import { ArrowRight, CheckCircle, Clock, Layout, Moon, Sun } from "lucide-react";
import Link from "next/link";


const features = [
  { 
    title: "Task Management", 
    icon: CheckCircle, 
    desc: "Create, organize, and track your tasks with ease. Set priorities and deadlines to stay on top of your work." 
  },
  { 
    title: "Project Organization", 
    icon: Layout, 
    desc: "Group related tasks into projects. Get a clear overview of your progress and upcoming deadlines." 
  },
  { 
    title: "Time Tracking", 
    icon: Clock, 
    desc: "Monitor time spent on tasks and projects. Analyze your productivity patterns to work smarter." 
  },
]

export default function LandingPage() {
  const { setTheme, theme } = useTheme();
  const { user, logout } = useAuthStore();

  async function  handleLogout() {
    await logout();
  }

  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Layout className="h-6 w-6" />
            <span>TaskFlow</span>
          </div>
          <nav className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            {user ? (<>
                <Link href="/">
                  <Button onClick={handleLogout} variant="outline">
                    Logout
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="default">Dashboard</Button>
                </Link>
              </>           
              ) : (<>
                <Link href="/auth/login" className="text-sm font-medium hover:underline">
                  <Button variant="outline">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center gap-8 py-24 text-center">
        <h1 className="text-4xl font-bold sm:text-6xl">
          Manage Your Tasks with
          <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {" "}
            Efficiency
          </span>
        </h1>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          TaskFlow helps you organize your daily tasks and projects in one place.
          Stay productive and never miss a deadline.
        </p>

        {user ? (
          <Link href="/dashboard">
            <Button size="lg" className="gap-2 text-base">
              Go to Dashboard <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        ) : (
          <div className="flex gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                Login
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative flex flex-col items-center gap-4 text-center p-6 rounded-lg border transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <div className="rounded-full bg-primary/10 p-4 group-hover:animate-pulse">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/40">
        <div className="container py-24">
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Join thousands of users who are already managing their tasks more
              efficiently with TaskFlow.
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="gap-2">
                Start for Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer ( MOVED TO WRAP OVER ALL CHILDREN FROM LAYOUT :) */}
      {/* <footer className="border-t">
        <div className="container flex flex-col md:flex-row h-16 p-2 items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            <span className="text-sm font-semibold">TaskFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 TaskFlow. All rights reserved.
          </p>
        </div>
      </footer>  */}
    </div>
  );
}