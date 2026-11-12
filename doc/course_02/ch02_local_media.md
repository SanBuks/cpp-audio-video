# 1. 媒体流 MediaStream
## 媒体流介绍
- 媒体流是信息的载体, 代表了一个媒体设备的内容流
  - 媒体流可以被采集, 传输和播放
  - 通常一个媒体流包含多个媒体轨道, 如音频轨道, 视频轨道
- 获取媒体流方式
  - 摄像头或者话筒获取流对象
  - 屏幕共享获取流对象
  - canvas(HTMLCanvasElement) 内容中获取流对象
  - 媒体元素(HTMLMediaElement) 获取流对象
 
## MediaStream 构造函数
- 创建一个空媒体流 `new MediaStream();` 
- 从stream中复制媒体流 `new MediaStream(stream);`
- 创建包含多个指定轨道的媒体流 `new MediaStream(tracks[]);`

## MediaStream 属性 
- active: 活跃状态
- id: UUID

## MediaStream 方法 
- addTrack(track: MediaStreamTrack) 该方法向媒体流中加入新的媒体轨道
- clone() 返回当前媒体流的副本, 副本具有不同且唯一的标识
- getAudioTracks() 返回媒体种类为 audio 的媒体轨道对象数组, 数组的顺序是不确定的, 每次调用都可能不同 
- getVideoTracks() 返回媒体种类为 video 的媒体轨道对象数组, 数组的顺序是不确定的, 每次调用都可能不同 
- getTracks() 返回所有媒体轨道对象数组, 数组的顺序是不确定的, 每次调用都可能不同 
- getTrackById(id) 返回指定 ID 的轨道对象, 如果存在多个相同ID的轨道, 该方法返回匹配到的第一个轨道
```js
navigator.mediaDevices
.getUserMedia({audio: true, video: true}) 
.then(mediaStream => { 
  document.querySelector('video').srcObject = mediaStream; 
  // 5s后, 停止播放第一个音频轨道 
  setTimeout(() => { 
    const tracks = mediaStream.getAudioTracks() 
    tracks[0].stop() 
  }, 5000) 
})

navigator.mediaDevices
.getUserMedia({video: true}) 
.then(mediaStream => { 
  document.querySelector('video').srcObject = mediaStream; 
  const track = mediaStream.getVideoTracks()[0]; 
  // 截取图片 
  const imageCapture = new ImageCapture(track); 
  return imageCapture; 
})

stream.getTrackById("primary-audio-track").applyConstraints({ volume: 0.5 });
```

## MediaStream 事件
- addtrack 当有新的媒体轨道加入时触发该事件, 对应事件句柄 onaddtrack
  - 注意, 只有在如下情况下, 才会触发该事件, 主动调用 addTrack() 方法则不会触发, 可以用 addEventListener() 监听
  - RTCPeerConnection 重新协商
  - HTMLMediaElement.captureStream() 返回新的媒体轨道
- removetrack 当有媒体轨道被移除时触发该事件, 对应事件句柄 onremovetrack
  - 注意, 只有在如下情况下才会触发该事件, 主动调用 removeTrack() 方法则不会触发
  - RTCPeerConnection 重新协商
  - HTMLMediaElement.captureStream() 返回新的媒体轨道
```js
stream.onaddtrack = (event: MediaStreamTrackEvent) => { 
  let trackList = document.getElementById("tracks"); 
  let label = document.createElement("li"); 
  label.innerHTML = event.track.kind + ": " + event.track.label; 
  trackList.appendChild(label); 
}; 
```

# 2. 媒体轨道 MediaStreamTrack
## 媒体轨道介绍
- 媒体流由媒体轨道构成
- 媒体轨道则代表着一个能够提供媒体服务的媒体, 如音频, 视频等

## MediaStreamTrack 属性
- enabled: 可写, 表示有效状态, 表示轨道有效, 可以被渲染
  - false 表示轨道失效, 被渲染时将会出现静音或黑屏
  - 设置值为 false 可以实现静音效果, 与 mute 方法相同 
- id: UUID
- kind: 内容种类, audio 表示音频, video 表示视频
- label: 表示媒体轨道的来源, 在没有媒体源与媒体轨道连接的情况下会为空
- muted: 是否处于静音状态, 当视频轨道处于静音状态时, 则会表现为黑屏
- readyState: 就绪状态 
  - live, 表示输入媒体源已经连接, 可以正常提供媒体数据 
  - ended, 表示输入媒体源处于结束状态，不能再提供新的媒体数据。

