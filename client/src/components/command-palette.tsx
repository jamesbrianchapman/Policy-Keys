import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Shield,
  Bot,
  Key,
  History,
  Settings,
  Plus,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppStore } from "@/lib/store";

export function CommandPalette() {
  const [, setLocation] = useLocation();
  const { commandPaletteOpen, setCommandPaletteOpen, policies, agents } = useAppStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const navigate = (path: string) => {
    setLocation(path);
    setCommandPaletteOpen(false);
  };

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search..." data-testid="input-command-search" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate("/")} data-testid="command-dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/policies")} data-testid="command-policies">
            <Shield className="mr-2 h-4 w-4" />
            <span>Policies</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/agents")} data-testid="command-agents">
            <Bot className="mr-2 h-4 w-4" />
            <span>Agents</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/keys")} data-testid="command-keys">
            <Key className="mr-2 h-4 w-4" />
            <span>Keys</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/history")} data-testid="command-history">
            <History className="mr-2 h-4 w-4" />
            <span>Execution History</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings")} data-testid="command-settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigate("/policies/new")} data-testid="command-new-policy">
            <Plus className="mr-2 h-4 w-4" />
            <span>New Policy</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/agents/new")} data-testid="command-new-agent">
            <Plus className="mr-2 h-4 w-4" />
            <span>New Agent</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/keys/new")} data-testid="command-new-key">
            <Plus className="mr-2 h-4 w-4" />
            <span>Generate Key</span>
          </CommandItem>
        </CommandGroup>

        {policies.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Policies">
              {policies.slice(0, 5).map((policy) => (
                <CommandItem
                  key={policy.id}
                  onSelect={() => navigate(`/policies/${policy.id}`)}
                  data-testid={`command-policy-${policy.id}`}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  <span>{policy.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {agents.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Agents">
              {agents.slice(0, 5).map((agent) => (
                <CommandItem
                  key={agent.id}
                  onSelect={() => navigate(`/agents/${agent.id}`)}
                  data-testid={`command-agent-${agent.id}`}
                >
                  <Bot className="mr-2 h-4 w-4" />
                  <span>{agent.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
