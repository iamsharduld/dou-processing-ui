<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <h1 class="app-title">Worker Pool Manager</h1>
        <div class="user-info">
          <div class="user-avatar">{{ userId.charAt(0).toUpperCase() }}</div>
          <span class="user-name">User: {{ userId }}</span>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="container">
        <!-- Pool Selection -->
        <PoolSelector
          :user-id="userId"
          :selected-pool="selectedPool"
          @pool-selected="onPoolSelected"
        />

        <!-- Pool Management Section -->
        <div v-if="selectedPool" class="pool-section">
          <div class="pool-header">
            <div class="pool-info">
              <h2 class="pool-title">{{ selectedPool.name }}</h2>
              <div class="pool-meta">
                <span class="pool-id">ID: {{ selectedPool.id.slice(0, 8) }}...</span>
                <span class="pool-owner" v-if="isOwner">You own this pool</span>
                <span class="pool-viewer" v-else>View-only access</span>
              </div>
            </div>
            <div class="pool-actions">
              <button @click="refreshData" class="action-btn secondary" :disabled="refreshing">
                <span class="refresh-icon" :class="{ spinning: refreshing }">🔄</span>
                Refresh
              </button>
            </div>
          </div>

          <div class="pool-content">
            <!-- Job Submission (only for owned pools) -->
            <div v-if="isOwner" class="content-section">
              <JobSubmission
                :pool="selectedPool"
                :user-id="userId"
                @job-submitted="onJobSubmitted"
              />
            </div>

            <!-- Job List -->
            <div class="content-section">
              <JobList
                :pool="selectedPool"
                :key="jobListKey"
              />
            </div>
          </div>
        </div>

        <!-- Welcome State -->
        <div v-else class="welcome-state">
          <div class="welcome-content">
            <div class="welcome-icon">⚡</div>
            <h2>Welcome to Worker Pool Manager</h2>
            <p>Select a worker pool above to start managing jobs and monitoring workers.</p>
            <div class="welcome-features">
              <div class="feature">
                <div class="feature-icon">📝</div>
                <div class="feature-text">
                  <h4>Submit Jobs</h4>
                  <p>Add new jobs to your worker pools with custom payloads</p>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">📊</div>
                <div class="feature-text">
                  <h4>Monitor Progress</h4>
                  <p>Track job status and worker activity in real-time</p>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">👥</div>
                <div class="feature-text">
                  <h4>Manage Pools</h4>
                  <p>Create and manage worker pools for different tasks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import PoolSelector from './components/PoolSelector.vue';
import JobSubmission from './components/JobSubmission.vue';
import JobList from './components/JobList.vue';
import type { Pool, Job } from './types';

// User ID - in a real app this would come from authentication
const userId = ref('user-123');
const selectedPool = ref<Pool | null>(null);
const refreshing = ref(false);
const jobListKey = ref(0);

const isOwner = computed(() => {
  return selectedPool.value?.user_id === userId.value;
});

const onPoolSelected = (pool: Pool) => {
  selectedPool.value = pool;
  jobListKey.value++; // Force refresh of job list
};

const onJobSubmitted = (job: Job) => {
  // Refresh job list when a new job is submitted
  jobListKey.value++;
};

const refreshData = async () => {
  refreshing.value = true;
  try {
    // Force refresh of job list
    jobListKey.value++;
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

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f8fafc;
  color: #1f2937;
  line-height: 1.5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.app-header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.user-name {
  color: #6b7280;
  font-size: 14px;
}

.main-content {
  flex: 1;
  padding: 32px 0;
}

.pool-section {
  margin-top: 8px;
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pool-info {
  flex: 1;
}

.pool-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.pool-meta {
  display: flex;
  gap: 16px;
  align-items: center;
}

.pool-id {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  color: #6b7280;
}

.pool-owner {
  background: #10b981;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.pool-viewer {
  background: #6b7280;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.pool-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.action-btn.secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  transition: transform 0.5s;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

.pool-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-section {
  /* Sections will have their own styling */
}

.welcome-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  margin-top: 32px;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
  padding: 48px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.welcome-content h2 {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.welcome-content > p {
  font-size: 18px;
  color: #6b7280;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.welcome-features {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 32px;
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  text-align: left;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
}

.feature-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.feature-text h4 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.feature-text p {
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .container {
    padding: 0 12px;
  }
  
  .app-header .container {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .pool-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .pool-actions {
    justify-content: flex-end;
  }
  
  .welcome-features {
    grid-template-columns: 1fr;
  }
  
  .feature {
    flex-direction: column;
    text-align: center;
  }
}

@media (min-width: 768px) {
  .welcome-features {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>