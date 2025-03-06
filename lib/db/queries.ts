import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

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
  if (USE_MOCK_DB) {
    console.log('Using mock user data for:', email);
    if (email === MOCK_USER.email) {
      return [MOCK_USER];
    }
    return [];
  }
  
  try {
    // biome-ignore lint: Forbidden non-null assertion.
    return await db!.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
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
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  if (USE_MOCK_DB) {
    console.log('Using mock chat data for user:', id);
    return MOCK_CHATS.filter(chat => chat.userId === id);
  }
  
  try {
    // biome-ignore lint: Forbidden non-null assertion.
    return await db!
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  if (USE_MOCK_DB) {
    console.log('Using mock message data for chat:', id);
    return MOCK_MESSAGES.filter(msg => msg.chatId === id);
  }
  
  try {
    // biome-ignore lint: Forbidden non-null assertion.
    return await db!
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
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
}) {
  try {
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
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
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
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
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
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
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
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

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
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
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
    return await db
      .update(chat)
      .set({ visibility })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility by id in database');
    throw error;
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
  } catch (error) {
    console.error('Failed to save token usage in database');
    throw error;
  }
}

export async function getTokenUsageByUserId({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(tokenUsage)
      .where(eq(tokenUsage.userId, userId))
      .orderBy(desc(tokenUsage.createdAt));
  } catch (error) {
    console.error('Failed to get token usage by user id from database');
    throw error;
  }
}

export async function getTokenUsageByChatId({ chatId }: { chatId: string }) {
  if (USE_MOCK_DB) {
    console.log('Using mock token usage data for chat:', chatId);
    return MOCK_TOKEN_USAGE.filter(usage => usage.chatId === chatId);
  }
  
  try {
    // biome-ignore lint: Forbidden non-null assertion.
    return await db!
      .select()
      .from(tokenUsage)
      .where(eq(tokenUsage.chatId, chatId))
      .orderBy(desc(tokenUsage.createdAt));
  } catch (error) {
    console.error('Failed to get token usage by chat id from database');
    throw error;
  }
}

export async function getTokenUsageSummaryByUserId({ userId }: { userId: string }) {
  try {
    const usage = await db
      .select()
      .from(tokenUsage)
      .where(eq(tokenUsage.userId, userId));
    
    // Calculate total tokens used
    const totalTokensUsed = usage.reduce((sum, record) => sum + record.totalTokens, 0);
    
    // Calculate tokens by model
    const tokensByModel = usage.reduce((acc, record) => {
      const { model, totalTokens } = record;
      acc[model] = (acc[model] || 0) + totalTokens;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalTokensUsed,
      tokensByModel,
      usageRecords: usage,
    };
  } catch (error) {
    console.error('Failed to get token usage summary by user id from database');
    throw error;
  }
}
