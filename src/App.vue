<template>
  <div id="app">
    <!-- Top Navigation Bar -->
    <nav class="top-navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <div class="brand-icon">⚡</div>
          <h1 class="brand-title">WorkerPool</h1>
        </div>
        <div class="navbar-user">
          <div class="user-avatar">{{ userId.charAt(0).toUpperCase() }}</div>
          <div class="user-details">
            <span class="user-name">{{ userId }}</span>
            <span class="user-role">Administrator</span>
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
        />

        <!-- Pool Management Section -->
        <div v-if="selectedPool" class="pool-workspace">
          <div class="workspace-header">
            <div class="pool-info">
              <div class="pool-title-section">
                <h2 class="pool-title">{{ selectedPool.name }}</h2>
                <div class="pool-badges">
                  <span class="pool-id-badge">{{ selectedPool.id.slice(0, 8) }}</span>
                  <span class="ownership-badge" :class="{ owner: isOwner, viewer: !isOwner }">
                    {{ isOwner ? 'Owner' : 'Viewer' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="workspace-actions">
              <button @click="refreshData" class="action-button" :disabled="refreshing">
                <span class="action-icon" :class="{ spinning: refreshing }">↻</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div class="workspace-content">
            <!-- Job Submission (only for owned pools) -->
            <div v-if="isOwner" class="workspace-section">
              <JobSubmission
                :pool="selectedPool"
                :user-id="userId"
                @job-submitted="onJobSubmitted"
              />
            </div>

            <!-- Two Column Layout for Progress and Jobs -->
            <div class="dual-column-layout">
              <!-- Live Progress Grid -->
              <div class="column-left">
                <ProgressGrid
                  :pool="selectedPool"
                  :key="progressGridKey"
                />
              </div>

              <!-- Job List -->
              <div class="column-right">
                <JobList
                  :pool="selectedPool"
                  :key="jobListKey"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Welcome State -->
        <div v-else class="welcome-workspace">
          <div class="welcome-card">
            <div class="welcome-header">
              <div class="welcome-icon">⚡</div>
              <h2 class="welcome-title">Welcome to WorkerPool</h2>
              <p class="welcome-subtitle">Select a worker pool to start managing jobs and monitoring performance</p>
            </div>
            
            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon">📝</div>
                <h4 class="feature-title">Submit Jobs</h4>
                <p class="feature-description">Queue new jobs with custom payloads and track their execution</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h4 class="feature-title">Monitor Progress</h4>
                <p class="feature-description">Real-time tracking of job status and worker activity</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">👥</div>
                <h4 class="feature-title">Manage Pools</h4>
                <p class="feature-description">Organize and control worker pools for different workloads</p>
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
import ProgressGrid from './components/ProgressGrid.vue';
import type { Pool, Job } from './types';

// User ID - in a real app this would come from authentication
const userId = ref('user-123');
const selectedPool = ref<Pool | null>(null);
const refreshing = ref(false);
const jobListKey = ref(0);
const progressGridKey = ref(0);

const isOwner = computed(() => {
  return selectedPool.value?.user_id === userId.value;
});

const onPoolSelected = (pool: Pool) => {
  selectedPool.value = pool;
  jobListKey.value++; // Force refresh of job list
  progressGridKey.value++; // Force refresh of progress grid
};

const onJobSubmitted = (job: Job) => {
  // Refresh both job list and progress grid when a new job is submitted
  jobListKey.value++;
  progressGridKey.value++;
};

const refreshData = async () => {
  refreshing.value = true;
  try {
    // Force refresh of both components
    jobListKey.value++;
    progressGridKey.value++;
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f8fafc;
  color: #1a1d29;
  line-height: 1.6;
}

#app {
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

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
}

.pool-title-section {
  flex: 1;
}

.pool-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1d29;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
}

.pool-badges {
  display: flex;
  gap: 12px;
  align-items: center;
}

.pool-id-badge {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 13px;
  color: #5f6368;
  background: #f8f9fa;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #e8eaed;
}

.ownership-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

.workspace-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e8eaed;
  background: white;
  color: #5f6368;
}

.action-button:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #dadce0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-icon {
  font-size: 16px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-icon.spinning {
  animation: spin 1s linear infinite;
}

.workspace-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.workspace-section {
  /* Sections will have their own styling */
}

/* Dual Column Layout */
.dual-column-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
}

.column-left,
.column-right {
  min-width: 0; /* Prevents grid overflow */
}

/* Welcome Workspace */
.welcome-workspace {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  margin-top: 32px;
}

.welcome-card {
  max-width: 900px;
  padding: 48px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8eaed;
  text-align: center;
}

.welcome-header {
  margin-bottom: 48px;
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.8;
}

.welcome-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1d29;
  margin: 0 0 16px 0;
  letter-spacing: -0.5px;
}

.welcome-subtitle {
  font-size: 18px;
  color: #5f6368;
  margin: 0;
  line-height: 1.6;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.feature-card {
  padding: 32px 24px;
  background: #fafbfc;
  border-radius: 16px;
  border: 1px solid #e8eaed;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #dadce0;
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.feature-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 8px 0;
}

.feature-description {
  color: #5f6368;
  margin: 0;
  line-height: 1.5;
  font-size: 14px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1200px) {
  .dual-column-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

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
    gap: 20px;
    align-items: stretch;
    padding: 24px;
  }
  
  .workspace-actions {
    justify-content: flex-end;
  }
  
  .welcome-card {
    padding: 32px 24px;
  }
  
  .welcome-title {
    font-size: 28px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .dual-column-layout {
    grid-template-columns: 1fr;
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
    font-size: 24px;
  }
}
</style>