// 创建 webRtcTransport
const createTransport = async (router) => new Promise(async (resolve, reject) => {
  const transport = await router.createWebRtcTransport({
    enableUdp: true,
    enableTcp: true,  // 优先使用 udp
    preferUdp: true,
    listenInfos: [
      {
        protocol: 'udp',
        ip: '127.0.0.1'
      },
      {
        protocol: 'tcp',
        ip: '127.0.0.1'
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