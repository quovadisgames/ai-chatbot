import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { nanoid } from 'nanoid';

import {
  user,
  chat,
  type User,
  type Chat,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  tokenUsage,
  type TokenUsage,
  type Document,
} from './schema';
import { ArtifactKind } from '@/components/artifact';

// Enable mock database for development
const USE_MOCK_DB = true;

// Mock data for development
const MOCK_USER: User = {
  id: "mock-user-123",
  email: "dev@example.com",
  password: "$2a$10$mockhashedpassword",
};

const MOCK_CHATS: Chat[] = [
  {
    id: "mock-chat-1",
    title: "Mock Chat 1",
    userId: MOCK_USER.id,
    createdAt: new Date(),
    visibility: "private",
  },
  {
    id: "mock-chat-2",
    title: "Mock Chat 2",
    userId: MOCK_USER.id,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    visibility: "private",
  }
];

const MOCK_MESSAGES: Message[] = [
  {
    id: "mock-message-1",
    chatId: "mock-chat-1",
    role: "user",
    content: "Hello, this is a mock message",
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: "mock-message-2",
    chatId: "mock-chat-1",
    role: "assistant",
    content: "Hello! I'm a mock assistant response.",
    createdAt: new Date(Date.now() - 3500000), // 58 minutes ago
  }
];

const MOCK_TOKEN_USAGE: TokenUsage[] = [
  {
    id: "mock-token-1",
    userId: MOCK_USER.id,
    chatId: "mock-chat-1",
    messageId: "mock-message-2",
    model: "gpt-3.5-turbo",
    promptTokens: 150,
    completionTokens: 100,
    totalTokens: 250,
    createdAt: new Date(Date.now() - 3500000), // 58 minutes ago
  }
];

// Add mock document data after the other mock data definitions
const MOCK_DOCUMENTS: Document[] = [
  {
    id: "mock-doc-1",
    title: "Mock Document 1",
    kind: "text" as const,
    content: "This is a mock text document for development",
    userId: MOCK_USER.id,
    createdAt: new Date(),
  },
  {
    id: "mock-doc-2",
    title: "Mock Code Sample",
    kind: "code" as const,
    content: "function hello() {\n  console.log('Hello world');\n}",
    userId: MOCK_USER.id,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    id: "mock-doc-3",
    title: "Mock Spreadsheet",
    kind: "sheet" as const,
    content: "Column A,Column B\nValue 1,Value 2",
    userId: MOCK_USER.id,
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
  }
];

// Add mock suggestions data
const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: "mock-suggestion-1",
    documentId: "mock-doc-1",
    userId: MOCK_USER.id,
    description: "Suggestion for improving document 1",
    documentCreatedAt: new Date(Date.now() - 3600000), // 1 hour ago
    originalText: "This is the original text",
    suggestedText: "This is the suggested improved text",
    isResolved: false,
    createdAt: new Date(),
  },
  {
    id: "mock-suggestion-2",
    documentId: "mock-doc-2",
    userId: MOCK_USER.id,
    description: "Suggestion for improving document 2",
    documentCreatedAt: new Date(Date.now() - 7200000), // 2 hours ago
    originalText: "function hello() {\n  console.log('Hello');\n}",
    suggestedText: "function hello() {\n  console.log('Hello world!');\n}",
    isResolved: false,
    createdAt: new Date(),
  }
];

// biome-ignore lint: Forbidden non-null assertion.
let client: postgres.Sql<{}> | null = null;
let db: PostgresJsDatabase | null = null;

try {
  // Only connect to the database if not using mock data
  if (!USE_MOCK_DB) {
    // biome-ignore lint: Forbidden non-null assertion.
    client = postgres(process.env.POSTGRES_URL!);
    db = drizzle(client);
  }
} catch (error) {
  console.error('Failed to connect to database, using mock data');
}

