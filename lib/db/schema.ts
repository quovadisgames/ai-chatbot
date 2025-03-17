import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('chat', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  title: text('title'),
  visibility: varchar('visibility', { enum: ['public', 'private'] }).notNull().default('private'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('message', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chat.id).notNull(),
  content: text('content').notNull(),
  role: varchar('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const tokenUsage = pgTable('TokenUsage', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  chatId: uuid('chatId')
    .references(() => chat.id),
  messageId: uuid('messageId')
    .references(() => message.id),
  model: varchar('model', { length: 64 }).notNull(),
  promptTokens: integer('promptTokens').notNull(),
  completionTokens: integer('completionTokens').notNull(),
  totalTokens: integer('totalTokens').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type TokenUsage = InferSelectModel<typeof tokenUsage>;

export type ExtendedChat = Chat & {
  messages?: Message[];
  visibility: 'public' | 'private';
  model?: string;
};
