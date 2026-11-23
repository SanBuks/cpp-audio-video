// 客户端请求消息
export const CLIENT_REQ = {
  JOIN_ROOM: 'join-room',                 // 加入房间
  CREATE_TRANSPORT: 'create-transport',   // 创建传输 producer / consumer
  CONNECT_TRANSPORT: 'connect-transport', // 连接传输 producer / consumer
  START_PRODUCE: 'start-producing',       // 开始 produce
  AUDIO_CHANGE: 'audio-change',           // 音频状态改变
  CONSUME_MEDIA: 'consume-media',         // 创建 consumer
  CONSUME_UNPAUSE: 'consume-unpause',     // 恢复 consume
} as const

// 服务器回应消息
export const CLIENT_ANS = {
  NEW_PRODUCER: 'new-producer'
}

export type ClientReqType = (typeof CLIENT_REQ)[keyof typeof CLIENT_REQ]
export type ClientAnsType = (typeof CLIENT_ANS)[keyof typeof CLIENT_ANS]
