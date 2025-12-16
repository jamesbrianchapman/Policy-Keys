import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPolicySchema,
  insertKeySchema,
  insertAgentSchema,
  insertExecutionLogSchema,
  type DashboardStats,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Dashboard Stats
  app.get("/api/stats", async (req, res) => {
    const [policies, agents, keys, logs] = await Promise.all([
      storage.getPolicies(),
      storage.getAgents(),
      storage.getKeys(),
      storage.getExecutionLogs(),
    ]);

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const todayLogs = logs.filter((l) => new Date(l.timestamp) > dayAgo);
    const successLogs = todayLogs.filter((l) => l.result === "success");
    const violations = todayLogs.filter((l) => l.result === "denied").length;

    const stats: DashboardStats = {
      activePolicies: policies.filter((p) => p.status === "active").length,
      activeAgents: agents.filter((a) => a.status === "active").length,
      activeKeys: keys.filter((k) => k.status === "active").length,
      todayExecutions: todayLogs.length,
      successRate: todayLogs.length > 0 ? (successLogs.length / todayLogs.length) * 100 : 100,
      totalSpendToday: "$0.00",
      violations24h: violations,
    };

    res.json(stats);
  });

  // Policies
  app.get("/api/policies", async (req, res) => {
    const policies = await storage.getPolicies();
    res.json(policies);
  });

  app.get("/api/policies/:id", async (req, res) => {
    const policy = await storage.getPolicy(req.params.id);
    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }
    res.json(policy);
  });

  app.post("/api/policies", async (req, res) => {
    try {
      const data = insertPolicySchema.parse(req.body);
      const policy = await storage.createPolicy(data);
      res.status(201).json(policy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      throw error;
    }
  });

  app.patch("/api/policies/:id", async (req, res) => {
    const policy = await storage.updatePolicy(req.params.id, req.body);
    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }
    res.json(policy);
  });

  app.delete("/api/policies/:id", async (req, res) => {
    const deleted = await storage.deletePolicy(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Policy not found" });
    }
    res.status(204).send();
  });

  // Keys
  app.get("/api/keys", async (req, res) => {
    const keys = await storage.getKeys();
    res.json(keys);
  });

  app.get("/api/keys/:id", async (req, res) => {
    const key = await storage.getKey(req.params.id);
    if (!key) {
      return res.status(404).json({ error: "Key not found" });
    }
    res.json(key);
  });

  app.post("/api/keys", async (req, res) => {
    try {
      const data = insertKeySchema.parse(req.body);
      const key = await storage.createKey(data);
      res.status(201).json(key);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      throw error;
    }
  });

  app.patch("/api/keys/:id", async (req, res) => {
    const key = await storage.updateKey(req.params.id, req.body);
    if (!key) {
      return res.status(404).json({ error: "Key not found" });
    }
    res.json(key);
  });

  app.delete("/api/keys/:id", async (req, res) => {
    const deleted = await storage.deleteKey(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Key not found" });
    }
    res.status(204).send();
  });

  // Agents
  app.get("/api/agents", async (req, res) => {
    const agents = await storage.getAgents();
    res.json(agents);
  });

  app.get("/api/agents/:id", async (req, res) => {
    const agent = await storage.getAgent(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json(agent);
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const data = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(data);
      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      throw error;
    }
  });

  app.patch("/api/agents/:id", async (req, res) => {
    const agent = await storage.updateAgent(req.params.id, req.body);
    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json(agent);
  });

  app.delete("/api/agents/:id", async (req, res) => {
    const deleted = await storage.deleteAgent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.status(204).send();
  });

  // Execution Logs
  app.get("/api/executions", async (req, res) => {
    const logs = await storage.getExecutionLogs();
    res.json(logs);
  });

  app.get("/api/executions/:id", async (req, res) => {
    const log = await storage.getExecutionLog(req.params.id);
    if (!log) {
      return res.status(404).json({ error: "Execution log not found" });
    }
    res.json(log);
  });

  app.post("/api/executions", async (req, res) => {
    try {
      const data = insertExecutionLogSchema.parse(req.body);
      const log = await storage.createExecutionLog(data);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      throw error;
    }
  });

  return httpServer;
}
