import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://s.166.net/config/ds_h72/ai_transfer_tool.json');
    if (!res.ok) throw new Error(`CDN responded with ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching ai_transfer_tool.json:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 502 });
  }
}
