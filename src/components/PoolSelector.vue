<template>
  <div class="pool-selector">
    <div class="selector-header">
      <div class="header-content">
        <h2 class="section-title">Worker Pools</h2>
        <p class="section-subtitle">Select a pool to manage jobs and monitor performance</p>
      </div>
      <div class="header-actions">
        <button @click="showCreateModal = true" class="create-button">
          <span class="button-icon">+</span>
          <span>Create Pool</span>
        </button>
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
              <div class="pool-actions">
                <div class="ownership-indicator owner">
                  <span class="indicator-dot"></span>
                  <span class="indicator-text">Owner</span>
                </div>
                <button 
                  @click.stop="confirmDelete(pool)" 
                  class="delete-button"
                  title="Delete pool"
                >
                  <span class="delete-icon">🗑️</span>
                </button>
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
          </div>
        </div>
      </div>

      <div v-if="!pools?.owned_pools.length && !pools?.other_pools.length" class="empty-state">
        <div class="empty-icon">📦</div>
        <h3 class="empty-title">No pools available</h3>
        <p class="empty-message">Create your first worker pool to get started.</p>
        <button @click="showCreateModal = true" class="create-first-button">
          <span class="button-icon">+</span>
          <span>Create Your First Pool</span>
        </button>
      </div>
    </div>

    <!-- Create Pool Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Create New Worker Pool</h3>
          <button @click="closeCreateModal" class="close-button">&times;</button>
        </div>
        <div class="modal-content">
          <form @submit.prevent="createPool" class="create-form">
            <div class="form-group">
              <label for="poolName" class="form-label">Pool Name</label>
              <input
                id="poolName"
                v-model="newPoolName"
                type="text"
                class="form-input"
                :class="{ 'has-error': createError }"
                placeholder="Enter a descriptive name for your pool"
                maxlength="100"
                required
              />
              <div class="input-help">
                Choose a name that describes the type of work this pool will handle
              </div>
              <div v-if="createError" class="error-message">
                <span class="error-icon">⚠️</span>
                {{ createError }}
              </div>
            </div>
            <div class="form-actions">
              <button type="button" @click="closeCreateModal" class="cancel-button">
                Cancel
              </button>
              <button 
                type="submit" 
                class="submit-button" 
                :disabled="creating || !newPoolName.trim()"
              >
                <span v-if="creating" class="loading-spinner small"></span>
                <span>{{ creating ? 'Creating...' : 'Create Pool' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Delete Worker Pool</h3>
          <button @click="closeDeleteModal" class="close-button">&times;</button>
        </div>
        <div class="modal-content">
          <div class="delete-warning">
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
              <h4 class="warning-title">Are you sure you want to delete this pool?</h4>
              <p class="warning-message">
                This will permanently delete the pool "<strong>{{ poolToDelete?.name }}</strong>" and all associated jobs. This action cannot be undone.
              </p>
            </div>
          </div>
          <div v-if="deleteError" class="error-message">
            <span class="error-icon">⚠️</span>
            {{ deleteError }}
          </div>
          <div class="form-actions">
            <button type="button" @click="closeDeleteModal" class="cancel-button">
              Cancel
            </button>
            <button 
              @click="deletePool" 
              class="delete-confirm-button" 
              :disabled="deleting"
            >
              <span v-if="deleting" class="loading-spinner small"></span>
              <span>{{ deleting ? 'Deleting...' : 'Delete Pool' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ApiService } from '../services/api';
import type { Pool, CategorizedPools } from '../types';

const props = defineProps<{
  userId: string;
  selectedPool: Pool | null;
}>();

const emit = defineEmits<{
  'pool-selected': [pool: Pool];
  'pool-created': [pool: Pool];
  'pool-deleted': [poolId: string];
}>();

const pools = ref<CategorizedPools | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Create pool modal
const showCreateModal = ref(false);
const newPoolName = ref('');
const creating = ref(false);
const createError = ref<string | null>(null);

// Delete pool modal
const showDeleteModal = ref(false);
const poolToDelete = ref<Pool | null>(null);
const deleting = ref(false);
const deleteError = ref<string | null>(null);

const loadPools = async () => {
  try {
    loading.value = true;
    error.value = null;
    pools.value = await ApiService.getCategorizedPools(props.userId);
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

const createPool = async () => {
  if (!newPoolName.value.trim()) {
    createError.value = 'Pool name is required';
    return;
  }

  try {
    creating.value = true;
    createError.value = null;
    
    const newPool = await ApiService.createPool(newPoolName.value.trim(), props.userId);
    
    // Reload pools to get updated list
    await loadPools();
    
    // Close modal and reset form
    closeCreateModal();
    
    // Emit event and auto-select the new pool
    emit('pool-created', newPool);
    emit('pool-selected', newPool);
  } catch (e) {
    createError.value = 'Failed to create pool. Please try again.';
    console.error('Error creating pool:', e);
  } finally {
    creating.value = false;
  }
};

const confirmDelete = (pool: Pool) => {
  poolToDelete.value = pool;
  showDeleteModal.value = true;
};

const deletePool = async () => {
  if (!poolToDelete.value) return;

  try {
    deleting.value = true;
    deleteError.value = null;
    
    await ApiService.deletePool(poolToDelete.value.id, props.userId);
    
    // If the deleted pool was selected, clear selection
    if (props.selectedPool?.id === poolToDelete.value.id) {
      emit('pool-selected', null as any);
    }
    
    // Reload pools to get updated list
    await loadPools();
    
    // Close modal
    closeDeleteModal();
    
    // Emit event
    emit('pool-deleted', poolToDelete.value.id);
  } catch (e) {
    deleteError.value = 'Failed to delete pool. Please try again.';
    console.error('Error deleting pool:', e);
  } finally {
    deleting.value = false;
  }
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  newPoolName.value = '';
  createError.value = null;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  poolToDelete.value = null;
  deleteError.value = null;
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
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
  margin-bottom: 20px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 20px;
}

.header-content {
  flex: 1;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 4px 0;
  letter-spacing: -0.2px;
}

.section-subtitle {
  color: #5f6368;
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.create-button {
  display: flex;
  align-items: center;
  gap: 6px;
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

.create-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.button-icon {
  font-size: 14px;
  font-weight: bold;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #f0f0f0;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
}

.loading-text {
  color: #5f6368;
  margin: 0;
  font-size: 14px;
}

/* Error State */
.error-state {
  text-align: center;
  padding: 40px 0;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.8;
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

.retry-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.retry-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Pool Categories */
.pool-category {
  margin-bottom: 24px;
}

.pool-category:last-child {
  margin-bottom: 0;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.category-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0;
}

.category-count {
  background: #f8f9fa;
  color: #5f6368;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #e8eaed;
}

.pool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

/* Pool Cards */
.pool-card {
  border: 2px solid #e8eaed;
  border-radius: 10px;
  padding: 16px;
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
  height: 3px;
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
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.pool-card.active {
  border-color: #667eea;
  background: #fafbff;
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.pool-info {
  flex: 1;
}

.pool-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1d29;
  margin: 0 0 2px 0;
  line-height: 1.3;
}

.pool-date {
  color: #5f6368;
  font-size: 12px;
}

.pool-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ownership-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
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
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}

.delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(234, 67, 53, 0.1);
  border: 1px solid rgba(234, 67, 53, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #ea4335;
}

.delete-button:hover {
  background: rgba(234, 67, 53, 0.15);
  border-color: rgba(234, 67, 53, 0.3);
  transform: scale(1.05);
}

.delete-icon {
  font-size: 12px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-title {
  color: #1a1d29;
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
}

.empty-message {
  color: #5f6368;
  margin: 0 0 20px 0;
  font-size: 14px;
}

.create-first-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.create-first-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
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
  max-width: 500px;
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
  color: #9aa0a6;
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
  background: #f8f9fa;
  color: #5f6368;
}

.modal-content {
  padding: 0 24px 24px 24px;
}

/* Form Styles */
.create-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a1d29;
}

.form-input {
  border: 2px solid #e8eaed;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  background: white;
  color: #1a1d29;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-input.has-error {
  border-color: #ea4335;
  background: #fef7f7;
}

.input-help {
  font-size: 13px;
  color: #5f6368;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-button {
  background: #f8f9fa;
  color: #5f6368;
  border: 2px solid #e8eaed;
  padding: 10px 20px;
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

.submit-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
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

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  background: #9aa0a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.delete-confirm-button {
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

.delete-confirm-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(234, 67, 53, 0.4);
}

.delete-confirm-button:disabled {
  background: #9aa0a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Delete Warning */
.delete-warning {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fef7f7;
  border: 1px solid #fce8e6;
  border-radius: 12px;
  margin-bottom: 20px;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .pool-selector {
    padding: 16px;
  }
  
  .selector-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .pool-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .pool-actions {
    justify-content: space-between;
  }
  
  .modal-container {
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .delete-warning {
    flex-direction: column;
    gap: 12px;
  }
}
</style>