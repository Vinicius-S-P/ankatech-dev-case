import { z } from "zod"

// Enums
export const UserRole = z.enum(["ADVISOR", "VIEWER"])
export const ClientAlignmentCategory = z.enum(["HIGH", "MEDIUM_HIGH", "MEDIUM_LOW", "LOW"])
export const GoalType = z.enum(["RETIREMENT", "SHORT_TERM", "MEDIUM_TERM", "LONG_TERM", "EDUCATION", "TRAVEL", "INVESTMENT", "OTHER"])
export const EventType = z.enum(["INCOME", "EXPENSE", "INVESTMENT", "WITHDRAWAL", "TRANSFER", "OTHER"])
export const InsuranceType = z.enum(["LIFE", "HEALTH", "DISABILITY", "PROPERTY", "OTHER"])

// User Schema
export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: UserRole,
  active: z.boolean().default(true),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
})

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
})

// Client Schema
export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  age: z.number().min(18, "Idade mínima é 18 anos").max(120, "Idade máxima é 120 anos"),
  active: z.boolean().default(true),
  familyProfile: z.string().optional(),
  advisorId: z.string().optional().default(""), // Será preenchido automaticamente
  totalWealth: z.number().min(0, "Patrimônio não pode ser negativo").optional(),
  alignmentPercentage: z.number().min(0).max(100).optional(),
  alignmentCategory: ClientAlignmentCategory.optional(),
})

// Goal Schema
export const goalSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  type: GoalType,
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  targetValue: z.number().min(1, "Valor alvo deve ser maior que zero"),
  targetDate: z.string().min(1, "Data alvo é obrigatória"),
  currentValue: z.number().min(0, "Valor atual não pode ser negativo").optional().default(0),
  monthlyIncome: z.number().min(0, "Renda mensal não pode ser negativa").optional(),
})

// Wallet Schema
export const walletSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  assetClass: z.string().min(1, "Classe de ativo é obrigatória"),
  percentage: z.number().min(0, "Percentual não pode ser negativo").max(100, "Percentual não pode ser maior que 100"),
  currentValue: z.number().min(0, "Valor atual não pode ser negativo"),
})

// Event Schema
export const eventSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  type: EventType,
  value: z.number().min(0.01, "Valor deve ser maior que zero"),
  frequency: z.enum(["UNIQUE", "MONTHLY", "ANNUAL"]),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional(),
})

// Insurance Schema
export const insuranceSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  type: InsuranceType,
  provider: z.string().min(1, "Seguradora é obrigatória"),
  value: z.number().min(0.01, "Valor deve ser maior que zero"),
  beneficiary: z.string().min(1, "Beneficiário é obrigatório"),
  description: z.string().optional(),
})

// Simulation Schema
export const simulationSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Cliente é obrigatório"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.any()),
  results: z.record(z.string(), z.any()).optional(),
  version: z.number().default(1),
  active: z.boolean().default(true),
})

// Projection Schema
export const projectionSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  initialWealth: z.number().min(0, "Patrimônio inicial não pode ser negativo"),
  targetYear: z.number().min(2024, "Ano deve ser no futuro"),
  annualReturn: z.number().min(0, "Taxa de retorno não pode ser negativa").max(100, "Taxa de retorno não pode ser maior que 100%"),
  monthlyContribution: z.number().min(0, "Contribuição mensal não pode ser negativa"),
})

// Form Types
export type UserFormData = z.infer<typeof userSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type ClientFormData = z.infer<typeof clientSchema>
export type GoalFormData = z.infer<typeof goalSchema>
export type WalletFormData = z.infer<typeof walletSchema>
export type EventFormData = z.infer<typeof eventSchema>
export type InsuranceFormData = z.infer<typeof insuranceSchema>
export type SimulationFormData = z.infer<typeof simulationSchema>
export type ProjectionFormData = z.infer<typeof projectionSchema>
