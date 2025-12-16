import { Search, Bell, Command, Wallet, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { useAppStore } from "@/lib/store";
import { truncateAddress } from "@/lib/crypto";

interface TopBarProps {
  title?: string;
  breadcrumb?: { label: string; href?: string }[];
}

export function TopBar({ title, breadcrumb }: TopBarProps) {
  const { isConnected, address, setConnected, setCommandPaletteOpen, stats } = useAppStore();

  const handleConnect = async () => {
    // Mock connection for now - will be replaced with real wallet connection
    const mockAddress = "0x" + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    setConnected(true, mockAddress);
  };

  const handleDisconnect = () => {
    setConnected(false);
  };

  const violations = stats?.violations24h || 0;

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-trigger" className="md:hidden" />
        
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav className="flex items-center gap-2 text-sm">
            {breadcrumb.map((item, index) => (
              <div key={item.label} className="flex items-center gap-2">
                {index > 0 && <span className="text-muted-foreground">/</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="font-medium">{item.label}</span>
                )}
              </div>
            ))}
          </nav>
        ) : title ? (
          <h1 className="text-lg font-semibold">{title}</h1>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 pl-9 pr-12"
            data-testid="input-search"
            onClick={() => setCommandPaletteOpen(true)}
            readOnly
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-xs text-muted-foreground">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>

        <Badge 
          variant="outline" 
          className="hidden sm:flex items-center gap-1.5 px-2 py-1"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-status-online animate-pulse" />
          <span className="text-xs font-medium">Arbitrum One</span>
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="h-4 w-4" />
              {violations > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                  {violations > 9 ? "9+" : violations}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {violations > 0 ? (
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <span className="font-medium text-destructive">Policy Violation</span>
                <span className="text-xs text-muted-foreground">
                  {violations} policy violation{violations > 1 ? "s" : ""} detected in the last 24 hours
                </span>
              </DropdownMenuItem>
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        {isConnected && address ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-wallet-connected">
                <div className="h-2 w-2 rounded-full bg-status-online mr-2" />
                {truncateAddress(address)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Wallet</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(address)}>
                Copy Address
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={`https://arbiscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  View on Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={handleConnect} size="sm" data-testid="button-connect-wallet">
            <Wallet className="h-4 w-4 mr-2" />
            Connect
          </Button>
        )}
      </div>
    </header>
  );
}
