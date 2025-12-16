import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Shield,
  Bot,
  Key,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  Zap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Policies", url: "/policies", icon: Shield },
  { title: "Agents", url: "/agents", icon: Bot },
  { title: "Keys", url: "/keys", icon: Key },
  { title: "Execution History", url: "/history", icon: History },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { isConnected, stats } = useAppStore();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between gap-2 px-2 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Hexagon className="h-5 w-5 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight">I-AM-SYSTEMS</span>
                <span className="text-xs text-muted-foreground">v3.0</span>
              </div>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleSidebar}
            data-testid="button-toggle-sidebar"
            className="shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <a
                        href={item.url}
                        onClick={(e) => {
                          e.preventDefault();
                          setLocation(item.url);
                        }}
                        data-testid={`link-nav-${item.title.toLowerCase().replace(" ", "-")}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isCollapsed && stats && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2 px-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Policies</span>
                  <Badge variant="secondary" className="text-xs">{stats.activePolicies}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Agents</span>
                  <Badge variant="secondary" className="text-xs">{stats.activeAgents}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Today's Actions</span>
                  <Badge variant="secondary" className="text-xs">{stats.todayExecutions}</Badge>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-3">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-status-online" : "bg-status-offline"}`} />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-xs font-medium">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
                <span className="text-xs text-muted-foreground">Arbitrum One</span>
              </div>
            )}
            {!isCollapsed && isConnected && (
              <Zap className="ml-auto h-3 w-3 text-status-online" />
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
