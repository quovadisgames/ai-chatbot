'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatList() {
  const router = useRouter();
  
  // Redirect to the home page, as this is just a directory
  // and we want users to start with the main chat page
  useEffect(() => {
    router.push('/');
  }, [router]);
  
  return <div>Redirecting to chat home...</div>;
}
