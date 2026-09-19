<script setup lang="ts">
defineProps<{
  eventName?: string;
  eventDate?: string;
  speakerName?: string;
}>();

const days = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}曜日）`;
}
</script>

<template>
  <div class="title-footer">
    <h3 v-if="eventName">{{ eventName }}</h3>
    <h3 v-if="eventDate">{{ formatDate(eventDate) }}</h3>
    <h3 v-if="speakerName">{{ speakerName }}</h3>
  </div>
</template>

<style scoped>
.title-footer {
  margin-top: 2rem;
}

.title-footer p {
  margin: 0.25rem 0;
}
</style>
