import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserTokenUsage, getChatTokenUsage } from '@/lib/ai/token-tracking';
import { getTokenUsageSummaryByUserId, getTokenUsageByChatId } from '@/lib/db/queries';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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
    const detailed = searchParams.get('detailed') === 'true';

    // If chatId is provided, get token usage for that chat
    if (chatId) {
      try {
        // Use the detailed query if requested
        if (detailed) {
          const chatUsageDetails = await getTokenUsageByChatId({ chatId });
          return NextResponse.json({ 
            summary: await getChatTokenUsage(chatId),
            details: chatUsageDetails
          });
        } else {
          const chatUsage = await getChatTokenUsage(chatId);
          return NextResponse.json(chatUsage);
        }
      } catch (error) {
        console.error('Error fetching chat token usage:', error);
        return NextResponse.json(
          { error: 'Failed to fetch chat token usage' },
          { status: 500 }
        );
      }
    }
    
    // If userId is provided, get token usage for that user
    // Only allow the user themselves to access their usage
    if (userId) {
      // Check if the requesting user is the same as the requested user
      if (userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to access this user\'s data' },
          { status: 403 }
        );
      }
      
      try {
        // Use the detailed query if requested
        if (detailed) {
          const userUsageSummary = await getTokenUsageSummaryByUserId({ userId });
          return NextResponse.json(userUsageSummary);
        } else {
          const userUsage = await getUserTokenUsage(userId);
          return NextResponse.json(userUsage);
        }
      } catch (error) {
        console.error('Error fetching user token usage:', error);
        return NextResponse.json(
          { error: 'Failed to fetch user token usage' },
          { status: 500 }
        );
      }
    }
    
    // Default to getting the current user's usage
    try {
      // Use the detailed query if requested
      if (detailed) {
        const userUsageSummary = await getTokenUsageSummaryByUserId({ userId: session.user.id });
        return NextResponse.json(userUsageSummary);
      } else {
        const userUsage = await getUserTokenUsage(session.user.id);
        return NextResponse.json(userUsage);
      }
    } catch (error) {
      console.error('Error fetching current user token usage:', error);
      return NextResponse.json(
        { error: 'Failed to fetch token usage' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in token usage API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 