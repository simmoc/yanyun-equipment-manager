import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbAvailable = await checkDatabaseConnection();
    // const dbAvailable = false;
    return NextResponse.json({
      success: true,
      data: {
        databaseAvailable: dbAvailable,
        mode: dbAvailable ? 'database' : 'localStorage'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: {
        databaseAvailable: false,
        mode: 'localStorage'
      }
    });
  }
}
