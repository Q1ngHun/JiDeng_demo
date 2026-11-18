<template>
  <view class="ring" :style="ringStyle">
    <view class="inner">
      <text class="val">{{ label }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  label: { type: String, default: '' },
  size: { type: Number, default: 84 }
})

const ringStyle = computed(() => {
  const v = Math.max(0, Math.min(100, props.value))
  return {
    width: props.size + 'px',
    height: props.size + 'px',
    background: `conic-gradient(#EA580C ${v * 3.6}deg, #F6EFE6 0deg)`
  }
})
</script>

<style scoped>
.ring {
  border-radius: 50%;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inner {
  width: 78%;
  height: 78%;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.val {
  font-size: 19px;
  font-weight: 700;
  color: #171210;
  line-height: 1;
}
</style>
