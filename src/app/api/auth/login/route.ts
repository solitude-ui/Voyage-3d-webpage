import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryUserByUsername, hasUserSubmittedFeedback } from '../../../../utils/db';
import { setSession } from '../../../../utils/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Query user record
    const user = await queryUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Verify password hash
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Set secure session cookie
    await setSession({
      id: user.id,
      username: user.username,
    });

    const feedbackSubmitted = await hasUserSubmittedFeedback(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        feedbackSubmitted
      },
    });
  } catch (e: any) {
    console.error('Login failed:', e);
    return NextResponse.json({ error: 'Server error during login' }, { status: 500 });
  }
}
