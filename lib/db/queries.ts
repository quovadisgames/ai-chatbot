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

export async function getUser(email: string): Promise<Array<User>> {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error: unknown) {
    console.error('Failed to get user from database');
    if (USE_MOCK_DB) {
      console.log('Using mock user data');
      if (email === MOCK_USER.email) {
        return [MOCK_USER];
      }
      return [];
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
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

export async function getChatById({ id }: { id: string }) {
  if (USE_MOCK_DB) {
    console.log('Using mock chat data for id:', id);
    return MOCK_CHATS.find(chat => chat.id === id) || null;
  }
  try {
    if (!db) throw new Error("Database not initialized");
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error: unknown) {
    console.error('Failed to get chat by id from database:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db.insert(message).values(messages);
  } catch (error: unknown) {
    console.error('Failed to save messages in database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  if (USE_MOCK_DB) {
    console.log('Using mock messages data');
    return MOCK_MESSAGES.filter(message => message.chatId === id);
  }

  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db.select().from(message).where(eq(message.chatId, id));
  } catch (error: unknown) {
    console.error('Failed to get messages by chat id from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
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
}) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    
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
  } catch (error: unknown) {
    console.error('Failed to vote message in database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error: unknown) {
    console.error('Failed to get votes by chat id from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
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
}) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error: unknown) {
    console.error('Failed to save document in database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return documents;
  } catch (error: unknown) {
    console.error('Failed to get documents by id from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error: unknown) {
    console.error('Failed to get document by id from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.createdAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error: unknown) {
    console.error('Failed to delete documents by id after timestamp from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db.insert(suggestion).values(suggestions);
  } catch (error: unknown) {
    console.error('Failed to save suggestions in database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error: unknown) {
    console.error('Failed to get suggestions by document id from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error: unknown) {
    console.error('Failed to get message by id from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
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
    console.log('Using mock token usage data');
    return MOCK_TOKEN_USAGE.filter(usage => usage.chatId === chatId);
  }

  try {
    if (!db) {
      throw new Error("Database not initialized");
    }
    return await db
      .select()
      .from(tokenUsage)
      .where(eq(tokenUsage.chatId, chatId))
      .orderBy(desc(tokenUsage.createdAt));
  } catch (error: unknown) {
    console.error('Failed to get token usage by chat id from database');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
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
