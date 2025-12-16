import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot, Plus, Search, Filter, MoreVertical, Pause, Play, Settings, Trash2, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { AgentStatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Agent, Policy } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Agents() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: policies = [] } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Agent> }) => {
      const response = await apiRequest("PATCH", `/api/agents/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Agent deleted" });
    },
  });

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
      (agent.description?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleAgentStatus = (agent: Agent) => {
    const newStatus = agent.status === "active" ? "paused" : agent.status === "paused" ? "active" : agent.status;
    updateMutation.mutate({ id: agent.id, updates: { status: newStatus } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-agents-title">Agents</h1>
          <p className="text-sm text-muted-foreground">
            Manage autonomous agents with policy-bound capabilities
          </p>
        </div>
        <Button onClick={() => setLocation("/agents/new")} data-testid="button-new-agent">
          <Plus className="mr-2 h-4 w-4" />
          New Agent
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-agents"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAgents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => {
            const policy = policies.find((p) => p.id === agent.policyId);
            return (
              <Card
                key={agent.id}
                className="group cursor-pointer transition-all hover:border-primary/50"
                onClick={() => setLocation(`/agents/${agent.id}`)}
                data-testid={`card-agent-${agent.id}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={agent.avatar} />
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-base" data-testid={`text-agent-name-${agent.id}`}>{agent.name}</CardTitle>
                      <CardDescription className="line-clamp-1">
                        {agent.taskScope}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                        data-testid={`button-agent-menu-${agent.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); toggleAgentStatus(agent); }}
                        data-testid={`button-toggle-agent-${agent.id}`}
                      >
                        {agent.status === "active" ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Resume
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); setLocation(`/agents/${agent.id}/edit`); }}
                        data-testid={`button-configure-agent-${agent.id}`}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(agent.id); }}
                        data-testid={`button-revoke-agent-${agent.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revoke
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <AgentStatusBadge status={agent.status} />
                    {policy && (
                      <Badge variant="outline" className="text-xs">
                        {policy.name}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium" data-testid={`text-agent-success-rate-${agent.id}`}>{agent.successRate}%</span>
                    </div>
                    <Progress value={agent.successRate} className="h-1.5" />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.filter(c => c.enabled).slice(0, 3).map((cap, index) => (
                      <Badge key={index} variant="secondary" className="text-xs capitalize">
                        {cap.type}
                      </Badge>
                    ))}
                    {agent.capabilities.filter(c => c.enabled).length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{agent.capabilities.filter(c => c.enabled).length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3" />
                      <span>{agent.totalActions} actions</span>
                    </div>
                    {agent.lastActiveAt && (
                      <span>Active {formatDistanceToNow(new Date(agent.lastActiveAt), { addSuffix: true })}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : agents.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium">No matching agents</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search or filter
            </p>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Bot}
          title="No agents deployed"
          description="Agents are autonomous operators that execute tasks within policy constraints. Deploy your first agent to get started."
          actionLabel="Deploy Agent"
          onAction={() => setLocation("/agents/new")}
        />
      )}
    </div>
  );
}
