"use client"

import { DashboardNav } from "@/components/dashboard/nav"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function CollapsibleNav() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-1/2 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="relative">
        <aside className={cn(
          "fixed top-16 z-40 h-[calc(100vh-4rem)] overflow-y-auto border-r bg-background transition-all duration-300 ease-in-out md:sticky",
          "left-0 md:translate-x-0",
          !isMobileOpen && "-translate-x-full md:translate-x-0",
          "w-[180px]"
        )}>
          <div className="relative h-full">
            <ScrollArea className="py-6 px-2">
              <DashboardNav />
            </ScrollArea>
          </div>
        </aside>
      </div>

      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}