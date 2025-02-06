import { UserNav } from "@/components/dashboard/user-nav"
import { Layout } from "lucide-react"
import { CollapsibleNav } from "@/components/dashboard/collapsible-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Layout className="h-6 w-6" />
            <span>TaskFlow</span>
          </div>
          <UserNav />
        </div>
      </header>
      <div className="container flex-1 items-start">
        <div className="flex">
          <CollapsibleNav />
          <main className="flex w-full flex-col overflow-hidden pl-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}