<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="brand-section">
          <div class="brand-icon">⚡</div>
          <h1 class="brand-title">DoU Processing</h1>
        </div>
        <p class="login-subtitle">Sign in to access your worker pools</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="userId" class="form-label">User ID</label>
          <input
            id="userId"
            v-model="credentials.userId"
            type="text"
            class="form-input"
            :class="{ 'has-error': error }"
            placeholder="Enter your user ID"
            required
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            class="form-input"
            :class="{ 'has-error': error }"
            placeholder="Enter your password"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>

        <button
          type="submit"
          class="login-button"
          :disabled="loading || !credentials.userId.trim() || !credentials.password.trim()"
        >
          <span v-if="loading" class="loading-spinner"></span>
          <span class="button-text">{{ loading ? 'Signing in...' : 'Sign In' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ApiService } from '../services/api';

const emit = defineEmits<{
  'login-success': [userId: string];
}>();

const credentials = ref({
  userId: '',
  password: ''
});

const loading = ref(false);
const error = ref<string | null>(null);

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const isAuthenticated = await ApiService.authenticate(
      credentials.value.userId.trim(),
      credentials.value.password
    );
    
    if (isAuthenticated) {
      emit('login-success', credentials.value.userId.trim());
    } else {
      error.value = 'Invalid user ID or password. Please try again.';
    }
  } catch (e) {
    error.value = 'Authentication failed. Please try again.';
    console.error('Login error:', e);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 48px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.brand-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.brand-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1d29;
  margin: 0;
  letter-spacing: -0.5px;
}

.login-subtitle {
  color: #5f6368;
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
}

.login-form {
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
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
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

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ea4335;
  font-size: 14px;
  padding: 12px 16px;
  background: #fef7f7;
  border-radius: 8px;
  border: 1px solid #fce8e6;
}

.error-icon {
  font-size: 16px;
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 56px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.login-button:disabled {
  background: #9aa0a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }
  
  .brand-title {
    font-size: 24px;
  }
  
  .form-input {
    padding: 14px;
    font-size: 16px;
  }
}
</style>