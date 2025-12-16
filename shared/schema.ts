import { z } from "zod";

// ============================================
// POLICY TYPES
// ============================================

export const policyConditionSchema = z.object({
  type: z.enum(["oracle", "time", "block", "balance"]),
  operator: z.enum(["lt", "gt", "eq", "lte", "gte", "between"]),
  value: z.string(),
  secondValue: z.string().optional(),
  oracle: z.string().optional(),
});

export const spendLimitSchema = z.object({
  max: z.string(),
  currency: z.enum(["USD", "ETH", "USDC", "USDT", "DAI"]),
  window: z.enum(["1h", "24h", "7d", "30d", "lifetime"]),
});

export const contractAllowlistSchema = z.object({
  address: z.string(),
  name: z.string().optional(),
  functions: z.array(z.string()),
  verified: z.boolean().optional(),
});

export const policySchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number(),
  spend: spendLimitSchema.optional(),
  contracts: z.array(contractAllowlistSchema),
  conditions: z.array(policyConditionSchema),
  expiresAt: z.string().optional(),
  revokeOn: z.array(z.enum(["violation", "manual", "expiry", "spend_exceeded"])),
  status: z.enum(["active", "expired", "violated", "revoked"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  description: z.string().optional(),
});

export const insertPolicySchema = policySchema.omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type Policy = z.infer<typeof policySchema>;
export type PolicyCondition = z.infer<typeof policyConditionSchema>;
export type SpendLimit = z.infer<typeof spendLimitSchema>;
export type ContractAllowlist = z.infer<typeof contractAllowlistSchema>;

// ============================================
// KEY TYPES
// ============================================

export const keyTypeSchema = z.enum(["root", "child", "agent"]);

export const policyBoundKeySchema = z.object({
  id: z.string(),
  fingerprint: z.string(),
  type: keyTypeSchema,
  policyId: z.string().optional(),
  agentId: z.string().optional(),
  address: z.string(),
  publicKey: z.string(),
  encryptedPrivateKey: z.string().optional(),
  status: z.enum(["active", "revoked", "expired"]),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
  parentKeyId: z.string().optional(),
  derivationPath: z.string().optional(),
});

export const insertKeySchema = policyBoundKeySchema.omit({ id: true, createdAt: true });
export type InsertKey = z.infer<typeof insertKeySchema>;
export type PolicyBoundKey = z.infer<typeof policyBoundKeySchema>;
export type KeyType = z.infer<typeof keyTypeSchema>;

// ============================================
// AGENT TYPES
// ============================================

export const agentCapabilitySchema = z.object({
  type: z.enum(["trade", "transfer", "stake", "governance", "custom"]),
  description: z.string(),
  enabled: z.boolean(),
});

export const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  policyId: z.string(),
  keyId: z.string(),
  status: z.enum(["active", "idle", "paused", "revoked"]),
  capabilities: z.array(agentCapabilitySchema),
  taskScope: z.string(),
  memorySandbox: z.record(z.any()).optional(),
  successRate: z.number(),
  totalActions: z.number(),
  createdAt: z.string(),
  lastActiveAt: z.string().optional(),
  avatar: z.string().optional(),
});

export const insertAgentSchema = agentSchema.omit({ id: true, createdAt: true, successRate: true, totalActions: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = z.infer<typeof agentSchema>;
export type AgentCapability = z.infer<typeof agentCapabilitySchema>;

// ============================================
// EXECUTION TYPES
// ============================================

export const executionResultSchema = z.enum(["success", "denied", "pending", "failed", "replayed"]);

export const executionLogSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  policyId: z.string(),
  keyId: z.string(),
  actionType: z.enum(["swap", "transfer", "approve", "stake", "unstake", "vote", "custom"]),
  inputCID: z.string(),
  outputCID: z.string().optional(),
  policyCID: z.string(),
  logCID: z.string(),
  signature: z.string().optional(),
  result: executionResultSchema,
  denialReason: z.string().optional(),
  txHash: z.string().optional(),
  gasUsed: z.string().optional(),
  timestamp: z.string(),
  duration: z.number().optional(),
  inputs: z.record(z.any()),
  outputs: z.record(z.any()).optional(),
  policyEvaluation: z.object({
    spendCheck: z.boolean().optional(),
    contractCheck: z.boolean().optional(),
    conditionCheck: z.boolean().optional(),
    timeCheck: z.boolean().optional(),
  }).optional(),
});

export const insertExecutionLogSchema = executionLogSchema.omit({ id: true });
export type InsertExecutionLog = z.infer<typeof insertExecutionLogSchema>;
export type ExecutionLog = z.infer<typeof executionLogSchema>;
export type ExecutionResult = z.infer<typeof executionResultSchema>;

// ============================================
// SPEND TRACKING
// ============================================

export const spendRecordSchema = z.object({
  id: z.string(),
  policyId: z.string(),
  amount: z.string(),
  currency: z.string(),
  usdValue: z.string(),
  executionId: z.string(),
  timestamp: z.string(),
});

export type SpendRecord = z.infer<typeof spendRecordSchema>;

// ============================================
// NETWORK/CHAIN CONFIG
// ============================================

export const chainConfigSchema = z.object({
  chainId: z.number(),
  name: z.string(),
  rpcUrl: z.string(),
  explorerUrl: z.string(),
  nativeCurrency: z.object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number(),
  }),
});

export type ChainConfig = z.infer<typeof chainConfigSchema>;

// Default Arbitrum One config
export const ARBITRUM_ONE: ChainConfig = {
  chainId: 42161,
  name: "Arbitrum One",
  rpcUrl: "https://arb1.arbitrum.io/rpc",
  explorerUrl: "https://arbiscan.io",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
};

// ============================================
// KNOWN CONTRACTS
// ============================================

export const KNOWN_CONTRACTS = {
  uniswap: {
    router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    name: "Uniswap V3 Router",
    functions: ["exactInputSingle", "exactInput", "exactOutputSingle", "exactOutput", "swapExactTokensForTokens"],
  },
  aave: {
    pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    name: "Aave V3 Pool",
    functions: ["supply", "withdraw", "borrow", "repay", "flashLoan"],
  },
  gmx: {
    router: "0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064",
    name: "GMX Router",
    functions: ["swap", "increasePosition", "decreasePosition"],
  },
};

// ============================================
// USER / SESSION (for basic auth if needed)
// ============================================

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
});

export const insertUserSchema = userSchema.omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
  activePolicies: number;
  activeAgents: number;
  activeKeys: number;
  todayExecutions: number;
  successRate: number;
  totalSpendToday: string;
  violations24h: number;
}
