import { NextRequest, NextResponse } from 'next/server';
import { progressMap } from '../../../../lib/progress-tracker';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get('id');
  
  if (!uploadId) {
    return NextResponse.json({ error: 'Upload ID required' }, { status: 400 });
  }
  
  const progress = progressMap.get(uploadId);
  
  console.log(`🔍 Progress check for ${uploadId}:`, progress);
  
  if (!progress) {
    return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
  }
  
  return NextResponse.json(progress);
}

export async function POST(request: NextRequest) {
  const { uploadId, progress, message, status } = await request.json();
  
  progressMap.set(uploadId, { progress, message, status });
  
  return NextResponse.json({ success: true });
}

// Cleanup is handled in the shared progress tracker
