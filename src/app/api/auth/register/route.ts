import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, queryUserByUsername } from '../../../../utils/db';
import { setSession } from '../../../../utils/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username.length < 3 || password.length < 6) {
      return NextResponse.json({ error: 'Username must be at least 3 characters and password at least 6 characters' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await queryUserByUsername(username);
    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // Hash password securely with bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save user record
    const user = await createUser(username, passwordHash);

    // Issue session cookie
    await setSession({
      id: user.id,
      username: user.username,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        feedbackSubmitted: false, // newly registered user has no reviews yet
      },
    });
  } catch (e: any) {
    console.error('Registration failed:', e);
    return NextResponse.json({ error: 'Server error during registration' }, { status: 500 });
  }
}
