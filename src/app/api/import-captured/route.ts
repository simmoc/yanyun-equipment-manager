import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CAPTURED_DATA_DIR = path.join(process.cwd(), 'tools', 'captured_data');

const SLOT_MAP: Record<string, string> = {
  '1': 'jian',
  '2': 'qiang',
  '3': 'huan',
  '4': 'pei',
  '5': 'guanzhou',
  '6': 'xiongjia',
  '7': 'jingjia',
  '8': 'wanjia'
};

const ATTR_MAP: Record<string, string> = {
  'HP_MAX': '气血最大值',
  'MIN_W_ATK': '最小外功攻击',
  'MAX_W_ATK': '最大外功攻击',
  'W_ATK': '外功攻击',
  'W_DEF': '外功防御'
};

export async function GET() {
  try {
    const latestFile = path.join(CAPTURED_DATA_DIR, 'latest_character.json');
    
    if (!fs.existsSync(latestFile)) {
      return NextResponse.json({
        success: false,
        error: 'latest_character.json not found'
      }, { status: 404 });
    }

    const data = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error reading captured data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read captured data'
    }, { status: 500 });
  }
}