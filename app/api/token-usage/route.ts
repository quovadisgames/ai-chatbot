import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserTokenUsage, getChatTokenUsage } from '@/lib/ai/token-tracking';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const chatId = searchParams.get('chatId');

  try {
    // If chatId is provided, get token usage for that chat
    if (chatId) {
      const chatUsage = await getChatTokenUsage(chatId);
      return NextResponse.json(chatUsage);
    }
    
    // If userId is provided, get token usage for that user
    // Only allow admins or the user themselves to access their usage
    if (userId) {
      // Check if the requesting user is the same as the requested user
      // or if they have admin privileges
      if (userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to access this user\'s data' },
          { status: 403 }
        );
      }
      
      const userUsage = await getUserTokenUsage(userId);
      return NextResponse.json(userUsage);
    }
    
    // Default to getting the current user's usage
    const userUsage = await getUserTokenUsage(session.user.id);
    return NextResponse.json(userUsage);
  } catch (error) {
    console.error('Error fetching token usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token usage' },
      { status: 500 }
    );
  }
} 