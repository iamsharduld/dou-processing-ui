export enum JobStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum WorkerStatus {
  IDLE = 'idle',
  BUSY = 'busy'
}

export interface Pool {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Job {
  id: string;
  pool_id: string;
  payload: Record<string, any>;
  status: JobStatus;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  pool_id: string;
  worker_name: string;
  status: WorkerStatus;
  current_job_id: string | null;
  last_heartbeat: string;
  created_at: string;
}

export interface PoolStats {
  jobs: {
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    total: number;
  };
  workers: {
    idle: number;
    busy: number;
    total_active: number;
  };
}

export interface CategorizedPools {
  owned_pools: Pool[];
  other_pools: Pool[];
  total_owned: number;
  total_other: number;
  total_all: number;
}