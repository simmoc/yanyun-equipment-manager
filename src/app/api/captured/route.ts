import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CAPTURED_DATA_DIR = path.join(process.cwd(), 'tools', 'captured_data');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(CAPTURED_DATA_DIR, 'latest_character.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: '文件不存在' }, { status: 404 });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('读取捕获数据失败:', error);
    return NextResponse.json({ success: false, error: '读取失败' }, { status: 500 });
  }
}
