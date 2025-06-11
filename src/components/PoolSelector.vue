<template>
  <div class="pool-selector">
    <div class="header">
      <h2 class="title">Select Worker Pool</h2>
      <p class="subtitle">Choose a pool to manage jobs and workers</p>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading pools...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadPools" class="retry-btn">Retry</button>
    </div>

    <div v-else class="pools-container">
      <!-- Owned Pools -->
      <div v-if="pools?.owned_pools.length" class="pool-section">
        <h3 class="section-title">Your Pools ({{ pools.total_owned }})</h3>
        <div class="pool-grid">
          <div
            v-for="pool in pools.owned_pools"
            :key="pool.id"
            class="pool-card owned"
            :class="{ selected: selectedPool?.id === pool.id }"
            @click="selectPool(pool)"
          >
            <div class="pool-header">
              <h4 class="pool-name">{{ pool.name }}</h4>
              <span class="owner-badge">Owner</span>
            </div>
            <p class="pool-date">Created {{ formatDate(pool.created_at) }}</p>
            <div class="pool-stats" v-if="poolStats[pool.id]">
              <div class="stat">
                <span class="stat-value">{{ poolStats[pool.id].jobs.total }}</span>
                <span class="stat-label">Jobs</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ poolStats[pool.id].workers.total_active }}</span>
                <span class="stat-label">Workers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Other Pools -->
      <div v-if="pools?.other_pools.length" class="pool-section">
        <h3 class="section-title">Other Pools ({{ pools.total_other }})</h3>
        <div class="pool-grid">
          <div
            v-for="pool in pools.other_pools"
            :key="pool.id"
            class="pool-card other"
            :class="{ selected: selectedPool?.id === pool.id }"
            @click="selectPool(pool)"
          >
            <div class="pool-header">
              <h4 class="pool-name">{{ pool.name }}</h4>
              <span class="viewer-badge">View Only</span>
            </div>
            <p class="pool-date">Created {{ formatDate(pool.created_at) }}</p>
            <div class="pool-stats" v-if="poolStats[pool.id]">
              <div class="stat">
                <span class="stat-value">{{ poolStats[pool.id].jobs.total }}</span>
                <span class="stat-label">Jobs</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ poolStats[pool.id].workers.total_active }}</span>
                <span class="stat-label">Workers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!pools?.owned_pools.length && !pools?.other_pools.length" class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No pools available</h3>
        <p>No worker pools have been created yet.</p>
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
  return new Date(dateString).toLocaleDateString();
};

onMounted(() => {
  loadPools();
});
</script>

<style scoped>
.pool-selector {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.header {
  margin-bottom: 32px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 48px 0;
  color: #ef4444;
}

.retry-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}

.pool-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
}

.pool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.pool-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.pool-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.pool-card.selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.pool-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.owner-badge {
  background: #10b981;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.viewer-badge {
  background: #6b7280;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.pool-date {
  color: #6b7280;
  font-size: 14px;
  margin: 0 0 16px 0;
}

.pool-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #6b7280;
  margin: 0;
}

@media (max-width: 768px) {
  .pool-grid {
    grid-template-columns: 1fr;
  }
  
  .pool-selector {
    padding: 16px;
  }
}
</style>