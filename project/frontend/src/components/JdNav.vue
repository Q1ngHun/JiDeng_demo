<template>
  <view class="jd-nav" :class="{ tint: tint }">
    <view class="status-pad" />
    <view class="bar">
      <view v-if="back" class="nav-back" hover-class="nav-back-hover" @tap="onBack">
        <jd-icon name="chevron-left" :size="22" color="#171210" />
      </view>
      <text class="ttl">{{ title }}</text>
      <view v-if="action" class="act" @tap="$emit('action')">{{ action }}</view>
      <slot name="right" />
    </view>
  </view>
</template>

<script setup>
import JdIcon from './JdIcon.vue'
import { back as goBack } from '@/store/session'

const props = defineProps({
  title: { type: String, default: '' },
  back: { type: Boolean, default: false },
  action: { type: String, default: '' },
  tint: { type: Boolean, default: false },
  fallback: { type: String, default: '/pages/home/home' }
})

const emit = defineEmits(['action'])

function onBack() {
  emit('back')
  goBack(props.fallback)
}
</script>

<style scoped>
.jd-nav {
  flex: 0 0 auto;
  background: #ffffff;
  position: relative;
  z-index: 30;
}

.jd-nav.tint {
  background: #fbf7f2;
}

.status-pad {
  height: env(safe-area-inset-top);
}

.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  padding-top: 6px;
}

.nav-back {
  width: 32px;
  height: 32px;
  margin-left: -6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-back-hover {
  background: #f6efe6;
}

.ttl {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #171210;
}

.act {
  margin-left: auto;
  font-size: 14px;
  font-weight: 500;
  color: #c2410c;
  padding: 6px 4px;
}
</style>
