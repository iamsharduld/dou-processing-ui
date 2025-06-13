<template>
  <div class="worker-monitor">
    <!-- Minimal Worker Status Bar -->
    <div class="worker-status-bar">
      <div class="status-section">
        <h4 class="status-title">Workers</h4>
        <div class="status-metrics">
          <div class="metric">
            <span class="metric-value">{{ workers.length }}</span>
            <span class="metric-label">Total</span>
          </div>
          <div class="metric idle">
            <span class="metric-value">{{ idleWorkers.length }}</span>
            <span class="metric-label">Idle</span>
          </div>
          <div class="metric busy">
            <span class="metric-value">{{ busyWorkers.length }}</span>
            <span class="metric-label">Busy</span>
          </div>
          <div class="metric capacity">
            <span class="metric-value">{{ capacityPercentage }}%</span>
            <span class="metric-label">Used</span>
          </div>
        </div>
      </div>
      
      <div class="status-controls">
        <div class="live-indicator" :class="{ active: isLive }">
          <span class="indicator-dot"></span>
          <span class="indicator-text">{{ isLive ? 'Live' : 'Offline' }}</span>
        </div>
        <button @click="loadWorkers" class="refresh-button" :disabled="loading">
          <span class="refresh-icon" :class="{ spinning: loading }">↻</span>
        </button>
      </div>
    </div>

    <!-- Error State (if needed) -->
    <div v-if="error && !workers.length" class="error-state">
      <span class="error-text">{{ error }}</span>
      <button @click="loadWorkers" class="retry-button">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ApiService } from '../services/api';
import type { Pool, Worker } from '../types';

const props = defineProps<{
  pool: Pool;
}>();

const workers = ref<Worker[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const isLive = ref(false);

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

const loadWorkers = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const newWorkers = await ApiService.getPoolWorkers(props.pool.id);
    workers.value = newWorkers;
    isLive.value = true;
  } catch (e) {
    error.value = 'Failed to load workers';
    isLive.value = false;
    console.error('Error loading workers:', e);
  } finally {
    loading.value = false;
  }
};

const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer);
  
  refreshTimer = setInterval(() => {
    loadWorkers();
  }, 5000); // 5 seconds
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
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
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
  margin-bottom: 24px;
}

.worker-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.status-section {
  flex: 1;
}

.status-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 12px 0;
}

.status-metrics {
  display: flex;
  gap: 20px;
  align-items: center;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #1a1d29;
  line-height: 1;
}

.metric-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric.idle .metric-value {
  color: #059669;
}

.metric.busy .metric-value {
  color: #d97706;
}

.metric.capacity .metric-value {
  color: #3b82f6;
}

.status-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.live-indicator.active {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.live-indicator:not(.active) {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.live-indicator.active .indicator-dot {
  animation: pulse 2s infinite;
}

.refresh-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
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

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 16px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 8px 12px;
  background: #fef7f7;
  border: 1px solid #fce8e6;
  border-radius: 8px;
}

.error-text {
  color: #ea4335;
  font-size: 13px;
  font-weight: 500;
}

.retry-button {
  background: #ea4335;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.retry-button:hover {
  background: #d33b2c;
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
  .worker-monitor {
    padding: 16px;
  }
  
  .worker-status-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .status-metrics {
    justify-content: space-around;
  }
  
  .status-controls {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .status-metrics {
    gap: 12px;
  }
  
  .metric-value {
    font-size: 18px;
  }
  
  .metric-label {
    font-size: 10px;
  }
}
</style>