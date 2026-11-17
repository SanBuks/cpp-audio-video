const fs = require('fs')
const https = require('https')
const express = require('express')
const mediasoup = require('mediasoup')
const socketio = require('socket.io')

// 创建 express 前端和后端服务
const app = express()
app.use(express.static(__dirname + '/public'))

// mkcrt 创建证书, 读取 ca 证书
const key = fs.readFileSync('./config/cert.key')
const cert = fs.readFileSync('./config/cert.crt')
const options = {key, cert}

// 通过 express 创建 https 服务
const httpsServer = https.createServer(options, app)

// 创建 mediasoup workers 工具函数
const createWorkers = require('./createWorkers')
// 创建 createTransport 工具函数
const createTransport = require('./createTransport')
// 配置
const config = require('./config/config')


let workers = null
let router = null

// 初始化 mediasoup
const initMediasoup = async () => {
  workers  = await createWorkers()
  router = await workers[0].createRouter({
    mediaCodecs: config.routerMediaCodecs
  })
  // console.log(router)
}

initMediasoup()

// 通过 https 服务 创建 socketio
const io = socketio(httpsServer, {
  cors: [`https://localhost:${config.port}`]
})

io.on('connect', socket => {
  // 这个示例只有一个 client 连接
  // 对应客户端的 producer
  let thisClientProducerTransport = null
  let thisClientProducer = null
  // 对应客户端的 consumer
  let thisClientConsumerTransport = null
  let thisClientConsumer = null

  // 返回 rtpc
  socket.on('getRtpCap', async ack => {
    ack(router.rtpCapabilities)
  })
  // 处理客户端建立 transport producer 请求, 返回 ice 相关信息
  socket.on('create-producer-transport', async ack => {
    const {transport, clientTransportParams} = await createTransport(router)
    thisClientProducerTransport = transport
    ack(clientTransportParams)
  })

  // 处理客户端建立 transport consumer 请求, 返回 ice 相关信息
  socket.on('create-consumer-transport', async ack => {
    const {transport, clientTransportParams} = await createTransport(router)
    thisClientConsumerTransport = transport
    ack(clientTransportParams)
  })

  // 处理客户端 producer transport 建立连接请求
  socket.on('connect-producer-transport', async (dtlsParameters, ack) => {
    try {
      await thisClientProducerTransport.connect(dtlsParameters)
      ack("success")
    } catch (err) {
      console.log(err)
      ack("error")
    }
  })
  // 处理客户端 consumer transport 建立连接请求
  socket.on('connect-consumer-transport', async (dtlsParameters, ack) => {
    try {
      await thisClientConsumerTransport.connect(dtlsParameters)
      ack("success")
    } catch (err) {
      console.log(err)
      ack("error")
    }
  })

  // 处理客户端 produce 请求, 调用 transport.produce(), 返回 producer.id
  socket.on('start-producing', async({kind, rtpParameters}, ack) => {
    try {
      thisClientProducer = await thisClientProducerTransport.produce({kind, rtpParameters})
      ack(thisClientProducer.id)
    } catch (err) {
      console.log(err)
      ack("error")
    }
  })

  // 处理客户端 consume 请求, 调用 transport.consume(), 返回
  socket.on('consume-media', async({rtpCapabilities}, ack) => {

    if (!thisClientProducer) {
      ack("noProducer")
      return
    }
    if (!router.canConsume({producerId: thisClientProducer.id, rtpCapabilities})) {
      ack("cannotConsume")
      return
    }

    try {
      thisClientConsumer = await thisClientConsumerTransport.consume({
        producerId: thisClientProducer.id,
        rtpCapabilities,
        paused: true,
      })
      let consumerParams = {
        id: thisClientConsumer.id,
        producerId: thisClientProducer.id,
        kind: thisClientConsumer.kind,
        rtpParameters: thisClientConsumer.rtpParameters,
      }
      ack(consumerParams)
    } catch (err) {
      console.log(err)
      ack("error")
    }
  })

  socket.on("unpause-consumer", async(ack) => {
    await thisClientConsumer.resume()
    ack("start living!")
  })
})

httpsServer.listen(config.port)