export async function getUser({ email }: { email: string }): Promise<User[]> {
  if (USE_MOCK_DB) {
    console.log('Using mock user data for email:', email);
    return email === MOCK_USER.email ? [MOCK_USER] : [];
  }
  try {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database:', error);
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db.insert(user).values({ email, password: hash });
  } catch (error: unknown) {
    console.error('Failed to create user in database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error: unknown) {
    console.error('Failed to save chat in database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error: unknown) {
    console.error('Failed to delete chat by id from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  if (USE_MOCK_DB) {
    console.log('Using mock chats data');
    return MOCK_CHATS.filter(chat => chat.userId === id);
  }

  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db.select().from(chat).where(eq(chat.userId, id));
  } catch (error: unknown) {
    console.error('Failed to get chats by user id from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function getChatById({ id }: { id: string }): Promise<ExtendedChat | null> {
  if (USE_MOCK_DB) {
    console.log(`[MOCK] Getting chat by ID: ${id}`);
    const mockChat = MOCK_CHATS.find(chat => chat.id === id);
    return mockChat ? { ...mockChat, userId: mockChat.userId || MOCK_USER.id } : null;
  }

  try {
    if (!db) {
      console.warn('Database not initialized, using mock data');
      const mockChat = MOCK_CHATS.find(chat => chat.id === id);
      return mockChat ? { ...mockChat, userId: mockChat.userId || MOCK_USER.id } : null;
    }
    
    const result = await db.select().from(chat).where(eq(chat.id, id)).limit(1);
    const chatResult = result[0];
    
    if (!chatResult) {
      return null;
    }
    
    // Ensure userId is always defined
    return {
      ...chatResult,
      userId: chatResult.userId || ''
    };
  } catch (error) {
    console.error('Error in getChatById:', error);
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }): Promise<any> {
  if (USE_MOCK_DB) {
    console.log('Using mock mode for saveMessages');
    return { success: true };
  }
  try {
    if (!db) throw new Error("Database not initialized");
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database:', error);
    throw error;
  }
}

export async function getMessagesByChatId({ chatId }: { chatId: string }): Promise<Message[]> {
  if (USE_MOCK_DB) {
    console.log('Using mock message data for chatId:', chatId);
    return MOCK_MESSAGES.filter(msg => msg.chatId === chatId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  try {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(message).where(eq(message.chatId, chatId)).orderBy(desc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database:', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}): Promise<any> {
  if (USE_MOCK_DB) {
    console.log('Using mock mode for voteMessage');
    return { success: true };
  }
  try {
    if (!db) throw new Error("Database not initialized");
    
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to vote message in database:', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }): Promise<any[]> {
  if (USE_MOCK_DB) {
    console.log('Using mock votes data for chat id:', id);
    return []; // Add mock votes if needed
  }
  try {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database:', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}): Promise<Document> {
  if (USE_MOCK_DB) {
    console.log(`[MOCK] Saving document with ID: ${id}`);
    
    // Check if document already exists in mock data
    const existingDocIndex = MOCK_DOCUMENTS.findIndex(doc => doc.id === id);
    
    const newDoc: Document = {
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    };
    
    // Update or add the document
    if (existingDocIndex >= 0) {
      MOCK_DOCUMENTS[existingDocIndex] = newDoc;
    } else {
      MOCK_DOCUMENTS.push(newDoc);
    }
    
    return newDoc;
  }

  try {
    if (!db) throw new Error("Database not initialized");
    
    await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: document.id,
        set: {
          title,
          kind,
          content,
          createdAt: new Date(),
        },
      });
    
    // Return the saved document
    const [savedDoc] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .limit(1);
    
    if (!savedDoc) {
      throw new Error(`Failed to retrieve saved document with ID: ${id}`);
    }
    
    return savedDoc;
  } catch (error) {
    console.error('Failed to save document to database:', error);
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }): Promise<Document[]> {
  if (USE_MOCK_DB) {
    console.log(`[MOCK] Getting documents for user ID: ${id}`);
    return MOCK_DOCUMENTS.filter(doc => doc.userId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  try {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(document)
      .where(eq(document.userId, id))
      .orderBy(desc(document.createdAt));
  } catch (error) {
    console.error('Failed to get documents by user id from database:', error);
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }): Promise<Document | null> {
  if (USE_MOCK_DB) {
    console.log(`[MOCK] Getting document by ID: ${id}`);
    return MOCK_DOCUMENTS.find(doc => doc.id === id) || null;
  }

  try {
    if (!db) throw new Error("Database not initialized");
    const [result] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .limit(1);
    
    return result || null;
  } catch (error) {
    console.error('Failed to get document by id from database:', error);
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}): Promise<void> {
  if (USE_MOCK_DB) {
    console.log(`[MOCK] Deleting documents for ID ${id} after timestamp ${timestamp}`);
    // In mock mode, we don't actually delete anything
    return;
  }

  try {
    if (!db) throw new Error("Database not initialized");
    
    // Delete suggestions first
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gte(suggestion.createdAt, timestamp)
        )
      );
    
    // Then delete documents
    await db
      .delete(document)
      .where(
        and(
          eq(document.id, id),
          gte(document.createdAt, timestamp)
        )
      );
  } catch (error) {
    console.error('Failed to delete documents by id after timestamp from database:', error);
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}): Promise<Suggestion[]> {
  if (USE_MOCK_DB) {
    console.log(`[MOCK] Saving ${suggestions.length} suggestions`);
    
    for (const newSuggestion of suggestions) {
      // Check if suggestion already exists in mock data
      const existingIndex = MOCK_SUGGESTIONS.findIndex(s => s.id === newSuggestion.id);
      
      if (existingIndex >= 0) {
        // Update existing suggestion
        MOCK_SUGGESTIONS[existingIndex] = newSuggestion;
      } else {
        // Add new suggestion
        MOCK_SUGGESTIONS.push(newSuggestion);
      }
    }
    
    return suggestions;
  }

  try {
    if (!db) throw new Error("Database not initialized");
    
    // Insert all suggestions
    for (const s of suggestions) {
      await db
        .insert(suggestion)
        .values(s)
        .onConflictDoUpdate({
          target: suggestion.id,
          set: {
            description: s.description,
            originalText: s.originalText,
            suggestedText: s.suggestedText,
            isResolved: s.isResolved,
          },
        });
    }
    
    return suggestions;
  } catch (error) {
    console.error('Failed to save suggestions to database:', error);
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}): Promise<Suggestion[]> {
  if (USE_MOCK_DB) {
    console.log(`[MOCK] Getting suggestions for document ID: ${documentId}`);
    return MOCK_SUGGESTIONS.filter(s => s.documentId === documentId);
  }

  try {
    if (!db) throw new Error("Database not initialized");
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (error) {
    console.error('Failed to get suggestions by document id from database:', error);
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  if (USE_MOCK_DB) {
    console.log('Using mock message data for id:', id);
    return MOCK_MESSAGES.filter(msg => msg.id === id);
  }
  try {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database:', error);
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gt(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((m) => m.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }

    return { rowCount: 0 };
  } catch (error: unknown) {
    console.error('Failed to delete messages by chat id after timestamp from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db
      .update(chat)
      .set({ visibility })
      .where(eq(chat.id, chatId));
  } catch (error: unknown) {
    console.error('Failed to update chat visibility by id in database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function saveTokenUsage({
  userId,
  chatId,
  messageId,
  model,
  promptTokens,
  completionTokens,
  totalTokens,
}: {
  userId: string;
  chatId?: string;
  messageId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db.insert(tokenUsage).values({
      userId,
      chatId,
      messageId,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      createdAt: new Date(),
    });
  } catch (error: unknown) {
    console.error('Failed to save token usage in database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function getTokenUsageByUserId({ userId }: { userId: string }) {
  if (USE_MOCK_DB) {
    console.log('Using mock token usage data');
    return MOCK_TOKEN_USAGE.filter(usage => usage.userId === userId);
  }

  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db
      .select()
      .from(tokenUsage)
      .where(eq(tokenUsage.userId, userId))
      .orderBy(desc(tokenUsage.createdAt));
  } catch (error: unknown) {
    console.error('Failed to get token usage by user id from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function getTokenUsageByChatId({ chatId }: { chatId: string }) {
  if (USE_MOCK_DB) {
    console.log('Using mock token usage data for chat:', chatId);
    return MOCK_TOKEN_USAGE.filter(usage => usage.chatId === chatId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  try {
    if (!db) throw new Error("Database not initialized");
    return await db.select().from(tokenUsage).where(eq(tokenUsage.chatId, chatId)).orderBy(desc(tokenUsage.createdAt));
  } catch (error) {
    console.error('Failed to get token usage by chat id from database:', error);
    throw error;
  }
}

export async function getTokenUsageSummaryByUserId({ userId }: { userId: string }) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    const usage = await db
      .select()
      .from(tokenUsage)
      .where(eq(tokenUsage.userId, userId));

    return usage.reduce(
      (acc, curr) => {
        acc.promptTokens += curr.promptTokens;
        acc.completionTokens += curr.completionTokens;
        acc.totalTokens += curr.totalTokens;
        return acc;
      },
      { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    );
  } catch (error: unknown) {
    console.error('Failed to get token usage summary by user id from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

// Ensure Chat type has userId property
export type { User, Message };
export interface ExtendedChat extends Chat {
  userId: string;
}
