# 获取流
- `navigator.mediaDevices.getUserMedia(constraints)`
- 在用户授权后从摄像头, 麦克风等设备采集媒体, 返回一个 MediaStream 对象, 包含视轨和音轨
- 返回一个 Promise, 调用后会触发浏览器的权限请求弹窗, 只有用户明确允许, Promise 才会成功解析
 
# 配置
- constraints 参数是一个 MediaStreamConstraints 对象, 核心成员是 video 和 audio, 至少指定其中一个
```js
const c1 = { video: true, audio: true }  // 基础配置
const c2 = {                             // 更详细的配置
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  },
  audio: true
}
// 其他参数

// deviceId: 指定具体设备(通常配合 enumerateDevices() 使用)
// 音频方面: 
// echoCancellation(回声消除)
// noiseSuppression(降噪)
// autoGainControl(自动增益)
// sampleRate 
```

- 返回错误名
  - NotAllowedError / PermissionDeniedError	用户拒绝授权
  - NotFoundError	没有匹配的摄像头或麦克风
  - NotReadableError	设备存在但无法被读取（被其他程序占用等）
  - SecurityError	非安全上下文等安全问题
- 最佳实践: 
  - 在用户进入正式通话前, 提供一个"设备设置"或"等候室"页面, 让用户在低压力环境下完成权限授权和设备选择, 可以显著减少因权限拒绝导致的通话失败
  - getUserMedia() 仅在安全上下文(HTTPS) 中可用, localhost 通常也被视为安全上下文, 所以本地开发一般不受影响

# 赋予流
- 获取流 `const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });`
- 获取控件 `const videoElement = document.querySelector("video");`
- 赋予 srcObject `videoElement.srcObject = stream;`
- 自动播放 `videoElement.autoplay = true;`

# audio 与 video 控件
- 共享属性
  - controls  显示浏览器自带的播放控件(播放/暂停, 进度条, 音量等), 自定义 UI 的生产环境中, 通常会移除 controls
  - autoplay  媒体就绪后尝试自动播放(浏览器可能拦截)
  - muted  静音播放
  - loop  循环播放
  - preload  预加载策略: auto / metadata / none
  - poster(video 特有)  视频加载前显示的占位图
  - src  媒体资源 URL(但 WebRTC 场景更常用 srcObject)
- 状态属性
  - paused(只读), ended(只读)
  - currentTime:当前播放位置(秒), 可写, 可用于 seek
  - duration(只读): 总时长
  - volume, muted
  - playbackRate: 播放速率
  - buffered(只读): 已缓冲的时间范围
- 常用方法
  - play(): 开始/恢复播放(返回 Promise, 可能因自动播放策略被拒绝)
  - pause(): 暂停
  - load(): 重新加载媒体源
- 常用事件
  - loadstart / progress / loadeddata  加载生命周期
  - canplay  数据足以开始播放
  - play / pause  播放状态变化
  - timeupdate  播放位置变化（进度条更新的核心事件）
  - ended  播放结束
  - error  加载或播放出错
 