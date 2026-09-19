<script setup lang="ts">
import { onMounted, ref } from 'vue';
import TimeView from './components/TimeView.vue';

const isPresenter = ref(false);

onMounted(() => {
  // プレゼンタービューは /presenter/ パスになる
  isPresenter.value = window.location.pathname.includes('/presenter');
});
</script>

<template>
  <!-- プレゼンタービューでのみ表示 -->
  <div v-if="isPresenter" class="presenter-time-view">
    <TimeView />
  </div>
</template>

<style scoped>
.presenter-time-view {
  position: fixed;
  bottom: 8px;
  right: 8px;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
}
</style>
