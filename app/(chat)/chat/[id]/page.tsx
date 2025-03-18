'use client';

export default function ChatPage({ params }: { params: { id: string } }) {
  return <div>Chat {params.id}</div>;
}

export const dynamic = 'force-dynamic';
