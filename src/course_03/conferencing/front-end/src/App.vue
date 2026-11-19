<template>
  <div class="room-container">
    <!-- Room 信息区 -->
    <div class="room-info">
      <span class="room-label">Room:</span>
      <el-input v-model="roomName" placeholder="Room Name" class="room-input" />
      <span class="room-label">User:</span>
      <el-input v-model="userName" class="user-input" />
      <el-button type="primary" @click="onJoin">Join</el-button>
    </div>

    <!-- 通话控制按钮：用 v-show 控制显隐 -->
    <div v-show="joined" class="control-buttons">
      <el-button type="primary" @click="onEnableFeed">Feed On</el-button>
      <el-button type="success" :disabled="!feedReady" @click="onSendFeed">Send Feed</el-button>
      <el-button type="success" :disabled="!joined" @click="onToggleMute">Audio On</el-button>
      <el-button type="danger" :disabled="!joined" @click="onHangUp">Hangup</el-button>
    </div>

    <!-- 顶部小视频（非主导说话者） -->
    <div class="remote-media">
      <div class="remote-video-container remote-speaker">
        <video ref="remoteVideo1" class="remote-video" autoplay inline controls></video>
        <div ref="username1" class="username"></div>
      </div>
      <div class="remote-video-container">
        <video ref="remoteVideo2" class="remote-video" autoplay inline controls></video>
        <div ref="username2" class="username"></div>
      </div>
      <div class="remote-video-container">
        <video ref="remoteVideo3" class="remote-video" autoplay inline controls></video>
        <div ref="username3" class="username"></div>
      </div>
      <div class="remote-video-container">
        <video ref="remoteVideo4" class="remote-video" autoplay inline controls></video>
        <div ref="username4" class="username"></div>
      </div>
    </div>

    <!-- 当前说话者大视频 -->
    <div class="current-speaker">
      <div class="current-video-container">
        <video ref="remoteVideo0" class="remote-video" autoplay inline controls></video>
        <div ref="username0" class="username"></div>
      </div>
    </div>

    <!-- 本地视频（左下角） -->
    <div class="local-media">
      <video ref="localVideoRef" class="local-video" muted autoplay inline></video>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { io, Socket } from 'socket.io-client'
import { Device } from 'mediasoup-client'
import { MSG_JOIN_ROOM } from '@/constant/signaling-msg'

// import getMic2 from './getMic2'
// import createProducerTransport from './mediaSoupFunctions/createProducerTransport'
// import createProducer from './mediaSoupFunctions/createProducer'
// import requestTransportToConsume from './mediaSoupFunctions/requestTransportToConsume'

let socket: Socket
let device: Device

onMounted(() => {
  socket = io('https://localhost:3031')
  socket.on('connect', () => {
    console.log('connect')
  })
})

const roomName = ref('')
const userName = ref('')

const joined = ref(false)    // 替代原 d-none 的显隐控制
const feedReady = ref(false) // 替代 "send-feed" 按钮的 disabled 状态

// ---- 视频 / 用户名元素引用 ----
const localVideoRef = ref<HTMLVideoElement | null>(null)

const remoteVideo0 = ref<(HTMLVideoElement | null)[]>([])
const remoteVideo1 = ref<(HTMLVideoElement | null)[]>([])
const remoteVideo2 = ref<(HTMLVideoElement | null)[]>([])
const remoteVideo3 = ref<(HTMLVideoElement | null)[]>([])
const remoteVideo4 = ref<(HTMLVideoElement | null)[]>([])

const username0 = ref<(HTMLElement | null)[]>([])
const username1= ref<(HTMLElement | null)[]>([])
const username2= ref<(HTMLElement | null)[]>([])
const username3= ref<(HTMLElement | null)[]>([])
const username4= ref<(HTMLElement | null)[]>([])

const onJoin = async () => {
  const resp = await socket.emitWithAck(MSG_JOIN_ROOM, {
    roomName: roomName.value,
    userName: userName.value,
  })
  console.log(resp)
  device = new Device()
  await device.load({
    routerRtpCapabilities: resp.routerRtpCapabilities,
  })
  console.log(device)
  joined.value = true
}

const onEnableFeed = () => {}
const onSendFeed = () => {}
const onToggleMute = () => {}
const onHangUp = () => {
  joined.value = false
}
</script>

<style scoped>
/* 容器，替代 Bootstrap 的 .container */
.room-container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 16px;
}

/* ---------- 顶部房间信息 ---------- */
.room-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.room-label {
  font-weight: 500;
}
.room-input,
.user-input {
  width: 180px;
}

/* ---------- 控制按钮区 ---------- */
.control-buttons {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}
/* 替代 Bootstrap 的 d-none；保留 class 方便 JS 通过 classList 切换 */
.hidden {
  display: none;
}

/* ---------- 顶部小视频行 ---------- */
.remote-media {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  margin-top: 8px;
  margin-bottom: 16px;
}
.remote-video-container {
  position: relative;
  width: 18%;
  height: 80px;
  border: 1px solid var(--el-color-primary);
  border-radius: 4px;
  overflow: hidden;
  background: #000;
}
/* 第一个“非主导说话者”容器默认宽度可自行决定，这里跟随 18% */
.remote-speaker {
  width: 18%;
  height: 80px;
}
.remote-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 视频上的用户名浮层 */
.username {
  position: absolute;
  left: 6px;
  bottom: 4px;
  color: #fff;
  font-size: 12px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

/* ---------- 当前说话者大视频 ---------- */
.current-speaker {
  text-align: center;
  margin-bottom: 16px;
}
.current-video-container {
  position: relative;
  width: 80%;
  height: 400px;
  margin: 0 auto;
  border: 1px solid var(--el-color-primary);
  border-radius: 4px;
  overflow: hidden;
  background: #000;
}

/* ---------- 本地视频 ---------- */
.local-media {
  position: relative;
  height: 150px;
}
.local-video {
  position: absolute;
  left: 0;
  top: 0;
  width: 200px;
  height: 150px;
  border: 1px solid var(--el-color-primary);
  border-radius: 4px;
  object-fit: cover;
  background: #000;
}
</style>
