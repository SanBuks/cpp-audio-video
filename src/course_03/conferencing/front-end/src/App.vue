<template>
  <div class="base-container">
    <!-- 房间信息区 -->
    <div class="room-info">
      <span class="room-label">房间:</span>
      <el-input v-model="roomName" placeholder="101" class="room-input" />
      <span class="room-label">用户名:</span>
      <el-input v-model="userName" class="user-input" />
      <el-button type="primary" @click="onJoin">加入房间</el-button>
    </div>

    <!-- 通话控制按钮 -->
    <div class="control-buttons">
      <el-button type="primary" :disabled="!openFeedStatus" @click="onEnableFeed">打开本地流</el-button>
      <el-button type="success" :disabled="!sendFeedStatus" @click="onSendFeed">发布本地流</el-button>
      <el-button :type="muteButtonType" :disabled="!toggleStatus" @click="onToggleMute">{{ muteText }}</el-button>
      <el-button type="danger" :disabled="!hangupStatus" @click="onHangUp">挂断</el-button>
    </div>

    <!-- 顶部小视频(非主导说话者) -->
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
      <video ref="localVideo" class="local-video" muted autoplay inline></video>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { io, Socket } from 'socket.io-client'
import { Device } from 'mediasoup-client'
import type { Producer, Transport } from 'mediasoup-client/types'
import { CLIENT_REQ } from '@/constant/signaling-msg'
import { createProducerTransport, createProducer, requestTransportToConsume } from '@/util/conf-util.ts'
import type { JoinRoomRequest, JoinRoomResponse } from '@/type/conf-type.ts'

// ---- var ----
let socket: Socket
let device: Device
let localStream: MediaStream // 本地媒体流
let producerTransport: Transport // 推流-传输对象
let videoProducer: Producer
let audioProducer: Producer

const roomName = ref('') // 房间名
const userName = ref('') // 用户名
const isMuted = ref(false) // 是否静音

const openFeedStatus = ref(false)
const sendFeedStatus = ref(false)
const toggleStatus = ref(false)
const hangupStatus = ref(false)

const localVideo = ref<HTMLVideoElement>()
const remoteVideo0 = ref<(HTMLVideoElement | null)[]>([])
const remoteVideo1 = ref<(HTMLVideoElement | null)[]>([])
const remoteVideo2 = ref<(HTMLVideoElement | null)[]>([])
const remoteVideo3 = ref<(HTMLVideoElement | null)[]>([])
const remoteVideo4 = ref<(HTMLVideoElement | null)[]>([])

const username0 = ref<(HTMLElement | null)[]>([])
const username1 = ref<(HTMLElement | null)[]>([])
const username2 = ref<(HTMLElement | null)[]>([])
const username3 = ref<(HTMLElement | null)[]>([])
const username4 = ref<(HTMLElement | null)[]>([])

// ---- hook ----
onMounted(() => {
  const host = `https://${import.meta.env.APP_SIGNALING_SERVER_IP}:${import.meta.env.APP_SIGNALING_SERVER_PORT}`
  socket = io(host)
  socket.on('connect', () => {
    console.log('connect')
  })
})

// ---- method ----
const onJoin = async () => {
  const req: JoinRoomRequest =  {
    roomName: roomName.value,
    userName: userName.value
  }
  const resp: JoinRoomResponse = await socket.emitWithAck(CLIENT_REQ.JOIN_ROOM, req)
  // 创建设备对象, 加载网络协商能力
  device = new Device()
  await device.load({
    routerRtpCapabilities: resp.routerRtpCapabilities,
  })

  console.log(resp)

  // 创建 consumer transport 前 5 个
  await requestTransportToConsume(resp, socket, device)
  openFeedStatus.value = true
}

const onEnableFeed = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  })
  localVideo.value!.srcObject = localStream
  openFeedStatus.value = false
  sendFeedStatus.value = true
}

const onSendFeed = async () => {
  producerTransport = await createProducerTransport(socket, device)
  const producer = await createProducer(localStream, producerTransport)
  videoProducer = producer.videoProducer
  audioProducer = producer.audioProducer

  sendFeedStatus.value = false
  toggleStatus.value = true
  hangupStatus.value = true
}

const onToggleMute = () => {
  if (audioProducer.paused) {
    audioProducer.resume()
    isMuted.value = false
  } else {
    audioProducer.pause()
    isMuted.value = true
  }
}

const onHangUp = () => {
  hangupStatus.value = false
}

// ---- computed ----
const muteText = computed(() => (isMuted.value ? '开启音频' : '关闭音频'))
const muteButtonType = computed(() => (isMuted.value ? 'danger' : 'success'))
</script>

<style scoped>
/* 基础容器 */
.base-container {
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
