import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Key, Plus, Search, Filter, MoreVertical, Copy, RotateCcw, Trash2, Shield, ExternalLink, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge, KeyTypeBadge } from "@/components/status-badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { truncateAddress } from "@/lib/crypto";
import { useToast } from "@/hooks/use-toast";
import type { PolicyBoundKey, Policy } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Keys() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: keys = [], isLoading } = useQuery<PolicyBoundKey[]>({
    queryKey: ["/api/keys"],
  });

  const { data: policies = [] } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/keys/${id}`, { status: "revoked" });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({ title: "Key revoked" });
    },
  });

  const filteredKeys = keys.filter((key) => {
    const matchesSearch = key.fingerprint.toLowerCase().includes(search.toLowerCase()) ||
      key.address.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || key.type === typeFilter;
    const matchesStatus = statusFilter === "all" || key.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-keys-title">Key Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage policy-bound cryptographic keys
          </p>
        </div>
        <Button onClick={() => setLocation("/keys/new")} data-testid="button-generate-key">
          <Plus className="mr-2 h-4 w-4" />
          Generate Key
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by fingerprint or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-keys"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
            <SelectValue placeholder="Key type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="root">Root</SelectItem>
            <SelectItem value="child">Child</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Policy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : filteredKeys.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Policy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((key) => {
                  const policy = policies.find((p) => p.id === key.policyId);
                  return (
                    <TableRow key={key.id} data-testid={`row-key-${key.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm" data-testid={`text-key-fingerprint-${key.id}`}>{key.fingerprint}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(key.fingerprint, "Fingerprint")}
                            data-testid={`button-copy-fingerprint-${key.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <KeyTypeBadge type={key.type} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{truncateAddress(key.address)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(key.address, "Address")}
                            data-testid={`button-copy-address-${key.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <a
                            href={`https://arbiscan.io/address/${key.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            data-testid={`link-explorer-${key.id}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        {policy ? (
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{policy.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No policy</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={key.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-key-menu-${key.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => copyToClipboard(key.publicKey, "Public key")}
                              data-testid={`button-copy-public-key-${key.id}`}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Public Key
                            </DropdownMenuItem>
                            {key.type !== "root" && (
                              <DropdownMenuItem data-testid={`button-rotate-key-${key.id}`}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Rotate Key
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => revokeMutation.mutate(key.id)}
                              disabled={key.status === "revoked"}
                              data-testid={`button-revoke-key-${key.id}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Revoke Key
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : keys.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium">No matching keys</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Key}
          title="No keys generated"
          description="Policy-bound keys enable secure, constrained signing. Generate your first key to get started."
          actionLabel="Generate Key"
          onAction={() => setLocation("/keys/new")}
        />
      )}
    </div>
  );
}
