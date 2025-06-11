import axios from 'axios';
import type { JobSubmission, QueueItem } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class DoUApiService {
  static async submitJob(job: JobSubmission): Promise<JobSubmission> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const submittedJob: JobSubmission = {
      ...job,
      id: `job_${Date.now()}`,
      status: 'submitted' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: 0,
      estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
    
    return submittedJob;
  }

  static async getJobQueue(): Promise<QueueItem[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        id: 'job_001',
        name: 'Neural Network Training - Model A',
        status: 'processing' as any,
        priority: 'high',
        submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        progress: 65,
        estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      },
      {
        id: 'job_002',
        name: 'Data Preprocessing - Dataset B',
        status: 'queued' as any,
        priority: 'medium',
        submittedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        estimatedCompletion: new Date(Date.now() + 25 * 60 * 1000).toISOString()
      },
      {
        id: 'job_003',
        name: 'Model Validation - Batch C',
        status: 'completed' as any,
        priority: 'low',
        submittedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        progress: 100
      }
    ];
  }

  static async getJobStatus(jobId: string): Promise<JobSubmission> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: jobId,
      name: 'Sample Job',
      inputFile1Path: '/path/to/file1.dat',
      inputFile2Path: '/path/to/file2.dat',
      parameters: {
        processingMode: 'standard',
        priority: 'medium',
        outputFormat: 'json',
        enableLogging: true,
        maxProcessingTime: 60
      },
      status: 'processing' as any,
      progress: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}