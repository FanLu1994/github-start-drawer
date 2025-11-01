/**
 * 分析状态管理
 */

export interface AnalysisProgress {
  current: number;
  total: number;
  status: string;
  completed: number;
  failed: number;
  processing: string[];
}

export interface AnalysisState {
  isRunning: boolean;
  isStopped: boolean;
  progress: AnalysisProgress;
  error: string | null;
}

class AnalysisStateManager {
  private state: AnalysisState = {
    isRunning: false,
    isStopped: false,
    progress: {
      current: 0,
      total: 0,
      status: 'idle',
      completed: 0,
      failed: 0,
      processing: []
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
      isStopped: false,
      progress: {
        current: 0,
        total: 0,
        status: 'idle',
        completed: 0,
        failed: 0,
        processing: []
      },
      error: null
    };
  }

  stop(): void {
    this.state.isStopped = true;
    this.state.isRunning = false;
    this.state.progress.status = '已停止';
  }

  isStopped(): boolean {
    return this.state.isStopped;
  }

  // 添加并行任务管理方法
  addProcessing(repoName: string): void {
    if (!this.state.progress.processing.includes(repoName)) {
      this.state.progress.processing.push(repoName);
    }
  }

  removeProcessing(repoName: string): void {
    this.state.progress.processing = this.state.progress.processing.filter(name => name !== repoName);
  }

  incrementCompleted(): void {
    this.state.progress.completed++;
    this.state.progress.current = this.state.progress.completed + this.state.progress.failed;
  }

  incrementFailed(): void {
    this.state.progress.failed++;
    this.state.progress.current = this.state.progress.completed + this.state.progress.failed;
  }
}

export const analysisStateManager = new AnalysisStateManager();
