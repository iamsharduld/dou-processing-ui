<template>
  <header class="qualcomm-header">
    <div class="container">
      <div class="header-content">
        <!-- Qualcomm Logo -->
        <div class="logo-section">
          <div class="qualcomm-logo">
            <svg width="180" height="40" viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Qualcomm Logo SVG -->
              <rect x="0" y="8" width="32" height="24" rx="4" fill="#3253DC"/>
              <rect x="8" y="12" width="16" height="16" rx="2" fill="white"/>
              <text x="45" y="26" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="#1f2937">
                Qualcomm
              </text>
            </svg>
          </div>
          <div class="product-title">
            <h1>DoU Processing Framework</h1>
            <span class="version">v2.1.0</span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="main-nav">
          <a href="#dashboard" class="nav-link active">Dashboard</a>
          <a href="#jobs" class="nav-link">Job Queue</a>
          <a href="#analytics" class="nav-link">Analytics</a>
          <a href="#settings" class="nav-link">Settings</a>
        </nav>

        <!-- User Section -->
        <div class="user-section">
          <div class="user-info">
            <div class="user-avatar">
              <span>JD</span>
            </div>
            <div class="user-details">
              <span class="user-name">John Doe</span>
              <span class="user-role">Senior Engineer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// Component logic here
</script>

<style scoped>
.qualcomm-header {
  background: linear-gradient(135deg, #3253DC 0%, #2A47C4 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(50, 83, 220, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  gap: 32px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.qualcomm-logo {
  flex-shrink: 0;
}

.product-title h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: white;
  line-height: 1.2;
}

.version {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.main-nav {
  display: flex;
  gap: 32px;
  flex: 1;
  justify-content: center;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  color: white;
  background: rgba(255, 255, 255, 0.15);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: #EF3E42;
  border-radius: 50%;
}

.user-section {
  display: flex;
  align-items: center;
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
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: white;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.2;
}

@media (max-width: 1024px) {
  .main-nav {
    display: none;
  }
  
  .header-content {
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .product-title h1 {
    font-size: 18px;
  }
  
  .user-details {
    display: none;
  }
  
  .logo-section {
    gap: 16px;
  }
}
</style>