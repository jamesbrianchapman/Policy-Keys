import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "active" | "idle" | "paused" | "revoked" | "expired" | "violated" | "success" | "denied" | "pending" | "failed" | "replayed";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; dotColor: string }> = {
  active: { label: "Active", variant: "default", dotColor: "bg-status-online" },
  idle: { label: "Idle", variant: "secondary", dotColor: "bg-status-away" },
  paused: { label: "Paused", variant: "secondary", dotColor: "bg-status-away" },
  revoked: { label: "Revoked", variant: "destructive", dotColor: "bg-status-busy" },
  expired: { label: "Expired", variant: "secondary", dotColor: "bg-status-offline" },
  violated: { label: "Violated", variant: "destructive", dotColor: "bg-status-busy" },
  success: { label: "Success", variant: "default", dotColor: "bg-status-online" },
  denied: { label: "Denied", variant: "destructive", dotColor: "bg-status-busy" },
  pending: { label: "Pending", variant: "secondary", dotColor: "bg-status-away" },
  failed: { label: "Failed", variant: "destructive", dotColor: "bg-status-busy" },
  replayed: { label: "Replayed", variant: "outline", dotColor: "bg-primary" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.active;

  return (
    <Badge variant={config.variant} className={cn("gap-1.5", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </Badge>
  );
}

interface PolicyStatusBadgeProps {
  status: "active" | "expired" | "violated" | "revoked";
  className?: string;
}

export function PolicyStatusBadge({ status, className }: PolicyStatusBadgeProps) {
  return <StatusBadge status={status} className={className} />;
}

interface AgentStatusBadgeProps {
  status: "active" | "idle" | "paused" | "revoked";
  className?: string;
}

export function AgentStatusBadge({ status, className }: AgentStatusBadgeProps) {
  return <StatusBadge status={status} className={className} />;
}

interface ExecutionResultBadgeProps {
  result: "success" | "denied" | "pending" | "failed" | "replayed";
  className?: string;
}

export function ExecutionResultBadge({ result, className }: ExecutionResultBadgeProps) {
  return <StatusBadge status={result} className={className} />;
}

interface KeyTypeBadgeProps {
  type: "root" | "child" | "agent";
  className?: string;
}

const keyTypeConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  root: { label: "Root", variant: "default" },
  child: { label: "Child", variant: "secondary" },
  agent: { label: "Agent", variant: "outline" },
};

export function KeyTypeBadge({ type, className }: KeyTypeBadgeProps) {
  const config = keyTypeConfig[type] || keyTypeConfig.child;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
