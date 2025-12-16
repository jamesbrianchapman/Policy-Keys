import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Plus, Search, Filter, MoreVertical, Edit, Trash2, Copy, Clock, DollarSign, FileCode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { PolicyStatusBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Policy } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Policies() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: policies = [], isLoading } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      toast({ title: "Policy deleted" });
    },
  });

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch = policy.name.toLowerCase().includes(search.toLowerCase()) ||
      (policy.description?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || policy.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-policies-title">Policies</h1>
          <p className="text-sm text-muted-foreground">
            Define rules and constraints for agent behavior
          </p>
        </div>
        <Button onClick={() => setLocation("/policies/new")} data-testid="button-new-policy">
          <Plus className="mr-2 h-4 w-4" />
          New Policy
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-policies"
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
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="violated">Violated</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPolicies.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPolicies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onDelete={() => deleteMutation.mutate(policy.id)}
            />
          ))}
        </div>
      ) : policies.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium">No matching policies</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search or filter
            </p>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Shield}
          title="No policies created"
          description="Policies define the rules and constraints that govern agent behavior. Create your first policy to get started."
          actionLabel="Create Policy"
          onAction={() => setLocation("/policies/new")}
        />
      )}
    </div>
  );
}

function PolicyCard({ policy, onDelete }: { policy: Policy; onDelete: () => void }) {
  const [, setLocation] = useLocation();

  return (
    <Card
      className="group cursor-pointer transition-all hover:border-primary/50"
      onClick={() => setLocation(`/policies/${policy.id}`)}
      data-testid={`card-policy-${policy.id}`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base" data-testid={`text-policy-name-${policy.id}`}>{policy.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {policy.description || "No description"}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visibility-visible"
              data-testid={`button-policy-menu-${policy.id}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); setLocation(`/policies/${policy.id}/edit`); }}
              data-testid={`button-edit-policy-${policy.id}`}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => e.stopPropagation()}
              data-testid={`button-duplicate-policy-${policy.id}`}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => e.stopPropagation()}
              data-testid={`button-export-policy-${policy.id}`}
            >
              <FileCode className="mr-2 h-4 w-4" />
              Export JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              data-testid={`button-delete-policy-${policy.id}`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <PolicyStatusBadge status={policy.status} />
          <span className="text-xs text-muted-foreground">v{policy.version}</span>
        </div>

        {policy.spend && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Spend Limit</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>$0 / {policy.spend.max}</span>
              <span className="text-muted-foreground">{policy.spend.window}</span>
            </div>
            <Progress value={0} className="h-1.5" />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>
              {policy.expiresAt
                ? `Expires ${formatDistanceToNow(new Date(policy.expiresAt), { addSuffix: true })}`
                : "No expiry"}
            </span>
          </div>
          <span>{policy.contracts.length} contracts</span>
        </div>
      </CardContent>
    </Card>
  );
}
