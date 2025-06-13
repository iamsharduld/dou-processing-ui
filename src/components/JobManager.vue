<template>
  <div class="job-manager">
    <div class="manager-header">
      <div class="header-content">
        <h3 class="section-title">Job Management</h3>
        <p class="section-subtitle">Submit and monitor jobs for {{ pool.name }}</p>
      </div>
    </div>

    <div class="manager-content">
      <!-- Job Submission Form -->
      <JobSubmissionForm
        :pool="pool"
        :user-id="userId"
        @job-submitted="onJobSubmitted"
        @jobs-submitted="onJobsSubmitted"
      />

      <!-- Job List -->
      <JobList
        :pool="pool"
        :key="jobListKey"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import JobSubmissionForm from './JobSubmissionForm.vue';
import JobList from './JobList.vue';
import type { Pool, Job } from '../types';

const props = defineProps<{
  pool: Pool;
  userId: string;
}>();

const emit = defineEmits<{
  'job-submitted': [job: Job];
}>();

const jobListKey = ref(0);

const onJobSubmitted = (job: Job) => {
  // Refresh job list
  jobListKey.value++;
  emit('job-submitted', job);
};

const onJobsSubmitted = (jobs: Job[]) => {
  // Refresh job list after batch submission
  jobListKey.value++;
  // Emit the first job for compatibility
  if (jobs.length > 0) {
    emit('job-submitted', jobs[0]);
  }
};
</script>

<style scoped>
.job-manager {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.manager-header {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8eaed;
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

.manager-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (max-width: 768px) {
  .manager-header {
    padding: 16px;
  }
}
</style>