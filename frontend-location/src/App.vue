<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="app">
    <h1>현재 위치 (Vue + Vite)</h1>
    <p>루트 프론트엔드 프로젝트가 준비되었습니다.</p>
    <button type="button" class="btn" @click="count++">클릭 {{ count }}</button>
  </div>
</template>

<style scoped>
.app {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}
h1 {
  margin: 0 0 8px;
  font-size: 1.5rem;
}
.btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}
.btn:hover {
  background: #f0f0f0;
}
</style>
