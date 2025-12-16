import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Shield, Bot, Key, Activity, AlertTriangle, TrendingUp, Clock, Zap, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { PolicyStatusBadge, AgentStatusBadge, ExecutionResultBadge } from "@/components/status-badge";
import { truncateAddress, formatCID } from "@/lib/crypto";
import type { Policy, Agent, ExecutionLog, DashboardStats } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: policies = [], isLoading: policiesLoading } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: executionLogs = [], isLoading: logsLoading } = useQuery<ExecutionLog[]>({
    queryKey: ["/api/executions"],
  });

  const displayStats = stats || {
    activePolicies: 0,
    activeAgents: 0,
    activeKeys: 0,
    todayExecutions: 0,
    successRate: 100,
    totalSpendToday: "$0.00",
    violations24h: 0,
  };

  const recentPolicies = policies.slice(0, 3);
  const recentAgents = agents.slice(0, 3);
  const recentExecutions = executionLogs.slice(0, 5);

  const isLoading = statsLoading || policiesLoading || agentsLoading || logsLoading;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your policies, agents, and execution activity
          </p>
        </div>
        {!stats && !statsLoading && (
          <Card className="border-status-away/30 bg-status-away/5">
            <CardContent className="flex items-center gap-3 p-3">
              <AlertTriangle className="h-4 w-4 text-status-away" />
              <span className="text-sm">Connect your wallet to get started</span>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Active Policies"
              value={displayStats.activePolicies}
              description="Enforcing constraints"
              icon={Shield}
            />
            <StatCard
              title="Active Agents"
              value={displayStats.activeAgents}
              description="Operating autonomously"
              icon={Bot}
            />
            <StatCard
              title="Today's Executions"
              value={displayStats.todayExecutions}
              description={`${displayStats.successRate.toFixed(1)}% success rate`}
              icon={Activity}
              trend={displayStats.todayExecutions > 0 ? { value: 12, isPositive: true } : undefined}
            />
            <StatCard
              title="Total Spend Today"
              value={displayStats.totalSpendToday}
              description="Across all policies"
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-lg">Active Policies</CardTitle>
              <CardDescription>Your current policy configurations</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/policies/new")}
              data-testid="button-new-policy-quick"
            >
              New Policy
            </Button>
          </CardHeader>
          <CardContent>
            {policiesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : recentPolicies.length > 0 ? (
              <div className="space-y-4">
                {recentPolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-4 hover-elevate cursor-pointer"
                    onClick={() => setLocation(`/policies/${policy.id}`)}
                    data-testid={`card-policy-${policy.id}`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium" data-testid={`text-policy-name-${policy.id}`}>{policy.name}</p>
                        <PolicyStatusBadge status={policy.status} />
                      </div>
                      {policy.spend && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Spend: $0 / {policy.spend.max}</span>
                            <span>0%</span>
                          </div>
                          <Progress value={0} className="h-1.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {policy.expiresAt
                          ? `Expires ${formatDistanceToNow(new Date(policy.expiresAt), { addSuffix: true })}`
                          : "No expiry"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Shield className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">No policies yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create your first policy to start controlling agent behavior
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => setLocation("/policies/new")}
                  data-testid="button-create-first-policy"
                >
                  Create Policy
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-lg">Agent Activity</CardTitle>
              <CardDescription>Recent agent operations</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/agents/new")}
              data-testid="button-new-agent-quick"
            >
              New Agent
            </Button>
          </CardHeader>
          <CardContent>
            {agentsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentAgents.length > 0 ? (
              <div className="space-y-4">
                {recentAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-4 hover-elevate cursor-pointer"
                    onClick={() => setLocation(`/agents/${agent.id}`)}
                    data-testid={`card-agent-${agent.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium" data-testid={`text-agent-name-${agent.id}`}>{agent.name}</p>
                          <AgentStatusBadge status={agent.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">{agent.taskScope}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{agent.successRate}%</p>
                      <p className="text-xs text-muted-foreground">{agent.totalActions} actions</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">No agents yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Deploy your first agent with policy-bound keys
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => setLocation("/agents/new")}
                  data-testid="button-create-first-agent"
                >
                  Create Agent
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-lg">Execution History</CardTitle>
            <CardDescription>Recent policy-gated actions</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/history")}
            data-testid="button-view-all-history"
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentExecutions.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {recentExecutions.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-4 hover-elevate cursor-pointer"
                    onClick={() => setLocation(`/history/${log.id}`)}
                    data-testid={`card-execution-${log.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        log.result === "success" ? "bg-status-online/10" :
                        log.result === "denied" ? "bg-status-busy/10" :
                        "bg-status-away/10"
                      }`}>
                        <Zap className={`h-4 w-4 ${
                          log.result === "success" ? "text-status-online" :
                          log.result === "denied" ? "text-status-busy" :
                          "text-status-away"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize" data-testid={`text-execution-type-${log.id}`}>{log.actionType}</p>
                          <ExecutionResultBadge result={log.result} />
                        </div>
                        <p className="font-mono text-xs text-muted-foreground">
                          {formatCID(log.inputCID)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </p>
                      {log.txHash && (
                        <p className="font-mono text-xs text-muted-foreground">
                          {truncateAddress(log.txHash)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">No executions yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Actions will appear here as agents execute tasks
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
