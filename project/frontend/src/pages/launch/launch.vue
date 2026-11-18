<template>
  <view class="jd-page launch">
    <view class="hero">
      <view class="logo">
        <jd-icon name="lamp" :size="52" color="#FFFFFF" :stroke="1.4" />
      </view>
      <text class="brand t28 b mt20">家灯</text>
      <text class="t12 c3 mt6">离线也能看，随时有记录</text>
    </view>

    <view class="wrap">
      <view class="card">
        <view class="row g12">
          <jd-avatar :text="user ? user.avatarText : '芳'" :color="user ? user.avatarColor : 'owner'" />
          <view class="f1">
            <text class="t15 sb">{{ user ? user.name : '王芳' }}</text>
            <view class="t11 c3 mt2">{{ family ? family.name : '李家' }} · {{ member ? member.relation : '主理子女' }}</view>
          </view>
          <view class="tag">Face ID</view>
        </view>

        <button class="btn btn-primary mt16" :disabled="unlocking" @tap="unlock">
          <jd-icon name="shield" :size="18" color="#FFFFFF" />
          <text>{{ unlockLabel }}</text>
        </button>
        <view class="t11 c3 tc mt10">健康档案已加密，解锁后才能查看</view>
      </view>

      <view class="card flat mt12 sync-card">
        <view class="between">
          <text class="t12 c2">上次同步</text>
          <text class="t12 sb">{{ syncLabel }}</text>
        </view>
        <view class="between mt8">
          <text class="t12 c2">离线缓存</text>
          <text class="t12 sb cok">{{ cachedTasks ? `可用 · ${cachedTasks} 条任务` : '登录后可离线查看' }}</text>
        </view>
      </view>

      <view class="row center g8 mt18">
        <text class="t11 c3" @tap="showAccounts = true">切换演示身份</text>
        <text class="t11 c4">·</text>
        <text class="t11 c3" @tap="showLogin = true">手机号登录</text>
      </view>

      <view class="row center g6 mt20 t11 c4">v0.1.0 · 给守护家庭的人</view>
    </view>

    <!-- 面容验证中的扫描动效 -->
    <view v-if="unlocking" class="scan-mask">
      <view class="scan-frame">
        <view class="scan-line" />
        <jd-icon name="shield" :size="34" color="#FFC48A" />
        <text class="t13 mt10" style="color: #ffd9b8">正在确认是你本人</text>
      </view>
    </view>

    <!-- 演示身份切换 -->
    <u-popup v-model:show="showAccounts" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">演示身份</view>
        <view class="t11 c3 mb10">同一份家庭数据，用不同成员视角看同一件事。</view>
        <view class="list">
          <view v-for="acc in accounts" :key="acc.username" class="li" @tap="loginAs(acc.username)">
            <jd-avatar :text="acc.text" :color="acc.color" size="sm" />
            <view class="f1">
              <text class="lb">{{ acc.name }}</text>
              <view class="t11 c3 mt2">{{ acc.role }}</view>
            </view>
            <text class="t11 cbrand">{{ acc.username }}</text>
          </view>
        </view>
        <view class="t11 c4 tc mt14">统一密码 123456</view>
      </view>
    </u-popup>

    <!-- 手机号登录 -->
    <u-popup v-model:show="showLogin" mode="bottom" round="20" :safeAreaInsetBottom="true">
      <view class="pop">
        <view class="pop-title">手机号登录</view>
        <view class="field mt6">
          <view class="lab">手机号</view>
          <input v-model="form.username" class="input" placeholder="13800000001" placeholder-class="ph" />
        </view>
        <view class="field mt8">
          <view class="lab">密码</view>
          <input v-model="form.password" class="input" password placeholder="123456" placeholder-class="ph" />
        </view>
        <button class="btn btn-primary mt14" :disabled="unlocking" @tap="loginByPassword">登录</button>
      </view>
    </u-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import JdIcon from '@/components/JdIcon.vue'
import JdAvatar from '@/components/JdAvatar.vue'
import { authApi } from '@/api'
import { useSession, setSession } from '@/store/session'

