<template>
  <h1>智能管控会议系统</h1>

  <el-row :gutter="10">
    <el-col :span="12">
      <el-input v-model="roomId" type="text" placeholder="请输入房间号"/>
    </el-col>
    <el-col :span="12">
      <el-button @click="join"> 加入</el-button>
      <el-button @click=""> 离开</el-button>
    </el-col>
  </el-row>
  <el-row :gutter="10">
    <el-col :span="12">
      <video ref="localVideo" autoplay muted playsinline> 本地窗口</video>
    </el-col>
    <el-col :span="12">
      <video ref="remoteVideo" autoplay playsinline> 远端窗口</video>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import {WebRTCEngine} from "@/utils/video";

let localVideo = ref()        // 本地窗口控件
let remoteVideo = ref()       // 远程窗口控件
let roomId = ref<string>('')  // 房间号码
let engine = ref<WebRTCEngine | null>(null);
let localStream: MediaStream | null = null  // 本地流

// 进入会议
function join () {
  initLocalStream()
}

// 初始化本地流
function initLocalStream() {
  let eng = engine.value
  if (eng === null) {
    alert("ws 连接未建立!");
    return;
  }
  let rid = roomId.value
  if (rid === null || rid === '') {
    alert("请输入房间号!");
    return;
  }

  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: {
      width: { ideal: 640 },
      height: { ideal: 360 },
      frameRate: { ideal: 30 }
    },
  }).then((stream: MediaStream) => {
      eng.doJoin(rid)
      console.log('Open local stream');
      localVideo.value.srcObject = stream;
      localStream = stream;
    }
  ).catch((e) => {
      alert("getUserMedia() error: " + e.name);
  })
}

onMounted(() => {
  engine.value = new WebRTCEngine("ws://localhost:8099");
  engine.value.createWebsocket();
})
</script>

<style scoped>
</style>