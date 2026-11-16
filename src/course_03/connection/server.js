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

// 创建 mediasoup workers
const createWorkers = require('./createWorkers')
const config = require('./config/config')


let workers = null
let router = null

// 初始化 mediasoup
const initMediasoup = async () => {
  workers  = await createWorkers()
  router = await workers[0].createRouter({
    mediaCodecs: config.routerMediaCodecs
  })
  console.log(router)
}

initMediasoup()

// 通过 https 服务 创建 socketio
const io = socketio(httpsServer, {
  cors: [`https://localhost:${config.port}`]
})

io.on('connect', socket => {
  // 返回 rtpc
  socket.on('getRtpCap', ack=> {
    ack(router.rtpCapabilities)
  })
})

httpsServer.listen(config.port)

