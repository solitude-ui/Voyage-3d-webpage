import { NextResponse } from 'next/server';
import { getSession } from '../../../../utils/auth';
import { hasUserSubmittedFeedback } from '../../../../utils/db';

export async function GET() {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ user: null });

    const feedbackSubmitted = await hasUserSubmittedFeedback(user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        feedbackSubmitted
      }
    });
  } catch (e: any) {
    console.error('Session retrieval failed:', e);
    return NextResponse.json({ user: null });
  }
}
