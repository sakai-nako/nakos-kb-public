<script setup lang="ts">
// $slidev はテンプレート内でグローバルに利用可能
// スクリプト内では使わず、テンプレート内で直接アクセスする

// Slidev固有の型（公式に完全な型がないため部分的に定義）
interface SlidevSlide {
  meta?: {
    slide?: {
      frontmatter?: {
        duration?: number;
      };
    };
  };
}

interface SlidevNav {
  currentPage: number;
  slides: SlidevSlide[];
}

interface SlidevContext {
  nav: SlidevNav;
  configs?: {
    presentation_time_minutes?: number;
  };
}

// 秒を MM:SS 形式にフォーマット
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 累積時間を計算する関数（秒単位で返す）
function getElapsedSeconds(slidev: SlidevContext): number {
  if (!slidev?.nav?.slides) return 0;
  const currentPage = slidev.nav.currentPage;
  const slides = slidev.nav.slides;
  let total = 0;
  for (let i = 0; i < currentPage - 1; i++) {
    // duration は秒単位
    const duration = slides[i]?.meta?.slide?.frontmatter?.duration ?? 0;
    total += duration;
  }
  return total;
}

// 現在のスライドのdurationを取得（秒単位）
function getCurrentDuration(slidev: SlidevContext): number {
  if (!slidev?.nav?.slides) return 0;
  const currentPage = slidev.nav.currentPage;
  return slidev.nav.slides[currentPage - 1]?.meta?.slide?.frontmatter?.duration ?? 0;
}

// 全体の時間を取得（分で設定されているので秒に変換）
function getTotalSeconds(slidev: SlidevContext): number {
  return (slidev?.configs?.presentation_time_minutes ?? 0) * 60;
}
</script>

<template>
  <span class="time-view">
    {{ formatTime(getElapsedSeconds($slidev)) }} ～
    {{ formatTime(getElapsedSeconds($slidev) + getCurrentDuration($slidev)) }} /
    {{ formatTime(getTotalSeconds($slidev)) }}
  </span>
</template>

<style scoped>
.time-view {
  font-family: monospace;
  font-size: 0.9em;
  color: #fff;
}
</style>
