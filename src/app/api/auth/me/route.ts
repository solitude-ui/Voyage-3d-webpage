import { NextResponse } from 'next/server';
import { getSession } from '../../../../utils/auth';

export async function GET() {
  try {
    const user = await getSession();
    return NextResponse.json({ user });
  } catch (e: any) {
    console.error('Session retrieval failed:', e);
    return NextResponse.json({ user: null });
  }
}
