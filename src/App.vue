<template>
  <div id="app">
    <!-- Top Navigation Bar -->
    <nav class="top-navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <div class="brand-icon">⚡</div>
          <h1 class="brand-title">DoU Processing</h1>
        </div>
        <div class="navbar-user">
          <div class="user-avatar">{{ userId.charAt(0).toUpperCase() }}</div>
          <div class="user-details">
            <span class="user-name">{{ userId }}</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="main-container">
      <div class="content-wrapper">
        <!-- Pool Selection -->
        <PoolSelector
          :user-id="userId"
          :selected-pool="selectedPool"
          @pool-selected="onPoolSelected"
          @pool-created="onPoolCreated"
          @pool-deleted="onPoolDeleted"
        />

        <!-- Job Management Section -->
        <div v-if="selectedPool" class="pool-workspace">
          <!-- Compact Workspace Header -->
          <div class="workspace-header">
            <div class="pool-info">
              <h2 class="pool-title">{{ selectedPool.name }}</h2>
              <div class="pool-meta">
                <span class="pool-id">{{ selectedPool.id.slice(0, 8) }}</span>
                <span class="ownership-badge" :class="{ owner: isOwner, viewer: !isOwner }">
                  {{ isOwner ? 'Owner' : 'Viewer' }}
                </span>
              </div>
            </div>
            <button @click="refreshData" class="refresh-button" :disabled="refreshing">
              <span class="refresh-icon" :class="{ spinning: refreshing }">↻</span>
            </button>
          </div>

          <div class="workspace-content">
            <!-- Worker Monitor -->
            <WorkerMonitor
              :pool="selectedPool"
              :key="workerMonitorKey"
            />

            <!-- Unified Job Management -->
            <JobManager
              :pool="selectedPool"
              :user-id="userId"
              @job-submitted="onJobSubmitted"
              :key="jobManagerKey"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import PoolSelector from './components/PoolSelector.vue';
import JobManager from './components/JobManager.vue';
import WorkerMonitor from './components/WorkerMonitor.vue';
import type { Pool, Job } from './types';

// User ID - in a real app this would come from authentication
const userId = ref('test_user_1');
const selectedPool = ref<Pool | null>(null);
const refreshing = ref(false);
const jobManagerKey = ref(0);
const workerMonitorKey = ref(0);

const isOwner = computed(() => {
  return selectedPool.value?.user_id === userId.value;
});

const onPoolSelected = (pool: Pool | null) => {
  selectedPool.value = pool;
  if (pool) {
    jobManagerKey.value++; // Force refresh of job manager
    workerMonitorKey.value++; // Force refresh of worker monitor
  }
};

const onPoolCreated = (pool: Pool) => {
  // Pool creation is handled in PoolSelector, just refresh if needed
  console.log('Pool created:', pool.name);
};

const onPoolDeleted = (poolId: string) => {
  // Pool deletion is handled in PoolSelector, just refresh if needed
  console.log('Pool deleted:', poolId);
};

const onJobSubmitted = (job: Job) => {
  // Job submission is handled in JobManager
  console.log('Job submitted:', job.id);
};

const refreshData = async () => {
  refreshing.value = true;
  try {
    // Force refresh of both job manager and worker monitor
    jobManagerKey.value++;
    workerMonitorKey.value++;
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
  } finally {
    refreshing.value = false;
  }
};
</script>

<style>
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f8fafc;
  color: #1a1d29;
  line-height: 1.6;
}

#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Top Navigation Bar */
.top-navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
}

.navbar-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  backdrop-filter: blur(10px);
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.5px;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.user-role {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

/* Main Content */
.main-container {
  flex: 1;
  background: #f8fafc;
}

.content-wrapper {
  max-width: 1600px;
  margin: 0 auto;
  padding: 32px;
}

/* Pool Workspace */
.pool-workspace {
  margin-top: 8px;
}

/* Compact Workspace Header */
.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
}

.pool-info {
  flex: 1;
}

.pool-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1d29;
  margin: 0 0 6px 0;
  letter-spacing: -0.3px;
}

.pool-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.pool-id {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 12px;
  color: #5f6368;
  background: #f8f9fa;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #e8eaed;
}

.ownership-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.ownership-badge.owner {
  background: linear-gradient(135deg, #00d4aa, #00b894);
  color: white;
}

.ownership-badge.viewer {
  background: #f8f9fa;
  color: #5f6368;
  border: 1px solid #e8eaed;
}

.refresh-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e8eaed;
  background: white;
  color: #5f6368;
}

.refresh-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #dadce0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.workspace-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 20px;
  }
  
  .navbar-container {
    padding: 12px 20px;
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .workspace-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 16px 20px;
  }
  
  .pool-meta {
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .navbar-container {
    padding: 12px 16px;
  }
  
  .content-wrapper {
    padding: 16px;
  }
  
  .brand-title {
    font-size: 20px;
  }
  
  .pool-title {
    font-size: 18px;
  }
  
  .workspace-header {
    padding: 12px 16px;
  }
}
</style>