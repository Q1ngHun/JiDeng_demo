<template>
  <view class="av" :class="[color, sizeClass]">{{ text }}</view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '我' },
  color: { type: String, default: 'owner' },
  size: { type: String, default: 'md' }
})

const sizeClass = computed(() => (props.size === 'md' ? '' : props.size))
</script>

<style scoped>
.av {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(140deg, #f0a868, #d97742);
}
.av.owner { background: linear-gradient(140deg, #e8863f, #c2410c); }
.av.sis { background: linear-gradient(140deg, #8fa6c9, #5f7fa8); }
.av.dad { background: linear-gradient(140deg, #9dbf9e, #5e8f62); }
.av.mom { background: linear-gradient(140deg, #d9a9c0, #b4718f); }
.av.lg { width: 48px; height: 48px; font-size: 16px; }
.av.sm { width: 28px; height: 28px; font-size: 11px; }
.av.xs { width: 24px; height: 24px; font-size: 10px; }
</style>
