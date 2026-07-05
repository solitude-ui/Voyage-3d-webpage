import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FEEDBACK_FILE_PATH = path.join(process.cwd(), 'content', 'feedback.json');

// Helper to safely read feedback items
const readFeedback = (): any[] => {
  try {
    if (!fs.existsSync(FEEDBACK_FILE_PATH)) {
      return [];
    }
    const data = fs.readFileSync(FEEDBACK_FILE_PATH, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (e) {
    return [];
  }
};

// Helper to safely write feedback items
const writeFeedback = (items: any[]) => {
  try {
    const dir = path.dirname(FEEDBACK_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FEEDBACK_FILE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write feedback local file:', e);
  }
};

export async function GET() {
  const items = readFeedback();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request
    if (!body.nickname || !body.rating) {
      return NextResponse.json({ error: 'Missing parameter profiles' }, { status: 400 });
    }

    const items = readFeedback();
    
    // Add new feedback item
    const newItem = {
      id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nickname: body.nickname,
      country: body.country || 'Unknown',
      rating: parseInt(body.rating, 10),
      suggestions: body.suggestions || '',
      bugReport: body.bugReport || '',
      favoriteFeature: body.favoriteFeature || '',
      timestamp: body.timestamp || new Date().toISOString(),
    };

    items.push(newItem);
    writeFeedback(items);

    return NextResponse.json({ success: true, item: newItem });
  } catch (e) {
    return NextResponse.json({ error: 'Server compression transmission failed' }, { status: 500 });
  }
}
