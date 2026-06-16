import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'tools', 'config_data');

function readJsonFile(filename: string) {
  try {
    const filepath = path.join(CONFIG_DIR, filename);
    const data = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    const equipData = readJsonFile('equip_data.json');
    const suffixData = readJsonFile('suffix_data.json');
    const affixData = readJsonFile('affix_data.json');
    const schoolData = readJsonFile('school_data.json');
    const xinfaData = readJsonFile('xinfa_data.json');
    const slotData = readJsonFile('slot_data.json');

    return NextResponse.json({
      success: true,
      data: {
        equip_data: equipData,
        suffix_data: suffixData,
        affix_data: affixData,
        school_data: schoolData,
        xinfa_data: xinfaData,
        slot_data: slotData
      }
    });
  } catch (error) {
    console.error('Error loading config data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load config data'
    }, { status: 500 });
  }
}