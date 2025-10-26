/**
 * 分析状态管理
 */

export interface AnalysisProgress {
  current: number;
  total: number;
  status: string;
}

export interface AnalysisState {
  isRunning: boolean;
  progress: AnalysisProgress;
  error: string | null;
}

class AnalysisStateManager {
  private state: AnalysisState = {
    isRunning: false,
    progress: {
      current: 0,
      total: 0,
      status: 'idle'
    },
    error: null
  };

  getState(): AnalysisState {
    return { ...this.state };
  }

  setRunning(isRunning: boolean): void {
    this.state.isRunning = isRunning;
  }

  setProgress(progress: Partial<AnalysisProgress>): void {
    this.state.progress = { ...this.state.progress, ...progress };
  }

  setError(error: string | null): void {
    this.state.error = error;
  }

  reset(): void {
    this.state = {
      isRunning: false,
      progress: {
        current: 0,
        total: 0,
        status: 'idle'
      },
      error: null
    };
  }
}

export const analysisStateManager = new AnalysisStateManager();
