import { NextRequest, NextResponse } from 'next/server';

// In-memory progress tracking (in production, use Redis or database)
const progressMap = new Map<string, { progress: number; message: string; status: 'uploading' | 'completed' | 'error' }>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get('id');
  
  if (!uploadId) {
    return NextResponse.json({ error: 'Upload ID required' }, { status: 400 });
  }
  
  const progress = progressMap.get(uploadId);
  
  if (!progress) {
    console.log(`📊 Progress not found for uploadId: ${uploadId}`);
    return NextResponse.json({ 
      progress: 0, 
      message: 'Waiting for upload to start...', 
      status: 'uploading' 
    });
  }
  
  console.log(`📊 Progress for ${uploadId}:`, progress);
  return NextResponse.json(progress);
}

export async function POST(request: NextRequest) {
  const { uploadId, progress, message, status } = await request.json();
  
  console.log(`📊 Updating progress for ${uploadId}:`, { progress, message, status });
  progressMap.set(uploadId, { progress, message, status });
  
  return NextResponse.json({ success: true });
}

// Clean up completed uploads after 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, progress] of progressMap.entries()) {
    if (progress.status === 'completed' || progress.status === 'error') {
      progressMap.delete(id);
    }
  }
}, 5 * 60 * 1000);
