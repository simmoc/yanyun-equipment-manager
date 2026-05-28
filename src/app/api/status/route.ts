import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';

export async function GET() {
  try {
    const dbAvailable = await checkDatabaseConnection();
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