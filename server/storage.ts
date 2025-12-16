import {
  type User,
  type InsertUser,
  type Policy,
  type InsertPolicy,
  type PolicyBoundKey,
  type InsertKey,
  type Agent,
  type InsertAgent,
  type ExecutionLog,
  type InsertExecutionLog,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Policies
  getPolicies(): Promise<Policy[]>;
  getPolicy(id: string): Promise<Policy | undefined>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy | undefined>;
  deletePolicy(id: string): Promise<boolean>;

  // Keys
  getKeys(): Promise<PolicyBoundKey[]>;
  getKey(id: string): Promise<PolicyBoundKey | undefined>;
  createKey(key: InsertKey): Promise<PolicyBoundKey>;
  updateKey(id: string, updates: Partial<PolicyBoundKey>): Promise<PolicyBoundKey | undefined>;
  deleteKey(id: string): Promise<boolean>;

  // Agents
  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<boolean>;

  // Execution Logs
  getExecutionLogs(): Promise<ExecutionLog[]>;
  getExecutionLog(id: string): Promise<ExecutionLog | undefined>;
  createExecutionLog(log: InsertExecutionLog): Promise<ExecutionLog>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private policies: Map<string, Policy>;
  private keys: Map<string, PolicyBoundKey>;
  private agents: Map<string, Agent>;
  private executionLogs: Map<string, ExecutionLog>;

  constructor() {
    this.users = new Map();
    this.policies = new Map();
    this.keys = new Map();
    this.agents = new Map();
    this.executionLogs = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Policies
  async getPolicies(): Promise<Policy[]> {
    return Array.from(this.policies.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getPolicy(id: string): Promise<Policy | undefined> {
    return this.policies.get(id);
  }

  async createPolicy(insertPolicy: InsertPolicy): Promise<Policy> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const policy: Policy = {
      ...insertPolicy,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.policies.set(id, policy);
    return policy;
  }

  async updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy | undefined> {
    const policy = this.policies.get(id);
    if (!policy) return undefined;
    const updated = { ...policy, ...updates, updatedAt: new Date().toISOString() };
    this.policies.set(id, updated);
    return updated;
  }

  async deletePolicy(id: string): Promise<boolean> {
    return this.policies.delete(id);
  }

  // Keys
  async getKeys(): Promise<PolicyBoundKey[]> {
    return Array.from(this.keys.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getKey(id: string): Promise<PolicyBoundKey | undefined> {
    return this.keys.get(id);
  }

  async createKey(insertKey: InsertKey): Promise<PolicyBoundKey> {
    const id = randomUUID();
    const key: PolicyBoundKey = {
      ...insertKey,
      id,
      createdAt: new Date().toISOString(),
    };
    this.keys.set(id, key);
    return key;
  }

  async updateKey(id: string, updates: Partial<PolicyBoundKey>): Promise<PolicyBoundKey | undefined> {
    const key = this.keys.get(id);
    if (!key) return undefined;
    const updated = { ...key, ...updates };
    this.keys.set(id, updated);
    return updated;
  }

  async deleteKey(id: string): Promise<boolean> {
    return this.keys.delete(id);
  }

  // Agents
  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = randomUUID();
    const agent: Agent = {
      ...insertAgent,
      id,
      successRate: 100,
      totalActions: 0,
      createdAt: new Date().toISOString(),
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    const updated = { ...agent, ...updates };
    this.agents.set(id, updated);
    return updated;
  }

  async deleteAgent(id: string): Promise<boolean> {
    return this.agents.delete(id);
  }

  // Execution Logs
  async getExecutionLogs(): Promise<ExecutionLog[]> {
    return Array.from(this.executionLogs.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getExecutionLog(id: string): Promise<ExecutionLog | undefined> {
    return this.executionLogs.get(id);
  }

  async createExecutionLog(insertLog: InsertExecutionLog): Promise<ExecutionLog> {
    const id = randomUUID();
    const log: ExecutionLog = { ...insertLog, id };
    this.executionLogs.set(id, log);
    return log;
  }
}

export const storage = new MemStorage();
