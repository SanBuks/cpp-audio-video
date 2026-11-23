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


# 更新主讲人业务逻辑
- 两种触发场景
  - 新的最活跃主讲人出现
  - 新 producer 出现且总数不足 5, 此时 top 5 还没满, 应尽快让相关客户端消费新流

1. 从 activeSpeakerList 中取最近 5 个主讲人作为 current
2. 把所有其他已知主讲人取出来作为 muted
3. 遍历这个房间中的所有客户端 (每个客户端已有的 consumer 不同, 所以要逐个客户端计算: 哪些要静音、哪些要恢复、哪些要新建消费)
  - 遍历所有 muted, 每次迭代一个 pid
    - 找到任何不在前 5 的 producer, 并暂停它 对于 muted 对象来说
    - 如果该客户端有与 pid 匹配的 consumer(订阅过) 就静音它
    - 如果该客户端没有匹配 pid 的 consumer(没订阅过), 就什么也不做
  - 创建一个数组，用来处理当前客户端的新主讲人。
 
3.5 Create an array to handle a new speaker to the current client
解释：这个数组可叫 newSpeaker，收集该客户端需要新建 consumer/transport 的 pid。
3.6 Loop through currentSpeakers (top 5)
翻译：遍历 currentSpeakers，也就是前 5 个主讲人。
解释：对每个当前主讲人处理：恢复 producer、恢复已有 consumer，或为新客户端准备新建消费。
3.7 Resume the producer
翻译：恢复该 producer。
解释：当前 top 5 主讲人的 producer 应处于可转发状态。注意同样可能在客户端循环中重复调用。
3.8 If client has a consumer that matches pid, unpause
翻译：如果该客户端有匹配 pid 的 consumer，就取消暂停。
解释：该客户端之前消费过这个主讲人，但因为它曾不在 top 5 被暂停，现在恢复接收。
3.9 This happens because it has consumed before and paused
翻译：之所以这样做，是因为它之前消费过，并且被暂停过。
解释：有匹配 consumer 说明客户端曾订阅过该 producer，所以可以直接 unpause。
3.10 If no match, and NOT this user, add to newSpeaker array to prepare to create a transport to consume
翻译：如果没有匹配的 consumer，并且该主讲人不是这个用户本人，就把它加入 newSpeaker 数组，准备创建 transport 来消费。
解释：客户端还没订阅这个当前主讲人，且不能订阅自己，所以稍后要为它创建 consumer/transport。
3.11 If there are any pids in newSpeaker array for THIS client, add them to be processed outside of loop
翻译：如果这个客户端的 newSpeaker 数组里还有 pid，就把它们加入循环外待处理列表。
解释：不要在遍历客户端的大循环里直接异步创建 transport/consumer，而是收集起来，循环结束后统一处理。
4. Client loop is done, emit to all connected sockets to this room the new top 5 so front-end can update
翻译：客户端循环结束后，向该房间所有已连接 socket 发送新的前 5 名，以便前端更新。
解释：广播当前 top 5 主讲人列表，前端据此更新 UI，例如高亮当前主讲人。
5. Emit to each client who has at least one new transport, the list of producers to start transport/consuming
翻译：向每个至少有一个新 transport 的客户端发送 producer 列表，以启动 transport/消费。
解释：只给需要新建消费的客户端发送消息，告诉它要开始消费哪些 producer，避免给无关客户端发多余指令。
补充：We are storing the audio pid in activeSpeakerList, so that's what we'll have
翻译：我们在 activeSpeakerList 中存储的是音频 pid，所以拿到的就是这个。
解释：活跃主讲人检测基于音频，因此列表元素是音频 producer id。
补充：We need to get the cooresponding video pid and the userName for the front-end
翻译：我们需要获取对应的视频 pid 和 userName 供前端使用。
解释：音频 pid 用于判断活跃度；前端显示和订阅视频时，需要根据音频 pid 映射到对应的视频 pid 和用户名。cooresponding 应为 corresponding。