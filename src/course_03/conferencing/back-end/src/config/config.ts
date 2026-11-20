import type { RouterRtpCodecCapability, TransportListenInfo } from 'mediasoup/types'

export interface AppConfig {
  ip: string
  port: number
  routerMediaCodecs: RouterRtpCodecCapability[]
  listenInfos: TransportListenInfo[]
  maxIncomingBitrate: number
  initialAvailableOutgoingBitrate: number
}

// 全局配置
export const config: AppConfig = {
  ip: '192.168.0.19',
  port: 3031,

  // 创建 router 相关配置
  routerMediaCodecs: [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: 'video',
      mimeType: 'video/VP8',
      clockRate: 90000,
      parameters: {
        'x-google-start-bitrate': 1000,
      },
    },
    {
      kind: 'video',
      mimeType: 'video/H264',
      clockRate: 90000,
      parameters: {
        'packetization-mode': 1,
        'profile-level-id': '42e01f',
        'level-asymmetry-allowed': 1,
      },
    },
  ],

  // 创建 transport 相关配置
  listenInfos: [
    {
      protocol: 'udp',
      ip: '0.0.0.0',
      announcedAddress: '192.168.0.19'
    },
    {
      protocol: 'tcp',
      ip: '0.0.0.0',
      announcedAddress: '192.168.0.19'
    }
  ],
  maxIncomingBitrate: 5_000_000,                 // 最大推流带宽
  initialAvailableOutgoingBitrate: 5_000_000     // 初始带宽
}

