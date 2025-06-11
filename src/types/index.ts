export interface JobSubmission {
  id?: string;
  name: string;
  description?: string;
  inputFile1Path: string;
  inputFile2Path: string;
  parameters: JobParameters;
  status: JobStatus;
  createdAt?: string;
  updatedAt?: string;
  progress?: number;
  estimatedCompletion?: string;
}

export interface JobParameters {
  processingMode: 'standard' | 'enhanced' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'critical';
  outputFormat: 'json' | 'xml' | 'csv' | 'binary';
  enableLogging: boolean;
  maxProcessingTime: number; // in minutes
  customSettings?: Record<string, any>;
}

export enum JobStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface QueueItem {
  id: string;
  name: string;
  status: JobStatus;
  priority: string;
  submittedAt: string;
  estimatedCompletion?: string;
  progress?: number;
}