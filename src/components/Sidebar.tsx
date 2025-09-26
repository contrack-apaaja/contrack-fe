"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, Clipboard, LogOut, User, Menu, X } from "lucide-react"
import { authUtils } from "@/services/api"
import { useSidebar } from "@/contexts/SidebarContext"


const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contract", href: "/contracts", icon: FileText },
  { name: "Clause", href: "/clauses", icon: Clipboard },
]

const useAuth = () => ({
  user: {
    name: "John Doe",
    email: "john.doe@example.com",
  },
  logout: () => authUtils.logout(),
})


export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
  }

  return (
    <div className="fixed top-0 left-0 flex w-64 h-full flex-col bg-sidebar border-r border-sidebar-border z-40">
        <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-[#137fec]">contrack.</h1>
        </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-[#137fec] text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary">
            <User className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

export default Sidebar;