<template>
  <div id="app">
    <QualcommHeader />
    
    <main class="main-content">
      <div class="container">
        <div class="content-grid">
          <!-- Job Submission Section -->
          <div class="submission-section">
            <JobSubmissionForm @job-submitted="onJobSubmitted" />
          </div>
          
          <!-- Job Queue Section -->
          <div class="queue-section">
            <JobQueue :key="queueKey" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import QualcommHeader from './components/QualcommHeader.vue';
import JobSubmissionForm from './components/JobSubmissionForm.vue';
import JobQueue from './components/JobQueue.vue';
import type { JobSubmission } from './types';

const queueKey = ref(0);

const onJobSubmitted = (job: JobSubmission) => {
  // Refresh the job queue when a new job is submitted
  queueKey.value++;
};
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #1f2937;
  line-height: 1.6;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.main-content {
  flex: 1;
  padding: 40px 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.submission-section,
.queue-section {
  /* Individual section styling handled by components */
}

/* Responsive Design */
@media (min-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
    gap: 48px;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  
  .main-content {
    padding: 24px 0;
  }
  
  .content-grid {
    gap: 24px;
  }
}

/* Qualcomm Brand Colors */
:root {
  --qualcomm-blue: #3253DC;
  --qualcomm-blue-dark: #2A47C4;
  --qualcomm-red: #EF3E42;
  --qualcomm-red-dark: #DC2626;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Focus styles for accessibility */
button:focus,
input:focus,
select:focus,
textarea:focus {
  outline: 2px solid var(--qualcomm-blue);
  outline-offset: 2px;
}

/* Animation utilities */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}

/* Print styles */
@media print {
  .main-content {
    background: white !important;
  }
  
  .job-submission-form,
  .job-queue {
    box-shadow: none !important;
    border: 1px solid #e5e7eb !important;
  }
}
</style>