# 1
- 历史
  - 2000 网络泡沫
  - 2003 skype
  - 2010 IPhone-FaceTime Android-GoogleChat
  - 2011 WebRTC
  - 2015 Mediasoup
  - 2019 Mediasoup v3
- 缺点: 
  - 连接太多, 无法超过 5 个人以上
  - 无中央控制, 无拥塞控制 
# 2
doc
# 3
- server
  - worker: 一个线程, 管理多个router (CPU 核心相关)
  - router: 请求入口, 管理多个 transport
  - transport: 与客户端连接的组件, 含有 consumer, producer, 只能有多个 consumer 或 producer, 不能混合
  - producer: 客户端音视频流, 注入 router
  - consumer: 拉流
- client
  - device: 连接一个 router
  - transport
  - producer/consumer

- 过程
  - signaling server (socket.io)
  - sfu (mediasoup)
    - 服务器: 创建 worker create 
    - 服务器: 创建 router, 放入 rtp capability (媒体编编解码器) 
    - 客户端: device, socket.io, 请求连接
    - 服务器: 返回 rtp capability (ice candidate)
    - 客户端: transport, 请求 transport
    - 服务器: transport, 回应 dtls 密钥 (此时还未建立连接)
    - 客户端: device 连接 transport, 创建 producer, 发送 track 请求, 建立连接, 附带另一半 dtls 密钥
    - 服务器: 将 router 连接到 device 上, 建立连接
    - 客户端: produce 请求
    - 服务器: 创建 producer, 回应 ID
    - router - device 之间传递数据
    - 客户端创建 consumer 也是一样的逻辑, 省去 rtpc 过程, 需要重新创建 transport 