const session = useSession()
const unlocking = ref(false)
const showAccounts = ref(false)
const showLogin = ref(false)
const syncLabel = ref('尚未同步')
const cachedTasks = ref(0)
const user = computed(() => session.user)
const family = computed(() => session.family)
const member = computed(() => session.member)
// computed 是只读的：之前的赋值会让面容解锁的回调抛错，导致登录后不跳转
const unlockLabel = computed(() => {
  if (unlocking.value) return '正在验证面容…'
  return session.token ? '继续进入家灯' : '用面容解锁'
})

const form = ref({ username: '13800000001', password: '123456' })

const accounts = [
  { username: '13800000001', name: '王芳', role: '李家 · 主理子女', text: '芳', color: 'owner' },
  { username: '13800000002', name: '王丽', role: '李家 · 妹妹', text: '丽', color: 'sis' },
  { username: '13800000003', name: '王建国', role: '李家 · 爸爸（关怀版）', text: '爸', color: 'dad' },
  { username: '13800000004', name: '李秀兰', role: '李家 · 妈妈', text: '妈', color: 'mom' }
]

function applySync(data) {
  if (data && data.sync) {
    if (data.sync.lastSyncAt) {
      syncLabel.value = data.sync.lastSyncAt.slice(11, 16) || '今天'
    }
    if (typeof data.sync.cachedTasks === 'number') {
      cachedTasks.value = data.sync.cachedTasks
    }
  }
}

onMounted(() => {
  if (session.token) {
    authApi
      .me()
      .then((data) => {
        setSession(data)
        applySync(data)
      })
      .catch(() => {})
  }
})

async function unlock() {
  if (unlocking.value) return
  unlocking.value = true
  try {
    const data = await authApi.face()
    setSession(data)
    applySync(data)
    setTimeout(() => {
      unlocking.value = false
      uni.reLaunch({ url: '/pages/home/home' })
    }, 620)
  } catch (e) {
    unlocking.value = false
  }
}

async function loginByPassword() {
  if (!form.value.username || !form.value.password) {
    uni.showToast({ title: '请填写手机号和密码', icon: 'none' })
    return
  }
  unlocking.value = true
  try {
    const data = await authApi.login(form.value)
    setSession(data)
    applySync(data)
    showLogin.value = false
    uni.reLaunch({ url: '/pages/home/home' })
  } catch (e) {
    /* 错误已由 request 统一提示 */
  } finally {
    unlocking.value = false
  }
}

async function loginAs(username) {
  unlocking.value = true
  try {
    const data = await authApi.face({ username })
    setSession(data)
    applySync(data)
    showAccounts.value = false
    uni.reLaunch({ url: '/pages/home/home' })
  } catch (e) {
    /* 错误已由 request 统一提示 */
  } finally {
    unlocking.value = false
  }
}
</script>

<style scoped>
.launch {
  position: relative;
  overflow-y: auto;
  padding-bottom: 24px;
}

.hero {
  text-align: center;
  padding-top: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  width: 92px;
  height: 92px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(150deg, #f59e0b, #c2410c);
  box-shadow: 0 18px 40px rgba(194, 65, 12, 0.34);
}

.brand {
  color: #171210;
}

.wrap {
  padding: 0 16px;
  margin-top: 24px;
}

.sync-card {
  background: #fbf7f2;
  border-color: #e7ded4;
}

.scan-mask {
  position: fixed;
  inset: 0;
  background: rgba(23, 18, 16, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
}

.scan-frame {
  width: 190px;
  height: 190px;
  border-radius: 32px;
  border: 2px solid rgba(255, 196, 138, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.scan-line {
  position: absolute;
  left: 12px;
  right: 12px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ffc48a, transparent);
  animation: scan 1.1s ease-in-out infinite;
}

@keyframes scan {
  0% { top: 18px; }
  50% { top: 168px; }
  100% { top: 18px; }
}

.pop {
  padding: 16px 18px 26px;
}

.pop-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 4px;
}

.input {
  font-size: 16px;
  min-height: 24px;
  color: #171210;
}

:deep(.ph) {
  color: #a99d91;
}
</style>
