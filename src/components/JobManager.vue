<template>
  <div class="job-manager">
    <div class="manager-header">
      <div class="header-content">
        <div class="title-section">
          <h3 class="section-title">Job Management</h3>
          <div class="status-indicators">
            <div class="indicator active" v-if="isLive">
              <span class="indicator-dot"></span>
              <span class="indicator-text">Live</span>
            </div>
            <div class="indicator inactive" v-else>
              <span class="indicator-dot"></span>
              <span class="indicator-text">Offline</span>
            </div>
          </div>
        </div>
        
        <div class="controls-section">
          <button @click="showHistoryModal = true" class="history-button">
            <span class="button-icon">📋</span>
            <span>View History</span>
          </button>
          <button 
            v-if="isOwner && userJobs.length > 0" 
            @click="showClearModal = true" 
            class="clear-button"
          >
            <span class="button-icon">🗑️</span>
            <span>Clear Jobs</span>
          </button>
          <button @click="toggleAutoRefresh" class="toggle-button" :class="{ active: autoRefresh }">
            <span class="toggle-icon">{{ autoRefresh ? '⏸️' : '▶️' }}</span>
            <span>{{ autoRefresh ? 'Pause' : 'Resume' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Excel File Upload Section (only for owned pools) -->
    <div v-if="isOwner" class="submission-section">
      <div class="submission-header">
        <h4 class="submission-title">Submit Jobs from Excel</h4>
        <p class="submission-subtitle">Upload an Excel file with columns: upd_id, trace_file_path, modification_file</p>
      </div>

      <!-- File Upload Area -->
      <div 
        class="file-upload-area"
        :class="{ 
          'drag-over': isDragOver,
          'has-file': selectedFile,
          'has-error': uploadError
        }"
        @drop="handleFileDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls"
          @change="handleFileSelect"
          style="display: none"
        />
        
        <div v-if="!selectedFile" class="upload-prompt">
          <div class="upload-icon">📊</div>
          <div class="upload-text">
            <p class="upload-title">Drop Excel file here or click to browse</p>
            <p class="upload-subtitle">Supports .xlsx and .xls files</p>
          </div>
        </div>

        <div v-else class="file-info">
          <div class="file-icon">📄</div>
          <div class="file-details">
            <p class="file-name">{{ selectedFile.name }}</p>
            <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
          <button @click.stop="clearFile" class="remove-file-button">
            <span class="remove-icon">×</span>
          </button>
        </div>
      </div>

      <div v-if="uploadError" class="error-message">
        <span class="error-icon">⚠️</span>
        {{ uploadError }}
      </div>

      <!-- Process File Button -->
      <div v-if="selectedFile && !jobsPreview.length" class="file-actions">
        <button 
          @click="processExcelFile" 
          class="process-button"
          :disabled="processing"
        >
          <span v-if="processing" class="loading-spinner"></span>
          <span>{{ processing ? 'Processing...' : 'Process File' }}</span>
        </button>
      </div>

      <!-- Jobs Preview Table -->
      <div v-if="jobsPreview.length" class="jobs-preview">
        <div class="preview-header">
          <h5 class="preview-title">Jobs Preview ({{ jobsPreview.length }} jobs)</h5>
          <div class="preview-actions">
            <button @click="clearPreview" class="clear-preview-button">
              <span class="button-icon">🗑️</span>
              <span>Clear</span>
            </button>
            <button 
              @click="submitAllJobs" 
              class="submit-all-button"
              :disabled="submittingBatch || jobsPreview.every(job => job.status === 'submitted')"
            >
              <span v-if="submittingBatch" class="loading-spinner"></span>
              <span v-if="submittingBatch">
                Submitting... {{ submissionProgress.current }}/{{ submissionProgress.total }}
              </span>
              <span v-else-if="jobsPreview.every(job => job.status === 'submitted')">
                All Jobs Submitted
              </span>
              <span v-else>
                Submit All Jobs
              </span>
            </button>
          </div>
        </div>

        <div class="preview-table-container">
          <table class="preview-table">
            <thead>
              <tr>
                <th class="row-number">#</th>
                <th class="upd-id">UPD ID</th>
                <th class="trace-file">Trace File</th>
                <th class="modification-file">Modification File</th>
                <th class="status">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(job, index) in jobsPreview" 
                :key="index"
                class="preview-row"
                :class="job.status"
              >
                <td class="row-number">{{ index + 1 }}</td>
                <td class="upd-id">{{ job.payload.upd_id }}</td>
                <td class="trace-file">
                  <span class="file-path" :title="job.payload.trace_file_path">
                    {{ getFileName(job.payload.trace_file_path) }}
                  </span>
                </td>
                <td class="modification-file">
                  <span class="file-path" :title="job.payload.modification_file">
                    {{ getFileName(job.payload.modification_file) }}
                  </span>
                </td>
                <td class="status">
                  <span class="status-badge" :class="job.status">
                    <span v-if="job.status === 'submitting'" class="status-spinner"></span>
                    {{ formatJobStatus(job.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="submissionSummary" class="submission-summary">
          <div class="summary-stats">
            <div class="summary-stat success">
              <span class="stat-value">{{ submissionSummary.successful }}</span>
              <span class="stat-label">Successful</span>
            </div>
            <div class="summary-stat failed">
              <span class="stat-value">{{ submissionSummary.failed }}</span>
              <span class="stat-label">Failed</span>
            </div>
            <div class="summary-stat total">
              <span class="stat-value">{{ submissionSummary.total }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Jobs List -->
    <div class="jobs-section">
      <div v-if="loading && !jobs.length" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading jobs...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button @click="loadJobs" class="retry-button">Try Again</button>
      </div>

      <div v-else-if="!userJobs.length" class="empty-state">
        <div class="empty-icon">📝</div>
        <h4 class="empty-title">No jobs submitted</h4>
        <p class="empty-message" v-if="isOwner">Upload an Excel file to submit your first jobs.</p>
        <p class="empty-message" v-else>No jobs have been submitted by you in this pool.</p>
      </div>

      <div v-else class="jobs-container">
        <div class="jobs-header">
          <h4 class="jobs-title">Your Jobs ({{ userJobs.length }})</h4>
          <div class="jobs-stats">
            <span class="stat pending" v-if="jobStats.pending">{{ jobStats.pending }} Pending</span>
            <span class="stat in-progress" v-if="jobStats.in_progress">{{ jobStats.in_progress }} Active</span>
            <span class="stat completed" v-if="jobStats.completed">{{ jobStats.completed }} Done</span>
            <span class="stat failed" v-if="jobStats.failed">{{ jobStats.failed }} Failed</span>
          </div>
        </div>

        <!-- Jobs Table -->
        <div class="jobs-table-container">
          <table class="jobs-table">
            <thead>
              <tr>
                <th class="job-id">Job ID</th>
                <th class="task-name">Task</th>
                <th class="status">Status</th>
                <th class="progress">Progress</th>
                <th class="created">Created</th>
                <th class="updated">Updated</th>
                <th class="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="job in userJobs" 
                :key="job.id"
                class="job-row"
                :class="[job.status, { 'recently-updated': isRecentlyUpdated(job) }]"
              >
                <td class="job-id">
                  <span class="id-text">{{ job.id.slice(0, 8) }}</span>
                </td>
                <td class="task-name">
                  <div class="task-info">
                    <span class="task-title">{{ getTaskName(job.payload) }}</span>
                    <span class="task-subtitle">{{ getTaskDetails(job.payload) }}</span>
                  </div>
                </td>
                <td class="status">
                  <span class="status-badge" :class="job.status">
                    {{ formatStatus(job.status) }}
                  </span>
                </td>
                <td class="progress">
                  <div v-if="job.status === 'in_progress' && job.progress" class="progress-cell">
                    <div class="progress-bar-small">
                      <div 
                        class="progress-fill-small" 
                        :style="{ width: `${job.progress}%` }"
                      ></div>
                    </div>
                    <span class="progress-text">{{ job.progress }}%</span>
                  </div>
                  <span v-else class="no-progress">-</span>
                </td>
                <td class="created">
                  <span class="time-text">{{ formatRelativeTime(job.created_at) }}</span>
                </td>
                <td class="updated">
                  <span class="time-text">{{ formatRelativeTime(job.updated_at) }}</span>
                </td>
                <td class="actions">
                  <button @click="viewJobDetails(job)" class="action-button">
                    <span class="action-icon">👁️</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Job Details Modal -->
    <div v-if="selectedJob" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-title-section">
            <h3 class="modal-title">Job Details</h3>
            <span class="job-status" :class="selectedJob.status">{{ formatStatus(selectedJob.status) }}</span>
          </div>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-content">
          <div class="detail-grid">
            <div class="detail-item">
              <label class="detail-label">Job ID</label>
              <span class="detail-value monospace">{{ selectedJob.id }}</span>
            </div>
            <div class="detail-item" v-if="selectedJob.progress">
              <label class="detail-label">Progress</label>
              <div class="progress-detail">
                <div class="progress-bar large">
                  <div class="progress-fill" :style="{ width: `${selectedJob.progress}%` }"></div>
                </div>
                <span class="progress-percentage">{{ selectedJob.progress }}%</span>
              </div>
            </div>
            <div class="detail-item">
              <label class="detail-label">Created</label>
              <span class="detail-value">{{ formatDateTime(selectedJob.created_at) }}</span>
            </div>
            <div class="detail-item">
              <label class="detail-label">Last Updated</label>
              <span class="detail-value">{{ formatDateTime(selectedJob.updated_at) }}</span>
            </div>
          </div>
          <div class="payload-section">
            <label class="detail-label">Complete Payload</label>
            <pre class="payload-full">{{ formatPayload(selectedJob.payload) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- History Modal -->
    <div v-if="showHistoryModal" class="modal-overlay" @click="closeHistoryModal">
      <div class="modal-container large" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Job History</h3>
          <button @click="closeHistoryModal" class="close-button">&times;</button>
        </div>
        <div class="modal-content">
          <div class="history-filters">
            <select v-model="historyFilter" @change="loadHistoryJobs" class="filter-select">
              <option value="">All Jobs</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <button @click="loadHistoryJobs" class="refresh-button" :disabled="loadingHistory">
              <span class="refresh-icon" :class="{ spinning: loadingHistory }">↻</span>
            </button>
          </div>

          <div v-if="loadingHistory" class="loading-state">
            <div class="loading-spinner"></div>
            <p class="loading-text">Loading history...</p>
          </div>

          <div v-else-if="!historyJobs.length" class="empty-state">
            <div class="empty-icon">📋</div>
            <h4 class="empty-title">No jobs found</h4>
            <p class="empty-message">No jobs match the selected filter.</p>
          </div>

          <div v-else class="history-list">
            <div
              v-for="job in historyJobs"
              :key="job.id"
              class="history-item"
              @click="viewJobDetails(job)"
            >
              <div class="history-header">
                <span class="job-id">{{ job.id.slice(0, 8) }}</span>
                <span class="job-status" :class="job.status">{{ formatStatus(job.status) }}</span>
                <span class="job-date">{{ formatDateTime(job.created_at) }}</span>
              </div>
              <div class="history-content">
                <span class="task-name">{{ getTaskName(job.payload) }}</span>
                <span v-if="job.progress" class="progress-info">{{ job.progress }}% complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Clear Jobs Modal -->
    <div v-if="showClearModal" class="modal-overlay" @click="closeClearModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Clear Jobs</h3>
          <button @click="closeClearModal" class="close-button">&times;</button>
        </div>
        <div class="modal-content">
          <div class="clear-options">
            <div class="clear-warning">
              <div class="warning-icon">⚠️</div>
              <div class="warning-content">
                <h4 class="warning-title">Clear jobs from this pool</h4>
                <p class="warning-message">
                  This action will permanently delete jobs from the pool. This cannot be undone.
                </p>
              </div>
            </div>

            <div class="clear-filters">
              <label class="filter-label">What to clear:</label>
              <div class="filter-options">
                <label class="filter-option">
                  <input 
                    type="radio" 
                    v-model="clearFilter" 
                    value="" 
                    name="clearFilter"
                  />
                  <span class="option-text">All Jobs ({{ userJobs.length }})</span>
                </label>
                <label class="filter-option" v-if="jobStats.pending > 0">
                  <input 
                    type="radio" 
                    v-model="clearFilter" 
                    value="pending" 
                    name="clearFilter"
                  />
                  <span class="option-text">Pending Jobs ({{ jobStats.pending }})</span>
                </label>
                <label class="filter-option" v-if="jobStats.completed > 0">
                  <input 
                    type="radio" 
                    v-model="clearFilter" 
                    value="completed" 
                    name="clearFilter"
                  />
                  <span class="option-text">Completed Jobs ({{ jobStats.completed }})</span>
                </label>
                <label class="filter-option" v-if="jobStats.failed > 0">
                  <input 
                    type="radio" 
                    v-model="clearFilter" 
                    value="failed" 
                    name="clearFilter"
                  />
                  <span class="option-text">Failed Jobs ({{ jobStats.failed }})</span>
                </label>
              </div>
            </div>

            <div v-if="clearError" class="error-message">
              <span class="error-icon">⚠️</span>
              {{ clearError }}
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeClearModal" class="cancel-button">
              Cancel
            </button>
            <button 
              @click="clearJobs" 
              class="clear-confirm-button" 
              :disabled="clearing"
            >
              <span v-if="clearing" class="loading-spinner small"></span>
              <span>{{ clearing ? 'Clearing...' : 'Clear Jobs' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ApiService } from '../services/api';
import type { Pool, Job, JobStatus } from '../types';
import * as XLSX from 'xlsx';

const props = defineProps<{
  pool: Pool;
  userId: string;
}>();

const emit = defineEmits<{
  'job-submitted': [job: Job];
}>();

// Excel file upload
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const uploadError = ref<string | null>(null);
const processing = ref(false);

// Jobs preview
interface JobPreview {
  payload: {
    upd_id: string;
    trace_file_path: string;
    modification_file: string;
  };
  status: 'pending' | 'submitting' | 'submitted' | 'error';
  error?: string;
}

const jobsPreview = ref<JobPreview[]>([]);
const submittingBatch = ref(false);
const submissionProgress = ref({ current: 0, total: 0 });
const submissionSummary = ref<{ successful: number; failed: number; total: number } | null>(null);

// Jobs data
const jobs = ref<Job[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const autoRefresh = ref(true);
const isLive = ref(false);
const jobHistory = ref<Map<string, Job[]>>(new Map());

// Modals
const selectedJob = ref<Job | null>(null);
const showHistoryModal = ref(false);
const historyJobs = ref<Job[]>([]);
const historyFilter = ref<JobStatus | ''>('');
const loadingHistory = ref(false);

// Clear jobs modal
const showClearModal = ref(false);
const clearFilter = ref<JobStatus | ''>('');
const clearing = ref(false);
const clearError = ref<string | null>(null);

let refreshTimer: NodeJS.Timeout | null = null;

const isOwner = computed(() => {
  return props.pool.user_id === props.userId;
});

const userJobs = computed(() => {
  // For now, show all jobs since we don't have user_id in job data
  // In a real implementation, you'd filter by user_id
  return jobs.value.slice(0, 20); // Limit to recent 20 jobs
});

const jobStats = computed(() => {
  const stats = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    failed: 0
  };
  
  userJobs.value.forEach(job => {
    stats[job.status as keyof typeof stats]++;
  });
  
  return stats;
});

// File upload methods
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    validateAndSetFile(file);
  }
};

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  
  const file = event.dataTransfer?.files[0];
  if (file) {
    validateAndSetFile(file);
  }
};

const validateAndSetFile = (file: File) => {
  uploadError.value = null;
  
  // Check file type
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ];
  
  if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
    uploadError.value = 'Please select a valid Excel file (.xlsx or .xls)';
    return;
  }
  
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = 'File size must be less than 10MB';
    return;
  }
  
  selectedFile.value = file;
  clearPreview(); // Clear any existing preview
};

const clearFile = () => {
  selectedFile.value = null;
  uploadError.value = null;
  clearPreview();
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const processExcelFile = async () => {
  if (!selectedFile.value) return;
  
  try {
    processing.value = true;
    uploadError.value = null;
    
    const arrayBuffer = await selectedFile.value.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('Excel file must contain at least a header row and one data row');
    }
    
    // Get headers
    const headers = jsonData[0] as string[];
    const requiredColumns = ['upd_id', 'trace_file_path', 'modification_file'];
    
    // Check if all required columns exist
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(header => header.toLowerCase().trim() === col.toLowerCase())
    );
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    
    // Find column indices
    const columnIndices = requiredColumns.reduce((acc, col) => {
      const index = headers.findIndex(header => 
        header.toLowerCase().trim() === col.toLowerCase()
      );
      acc[col] = index;
      return acc;
    }, {} as Record<string, number>);
    
    // Process data rows
    const dataRows = jsonData.slice(1) as any[][];
    const jobs: JobPreview[] = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Skip empty rows
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        continue;
      }
      
      const updId = row[columnIndices.upd_id]?.toString().trim();
      const traceFilePath = row[columnIndices.trace_file_path]?.toString().trim();
      const modificationFile = row[columnIndices.modification_file]?.toString().trim();
      
      // Validate required fields
      if (!updId || !traceFilePath || !modificationFile) {
        console.warn(`Skipping row ${i + 2}: Missing required data`);
        continue;
      }
      
      jobs.push({
        payload: {
          upd_id: updId,
          trace_file_path: traceFilePath,
          modification_file: modificationFile
        },
        status: 'pending'
      });
    }
    
    if (jobs.length === 0) {
      throw new Error('No valid job data found in the Excel file');
    }
    
    jobsPreview.value = jobs;
    
  } catch (error) {
    console.error('Error processing Excel file:', error);
    uploadError.value = error instanceof Error ? error.message : 'Failed to process Excel file';
  } finally {
    processing.value = false;
  }
};

