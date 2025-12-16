import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Check, Code, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { KNOWN_CONTRACTS, type ContractAllowlist, type PolicyCondition, type SpendLimit, type Policy, type InsertPolicy } from "@shared/schema";

export default function PolicyBuilder() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEditing = !!params.id && params.id !== "new";
  const { toast } = useToast();

  const { data: existingPolicy, isLoading: loadingPolicy } = useQuery<Policy>({
    queryKey: ["/api/policies", params.id],
    enabled: isEditing,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [spendEnabled, setSpendEnabled] = useState(true);
  const [spendMax, setSpendMax] = useState(500);
  const [spendCurrency, setSpendCurrency] = useState<SpendLimit["currency"]>("USD");
  const [spendWindow, setSpendWindow] = useState<SpendLimit["window"]>("24h");
  const [contracts, setContracts] = useState<ContractAllowlist[]>([]);
  const [conditions, setConditions] = useState<PolicyCondition[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [revokeOnViolation, setRevokeOnViolation] = useState(true);
  const [revokeOnExpiry, setRevokeOnExpiry] = useState(true);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    if (existingPolicy) {
      setName(existingPolicy.name);
      setDescription(existingPolicy.description || "");
      setSpendEnabled(!!existingPolicy.spend);
      if (existingPolicy.spend) {
        const amount = parseInt(existingPolicy.spend.max.replace(/[^\d]/g, "")) || 500;
        setSpendMax(amount);
        setSpendCurrency(existingPolicy.spend.currency);
        setSpendWindow(existingPolicy.spend.window);
      }
      setContracts(existingPolicy.contracts);
      setConditions(existingPolicy.conditions);
      setExpiresAt(existingPolicy.expiresAt || "");
      setRevokeOnViolation(existingPolicy.revokeOn.includes("violation"));
      setRevokeOnExpiry(existingPolicy.revokeOn.includes("expiry"));
    }
  }, [existingPolicy]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertPolicy) => {
      const response = await apiRequest("POST", "/api/policies", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      toast({ title: "Policy Created", description: `"${name}" has been created successfully` });
      setLocation("/policies");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create policy", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Policy>) => {
      const response = await apiRequest("PATCH", `/api/policies/${params.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policies"] });
      toast({ title: "Policy Updated", description: `"${name}" has been updated` });
      setLocation("/policies");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update policy", variant: "destructive" });
    },
  });

  const addKnownContract = (key: keyof typeof KNOWN_CONTRACTS) => {
    const contract = KNOWN_CONTRACTS[key];
    const newContract: ContractAllowlist = {
      address: key === "uniswap" ? contract.router : key === "aave" ? contract.pool : contract.router,
      name: contract.name,
      functions: [...contract.functions],
      verified: true,
    };
    setContracts([...contracts, newContract]);
  };

  const addCustomContract = () => {
    setContracts([
      ...contracts,
      { address: "", name: "", functions: [], verified: false },
    ]);
  };

  const updateContract = (index: number, updates: Partial<ContractAllowlist>) => {
    const updated = [...contracts];
    updated[index] = { ...updated[index], ...updates };
    setContracts(updated);
  };

  const removeContract = (index: number) => {
    setContracts(contracts.filter((_, i) => i !== index));
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { type: "oracle", operator: "lt", value: "" },
    ]);
  };

  const updateCondition = (index: number, updates: Partial<PolicyCondition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates };
    setConditions(updated);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const buildPolicyObject = (): InsertPolicy => {
    const revokeOn: ("violation" | "manual" | "expiry" | "spend_exceeded")[] = ["manual"];
    if (revokeOnViolation) revokeOn.push("violation");
    if (revokeOnExpiry && expiresAt) revokeOn.push("expiry");
    if (spendEnabled) revokeOn.push("spend_exceeded");

    return {
      name,
      version: existingPolicy?.version ? existingPolicy.version + 1 : 1,
      description: description || undefined,
      spend: spendEnabled ? { max: `${spendMax} ${spendCurrency}`, currency: spendCurrency, window: spendWindow } : undefined,
      contracts,
      conditions,
      expiresAt: expiresAt || undefined,
      revokeOn,
      status: "active",
    };
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Policy name is required",
        variant: "destructive",
      });
      return;
    }

    const policy = buildPolicyObject();
    
    if (isEditing) {
      updateMutation.mutate(policy);
    } else {
      createMutation.mutate(policy);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const policyJson = JSON.stringify(buildPolicyObject(), null, 2);

  const naturalLanguageSummary = () => {
    const parts = [];
    
    if (spendEnabled) {
      parts.push(`Spend up to ${spendMax} ${spendCurrency} per ${spendWindow}`);
    }
    
    if (contracts.length > 0) {
      const names = contracts.map(c => c.name || c.address.slice(0, 10)).join(", ");
      parts.push(`Interact with ${names}`);
    }
    
    if (conditions.length > 0) {
      parts.push(`${conditions.length} condition${conditions.length > 1 ? "s" : ""} applied`);
    }
    
    if (expiresAt) {
      parts.push(`Valid until ${new Date(expiresAt).toLocaleDateString()}`);
    }
    
    return parts.length > 0 ? parts.join(" | ") : "Configure your policy settings below";
  };

  if (isEditing && loadingPolicy) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/policies")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-policy-builder-title">
            {isEditing ? "Edit Policy" : "Create Policy"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Define rules and constraints for agent behavior
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowJson(!showJson)} data-testid="button-toggle-json">
          <Code className="mr-2 h-4 w-4" />
          {showJson ? "Hide" : "Show"} JSON
        </Button>
        <Button onClick={handleSave} disabled={isPending} data-testid="button-save-policy">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          {isEditing ? "Update Policy" : "Create Policy"}
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <p className="text-sm" data-testid="text-policy-summary">{naturalLanguageSummary()}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Name and describe your policy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Trading Policy - ETH/USDC"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-policy-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this policy allows..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-policy-description"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="spend" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="spend" data-testid="tab-spend">Spend Limits</TabsTrigger>
              <TabsTrigger value="contracts" data-testid="tab-contracts">Contracts</TabsTrigger>
              <TabsTrigger value="conditions" data-testid="tab-conditions">Conditions</TabsTrigger>
              <TabsTrigger value="duration" data-testid="tab-duration">Duration</TabsTrigger>
            </TabsList>

            <TabsContent value="spend" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Spend Limits</CardTitle>
                      <CardDescription>Set maximum spending constraints</CardDescription>
                    </div>
                    <Switch
                      checked={spendEnabled}
                      onCheckedChange={setSpendEnabled}
                      data-testid="switch-spend-enabled"
                    />
                  </div>
                </CardHeader>
                {spendEnabled && (
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Maximum Amount</Label>
                        <span className="text-2xl font-bold" data-testid="text-spend-amount">{spendMax} {spendCurrency}</span>
                      </div>
                      <Slider
                        value={[spendMax]}
                        onValueChange={(v) => setSpendMax(v[0])}
                        max={10000}
                        step={50}
                        data-testid="slider-spend-max"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>10,000</span>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={spendCurrency} onValueChange={(v) => setSpendCurrency(v as SpendLimit["currency"])}>
                          <SelectTrigger data-testid="select-spend-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="ETH">ETH</SelectItem>
                            <SelectItem value="USDC">USDC</SelectItem>
                            <SelectItem value="USDT">USDT</SelectItem>
                            <SelectItem value="DAI">DAI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Time Window</Label>
                        <Select value={spendWindow} onValueChange={(v) => setSpendWindow(v as SpendLimit["window"])}>
                          <SelectTrigger data-testid="select-spend-window">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1h">Per Hour</SelectItem>
                            <SelectItem value="24h">Per Day</SelectItem>
                            <SelectItem value="7d">Per Week</SelectItem>
                            <SelectItem value="30d">Per Month</SelectItem>
                            <SelectItem value="lifetime">Lifetime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="contracts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Allowlist</CardTitle>
                  <CardDescription>Specify which contracts and functions agents can interact with</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addKnownContract("uniswap")}
                      data-testid="button-add-uniswap"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Uniswap V3
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addKnownContract("aave")}
                      data-testid="button-add-aave"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Aave V3
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addKnownContract("gmx")}
                      data-testid="button-add-gmx"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      GMX
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCustomContract}
                      data-testid="button-add-custom-contract"
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Custom
                    </Button>
                  </div>

                  <Separator />

                  {contracts.length > 0 ? (
                    <div className="space-y-4">
                      {contracts.map((contract, index) => (
                        <div key={index} className="rounded-lg border p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Contract name"
                                  value={contract.name || ""}
                                  onChange={(e) => updateContract(index, { name: e.target.value })}
                                  className="max-w-[200px]"
                                  data-testid={`input-contract-name-${index}`}
                                />
                                {contract.verified && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Check className="mr-1 h-3 w-3" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <Input
                                placeholder="0x..."
                                value={contract.address}
                                onChange={(e) => updateContract(index, { address: e.target.value })}
                                className="font-mono text-sm"
                                data-testid={`input-contract-address-${index}`}
                              />
                              <div className="flex flex-wrap gap-1">
                                {contract.functions.map((fn, fnIndex) => (
                                  <Badge key={fnIndex} variant="outline" className="text-xs">
                                    {fn}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeContract(index)}
                              data-testid={`button-remove-contract-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No contracts added yet</p>
                      <p className="text-xs mt-1">Add known protocols or custom contracts above</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conditions" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Conditions</CardTitle>
                      <CardDescription>Add conditional constraints based on oracles, time, or other factors</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addCondition} data-testid="button-add-condition">
                      <Plus className="mr-2 h-3 w-3" />
                      Add Condition
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {conditions.length > 0 ? (
                    <div className="space-y-4">
                      {conditions.map((condition, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-lg border p-4">
                          <Select
                            value={condition.type}
                            onValueChange={(v) => updateCondition(index, { type: v as PolicyCondition["type"] })}
                          >
                            <SelectTrigger className="w-[140px]" data-testid={`select-condition-type-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="oracle">Oracle Price</SelectItem>
                              <SelectItem value="time">Time Window</SelectItem>
                              <SelectItem value="block">Block Number</SelectItem>
                              <SelectItem value="balance">Balance Check</SelectItem>
                            </SelectContent>
                          </Select>

                          {condition.type === "oracle" && (
                            <Input
                              placeholder="e.g., ETH/USD"
                              value={condition.oracle || ""}
                              onChange={(e) => updateCondition(index, { oracle: e.target.value })}
                              className="w-[120px]"
                              data-testid={`input-condition-oracle-${index}`}
                            />
                          )}

                          <Select
                            value={condition.operator}
                            onValueChange={(v) => updateCondition(index, { operator: v as PolicyCondition["operator"] })}
                          >
                            <SelectTrigger className="w-[100px]" data-testid={`select-condition-operator-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lt">{"<"} Less than</SelectItem>
                              <SelectItem value="lte">{"<="} Less or equal</SelectItem>
                              <SelectItem value="gt">{">"} Greater than</SelectItem>
                              <SelectItem value="gte">{">="} Greater or equal</SelectItem>
                              <SelectItem value="eq">{"="} Equals</SelectItem>
                              <SelectItem value="between">Between</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            placeholder="Value"
                            value={condition.value}
                            onChange={(e) => updateCondition(index, { value: e.target.value })}
                            className="flex-1"
                            data-testid={`input-condition-value-${index}`}
                          />

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCondition(index)}
                            data-testid={`button-remove-condition-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No conditions added</p>
                      <p className="text-xs mt-1">Add conditions to restrict when the policy applies</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="duration" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Duration & Revocation</CardTitle>
                  <CardDescription>Set expiration and auto-revocation rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="expires">Expiration Date (optional)</Label>
                    <Input
                      id="expires"
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      data-testid="input-expires-at"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for no expiration
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Auto-Revocation Rules</Label>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Revoke on Violation</p>
                        <p className="text-xs text-muted-foreground">
                          Automatically revoke if policy constraints are violated
                        </p>
                      </div>
                      <Switch
                        checked={revokeOnViolation}
                        onCheckedChange={setRevokeOnViolation}
                        data-testid="switch-revoke-violation"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Revoke on Expiry</p>
                        <p className="text-xs text-muted-foreground">
                          Automatically revoke when the policy expires
                        </p>
                      </div>
                      <Switch
                        checked={revokeOnExpiry}
                        onCheckedChange={setRevokeOnExpiry}
                        data-testid="switch-revoke-expiry"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {showJson && (
          <Card className="lg:sticky lg:top-20 h-fit">
            <CardHeader>
              <CardTitle className="text-sm">Policy JSON</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <pre className="text-xs font-mono bg-muted/50 p-4 rounded-lg overflow-x-auto" data-testid="text-policy-json">
                  {policyJson}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
