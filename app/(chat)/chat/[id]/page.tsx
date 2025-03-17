import { auth } from '@/auth';
import { Chat } from '@/components/chat';
import { getChat } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import type { ExtendedChat } from '@/lib/db/schema';

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const chat = await getChat(params.id) as ExtendedChat | null;

  if (!chat) {
    return notFound();
  }

  const session = await auth();

  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (chat.userId !== session.user.id) {
      return notFound();
    }
  }

  return (
    <Chat
      chatId={chat.id}
      initialMessages={chat.messages}
      selectedChatModel={chat.model || 'gpt-4'}
      selectedVisibilityType={chat.visibility}
      isReadonly={!session?.user || chat.userId !== session.user.id}
    />
  );
}