const clearPreview = () => {
  jobsPreview.value = [];
  submissionSummary.value = null;
  submissionProgress.value = { current: 0, total: 0 };
};

const submitAllJobs = async () => {
  if (!jobsPreview.value.length) return;
  
  try {
    submittingBatch.value = true;
    submissionProgress.value = { current: 0, total: jobsPreview.value.length };
    
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < jobsPreview.value.length; i++) {
      const jobPreview = jobsPreview.value[i];
      
      if (jobPreview.status === 'submitted') {
        continue; // Skip already submitted jobs
      }
      
      try {
        // Update status to submitting
        jobPreview.status = 'submitting';
        submissionProgress.value.current = i + 1;
        
        // Submit the job
        const job = await ApiService.submitJob(props.pool.id, jobPreview.payload, props.userId);
        
        // Update status to submitted
        jobPreview.status = 'submitted';
        successful++;
        
        emit('job-submitted', job);
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error submitting job ${i + 1}:`, error);
        jobPreview.status = 'error';
        jobPreview.error = error instanceof Error ? error.message : 'Submission failed';
        failed++;
      }
    }
    
    // Set summary
    submissionSummary.value = {
      successful,
      failed,
      total: jobsPreview.value.length
    };
    
    // Refresh jobs list
    await loadJobs();
    
  } catch (error) {
    console.error('Error in batch submission:', error);
  } finally {
    submittingBatch.value = false;
  }
};

const getFileName = (filePath: string) => {
  return filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
};

const formatJobStatus = (status: string) => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'submitting': return 'Submitting...';
    case 'submitted': return 'Submitted';
    case 'error': return 'Error';
    default: return status;
  }
};

// Job management methods
const loadJobs = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const newJobs = await ApiService.getPoolJobs(props.pool.id);
    
    // Store job history for progress tracking
    newJobs.forEach(job => {
      if (!jobHistory.value.has(job.id)) {
        jobHistory.value.set(job.id, []);
      }
      const history = jobHistory.value.get(job.id)!;
      
      const lastEntry = history[history.length - 1];
      if (!lastEntry || lastEntry.progress !== job.progress || lastEntry.status !== job.status) {
        history.push({ ...job, timestamp: new Date().toISOString() } as any);
        
        if (history.length > 50) {
          history.splice(0, history.length - 50);
        }
      }
    });
    
    jobs.value = newJobs;
    isLive.value = true;
  } catch (e) {
    error.value = 'Failed to load jobs. Please try again.';
    isLive.value = false;
    console.error('Error loading jobs:', e);
  } finally {
    loading.value = false;
  }
};

const loadHistoryJobs = async () => {
  try {
    loadingHistory.value = true;
    const status = historyFilter.value as JobStatus | undefined;
    historyJobs.value = await ApiService.getPoolJobs(props.pool.id, status);
  } catch (e) {
    console.error('Error loading history:', e);
  } finally {
    loadingHistory.value = false;
  }
};

const clearJobs = async () => {
  try {
    clearing.value = true;
    clearError.value = null;
    
    const status = clearFilter.value as JobStatus | undefined;
    await ApiService.clearPoolJobs(props.pool.id, props.userId, status);
    
    // Refresh jobs after clearing
    await loadJobs();
    
    // Close modal
    closeClearModal();
  } catch (error) {
    console.error('Error clearing jobs:', error);
    clearError.value = 'Failed to clear jobs. Please try again.';
  } finally {
    clearing.value = false;
  }
};

const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  
  refreshTimer = setInterval(() => {
    if (autoRefresh.value) {
      loadJobs();
    }
  }, 3000);
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
    isLive.value = false;
  }
};

const isRecentlyUpdated = (job: Job) => {
  const updateTime = new Date(job.updated_at).getTime();
  const now = new Date().getTime();
  return (now - updateTime) < 10000; // Updated within last 10 seconds
};

const getTaskName = (payload: Record<string, any>) => {
  if (payload.upd_id) {
    return `UPD ${payload.upd_id}`;
  }
  return payload.task || payload.name || payload.type || 'Unknown Task';
};

const getTaskDetails = (payload: Record<string, any>) => {
  const details = [];
  if (payload.trace_file_path) {
    const fileName = getFileName(payload.trace_file_path);
    details.push(`Trace: ${fileName}`);
  }
  if (payload.modification_file) {
    const fileName = getFileName(payload.modification_file);
    details.push(`Mod: ${fileName}`);
  }
  if (payload.timeout) details.push(`${payload.timeout}s`);
  return details.join(' • ') || 'No details';
};

const viewJobDetails = (job: Job) => {
  selectedJob.value = job;
};

const closeModal = () => {
  selectedJob.value = null;
};

const closeHistoryModal = () => {
  showHistoryModal.value = false;
  historyJobs.value = [];
  historyFilter.value = '';
};

const closeClearModal = () => {
  showClearModal.value = false;
  clearFilter.value = '';
  clearError.value = null;
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPayload = (payload: Record<string, any>) => {
  return JSON.stringify(payload, null, 2);
};

// Watch for pool changes
watch(() => props.pool.id, () => {
  jobHistory.value.clear();
  loadJobs();
});

// Watch for history modal
watch(showHistoryModal, (show) => {
  if (show) {
    loadHistoryJobs();
  }
});

onMounted(() => {
  loadJobs();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.job-manager {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
}

.manager-header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.title-section {
  flex: 1;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 12px 0;
}

.status-indicators {
  display: flex;
  gap: 12px;
}

.indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.indicator.active {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.indicator.inactive {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

.controls-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-button, .toggle-button, .clear-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 13px;
  font-weight: 600;
}

.clear-button {
  border-color: #fecaca;
  background: rgba(254, 202, 202, 0.1);
  color: #dc2626;
}

.clear-button:hover {
  border-color: #fca5a5;
  background: rgba(254, 202, 202, 0.2);
}

.toggle-button.active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
  color: #059669;
}

.history-button:hover, .toggle-button:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.button-icon {
  font-size: 14px;
}

/* Excel File Upload */
.submission-section {
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #f0f0f0;
}

.submission-header {
  margin-bottom: 24px;
}

.submission-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 4px 0;
}

.submission-subtitle {
  color: #5f6368;
  margin: 0;
  font-size: 14px;
}

.file-upload-area {
  border: 2px dashed #e8eaed;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fafbfc;
}

.file-upload-area:hover {
  border-color: #dadce0;
  background: #f8f9fa;
}

.file-upload-area.drag-over {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.file-upload-area.has-file {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.file-upload-area.has-error {
  border-color: #ea4335;
  background: rgba(234, 67, 53, 0.05);
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  font-size: 48px;
  opacity: 0.6;
}

.upload-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
}

.upload-subtitle {
  font-size: 14px;
  color: #5f6368;
  margin: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
}

.file-icon {
  font-size: 32px;
}

.file-details {
  text-align: left;
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 4px 0;
}

.file-size {
  font-size: 14px;
  color: #5f6368;
  margin: 0;
}

.remove-file-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(234, 67, 53, 0.1);
  border: 1px solid rgba(234, 67, 53, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #ea4335;
}

.remove-file-button:hover {
  background: rgba(234, 67, 53, 0.15);
  border-color: rgba(234, 67, 53, 0.3);
}

.remove-icon {
  font-size: 18px;
  font-weight: bold;
}

.file-actions {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.process-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.process-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.process-button:disabled {
  background: #9aa0a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Jobs Preview */
.jobs-preview {
  margin-top: 24px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
}

.preview-actions {
  display: flex;
  gap: 12px;
}

.clear-preview-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8f9fa;
  color: #5f6368;
  border: 2px solid #e8eaed;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.clear-preview-button:hover {
  background: #f1f3f4;
  border-color: #dadce0;
}

.submit-all-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.submit-all-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-all-button:disabled {
  background: #9aa0a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.preview-table-container {
  border: 1px solid #e8eaed;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.preview-table th {
  background: #f8f9fa;
  color: #1a1d29;
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e8eaed;
}

.preview-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-row {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.preview-row:hover {
  background: #f8f9fa;
}

.preview-row.submitted {
  background: rgba(16, 185, 129, 0.05);
}

.preview-row.error {
  background: rgba(234, 67, 53, 0.05);
}

.preview-row.submitting {
  background: rgba(102, 126, 234, 0.05);
}

.row-number {
  width: 60px;
  text-align: center;
  font-weight: 600;
  color: #5f6368;
}

.upd-id {
  width: 120px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-weight: 600;
}

.file-path {
  display: block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1a1d29;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.submitting {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.submitted {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.error {
  background: #fee2e2;
  color: #991b1b;
}

.status-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.submission-summary {
  background: #f8f9fa;
  border: 1px solid #e8eaed;
  border-radius: 12px;
  padding: 20px;
}

.summary-stats {
  display: flex;
  gap: 24px;
  justify-content: center;
}

.summary-stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-stat.success .stat-value {
  color: #059669;
}

.summary-stat.failed .stat-value {
  color: #dc2626;
}

.summary-stat.total .stat-value {
  color: #1a1d29;
}

/* Jobs Table */
.jobs-section {
  /* Section styling */
}

.jobs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.jobs-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
}

.jobs-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.stat.pending {
  background: #fef3c7;
  color: #92400e;
}

.stat.in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.stat.completed {
  background: #d1fae5;
  color: #065f46;
}

.stat.failed {
  background: #fee2e2;
  color: #991b1b;
}

.jobs-table-container {
  border: 1px solid #e8eaed;
  border-radius: 12px;
  overflow: hidden;
}

.jobs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.jobs-table th {
  background: #f8f9fa;
  color: #1a1d29;
  font-weight: 600;
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e8eaed;
}

.jobs-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.job-row {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.job-row:hover {
  background: #f8f9fa;
}

.job-row.recently-updated {
  background: rgba(16, 185, 129, 0.05);
}

.job-row.completed {
  background: rgba(16, 185, 129, 0.02);
}

.job-row.failed {
  background: rgba(234, 67, 53, 0.02);
}

.job-id .id-text {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  color: #5f6368;
  font-weight: 600;
  background: #f3f4f6;
  padding: 3px 6px;
  border-radius: 4px;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-title {
  font-weight: 600;
  color: #1a1d29;
  font-size: 14px;
}

.task-subtitle {
  font-size: 12px;
  color: #6b7280;
}

.status .status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.in_progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.failed {
  background: #fee2e2;
  color: #991b1b;
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar-small {
  width: 60px;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill-small {
  height: 100%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 3px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-text {
  font-size: 12px;
  color: #5f6368;
  font-weight: 600;
  min-width: 35px;
}

.no-progress {
  color: #9ca3af;
  font-style: italic;
}

.time-text {
  font-size: 12px;
  color: #6b7280;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.action-icon {
  font-size: 14px;
}

/* Loading, Error, Empty States */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
}

.loading-text, .error-message, .empty-message {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}

.error-icon, .empty-icon {
  font-size: 40px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-title {
  color: #1a1d29;
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.retry-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.retry-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ea4335;
  font-size: 14px;
  margin-top: 8px;
  padding: 12px 16px;
  background: #fef7f7;
  border-radius: 8px;
  border: 1px solid #fce8e6;
}

.error-message .error-icon {
  font-size: 16px;
  margin: 0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-container.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-button:hover {
  background: #f3f4f6;
  color: #6b7280;
}

.modal-content {
  padding: 0 24px 24px 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  color: #1a1d29;
  font-size: 14px;
  font-weight: 500;
}

.monospace {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.progress-detail {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar.large {
  width: 120px;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-percentage {
  font-size: 12px;
  color: #5f6368;
  font-weight: 600;
}

.payload-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.payload-section .detail-label {
  margin-bottom: 12px;
}

.payload-full {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #1a1d29;
  margin: 0;
  overflow-x: auto;
}

/* History and Clear Modal Styles */
.history-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.filter-select {
  border: 2px solid #e8eaed;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  font-weight: 500;
  color: #1a1d29;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.refresh-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: white;
  border: 2px solid #e8eaed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #5f6368;
}

.refresh-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #dadce0;
}

.refresh-icon {
  font-size: 16px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.history-item:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.job-date {
  font-size: 12px;
  color: #6b7280;
}

.progress-info {
  font-size: 12px;
  color: #3b82f6;
  font-weight: 600;
}

.clear-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.clear-warning {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fef7f7;
  border: 1px solid #fce8e6;
  border-radius: 12px;
}

.warning-icon {
  font-size: 24px;
  color: #ea4335;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 8px 0;
}

.warning-message {
  color: #5f6368;
  margin: 0;
  line-height: 1.5;
}

.clear-filters {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1d29;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.filter-option:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.filter-option input[type="radio"] {
  margin: 0;
}

.option-text {
  font-size: 14px;
  color: #1a1d29;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-button {
  background: #f8f9fa;
  color: #5f6368;
  border: 2px solid #e8eaed;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.cancel-button:hover {
  background: #f1f3f4;
  border-color: #dadce0;
}

.clear-confirm-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ea4335, #d33b2c);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 120px;
  justify-content: center;
}

.clear-confirm-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(234, 67, 53, 0.4);
}

.clear-confirm-button:disabled {
  background: #9aa0a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Responsive Design */
@media (max-width: 768px) {
  .job-manager {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .controls-section {
    justify-content: space-between;
    flex-wrap: wrap;
  }
  
  .preview-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .preview-actions {
    justify-content: space-between;
  }
  
  .preview-table-container {
    overflow-x: auto;
  }
  
  .jobs-table-container {
    overflow-x: auto;
  }
  
  .jobs-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .summary-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .modal-container {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .history-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .clear-warning {
    flex-direction: column;
    gap: 12px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>