<template>
  <div class="worker-monitor">
    <div class="monitor-header">
      <div class="header-content">
        <div class="title-section">
          <h3 class="section-title">Worker Status</h3>
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
          <div class="refresh-info">
            <span class="refresh-text">Updates every {{ refreshInterval / 1000 }}s</span>
          </div>
          <button @click="toggleAutoRefresh" class="toggle-button" :class="{ active: autoRefresh }">
            <span class="toggle-icon">{{ autoRefresh ? '⏸️' : '▶️' }}</span>
            <span>{{ autoRefresh ? 'Pause' : 'Resume' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading && !workers.length" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading workers...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="loadWorkers" class="retry-button">Try Again</button>
    </div>

    <div v-else class="workers-content">
      <!-- Worker Summary Stats -->
      <div class="worker-stats">
        <div class="stat-card total">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-value">{{ workers.length }}</div>
            <div class="stat-label">Total Workers</div>
          </div>
        </div>
        <div class="stat-card idle">
          <div class="stat-icon">💤</div>
          <div class="stat-content">
            <div class="stat-value">{{ idleWorkers.length }}</div>
            <div class="stat-label">Idle</div>
          </div>
        </div>
        <div class="stat-card busy">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <div class="stat-value">{{ busyWorkers.length }}</div>
            <div class="stat-label">Busy</div>
          </div>
        </div>
        <div class="stat-card capacity">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ capacityPercentage }}%</div>
            <div class="stat-label">Capacity Used</div>
          </div>
        </div>
      </div>

      <!-- Workers List -->
      <div v-if="!workers.length" class="empty-state">
        <div class="empty-icon">🤖</div>
        <h4 class="empty-title">No active workers</h4>
        <p class="empty-message">No workers are currently connected to this pool.</p>
      </div>

      <div v-else class="workers-container">
        <div class="workers-header">
          <h4 class="workers-title">Active Workers ({{ workers.length }})</h4>
          <div class="filter-controls">
            <select v-model="statusFilter" @change="filterWorkers" class="status-filter">
              <option value="">All Workers</option>
              <option value="idle">Idle Only</option>
              <option value="busy">Busy Only</option>
            </select>
          </div>
        </div>

        <div class="workers-grid">
          <div
            v-for="worker in filteredWorkers"
            :key="worker.id"
            class="worker-card"
            :class="[worker.status, { 'recently-updated': isRecentlyUpdated(worker) }]"
          >
            <div class="card-header">
              <div class="worker-identity">
                <div class="worker-name">{{ worker.worker_name }}</div>
                <div class="worker-id">{{ worker.id.slice(0, 8) }}</div>
              </div>
              <div class="worker-status" :class="worker.status">
                <span class="status-dot"></span>
                <span class="status-text">{{ formatStatus(worker.status) }}</span>
              </div>
            </div>

            <div class="card-content">
              <div class="worker-details">
                <div class="detail-row">
                  <span class="detail-label">Current Job</span>
                  <span class="detail-value" v-if="worker.current_job_id">
                    <span class="job-id">{{ worker.current_job_id.slice(0, 8) }}...</span>
                  </span>
                  <span class="detail-value no-job" v-else>No active job</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Last Heartbeat</span>
                  <span class="detail-value">{{ formatRelativeTime(worker.last_heartbeat) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Connected Since</span>
                  <span class="detail-value">{{ formatRelativeTime(worker.created_at) }}</span>
                </div>
              </div>

              <div class="worker-health">
                <div class="health-indicator" :class="getHealthStatus(worker)">
                  <span class="health-dot"></span>
                  <span class="health-text">{{ getHealthText(worker) }}</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="worker-uptime">
                <span class="uptime-text">Uptime: {{ getUptime(worker.created_at) }}</span>
              </div>
              <div class="card-actions">
                <button @click="viewWorkerDetails(worker)" class="details-button">
                  <span class="button-icon">👁️</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Worker Details Modal -->
    <div v-if="selectedWorker" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="modal-title-section">
            <h3 class="modal-title">Worker Details</h3>
            <span class="worker-status" :class="selectedWorker.status">{{ formatStatus(selectedWorker.status) }}</span>
          </div>
          <button @click="closeModal" class="close-button">&times;</button>
        </div>
        <div class="modal-content">
          <div class="detail-grid">
            <div class="detail-item">
              <label class="detail-label">Worker ID</label>
              <span class="detail-value monospace">{{ selectedWorker.id }}</span>
            </div>
            <div class="detail-item">
              <label class="detail-label">Worker Name</label>
              <span class="detail-value">{{ selectedWorker.worker_name }}</span>
            </div>
            <div class="detail-item">
              <label class="detail-label">Status</label>
              <span class="detail-value">
                <span class="worker-status" :class="selectedWorker.status">
                  <span class="status-dot"></span>
                  {{ formatStatus(selectedWorker.status) }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <label class="detail-label">Current Job</label>
              <span class="detail-value" v-if="selectedWorker.current_job_id">
                <span class="job-id monospace">{{ selectedWorker.current_job_id }}</span>
              </span>
              <span class="detail-value no-job" v-else>No active job</span>
            </div>
            <div class="detail-item">
              <label class="detail-label">Last Heartbeat</label>
              <span class="detail-value">{{ formatDateTime(selectedWorker.last_heartbeat) }}</span>
            </div>
            <div class="detail-item">
              <label class="detail-label">Connected At</label>
              <span class="detail-value">{{ formatDateTime(selectedWorker.created_at) }}</span>
            </div>
            <div class="detail-item">
              <label class="detail-label">Total Uptime</label>
              <span class="detail-value">{{ getUptime(selectedWorker.created_at) }}</span>
            </div>
            <div class="detail-item">
              <label class="detail-label">Health Status</label>
              <span class="detail-value">
                <span class="health-indicator" :class="getHealthStatus(selectedWorker)">
                  <span class="health-dot"></span>
                  {{ getHealthText(selectedWorker) }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ApiService } from '../services/api';
import type { Pool, Worker, WorkerStatus } from '../types';

const props = defineProps<{
  pool: Pool;
}>();

const workers = ref<Worker[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedWorker = ref<Worker | null>(null);
const autoRefresh = ref(true);
const refreshInterval = ref(5000); // 5 seconds
const isLive = ref(false);
const statusFilter = ref<WorkerStatus | ''>('');

let refreshTimer: NodeJS.Timeout | null = null;

const idleWorkers = computed(() => {
  return workers.value.filter(worker => worker.status === 'idle');
});

const busyWorkers = computed(() => {
  return workers.value.filter(worker => worker.status === 'busy');
});

const capacityPercentage = computed(() => {
  if (!workers.value.length) return 0;
  return Math.round((busyWorkers.value.length / workers.value.length) * 100);
});

const filteredWorkers = computed(() => {
  if (!statusFilter.value) return workers.value;
  return workers.value.filter(worker => worker.status === statusFilter.value);
});

const loadWorkers = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const newWorkers = await ApiService.getPoolWorkers(props.pool.id);
    workers.value = newWorkers;
    isLive.value = true;
  } catch (e) {
    error.value = 'Failed to load workers. Please try again.';
    isLive.value = false;
    console.error('Error loading workers:', e);
  } finally {
    loading.value = false;
  }
};

const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  
  refreshTimer = setInterval(() => {
    if (autoRefresh.value) {
      loadWorkers();
    }
  }, refreshInterval.value);
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

const filterWorkers = () => {
  // Filtering is handled by computed property
};

const isRecentlyUpdated = (worker: Worker) => {
  const updateTime = new Date(worker.last_heartbeat).getTime();
  const now = new Date().getTime();
  return (now - updateTime) < 10000; // Updated within last 10 seconds
};

const getHealthStatus = (worker: Worker) => {
  const lastHeartbeat = new Date(worker.last_heartbeat).getTime();
  const now = new Date().getTime();
  const secondsSinceHeartbeat = (now - lastHeartbeat) / 1000;
  
  if (secondsSinceHeartbeat < 10) return 'healthy';
  if (secondsSinceHeartbeat < 20) return 'warning';
  return 'critical';
};

const getHealthText = (worker: Worker) => {
  const status = getHealthStatus(worker);
  switch (status) {
    case 'healthy': return 'Healthy';
    case 'warning': return 'Delayed';
    case 'critical': return 'Stale';
    default: return 'Unknown';
  }
};

const getUptime = (startTime: string) => {
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  const diffInMinutes = Math.floor((now - start) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m`;
  return `${Math.floor(diffInMinutes / 1440)}d ${Math.floor((diffInMinutes % 1440) / 60)}h`;
};

const viewWorkerDetails = (worker: Worker) => {
  selectedWorker.value = worker;
};

const closeModal = () => {
  selectedWorker.value = null;
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
    minute: '2-digit',
    second: '2-digit'
  });
};

// Watch for pool changes
watch(() => props.pool.id, () => {
  loadWorkers();
});

onMounted(() => {
  loadWorkers();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.worker-monitor {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
}

.monitor-header {
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
  gap: 16px;
}

.refresh-info {
  font-size: 13px;
  color: #6b7280;
}

.toggle-button {
  display: flex;
  align-items: center;
  gap: 8px;
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

.toggle-button.active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
  color: #059669;
}

.toggle-button:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

/* Loading, Error, Empty States */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text, .error-message, .empty-message {
  color: #6b7280;
  margin: 0;
  font-size: 16px;
}

.error-icon, .empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.empty-title {
  color: #1a1d29;
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.retry-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.retry-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Worker Stats */
.worker-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-card.idle {
  border-color: #d1fae5;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}

.stat-card.busy {
  border-color: #fde68a;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.stat-card.capacity {
  border-color: #dbeafe;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
}

.stat-icon {
  font-size: 24px;
  opacity: 0.8;
}

.stat-content {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1a1d29;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Workers Container */
.workers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.workers-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
}

.filter-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.status-filter {
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

.status-filter:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Workers Grid */
.workers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.worker-card {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  background: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.worker-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.worker-card.idle::before {
  background: linear-gradient(135deg, #10b981, #059669);
}

.worker-card.busy::before {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.worker-card:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.worker-card.recently-updated {
  border-color: #10b981;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
  animation: glow 2s ease-in-out;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.worker-identity {
  flex: 1;
}

.worker-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 4px;
}

.worker-id {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.worker-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.worker-status.idle {
  background: #d1fae5;
  color: #065f46;
}

.worker-status.busy {
  background: #fef3c7;
  color: #92400e;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.card-content {
  margin-bottom: 16px;
}

.worker-details {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 12px;
  color: #1a1d29;
  font-weight: 600;
}

.detail-value.no-job {
  color: #9ca3af;
  font-style: italic;
}

.job-id {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  background: #f3f4f6;
  padding: 2px 4px;
  border-radius: 3px;
}

.worker-health {
  display: flex;
  justify-content: center;
}

.health-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.health-indicator.healthy {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.health-indicator.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.health-indicator.critical {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.health-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.uptime-text {
  font-size: 11px;
  color: #9ca3af;
}

.details-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.details-button:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.button-icon {
  font-size: 12px;
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

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
  50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.4); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .worker-monitor {
    padding: 24px 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
  
  .controls-section {
    justify-content: space-between;
  }
  
  .worker-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .workers-grid {
    grid-template-columns: 1fr;
  }
  
  .workers-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .modal-container {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>