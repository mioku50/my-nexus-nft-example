import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const artifactPath = path.join(process.cwd(), '..', 'contracts', 'artifacts', 'contracts', 'SimpleNFT.sol', 'SimpleNFT.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    return NextResponse.json(artifact);
  } catch (error: any) {
    console.error('Error reading contract artifact:', error);
    return NextResponse.json(
      { error: 'Failed to load contract artifact' },
      { status: 500 }
    );
  }
} 