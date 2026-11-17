// 创建 webRtcTransport
const createTransport = async (router) => new Promise(async (resolve, reject) => {
  const transport = await router.createWebRtcTransport({
    enableUdp: true,
    enableTcp: true,  // 优先使用 udp
    preferUdp: true,
    listenInfos: [
      {
        protocol: 'udp',
        // ip: '127.0.0.1'
        ip: '0.0.0.0',
        announceAddress: '192.168.0.19'
      },
      {
        protocol: 'tcp',
        // ip: '127.0.0.1'
        ip: '0.0.0.0',
        announceAddress: '192.168.0.19'
      }
    ]
  })
  const clientTransportParams = {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  }
  resolve({transport, clientTransportParams})
})

module.exports = createTransport