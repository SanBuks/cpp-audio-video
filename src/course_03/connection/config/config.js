// 全局配置
const config = {
  port: 3030,

  workerSettings: {
    logLevel: 'warn',
    rtcMinPort: 10000,
    rtcMaxPort: 11000,
    logTags: [
      "info",
      "ice",
      "dtls",
      "rtp",
      "srtp",
      "rtcp"
    ],
  },

  routerMediaCodecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2
    },
    {
      kind: "video",
      mimeType: "video/H264",
      clockRate: 90000,
      parameters:
        {
          "packetization-mode": 1,
          "profile-level-id": "42e01f",
          "level-asymmetry-allowed": 1
        }
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      clockRate: 90000,
      parameters: {},
    }
  ]
}

module.exports = config