/**
 * 同步状态管理
 */

export interface SyncProgress {
  current: number;
  total: number;
  status: string;
  synced: number;
  skipped: number;
  errors: number;
}

export interface SyncState {
  isRunning: boolean;
  progress: SyncProgress;
  error: string | null;
  errorCode?: string;
}

class SyncStateManager {
  private state: SyncState = {
    isRunning: false,
    progress: {
      current: 0,
      total: 0,
      status: 'idle',
      synced: 0,
      skipped: 0,
      errors: 0
    },
    error: null,
    errorCode: undefined
  };

  getState(): SyncState {
    return { ...this.state };
  }

  setRunning(isRunning: boolean): void {
    this.state.isRunning = isRunning;
  }

  setProgress(progress: Partial<SyncProgress>): void {
    this.state.progress = { ...this.state.progress, ...progress };
  }

  setError(error: string | null, errorCode?: string): void {
    this.state.error = error;
    this.state.errorCode = errorCode;
  }

  incrementSynced(): void {
    this.state.progress.synced++;
    this.state.progress.current = this.state.progress.synced + this.state.progress.skipped + this.state.progress.errors;
  }

  incrementSkipped(): void {
    this.state.progress.skipped++;
    this.state.progress.current = this.state.progress.synced + this.state.progress.skipped + this.state.progress.errors;
  }

  incrementError(): void {
    this.state.progress.errors++;
    this.state.progress.current = this.state.progress.synced + this.state.progress.skipped + this.state.progress.errors;
  }

  reset(): void {
    this.state = {
      isRunning: false,
      progress: {
        current: 0,
        total: 0,
        status: 'idle',
        synced: 0,
        skipped: 0,
        errors: 0
      },
      error: null,
      errorCode: undefined
    };
  }
}

export const syncStateManager = new SyncStateManager();

