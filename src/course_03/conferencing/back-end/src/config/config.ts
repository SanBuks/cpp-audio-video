import type { RouterRtpCodecCapability } from 'mediasoup/types'

export interface AppConfig {
  ip: string
  port: number
  routerMediaCodecs: RouterRtpCodecCapability[]
}

// 全局配置
export const config: AppConfig = {
  ip: '127.0.0.1',
  port: 3443,

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
}

