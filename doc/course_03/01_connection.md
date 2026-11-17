# 4 
- nodemon
- mkcert
- vite

# 5 
- app 
  - mkcert, express, https, socket.io
  - config, createWorkers, initMediasoup
  - mediasoup.createWorker() 参数
  - worker.on('died')
- router 
  - routerMediaCodecs, createRouter
- initconnect
  - socket = io()
- device 
  - mediasoup-client 
  - new mediasoupClient.Device()
  - socket.emitWithAck('getRtpCap')
  - device.load({routerRtpCapabilities})
  - server: ack(router.rtpCapabilities)

# 6 transport white board
- RTP/SRTP - UDP - DTLS 
- HTTP/HTTPS - TCP - TLS
- transport 只能是单向的, 对等的
- 创建 producer transport
  - client: 通过 socket.io 发送请求, 请求 transport 相关参数 ICE, SRTP, DTLS 相关参数
    - 获取 ICE 参数
    - 获取 ICE candidate 寻找 网络连接路径 
    - 获取 DTLS 参数
  - server: 创建 transport, 具有 ICE, SRTP, DTLS 相关参数, 监听两个事件(connect, produce), 最后回应 client (transport 还未连接)
  - client: 创建 transport, 监听两个事件(connect, produce), 创建 DTLS, 向服务器发送信令
  - server: 调用 connect 建立连接, RTP, DTLS

# 016 Create Server Producer Transport
# 017 Create Client Producer Transport
- client: localstream, ask-for create-producer-transport 
- server: router.createWebRtcTransport, ack clientTransportParams 

# 018 Connect Producer Transport And Produce
- client: 
  - track, localStream.getVideoTracks()[0]
  - producerTransport.produce({track})
  - connect event
  - produce event
- server:
  - connect-transport signaling
  - start-producing signaling

# 019 Create Consumer Transport
- createTransport 工具函数抽取
- client: 
  - device.createRecvTransport()
  - consumerTransport.on("connect", ...)
- server: 
  - socket.on('create-consumer-transport', ...) 
  - socket.on('connect-consumer-transport', ...) 

# 020 Consume!
- client: 
  - socket.emitWithAck('consume-media', ...) 
  - await consumerTransport.consume(consumerParams)
  - await socket.emitWithAck("unpause-consumer")
- server:
  - socket.on('consume-media', ...)
  - router.canConsume
  - thisClientConsumerTransport.consume()
  - ack(consumerParams)

# 调试相关
- 查看地址: `chrome://webrtc-internals`
- 文档: mdn-doc, MediaStream 
- 增加状态监听回调
  - track.addEventListener("ended", cb) 
  - track.onmute = cb 
  - track.onunmute = cb 
  - consumerTransport.on("connectionstatechange", ...) 
  - consumerTransport.on("icegatheringstatechange", ...)