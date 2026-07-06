import { NextResponse } from 'next/server';
import { getSession } from '../../../utils/auth';
import { insertFeedback, getAllFeedback } from '../../../utils/db';

// Retrieves all feedback items
export async function GET() {
  try {
    const items = await getAllFeedback();
    return NextResponse.json(items);
  } catch (e) {
    console.error('Feedback fetch failed:', e);
    return NextResponse.json({ error: 'Failed to retrieve feedback' }, { status: 500 });
  }
}

// Submits a new feedback item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check for active secure session cookie
    const session = await getSession();
    const userId = session ? session.id : null;
    
    // Use session username if logged in, otherwise default to nickname or Anonymous
    const nickname = session ? session.username : (body.nickname || 'Anonymous');

    // Validate rating parameter
    const rating = parseInt(body.rating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const message = body.suggestions || body.message || 'No comment provided';

    // Insert feedback item (Postgres DB or fallback JSON DB)
    await insertFeedback(
      userId,
      nickname,
      message,
      rating,
      body.suggestions || '',
      body.bugReport || '',
      body.favoriteFeature || ''
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Feedback submission failed:', e);
    return NextResponse.json({ error: 'Server error during feedback submission' }, { status: 500 });
  }
}
