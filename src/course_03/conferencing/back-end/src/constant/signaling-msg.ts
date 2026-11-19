// 客户端请求消息
export const CLIENT_REQ = {
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  CREATE_WEBRTC_TRANSPORT: 'create-webrtc-transport',
  CONNECT_WEBRTC_TRANSPORT: 'connect-webrtc-transport',
  PRODUCE: 'produce',
  CONSUME: 'consume',
} as const

// 服务器回应消息
export const CLIENT_ANS = {
  NEW_PRODUCER: 'new-producer'
}

export type ClientReqType = (typeof CLIENT_REQ)[keyof typeof CLIENT_REQ]
export type ClientAnsType = (typeof CLIENT_ANS)[keyof typeof CLIENT_ANS]
