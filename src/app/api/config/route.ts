import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'tools', 'config_data');

export const dynamic = 'force-dynamic';

function readConfigData() {
  return Object.fromEntries(
    fs.readdirSync(CONFIG_DIR)
      .filter((filename) => filename.endsWith('.json'))
      .sort()
      .map((filename) => {
        const key = path.basename(filename, '.json');
        const data = fs.readFileSync(path.join(CONFIG_DIR, filename), 'utf-8');
        return [key, JSON.parse(data)];
      })
  );
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: readConfigData()
    });
  } catch (error) {
    console.error('Error loading config data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load config data'
    }, { status: 500 });
  }
}
