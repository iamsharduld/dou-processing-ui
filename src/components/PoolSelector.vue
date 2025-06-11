<template>
  <div class="pool-selector">
    <div class="selector-header">
      <div class="header-content">
        <h2 class="section-title">Worker Pools</h2>
        <p class="section-subtitle">Select a pool to manage jobs and monitor performance</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading pools...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="loadPools" class="retry-button">Try Again</button>
    </div>

    <div v-else class="pools-content">
      <!-- Owned Pools -->
      <div v-if="pools?.owned_pools.length" class="pool-category">
        <div class="category-header">
          <h3 class="category-title">Your Pools</h3>
          <span class="category-count">{{ pools.total_owned }}</span>
        </div>
        <div class="pool-grid">
          <div
            v-for="pool in pools.owned_pools"
            :key="pool.id"
            class="pool-card owned"
            :class="{ active: selectedPool?.id === pool.id }"
            @click="selectPool(pool)"
          >
            <div class="card-header">
              <div class="pool-info">
                <h4 class="pool-name">{{ pool.name }}</h4>
                <span class="pool-date">{{ formatDate(pool.created_at) }}</span>
              </div>
              <div class="ownership-indicator owner">
                <span class="indicator-dot"></span>
                <span class="indicator-text">Owner</span>
              </div>
            </div>
            <div class="card-stats" v-if="poolStats[pool.id]">
              <div class="stat-item">
                <span class="stat-value">{{ poolStats[pool.id].jobs.total }}</span>
                <span class="stat-label">Jobs</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ poolStats[pool.id].workers.total_active }}</span>
                <span class="stat-label">Workers</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ poolStats[pool.id].jobs.pending }}</span>
                <span class="stat-label">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Other Pools -->
      <div v-if="pools?.other_pools.length" class="pool-category">
        <div class="category-header">
          <h3 class="category-title">Shared Pools</h3>
          <span class="category-count">{{ pools.total_other }}</span>
        </div>
        <div class="pool-grid">
          <div
            v-for="pool in pools.other_pools"
            :key="pool.id"
            class="pool-card shared"
            :class="{ active: selectedPool?.id === pool.id }"
            @click="selectPool(pool)"
          >
            <div class="card-header">
              <div class="pool-info">
                <h4 class="pool-name">{{ pool.name }}</h4>
                <span class="pool-date">{{ formatDate(pool.created_at) }}</span>
              </div>
              <div class="ownership-indicator viewer">
                <span class="indicator-dot"></span>
                <span class="indicator-text">Viewer</span>
              </div>
            </div>
            <div class="card-stats" v-if="poolStats[pool.id]">
              <div class="stat-item">
                <span class="stat-value">{{ poolStats[pool.id].jobs.total }}</span>
                <span class="stat-label">Jobs</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ poolStats[pool.id].workers.total_active }}</span>
                <span class="stat-label">Workers</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ poolStats[pool.id].jobs.pending }}</span>
                <span class="stat-label">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!pools?.owned_pools.length && !pools?.other_pools.length" class="empty-state">
        <div class="empty-icon">📦</div>
        <h3 class="empty-title">No pools available</h3>
        <p class="empty-message">No worker pools have been created yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ApiService } from '../services/api';
import type { Pool, CategorizedPools, PoolStats } from '../types';

const props = defineProps<{
  userId: string;
  selectedPool: Pool | null;
}>();

const emit = defineEmits<{
  'pool-selected': [pool: Pool];
}>();

const pools = ref<CategorizedPools | null>(null);
const poolStats = ref<Record<string, PoolStats>>({});
const loading = ref(true);
const error = ref<string | null>(null);

const loadPools = async () => {
  try {
    loading.value = true;
    error.value = null;
    pools.value = await ApiService.getCategorizedPools(props.userId);
    
    // Load stats for each pool
    const allPools = [...(pools.value.owned_pools || []), ...(pools.value.other_pools || [])];
    for (const pool of allPools) {
      try {
        poolStats.value[pool.id] = await ApiService.getPoolStats(pool.id);
      } catch (e) {
        console.warn(`Failed to load stats for pool ${pool.id}`);
      }
    }
  } catch (e) {
    error.value = 'Failed to load pools. Please try again.';
    console.error('Error loading pools:', e);
  } finally {
    loading.value = false;
  }
};

const selectPool = (pool: Pool) => {
  emit('pool-selected', pool);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

onMounted(() => {
  loadPools();
});
</script>

<style scoped>
.pool-selector {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
  margin-bottom: 32px;
}

.selector-header {
  margin-bottom: 32px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1d29;
  margin: 0 0 8px 0;
  letter-spacing: -0.3px;
}

.section-subtitle {
  color: #5f6368;
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
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

.loading-text {
  color: #5f6368;
  margin: 0;
  font-size: 16px;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 64px 0;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.8;
}

.error-message {
  color: #ea4335;
  margin: 0 0 24px 0;
  font-size: 16px;
}

.retry-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.retry-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Pool Categories */
.pool-category {
  margin-bottom: 40px;
}

.pool-category:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.category-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
}

.category-count {
  background: #f8f9fa;
  color: #5f6368;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #e8eaed;
}

.pool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

/* Pool Cards */
.pool-card {
  border: 2px solid #e8eaed;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  position: relative;
  overflow: hidden;
}

.pool-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.pool-card.owned::before {
  background: linear-gradient(135deg, #00d4aa, #00b894);
}

.pool-card.shared::before {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.pool-card:hover {
  border-color: #dadce0;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.pool-card.active {
  border-color: #667eea;
  background: #fafbff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.pool-info {
  flex: 1;
}

.pool-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.pool-date {
  color: #5f6368;
  font-size: 14px;
}

.ownership-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ownership-indicator.owner {
  background: rgba(0, 212, 170, 0.1);
  color: #00b894;
}

.ownership-indicator.viewer {
  background: rgba(95, 99, 104, 0.1);
  color: #5f6368;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px 8px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1a1d29;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 64px 0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-title {
  color: #1a1d29;
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.empty-message {
  color: #5f6368;
  margin: 0;
  font-size: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .pool-selector {
    padding: 24px 20px;
  }
  
  .pool-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .ownership-indicator {
    align-self: flex-start;
  }
}
</style>