import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  boolean,
  integer,
  pgEnum,
  jsonb,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Drizzle schema for the FORGE Supabase Postgres database.
 * Hand-mirrored from `lib/db/migrations/000X_*.sql` — RLS lives in those
 * SQL files, this file is structure-only.
 *
 * Legacy notary tables (clients/appointments/journal_entries/etc.) are
 * REMOVED from this file as of session-4 pivot. The corresponding files
 * in `app/(app)/appointments/`, `app/(app)/journal/`, `app/(app)/pipeline/`,
 * and `components/app/{appointment,journal,contact}-*.tsx` will be torn
 * down before they're reached by any user — their routes still mount but
 * call into queries that no longer have a backing table after `0003_pivot.sql`
 * runs against the database. Those files are scheduled for deletion next
 * session as part of the per-tab rebuilds.
 *
 * `auth.users` is owned by Supabase Auth; we only reference its id here.
 */

// ─────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────
export const planEnum = pgEnum("plan", ["free", "trial", "solo", "pro", "lifetime"]);
export const subStatusEnum = pgEnum("sub_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
]);
export const primaryGoalEnum = pgEnum("primary_goal", [
  "cut",
  "maintain",
  "bulk",
  "mental",
  "financial",
]);
export const programStatusEnum = pgEnum("program_status", [
  "active",
  "completed",
  "failed",
  "abandoned",
]);

