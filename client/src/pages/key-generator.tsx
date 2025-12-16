import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Check, Key, Shield, AlertTriangle, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { generateKeyPair, generateFingerprint, encryptPrivateKey } from "@/lib/crypto";
import type { PolicyBoundKey, Policy, InsertKey } from "@shared/schema";

export default function KeyGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: keys = [] } = useQuery<PolicyBoundKey[]>({
    queryKey: ["/api/keys"],
  });

  const { data: policies = [] } = useQuery<Policy[]>({
    queryKey: ["/api/policies"],
  });

  const [keyType, setKeyType] = useState<"root" | "child" | "agent">("child");
  const [parentKeyId, setParentKeyId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const rootKeys = keys.filter((k) => k.type === "root" && k.status === "active");
  const activePolicies = policies.filter((p) => p.status === "active");

  const createMutation = useMutation({
    mutationFn: async (data: InsertKey) => {
      const response = await apiRequest("POST", "/api/keys", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({ title: "Key Generated", description: `New ${keyType} key created successfully` });
      setLocation("/keys");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate key", variant: "destructive" });
    },
  });

  const handleGenerate = async () => {
    if (keyType !== "root" && !parentKeyId && rootKeys.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please select a parent key",
        variant: "destructive",
      });
      return;
    }

    if (keyType === "agent" && !policyId) {
      toast({
        title: "Validation Error",
        description: "Agent keys must be bound to a policy",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { publicKey, privateKey, address } = await generateKeyPair();
      const fingerprint = generateFingerprint(publicKey);
      
      let encryptedPrivateKey: string | undefined;
      if (password) {
        encryptedPrivateKey = await encryptPrivateKey(privateKey, password);
      }

      const newKey: InsertKey = {
        fingerprint,
        type: keyType,
        policyId: policyId && policyId !== "none" ? policyId : undefined,
        agentId: undefined,
        address,
        publicKey,
        encryptedPrivateKey,
        status: "active",
        expiresAt: undefined,
        parentKeyId: parentKeyId || undefined,
        derivationPath: keyType !== "root" ? `m/44'/60'/0'/0/${keys.length}` : undefined,
      };

      createMutation.mutate(newKey);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isPending = isGenerating || createMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/keys")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-key-generator-title">
            Generate Key
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new policy-bound cryptographic key
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={isPending} data-testid="button-generate">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Generate Key
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Security Notice</AlertTitle>
        <AlertDescription>
          Keys are generated locally in your browser using the Web Crypto API. 
          Private keys never leave your device unless you explicitly export them.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key Type</CardTitle>
            <CardDescription>Select the type of key to generate</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={keyType} onValueChange={(v) => setKeyType(v as typeof keyType)} className="space-y-4">
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="root" id="root" data-testid="radio-key-root" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="root" className="font-medium cursor-pointer">Root Key</Label>
                  <p className="text-xs text-muted-foreground">
                    Master key for deriving child keys. Store offline for maximum security.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="child" id="child" data-testid="radio-key-child" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="child" className="font-medium cursor-pointer">Child Key</Label>
                  <p className="text-xs text-muted-foreground">
                    Derived key for specific purposes. Can be bound to policies.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <RadioGroupItem value="agent" id="agent" data-testid="radio-key-agent" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="agent" className="font-medium cursor-pointer">Agent Key</Label>
                  <p className="text-xs text-muted-foreground">
                    Constrained key issued to agents. Must be bound to a policy.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {keyType !== "root" && (
            <Card>
              <CardHeader>
                <CardTitle>Parent Key</CardTitle>
                <CardDescription>Select the root key to derive from</CardDescription>
              </CardHeader>
              <CardContent>
                {rootKeys.length > 0 ? (
                  <Select value={parentKeyId} onValueChange={setParentKeyId}>
                    <SelectTrigger data-testid="select-parent-key">
                      <SelectValue placeholder="Select root key..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rootKeys.map((key) => (
                        <SelectItem key={key.id} value={key.id}>
                          <div className="flex items-center gap-2">
                            <Key className="h-3 w-3" />
                            <span className="font-mono text-xs">{key.fingerprint}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No root keys available. Generate a root key first, or this will create an independent key.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {(keyType === "child" || keyType === "agent") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Policy Binding
                </CardTitle>
                <CardDescription>
                  {keyType === "agent" ? "Required for agent keys" : "Optional policy constraint"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={policyId} onValueChange={setPolicyId}>
                  <SelectTrigger data-testid="select-policy">
                    <SelectValue placeholder="Select policy..." />
                  </SelectTrigger>
                  <SelectContent>
                    {keyType !== "agent" && <SelectItem value="none">No policy (unrestricted)</SelectItem>}
                    {activePolicies.map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3" />
                          <span>{policy.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Encryption Password</CardTitle>
              <CardDescription>Protect the private key with a password (optional but recommended)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="input-confirm-password"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
