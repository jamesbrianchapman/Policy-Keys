import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Policy, PolicyBoundKey, Agent, ExecutionLog, DashboardStats } from "@shared/schema";

interface AppState {
  // UI State
  sidebarCollapsed: boolean;
  currentPage: string;
  commandPaletteOpen: boolean;
  
  // Data
  policies: Policy[];
  keys: PolicyBoundKey[];
  agents: Agent[];
  executionLogs: ExecutionLog[];
  stats: DashboardStats | null;
  
  // Network
  chainId: number;
  isConnected: boolean;
  address: string | null;
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setPolicies: (policies: Policy[]) => void;
  addPolicy: (policy: Policy) => void;
  updatePolicy: (id: string, updates: Partial<Policy>) => void;
  deletePolicy: (id: string) => void;
  setKeys: (keys: PolicyBoundKey[]) => void;
  addKey: (key: PolicyBoundKey) => void;
  revokeKey: (id: string) => void;
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  setExecutionLogs: (logs: ExecutionLog[]) => void;
  addExecutionLog: (log: ExecutionLog) => void;
  setStats: (stats: DashboardStats) => void;
  setConnected: (connected: boolean, address?: string) => void;
  setChainId: (chainId: number) => void;
}

export const useAppStore = create<AppState>()(
  immer((set) => ({
    // Initial State
    sidebarCollapsed: false,
    currentPage: "dashboard",
    commandPaletteOpen: false,
    policies: [],
    keys: [],
    agents: [],
    executionLogs: [],
    stats: null,
    chainId: 42161, // Arbitrum One
    isConnected: false,
    address: null,

    // Actions
    setSidebarCollapsed: (collapsed) =>
      set((state) => {
        state.sidebarCollapsed = collapsed;
      }),

    setCurrentPage: (page) =>
      set((state) => {
        state.currentPage = page;
      }),

    setCommandPaletteOpen: (open) =>
      set((state) => {
        state.commandPaletteOpen = open;
      }),

    setPolicies: (policies) =>
      set((state) => {
        state.policies = policies;
      }),

    addPolicy: (policy) =>
      set((state) => {
        state.policies.push(policy);
      }),

    updatePolicy: (id, updates) =>
      set((state) => {
        const index = state.policies.findIndex((p) => p.id === id);
        if (index !== -1) {
          state.policies[index] = { ...state.policies[index], ...updates };
        }
      }),

    deletePolicy: (id) =>
      set((state) => {
        state.policies = state.policies.filter((p) => p.id !== id);
      }),

    setKeys: (keys) =>
      set((state) => {
        state.keys = keys;
      }),

    addKey: (key) =>
      set((state) => {
        state.keys.push(key);
      }),

    revokeKey: (id) =>
      set((state) => {
        const index = state.keys.findIndex((k) => k.id === id);
        if (index !== -1) {
          state.keys[index].status = "revoked";
        }
      }),

    setAgents: (agents) =>
      set((state) => {
        state.agents = agents;
      }),

    addAgent: (agent) =>
      set((state) => {
        state.agents.push(agent);
      }),

    updateAgent: (id, updates) =>
      set((state) => {
        const index = state.agents.findIndex((a) => a.id === id);
        if (index !== -1) {
          state.agents[index] = { ...state.agents[index], ...updates };
        }
      }),

    setExecutionLogs: (logs) =>
      set((state) => {
        state.executionLogs = logs;
      }),

    addExecutionLog: (log) =>
      set((state) => {
        state.executionLogs.unshift(log);
      }),

    setStats: (stats) =>
      set((state) => {
        state.stats = stats;
      }),

    setConnected: (connected, address) =>
      set((state) => {
        state.isConnected = connected;
        state.address = address || null;
      }),

    setChainId: (chainId) =>
      set((state) => {
        state.chainId = chainId;
      }),
  }))
);
