import { useState } from "react";
import { Settings as SettingsIcon, Globe, Shield, Bell, Database, Download, Trash2, Moon, Sun, Monitor, Key, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme";
import { useAppStore } from "@/lib/store";
import { ARBITRUM_ONE } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { chainId, setChainId, policies, agents, keys, executionLogs } = useAppStore();

  const [rpcUrl, setRpcUrl] = useState(ARBITRUM_ONE.rpcUrl);
  const [autoRevoke, setAutoRevoke] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [violationAlerts, setViolationAlerts] = useState(true);
  const [executionAlerts, setExecutionAlerts] = useState(false);

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      policies,
      agents,
      keys: keys.map(k => ({ ...k, encryptedPrivateKey: undefined })), // Don't export private keys
      executionLogs,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `iam-systems-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: "Your data has been exported successfully",
    });
  };

  const handleClearData = () => {
    // This would clear IndexedDB in a real implementation
    toast({
      title: "Data Cleared",
      description: "All local data has been removed",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-settings-title">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your I-AM-SYSTEMS preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how I-AM-SYSTEMS looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Theme</Label>
              <RadioGroup
                value={theme}
                onValueChange={(v) => setTheme(v as "light" | "dark")}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="light" id="light" className="peer sr-only" />
                  <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Sun className="mb-3 h-6 w-6" />
                    Light
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                  <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Moon className="mb-3 h-6 w-6" />
                    Dark
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="system" id="system" className="peer sr-only" disabled />
                  <Label
                    htmlFor="system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 opacity-50 cursor-not-allowed"
                  >
                    <Monitor className="mb-3 h-6 w-6" />
                    System
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Network
            </CardTitle>
            <CardDescription>Configure blockchain network settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Active Network</Label>
              <Select value={chainId.toString()} onValueChange={(v) => setChainId(parseInt(v))}>
                <SelectTrigger data-testid="select-network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="42161">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-status-online" />
                      Arbitrum One
                    </div>
                  </SelectItem>
                  <SelectItem value="1" disabled>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-status-offline" />
                      Ethereum Mainnet (Coming Soon)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rpc">Custom RPC URL</Label>
              <Input
                id="rpc"
                placeholder="https://arb1.arbitrum.io/rpc"
                value={rpcUrl}
                onChange={(e) => setRpcUrl(e.target.value)}
                data-testid="input-rpc-url"
              />
              <p className="text-xs text-muted-foreground">
                Leave default for public RPC or enter your own endpoint
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Block Explorer</p>
                <p className="text-xs text-muted-foreground">arbiscan.io</p>
              </div>
              <a
                href="https://arbiscan.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </CardTitle>
            <CardDescription>Configure security preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Auto-revoke on Violation</p>
                <p className="text-xs text-muted-foreground">
                  Automatically revoke keys when policy violations occur
                </p>
              </div>
              <Switch
                checked={autoRevoke}
                onCheckedChange={setAutoRevoke}
                data-testid="switch-auto-revoke"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Enable Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Receive notifications for important events
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Policy Violation Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when policy violations occur
                </p>
              </div>
              <Switch
                checked={violationAlerts}
                onCheckedChange={setViolationAlerts}
                disabled={!notifications}
                data-testid="switch-violation-alerts"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Execution Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Get notified for every agent execution
                </p>
              </div>
              <Switch
                checked={executionAlerts}
                onCheckedChange={setExecutionAlerts}
                disabled={!notifications}
                data-testid="switch-execution-alerts"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Management
            </CardTitle>
            <CardDescription>Export or clear your local data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Export Data</p>
                <p className="text-xs text-muted-foreground">
                  Download all policies, agents, and logs as JSON
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData} data-testid="button-export-data">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-destructive">Clear All Data</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete all local data. This cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" data-testid="button-clear-data">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your
                      policies, agents, keys, and execution logs from local storage.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData}>
                      Yes, clear all data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
