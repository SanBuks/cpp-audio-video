- "mediasoup-client": "^3.15.0",
- "socket.io-client": "^4.8.1"
- socket 连接存在重连, 需要避免 socket 绑定多个事件

# 过程
- 项目基础搭建
- join-room 事件处理
- Client 类
  - userName
  - socket(1) - client(1)  用户 一个 tab 只维持一个 socket
  - room(n) - client(1)    用户可能参与多个房间中
  - upstreamTransport(1) - client(1)
  - downstreamTransport(n) - client(1)
  - producer_va(1) - client(1) 
  - consumers_va(n) - client(1)
- Room 类
  - roomName 
  - worker(1) - room(n)
  - router(1) - room(1)

- RTPObserver
- ActiveSpeakerObserver, on("dominantspeaker", newDominantSpeaker)