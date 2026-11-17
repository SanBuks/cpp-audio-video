
let socket = null
let device = null
let localStream = null
let producerTransport = null
let producer = null
let consumerTransport = null
let consumer = null

function initConnect() {
  socket = io("https://localhost:3030")
  connectButton.innerHTML = "connecting..."
  connectButton.disabled = true
  addSocketListeners()
}

function addSocketListeners() {
  socket.on('connect', () => {
    connectButton.innerHTML = "connected"
    deviceButton.disabled = false
  })
}

async function deviceSetup() {
  device = new mediasoupClient.Device()
  const routerRtpCapabilities =  await socket.emitWithAck('getRtpCap')
  console.log(routerRtpCapabilities)
  await device.load({routerRtpCapabilities})
  deviceButton.disabled = true
  createProdButton.disabled = false
  console.log(`device load status: ${device.loaded}`)
}

async function createProducer() {
  // 打开本地流
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    })
    localVideo.srcObject = localStream
  } catch(err) {
    console.log(`create producer error: ${err}`)
  }

  // 从信令服务器获取 transport 信息
  let {id, iceParameters, iceCandidates, dtlsParameters} = await socket.emitWithAck('create-producer-transport')

  // 创建 client 端 send transport
  producerTransport = device.createSendTransport({id, iceParameters, iceCandidates, dtlsParameters})

  // 监听 connect 事件, transport.produce() 调用触发
  producerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    console.log('producerTransport connected')

    // 发送 producer transport 建立连接请求
    const resp = await socket.emitWithAck('connect-producer-transport', {dtlsParameters})
    if (resp === "success") {
      // 处理成功一定要调用 callback 通知, 触发 produce 事件
      callback()
    } else if (resp === "error") {
      // 处理失败一定要调用 errback 通知, 将错误向上传播到 mediasoup 客户端内部
      // 底层立即中止本次连接尝试, 并将这个错误抛给发起 produce() 的调用者
      errback()
    }
    console.log(resp)
  })

  // 监听 produce 事件
  producerTransport.on("produce", async (parameters, callback, errback) => {
    console.log('producerTransport produced')
    const { kind, rtpParameters} = parameters
    const resp = await socket.emitWithAck('start-producing', {kind, rtpParameters})
    if (resp === 'error') {
      errback()
    } else {
      callback({id: resp})
    }
    publishButton.disabled = true
    createConsButton.disabled = false
  })

  createProdButton.disabled = true
  publishButton.disabled = false
}

async function createConsumer() {
  // 从信令服务器获取 transport 信息
  let {id, iceParameters, iceCandidates, dtlsParameters} = await socket.emitWithAck('create-consumer-transport')

  // 创建 client 端  recv transport
  consumerTransport = device.createRecvTransport({
    id, iceParameters, iceCandidates, dtlsParameters
  })

  // 监听 connect 事件, transport.consume() 调用触发
  consumerTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    console.log('consumerTransport connected')

    // 发送 transport 建立连接请求
    const resp = await socket.emitWithAck('connect-consumer-transport', {dtlsParameters})
    if (resp === "success") {
      callback()
    } else if (resp === "error") {
      errback()
    }
    console.log("consumer transport connected")
  })

  // 显示 transport 连接状态
  consumerTransport.on("connectionstatechange", async (state) => {
    console.log('... connectionstatechange ...')
    console.log(state)
  })

  // 显示 ice 连接状态
  consumerTransport.on("icegatheringstatechange", async (state) => {
    console.log('... icegatheringstatechange ...')
    console.log(state)
  })

  createConsButton.disabled = true
  consumeButton.disabled = false
}

async function publish() {
  const track = localStream.getVideoTracks()[0]
  producer = await producerTransport.produce({track})
}

async function consume() {
  const consumerParams = await socket.emitWithAck('consume-media', {rtpCapabilities: device.rtpCapabilities})

  if (consumerParams === "noProducer") {
    console.log("no producer to consume")
    return;
  } else if (consumerParams === "cannotConsume") {
    console.log("rtp capability check fail, cannot consume")
    return;
  }
  consumer = await consumerTransport.consume(consumerParams)
  const {track} = consumer

  // 监听轨道事件
  track.addEventListener("ended", () => {
    console.log("Track has ended")
  })
  track.onmute = () => {
    console.log("Track has muted")
  }
  track.onunmute = () => {
    console.log("Track has unmuted")
  }

  remoteVideo.srcObject = new MediaStream([track])
  console.log("track is ready!")
  const resp = await socket.emitWithAck("unpause-consumer")
  console.log(resp)
  console.log(track)

  consumeButton.disabled = true
  disconnectButton.disabled = false
}