## MediaStreamTrack 方法
- applyConstraints(constraints) 该方法为媒体轨道指定约束条件
  - constraints 可选参数, 包含了准备应用到媒体轨道里的所有约束需求, 未在需求中指定的约束将使用默认值
  - constraints 为空, 则会清除当前轨道所有的自定义效果, 全部使用默认值
  - 返回值: Promise, 决议失败时返回 MediaStreamError, 当指定的约束太严格时, 可能会导致失败
- clone() 获取媒体轨道的副本, 新的轨道具有不同的ID值
- getCapabilities() 获取媒体轨道的能力集, MediaTrackCapabilities对象
- getConstraints() 获取最近一次自定义约束, 包含了媒体轨道的约束 
- getSettings() 获取媒体轨道约束的当前值, MediaTrackSettings 对象
- stop() 用于停止播放当前媒体轨道
  - 如果多个媒体轨道与同一个源相连, 停止某个轨道不会导致源终止, 只有当所有相连媒体轨道都停止时, 媒体源才会停止
  - 调用该方法后, 属性 readyState 将被设置为 ended
```js
// 约束指定了视频的宽, 高和宽高比
const constraints = { 
  width: {min: 640, ideal: 1280}, 
  height: {min: 480, ideal: 720}, 
  aspectRatio: { ideal: 1.7777777778 } 
}; 
 
navigator.mediaDevices.getUserMedia({ video: true }) 
.then(mediaStream => { 
  const track = mediaStream.getVideoTracks()[0]; 
  track.applyConstraints(constraints) 
  .then(() => { 
    // 成功应用了约束条件 
    console.log('successed!'); 
  }).catch(e => { 
    // 不能满足约束条件 
    console.log('applyConstraints error, error name: ' + e.name); 
  }); 
});
```


## MediaStreamTrack 事件
- ended 当媒体轨道结束时, 触发该事件, 此时属性 readyState 取值变为 ended, 对应事件句柄 onended
  - 以下情况会触发该事件
    - 媒体源没有更多数据
    - 用户注销了相关媒体设备的访问权限
    - 媒体源设备被移除
    - 当媒体源来自对等端时, 意味着对等端永久性终止了数据发送
- mute 当属性 mute 被设置为 true 时触发该事件, 表明媒体轨道暂时不能提供数据, 对应事件句柄onmute
- unmute 当属性 mute 被设置为 false 时触发该事件, 表明媒体轨道可以正常提供数据, 对应事件句柄onunmute

# 3. 媒体约束 MediaConstraints
## 媒体约束介绍
- 媒体约束, 媒体能力, 媒体约束设定值理解起来容易混淆
  - 媒体约束(MediaTrackConstraints/MediaStreamConstraints) 是指媒体某一项技术特性, 如分辨率, 帧率等
  - 媒体能力(MediaTrackCapabilities) 是当前设备能够支持的某个约束的量化指标, 如帧率最高 30
  - 媒体约束设定(MediaTrackSettings) 是指包含了浏览器默认设定值的所有媒体约束
- MediaDevices.getSupportedConstraints() 获取当前浏览器支持的约束数组
- MediaStreamTrack.getCapabilities() 有了支持的约束数组, 使用该方法获取这些约束的取值范围
- MediaStreamTrack.applyConstraints() 根据应用程序的需要, 调用该方法为约束指定自定义的值
- MediaStreamTrack.getConstraints(): 获取上述 applyConstraints() 方法传入的值
- MediaStreamTrack.getSettings(): 获取当前轨道上所有约束的实际值

## 媒体约束类型
- 媒体约束包括 媒体流约束(MediaStreamConstraints) 和 媒体轨道约束(MediaTrackConstraints)
- 媒体流约束 MediaStreamConstraints
  - video 是否请求视频
  - audio 是否请求音频
- 媒体轨道约束 MediaTrackConstraints

## 数据类型与用法
- 通常为约束指定值时, 既可以指定具体值也可以指定一个对象
  - 在对象中包含 exact 或 ideal 属性, 用来告诉浏览器该约束的确切值和理想值
  - 有的约束还支持在对象中指定最小值 min 或最大值 max
```js
const constraints = { 
  width: {min: 320, ideal: 1280, max: 1920}, 
  height: {min: 240, ideal: 720, max: 1080}, 
}; 
```

