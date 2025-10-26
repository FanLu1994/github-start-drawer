import { NextResponse } from 'next/server';
import { analysisStateManager } from '@/lib/analysis-state';

export async function GET() {
  const state = analysisStateManager.getState();
  return NextResponse.json({
    isRunning: state.isRunning,
    progress: state.progress,
    error: state.error
  });
}
