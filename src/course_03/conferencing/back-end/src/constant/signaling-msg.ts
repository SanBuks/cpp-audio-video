export const MSG = {
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  CREATE_WEBRTC_TRANSPORT: 'create-webrtc-transport',
  CONNECT_WEBRTC_TRANSPORT: 'connect-webrtc-transport',
  PRODUCE: 'produce',
  CONSUME: 'consume',
} as const

export type MsgType = (typeof MSG)[keyof typeof MSG]
