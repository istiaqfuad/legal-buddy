import { pgTable, text, timestamp, integer, boolean, jsonb, pgEnum, uuid } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'lawyer', 'admin']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'starter', 'professional', 'enterprise']);
export const chatSessionStatusEnum = pgEnum('chat_session_status', ['active', 'archived']);

// User profiles (extends Neon Auth users)
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  authUserId: text('auth_user_id').notNull().unique(), // from Neon Auth
  role: userRoleEnum('role').notNull().default('user'),
  subscriptionTier: subscriptionTierEnum('subscription_tier').notNull().default('free'),
  displayName: text('display_name'),
  phone: text('phone'),
  location: text('location'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Chat sessions
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // auth user id
  title: text('title').notNull().default('New conversation'),
  status: chatSessionStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Chat messages
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  sources: jsonb('sources'), // Source[] from RAG
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Daily query counts for rate limiting
export const queryLimits = pgTable('query_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  count: integer('count').notNull().default(0),
});

// Lawyer profiles
export const lawyerProfiles = pgTable('lawyer_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(), // auth user id
  barCouncilId: text('bar_council_id'),
  verificationLevel: text('verification_level').notNull().default('basic'), // basic | verified | premium | expert
  specializations: jsonb('specializations').$type<string[]>().default([]),
  location: text('location'),
  yearsExperience: integer('years_experience'),
  bio: text('bio'),
  consultationFee: integer('consultation_fee'), // in BDT
  isAvailable: boolean('is_available').notNull().default(true),
  rating: integer('rating').default(0), // 0-500 (multiply by 0.01 for actual rating)
  reviewCount: integer('review_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
