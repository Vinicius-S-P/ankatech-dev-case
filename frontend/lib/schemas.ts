import { z } from "zod";

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const goalSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  name: z.string().min(1, "Goal name is required"),
  targetAmount: z.number().min(0, "Target amount must be positive"),
  currentAmount: z.number().min(0, "Current amount must be positive").default(0),
  targetDate: z.string(),
  description: z.string().optional(),
  status: z.enum(["Pending", "Achieved", "InProgress"]).default("Pending"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const investmentSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  name: z.string().min(1, "Investment name is required"),
  type: z.string().min(1, "Investment type is required"),
  currentValue: z.number().min(0, "Current value must be positive"),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const walletSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  name: z.string().min(1, "Wallet name is required"),
  balance: z.number().min(0, "Balance must be positive"),
  currency: z.string().default("USD"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const eventSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  name: z.string().min(1, "Event name is required"),
  date: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const insuranceSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  policyName: z.string().min(1, "Policy name is required"),
  provider: z.string().min(1, "Provider is required"),
  coverageAmount: z.number().min(0, "Coverage amount must be positive"),
  premium: z.number().min(0, "Premium must be positive"),
  policyType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Client = z.infer<typeof clientSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Investment = z.infer<typeof investmentSchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Insurance = z.infer<typeof insuranceSchema>;