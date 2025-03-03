import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';
import { appConfig } from '@/lib/config';

export async function GET() {
  if (!appConfig.auth.required) {
    return NextResponse.json({
      user: appConfig.auth.defaultUser
    });
  }
  
  const session = await auth();
  return NextResponse.json(session);
} 