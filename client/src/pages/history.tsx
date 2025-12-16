import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { History, Search, Filter, Play, ExternalLink, FileCode, Copy, Clock, Zap, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { ExecutionResultBadge } from "@/components/status-badge";
import { truncateAddress, formatCID } from "@/lib/crypto";
import { useToast } from "@/hooks/use-toast";
import type { ExecutionLog, Agent, Policy } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";

export default function ExecutionHistory() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<ExecutionLog | null>(null);

  const { data: executionLogs = [], isLoading } = useQuery<ExecutionLog[]>({
    queryKey: ["/api/executions"],
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: policies = [] } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  const filteredLogs = executionLogs.filter((log) => {
    const matchesSearch = 
      log.inputCID.toLowerCase().includes(search.toLowerCase()) ||
      log.txHash?.toLowerCase().includes(search.toLowerCase());
    const matchesResult = resultFilter === "all" || log.result === resultFilter;
    const matchesAction = actionFilter === "all" || log.actionType === actionFilter;
    return matchesSearch && matchesResult && matchesAction;
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-status-online" />;
      case "denied":
        return <XCircle className="h-4 w-4 text-status-busy" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-status-away" />;
      default:
        return <Zap className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-history-title">
            Execution History
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and replay policy-gated actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-export-logs">
            <FileCode className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by CID or transaction hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-history"
          />
        </div>
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-result-filter">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-action-filter">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="swap">Swap</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="approve">Approve</SelectItem>
            <SelectItem value="stake">Stake</SelectItem>
            <SelectItem value="unstake">Unstake</SelectItem>
            <SelectItem value="vote">Vote</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Result</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Input CID</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : filteredLogs.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Result</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Input CID</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const agent = agents.find((a) => a.id === log.agentId);
                  return (
                    <TableRow 
                      key={log.id} 
                      className="cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                      data-testid={`row-execution-${log.id}`}
                    >
                      <TableCell>
                        {getResultIcon(log.result)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {log.actionType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm" data-testid={`text-execution-agent-${log.id}`}>{agent?.name || "Unknown"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{formatCID(log.inputCID)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(log.inputCID, "Input CID"); }}
                            data-testid={`button-copy-cid-${log.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.txHash ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">{truncateAddress(log.txHash)}</span>
                            <a
                              href={`https://arbiscan.io/tx/${log.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`link-tx-${log.id}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No tx</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                            data-testid={`button-view-${log.id}`}
                          >
                            <Search className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={log.result !== "success"}
                            data-testid={`button-replay-${log.id}`}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : executionLogs.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium">No matching executions</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={History}
          title="No execution history"
          description="Execution logs will appear here as agents perform policy-gated actions."
        />
      )}

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        {selectedLog && (
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getResultIcon(selectedLog.result)}
                <span className="capitalize">{selectedLog.actionType}</span>
                <ExecutionResultBadge result={selectedLog.result} />
              </DialogTitle>
              <DialogDescription>
                {format(new Date(selectedLog.timestamp), "PPpp")}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="details" className="flex-1 overflow-hidden">
              <TabsList>
                <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
                <TabsTrigger value="policy" data-testid="tab-policy">Policy Check</TabsTrigger>
                <TabsTrigger value="inputs" data-testid="tab-inputs">Inputs</TabsTrigger>
                {selectedLog.outputs && <TabsTrigger value="outputs" data-testid="tab-outputs">Outputs</TabsTrigger>}
              </TabsList>

              <ScrollArea className="flex-1 mt-4">
                <TabsContent value="details" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Input CID</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm" data-testid="text-input-cid">{formatCID(selectedLog.inputCID, 12)}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedLog.inputCID, "Input CID")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Policy CID</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{formatCID(selectedLog.policyCID, 12)}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(selectedLog.policyCID, "Policy CID")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {selectedLog.outputCID && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Output CID</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{formatCID(selectedLog.outputCID, 12)}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(selectedLog.outputCID!, "Output CID")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedLog.txHash && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Transaction Hash</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm">{truncateAddress(selectedLog.txHash, 8)}</p>
                          <a
                            href={`https://arbiscan.io/tx/${selectedLog.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedLog.gasUsed && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Gas Used</p>
                        <p className="text-sm">{selectedLog.gasUsed}</p>
                      </div>
                    )}
                    {selectedLog.duration && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm">{selectedLog.duration}ms</p>
                      </div>
                    )}
                  </div>

                  {selectedLog.denialReason && (
                    <div className="rounded-lg bg-destructive/10 p-4">
                      <p className="text-sm font-medium text-destructive">Denial Reason</p>
                      <p className="text-sm text-destructive/80 mt-1" data-testid="text-denial-reason">{selectedLog.denialReason}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="policy" className="mt-0 space-y-4">
                  {selectedLog.policyEvaluation && (
                    <div className="space-y-3">
                      {Object.entries(selectedLog.policyEvaluation).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                          <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          {value ? (
                            <CheckCircle className="h-4 w-4 text-status-online" />
                          ) : (
                            <XCircle className="h-4 w-4 text-status-busy" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="inputs" className="mt-0">
                  <pre className="text-xs font-mono bg-muted/50 p-4 rounded-lg overflow-x-auto" data-testid="text-inputs-json">
                    {JSON.stringify(selectedLog.inputs, null, 2)}
                  </pre>
                </TabsContent>

                {selectedLog.outputs && (
                  <TabsContent value="outputs" className="mt-0">
                    <pre className="text-xs font-mono bg-muted/50 p-4 rounded-lg overflow-x-auto" data-testid="text-outputs-json">
                      {JSON.stringify(selectedLog.outputs, null, 2)}
                    </pre>
                  </TabsContent>
                )}
              </ScrollArea>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
