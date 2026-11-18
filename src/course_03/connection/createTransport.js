// 配置
const config = require('./config/config')

// 创建 webRtcTransport
const createTransport = async (router) => new Promise(async (resolve, reject) => {
  console.log(config.ip)

  const transport = await router.createWebRtcTransport({
    enableUdp: true,
    enableTcp: true,  // 优先使用 udp
    preferUdp: true,
    listenInfos: [
      {
        protocol: 'udp',
        // ip: '127.0.0.1',
        ip: '0.0.0.0',
        announcedAddress: config.ip
      },
      {
        protocol: 'tcp',
        // ip: '127.0.0.1',
        ip: '0.0.0.0',
        announcedAddress: config.ip
      }
    ]
  })
  // 检查 iceCandidates 里的 ip
  console.log('Server ICE Candidates:', transport.iceCandidates);

  const clientTransportParams = {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  }
  resolve({transport, clientTransportParams})
})

module.exports = createTransport