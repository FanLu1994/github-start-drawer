import { NextResponse } from 'next/server';
import { analysisStateManager } from '@/lib/analysis-state';

export async function POST() {
  try {
    const state = analysisStateManager.getState();
    
    if (!state.isRunning) {
      return NextResponse.json(
        { error: '分析未运行，无法停止' },
        { status: 400 }
      );
    }

    analysisStateManager.stop();

    return NextResponse.json({
      message: '分析已停止',
      progress: analysisStateManager.getState().progress
    });

  } catch (error) {
    console.error('停止分析失败:', error);
    return NextResponse.json(
      { 
        error: '停止分析失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

