import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Check, Bot, Shield, Key, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AgentCapability, Policy, PolicyBoundKey, Agent, InsertAgent } from "@shared/schema";

const defaultCapabilities: AgentCapability[] = [
  { type: "trade", description: "Execute trades on DEXs", enabled: true },
  { type: "transfer", description: "Transfer tokens between addresses", enabled: false },
  { type: "stake", description: "Stake and unstake tokens", enabled: false },
  { type: "governance", description: "Vote on DAO proposals", enabled: false },
];

export default function AgentBuilder() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEditing = !!params.id && params.id !== "new";
  const { toast } = useToast();

  const { data: existingAgent, isLoading: loadingAgent } = useQuery<Agent>({
    queryKey: ["/api/agents", params.id],
    enabled: isEditing,
  });

  const { data: policies = [] } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  const { data: keys = [] } = useQuery<PolicyBoundKey[]>({
    queryKey: ["/api/keys"],
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [taskScope, setTaskScope] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [capabilities, setCapabilities] = useState<AgentCapability[]>(defaultCapabilities);

  useEffect(() => {
    if (existingAgent) {
      setName(existingAgent.name);
      setDescription(existingAgent.description || "");
      setTaskScope(existingAgent.taskScope);
      setPolicyId(existingAgent.policyId);
      setKeyId(existingAgent.keyId);
      setCapabilities(existingAgent.capabilities);
    }
  }, [existingAgent]);

  const activePolicies = policies.filter((p) => p.status === "active");
  const activeKeys = keys.filter((k) => k.status === "active" && k.type === "agent");

  const createMutation = useMutation({
    mutationFn: async (data: InsertAgent) => {
      const response = await apiRequest("POST", "/api/agents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Agent Deployed", description: `"${name}" is now active and bound to its policy` });
      setLocation("/agents");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deploy agent", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Agent>) => {
      const response = await apiRequest("PATCH", `/api/agents/${params.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Agent Updated", description: `"${name}" has been updated` });
      setLocation("/agents");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update agent", variant: "destructive" });
    },
  });

  const toggleCapability = (index: number) => {
    const updated = [...capabilities];
    updated[index].enabled = !updated[index].enabled;
    setCapabilities(updated);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Agent name is required",
        variant: "destructive",
      });
      return;
    }

    if (!policyId) {
      toast({
        title: "Validation Error",
        description: "Please select a policy for this agent",
        variant: "destructive",
      });
      return;
    }

    const agent: InsertAgent = {
      name,
      description: description || undefined,
      policyId,
      keyId: keyId || "auto-generated",
      status: "active",
      capabilities,
      taskScope: taskScope || "General tasks",
    };

    if (isEditing) {
      updateMutation.mutate(agent);
    } else {
      createMutation.mutate(agent);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingAgent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/agents")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-agent-builder-title">
            {isEditing ? "Edit Agent" : "Deploy Agent"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Create an autonomous agent with policy-bound capabilities
          </p>
        </div>
        <Button onClick={handleSave} disabled={isPending} data-testid="button-deploy-agent">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          {isEditing ? "Update Agent" : "Deploy Agent"}
        </Button>
      </div>

      {activePolicies.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Active Policies</AlertTitle>
          <AlertDescription>
            You need to create a policy before deploying an agent.{" "}
            <Button
              variant="link"
              className="h-auto p-0"
              onClick={() => setLocation("/policies/new")}
              data-testid="link-create-policy"
            >
              Create a policy
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Identity</CardTitle>
              <CardDescription>Name and describe your agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Trading Bot Alpha"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-agent-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What does this agent do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-agent-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskScope">Task Scope</Label>
                <Input
                  id="taskScope"
                  placeholder="e.g., ETH/USDC trading on Uniswap"
                  value={taskScope}
                  onChange={(e) => setTaskScope(e.target.value)}
                  data-testid="input-agent-task-scope"
                />
                <p className="text-xs text-muted-foreground">
                  A brief description of what tasks this agent will perform
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
              <CardDescription>Enable the actions this agent can perform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {capabilities.map((cap, index) => (
                <div
                  key={cap.type}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium capitalize">{cap.type}</p>
                    <p className="text-xs text-muted-foreground">{cap.description}</p>
                  </div>
                  <Switch
                    checked={cap.enabled}
                    onCheckedChange={() => toggleCapability(index)}
                    data-testid={`switch-capability-${cap.type}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Policy Binding
              </CardTitle>
              <CardDescription>
                Select the policy that will govern this agent's behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Policy</Label>
                <Select value={policyId} onValueChange={setPolicyId}>
                  <SelectTrigger data-testid="select-policy">
                    <SelectValue placeholder="Choose a policy..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activePolicies.map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3" />
                          <span>{policy.name}</span>
                          {policy.spend && (
                            <Badge variant="secondary" className="text-xs ml-2">
                              {policy.spend.max}/{policy.spend.window}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {policyId && (
                <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                  {(() => {
                    const policy = policies.find((p) => p.id === policyId);
                    if (!policy) return null;
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium" data-testid="text-selected-policy-name">{policy.name}</span>
                          <Badge variant="outline">v{policy.version}</Badge>
                        </div>
                        {policy.spend && (
                          <div className="text-xs text-muted-foreground">
                            Spend limit: {policy.spend.max} per {policy.spend.window}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {policy.contracts.length} contract{policy.contracts.length !== 1 ? "s" : ""} allowed
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Key Assignment
              </CardTitle>
              <CardDescription>
                Assign a policy-bound key to this agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeKeys.length > 0 ? (
                <div className="space-y-2">
                  <Label>Select Key</Label>
                  <Select value={keyId} onValueChange={setKeyId}>
                    <SelectTrigger data-testid="select-key">
                      <SelectValue placeholder="Choose a key or generate new..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Generate New Key</SelectItem>
                      {activeKeys.map((key) => (
                        <SelectItem key={key.id} value={key.id}>
                          <div className="flex items-center gap-2">
                            <Key className="h-3 w-3" />
                            <span className="font-mono text-xs">{key.fingerprint}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed p-6 text-center">
                  <Key className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-sm font-medium">Auto-generate Key</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A new policy-bound key will be generated for this agent
                  </p>
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  The assigned key will be bound to the selected policy. The agent cannot sign
                  transactions that violate policy constraints.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