// ─────────────────────────────────────────────────────────────────────────
// profiles — reshaped from notary → FORGE
// ─────────────────────────────────────────────────────────────────────────
export const profiles = pgTable("profiles", {
  id:                    uuid("id").primaryKey(),
  email:                 text("email").notNull(),
  displayName:           text("display_name"),
  phone:                 text("phone"),
  age:                   integer("age"),
  heightIn:              integer("height_in"),
  weightLb:              integer("weight_lb"),
  bodyFatPct:            integer("body_fat_pct"),
  primaryGoal:           primaryGoalEnum("primary_goal"),
  starterProgram:        text("starter_program"),
  vices:                 text("vices").array(),
  appleHealthConnected:  boolean("apple_health_connected").default(false).notNull(),
  squadHandle:           text("squad_handle").unique(),
  notificationsPrefs:    jsonb("notifications_prefs"),
  // Billing — Stripe webhook writes these; profiles is the read source of truth.
  plan:                  text("plan").default("free").notNull(),
  stripeCustomerId:      text("stripe_customer_id"),
  stripeSubscriptionId:  text("stripe_subscription_id"),
  currentPeriodEnd:      timestamp("current_period_end", { withTimezone: true }),
  onboardedAt:           timestamp("onboarded_at", { withTimezone: true }),
  createdAt:             timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:             timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────
// subscriptions — same shape, plan enum now includes 'lifetime'
// ─────────────────────────────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  userId:               uuid("user_id").primaryKey(),
  stripeCustomerId:     text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status:               subStatusEnum("status").default("trialing").notNull(),
  plan:                 planEnum("plan").default("trial").notNull(),
  trialEndsAt:          timestamp("trial_ends_at", { withTimezone: true }),
  currentPeriodEnd:     timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd:    boolean("cancel_at_period_end").default(false).notNull(),
  createdAt:            timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:            timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────
// programs — reference data, system-managed
// ─────────────────────────────────────────────────────────────────────────
export const programs = pgTable("programs", {
  key:           text("key").primaryKey(),
  name:          text("name").notNull(),
  durationDays:  integer("duration_days").notNull(),
  description:   text("description"),
  rules:         jsonb("rules"),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────
// habits — per-user habit list. `habit_key` is stable; `label` is mutable.
// ─────────────────────────────────────────────────────────────────────────
export const habits = pgTable(
  "habits",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    userId:      uuid("user_id").notNull(),
    habitKey:    text("habit_key").notNull(),
    label:       text("label").notNull(),
    icon:        text("icon"),
    sortOrder:   integer("sort_order").default(0).notNull(),
    archivedAt:  timestamp("archived_at", { withTimezone: true }),
    createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("habits_user_key_unique").on(t.userId, t.habitKey)]
);

// ─────────────────────────────────────────────────────────────────────────
// habit_logs — one row per habit completion per day
// ─────────────────────────────────────────────────────────────────────────
export const habitLogs = pgTable(
  "habit_logs",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    userId:    uuid("user_id").notNull(),
    habitId:   uuid("habit_id").notNull(),
    logDate:   date("log_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("habit_logs_user_habit_date_unique").on(t.userId, t.habitId, t.logDate)]
);

// ─────────────────────────────────────────────────────────────────────────
// program_enrollments
// ─────────────────────────────────────────────────────────────────────────
export const programEnrollments = pgTable("program_enrollments", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").notNull(),
  programKey:   text("program_key").notNull(),
  startedAt:    date("started_at").notNull(),
  currentDay:   integer("current_day").default(1).notNull(),
  hardResets:   integer("hard_resets").default(0).notNull(),
  status:       programStatusEnum("status").default("active").notNull(),
  completedAt:  date("completed_at"),
  failedAt:     date("failed_at"),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────
// program_task_logs — Hard 75 (and any future program) per-task per-day log
// ─────────────────────────────────────────────────────────────────────────
export const programTaskLogs = pgTable(
  "program_task_logs",
  {
    id:            uuid("id").primaryKey().defaultRandom(),
    userId:        uuid("user_id").notNull(),
    enrollmentId:  uuid("enrollment_id").notNull(),
    taskKey:       text("task_key").notNull(),
    logDate:       date("log_date").notNull(),
    createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("ptl_enrollment_task_date_unique").on(t.enrollmentId, t.taskKey, t.logDate)]
);

// ─────────────────────────────────────────────────────────────────────────
// meal_logs — append-only FUEL log
// ─────────────────────────────────────────────────────────────────────────
export const mealLogs = pgTable("meal_logs", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").notNull(),
  loggedAt:     timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
  mealName:     text("meal_name").notNull(),
  calories:     integer("calories"),
  proteinG:     integer("protein_g"),
  carbsG:       integer("carbs_g"),
  fatG:         integer("fat_g"),
  sourceImage:  text("source_image"),
  notes:        text("notes"),
});

// ─────────────────────────────────────────────────────────────────────────
// progress_photos
// ─────────────────────────────────────────────────────────────────────────
export const progressPhotos = pgTable("progress_photos", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").notNull(),
  photoDate:    date("photo_date").notNull(),
  storagePath:  text("storage_path").notNull(),
  weightLb:     integer("weight_lb"),
  notes:        text("notes"),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────
// squads + squad_members
// ─────────────────────────────────────────────────────────────────────────
export const squads = pgTable("squads", {
  id:         uuid("id").primaryKey().defaultRandom(),
  name:       text("name").notNull(),
  createdBy:  uuid("created_by"),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const squadMembers = pgTable(
  "squad_members",
  {
    squadId:   uuid("squad_id").notNull(),
    userId:    uuid("user_id").notNull(),
    joinedAt:  timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.squadId, t.userId] })]
);

// ─────────────────────────────────────────────────────────────────────────
// respect_grants — anonymous +1s between squad members
// ─────────────────────────────────────────────────────────────────────────
export const respectGrants = pgTable(
  "respect_grants",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    fromUserId:  uuid("from_user_id").notNull(),
    toUserId:    uuid("to_user_id").notNull(),
    grantDate:   date("grant_date").notNull(),
    createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("respect_unique").on(t.fromUserId, t.toUserId, t.grantDate)]
);

// ─────────────────────────────────────────────────────────────────────────
// referrals
// ─────────────────────────────────────────────────────────────────────────
export const referrals = pgTable("referrals", {
  id:             uuid("id").primaryKey().defaultRandom(),
  userId:         uuid("user_id").notNull(),
  code:           text("code").notNull().unique(),
  usedByUserId:   uuid("used_by_user_id"),
  usedAt:         timestamp("used_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────
// email_subscribers — lead magnet, no auth
// ─────────────────────────────────────────────────────────────────────────
export const emailSubscribers = pgTable("email_subscribers", {
  id:         uuid("id").primaryKey().defaultRandom(),
  email:      text("email").notNull().unique(),
  source:     text("source"),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
