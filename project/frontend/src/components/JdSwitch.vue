<template>
  <view class="sw" :class="{ on: modelValue, sm: size === 'sm' }" @tap="toggle">
    <view class="knob" />
  </view>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
  emit('change', !props.modelValue)
}
</script>

<style scoped>
.sw {
  width: 50px;
  height: 30px;
  border-radius: 999px;
  background: #dcd3c9;
  position: relative;
  flex: 0 0 auto;
  transition: background 0.2s ease;
}

.sw.on {
  background: #0f7b4f;
}

.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: left 0.2s ease;
}

.sw.on .knob {
  left: 23px;
}

.sw.sm {
  width: 42px;
  height: 26px;
}

.sw.sm .knob {
  width: 20px;
  height: 20px;
}

.sw.sm.on .knob {
  left: 19px;
}
</style>
