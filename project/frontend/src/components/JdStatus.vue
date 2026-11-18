<template>
  <view class="st" :class="tone">
    <view class="dot" />
    <text>{{ label }}</text>
  </view>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  tone: { type: String, default: 'mute' }
})
</script>
