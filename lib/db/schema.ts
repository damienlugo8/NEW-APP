import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * Drizzle schema mirroring the Supabase Postgres database.
 * The corresponding SQL — including RLS policies — is in
 * lib/db/migrations/0001_init.sql and applied via the Supabase SQL editor.
 *
 * `auth.users` is owned by Supabase Auth; we only reference its id here.
 */

export const planEnum = pgEnum("plan", ["free", "trial", "solo", "pro"]);
export const subStatusEnum = pgEnum("sub_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
]);
export const clientTypeEnum = pgEnum("client_type", [
  "title_company",
  "signing_service",
  "law_firm",
  "direct",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullLegalName: text("full_legal_name"),
  businessName: text("business_name"),
  phone: text("phone"),
  commissionState: text("commission_state"),
  commissionExpiresAt: date("commission_expires_at"),
  notaryIdNumber: text("notary_id_number"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  userId: uuid("user_id").primaryKey(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: subStatusEnum("status").default("trialing").notNull(),
  plan: planEnum("plan").default("trial").notNull(),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Tables scaffolded for future feature sessions — no UI yet.

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  type: clientTypeEnum("type").default("title_company").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pipelineStages = pgTable("pipeline_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  position: integer("position").notNull(),
});

export const pipelineDeals = pgTable("pipeline_deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  clientId: uuid("client_id"),
  stageId: uuid("stage_id"),
  valueEstimateCents: integer("value_estimate_cents").default(0).notNull(),
  lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
  nextActionAt: timestamp("next_action_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  location: text("location"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMin: integer("duration_min").default(60).notNull(),
  feeCents: integer("fee_cents").default(0).notNull(),
  status: text("status").default("scheduled").notNull(),
  notes: text("notes"),
});

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  signerName: text("signer_name").notNull(),
  documentType: text("document_type").notNull(),
  signedAt: timestamp("signed_at", { withTimezone: true }).notNull(),
  location: text("location"),
  feeCents: integer("fee_cents").default(0).notNull(),
  notes: text("notes"),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  clientId: uuid("client_id"),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").default("draft").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});
