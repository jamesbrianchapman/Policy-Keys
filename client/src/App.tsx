import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/lib/theme";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { CommandPalette } from "@/components/command-palette";
import Dashboard from "@/pages/dashboard";
import Policies from "@/pages/policies";
import PolicyBuilder from "@/pages/policy-builder";
import Agents from "@/pages/agents";
import AgentBuilder from "@/pages/agent-builder";
import Keys from "@/pages/keys";
import KeyGenerator from "@/pages/key-generator";
import ExecutionHistory from "@/pages/history";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/policies" component={Policies} />
      <Route path="/policies/new" component={PolicyBuilder} />
      <Route path="/policies/:id" component={PolicyBuilder} />
      <Route path="/policies/:id/edit" component={PolicyBuilder} />
      <Route path="/agents" component={Agents} />
      <Route path="/agents/new" component={AgentBuilder} />
      <Route path="/agents/:id" component={AgentBuilder} />
      <Route path="/agents/:id/edit" component={AgentBuilder} />
      <Route path="/keys" component={Keys} />
      <Route path="/keys/new" component={KeyGenerator} />
      <Route path="/history" component={ExecutionHistory} />
      <Route path="/history/:id" component={ExecutionHistory} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <SidebarInset className="flex flex-col flex-1 overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-y-auto p-6">
                  <div className="mx-auto max-w-7xl">
                    <Router />
                  </div>
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
          <CommandPalette />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
