import { NextResponse } from 'next/server';
import { clearSession } from '../../../../utils/auth';

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Logout failed:', e);
    return NextResponse.json({ error: 'Server error during logout' }, { status: 500 });
  }
}