## 通用约束
## 视频约束
## 音频约束
## 屏幕共享约束
## 图像约束

## 约束进阶属性
```js
const constraints = {
  // 基础约束 (Basic Constraints)
  width: { min: 640, ideal: 1280 },
  height: { min: 480, ideal: 720 },
  // 高级约束 (Advanced Constraints)
  advanced: [
    { width: 1920, height: 1280 }, // 首选方案: 全高清
    { aspectRatio: 4/3 }           // 备选方案: 4:3
  ]
};
```
- min / max 硬边界: 最先检查, 不满足直接失败 OverconstrainedError
- 基础 ideal 软期望: 最后层检查, 在所有 advanced 方案都失败后的最终保底选择, 浏览器会选用最接近的值
- advanced 优先方案: 在满足基础约束后, 优先于基础 ideal 被尝试, 继续尝试数组中的下一个方案

# 4. 媒体设备 MediaDevicesInfo 
## 4.1 WebRTC 隐私和安全
- WebRTC 使用 navigator.mediaDevices 接口访问与浏览器相连的媒体设备, 该接口提供了访问摄像头, 话筒以及屏幕共享的入口 API
- WebRTC 为了保护用户的隐私, 必须在安全的内容中使用
  - 使用 HTTPS/TLS 加载的页面内容
  - 从本地 localhost/127.0.0.1 加载的页面内容
- 如果在不安全的内容中使用 WebRTC, navigator.mediaDevices 值为 undefined, 此时访问 getUserMedia() 将会报错
- 在第一次打开媒体设备时, getUserMedia 会弹出请求授权的提示框, 用户通过授权, 浏览器会记录授权结果, 同一域名不重复请求授权
- 浏览器会显示媒体设备使用和授权状态, 摄像头处于使用状态时, 硬件指示灯必须亮起, 另外浏览器通常会在 URL 地址栏中显示媒体设备的状态
- 在 iframe中 使用 WebRTC 时, 需要明确为该 frame 请求权限
  - `<iframe src="https://mycode.example.net/etc" allow="camera;microphone"></iframe>`

## 4.2 获取媒体流
- 获取摄像头与话筒对应的媒体流 `navigator.mediaDevices.getUserMedia(constraints);`
- 获取共享屏幕流 `navigator.mediaDevices.getDisplayMedia(constraints);` 
- 获取 Canvas 流 `canvas.captureStream(frameRate);` 
  - frameRate 视频帧率, 双精浮点值, 如果未指定参数, 则每次画布变化时都会捕获一个新帧
  - 如果取值为 0, 则不会自动捕获, 而是在调用 requestFrame() 方法时触发捕获
  - 返回 MediaStream 媒体流对象, 单一媒体轨道为 CanvasCaptureMediaStreamTrack
- 获取视频元素/音频元素流 `mediaElement.captureStream();`

## 4.3 媒体设备
- 列出所有可用的媒体设备 `navigator.mediaDevices.enumerateDevices();`
- 媒体设备类 MediaDevicesInfo 
- 监听媒体设备变化
  - `navigator.mediaDevices.addEventListener('devicechange', ()=>{});`
  - `navigator.mediaDevices.ondevicechange = (event) => { updateDeviceList(); }`

## 4.5 播放媒体流
- 将流对象赋值给视频元素的 srcObject 属性, 从而实现本地播放音视频

## 4.6 录制媒体流 MediaRecorder
### MediaRecorder 构造函数
- 构造 MediaRecorder 对象 `new MediaRecorder(stream: MediaStrem [, options: MediaRecorderOptions]);`
- MediaRecorderOptions
  - mimeType 指定录制流的编码格式
    - 调用 MediaRecorder.isTypeSupported() 方法检查当前浏览器是否支待指定的编码格式
    - 如果当前浏览器不支待指定的编码格式, 则该构造函数抛出异常NoiSupportedError
  - audioBitsPerSecond 指定录制流的音频码率
  - videoBitsPerSecond 指定录制流的视频玛率
  - bitsPerSecond 指定录制流中音视频的玛率, 用于替代上述两个属性
    - 如果这两个属性只指定了一个, 则将替代另外一个
  - audioBitrateMode 指定音频码率模式, 取值为 cbr 或 vbr 
    - cbr 指以固定码率进行编码
    - vbr 指以可变码率进行编码
### MediaRecorder 属性
### MediaRecorder 方法
### MediaRecorder 事件
