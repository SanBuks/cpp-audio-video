<template>
  <h1>智能管控会议系统</h1>

  <div id="buttons">
    <el-input v-model="roomId" type="text" placeholder="请输入房间号"/>
    <el-button @click="join"> 加入</el-button>
    <el-button @click=""> 离开</el-button>
  </div>
  <div id="videos">
    <video ref="localVideo" autoplay muted playsinline> 本地窗口</video>
    <video ref="remoteVideo" autoplay playsinline> 远端窗口</video>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue";

let localVideo = ref()   // 本地窗口控件
let remoteVideo = ref()  // 远程窗口控件
let roomId = ref(null)   // 房间号码

let localStream: MediaStream | null = null  // 本地流


// 进入会议
function join () {
  initLocalStream()
}

// 初始化本地流
function initLocalStream() {
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  }).then((stream: MediaStream) => {
      console.log('Open local stream');
      localVideo.value.srcObject = stream;
      localStream = stream;
    }
  ).catch((e) => {
      alert("getUserMedia() error: " + e.name);
  })
}
</script>

<style scoped>
</style>