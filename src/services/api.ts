import axios from 'axios';
import type { Pool, Job, Worker, PoolStats, CategorizedPools, JobStatus } from '../types';

const API_BASE_URL = 'http://localhost:8000'; // Adjust this to your FastAPI server URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class ApiService {
  // Pool operations
  static async getCategorizedPools(userId: string): Promise<CategorizedPools> {
    const response = await api.get(`/pools/categorized?user_id=${userId}`);
    return response.data;
  }

  static async getAllPools(): Promise<Pool[]> {
    const response = await api.get('/pools');
    return response.data;
  }

  static async createPool(name: string, userId: string): Promise<Pool> {
    const response = await api.post('/pools', { name, user_id: userId });
    return response.data;
  }

  static async deletePool(poolId: string, userId: string): Promise<void> {
    await api.delete(`/pools/${poolId}?user_id=${userId}`);
  }

  // Job operations
  static async getPoolJobs(poolId: string, status?: JobStatus): Promise<Job[]> {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/pools/${poolId}/jobs${params}`);
    return response.data;
  }

  static async submitJob(poolId: string, payload: Record<string, any>, userId: string): Promise<Job> {
    const response = await api.post(`/pools/${poolId}/jobs?user_id=${userId}`, { payload });
    return response.data;
  }

  static async getJob(jobId: string): Promise<Job> {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  }

  static async updateJobProgress(jobId: string, progress: number, status?: JobStatus): Promise<Job> {
    const response = await api.post(`/jobs/${jobId}/progress`, { progress, status });
    return response.data;
  }

  static async clearPoolJobs(poolId: string, userId: string, status?: JobStatus): Promise<void> {
    const params = new URLSearchParams({ user_id: userId });
    if (status) {
      params.append('status', status);
    }
    await api.delete(`/pools/${poolId}/jobs?${params.toString()}`);
  }

  // Worker operations
  static async getPoolWorkers(poolId: string): Promise<Worker[]> {
    const response = await api.get(`/pools/${poolId}/workers`);
    return response.data;
  }

  static async workerHeartbeat(poolId: string, workerName: string, status: string, currentJobId?: string): Promise<Worker> {
    const response = await api.post(`/pools/${poolId}/workers/heartbeat`, {
      worker_name: workerName,
      status,
      current_job_id: currentJobId
    });
    return response.data;
  }

  // Stats
  static async getPoolStats(poolId: string): Promise<PoolStats> {
    const response = await api.get(`/pools/${poolId}/stats`);
    return response.data;
  }
}