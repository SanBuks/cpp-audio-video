import { Socket } from 'socket.io-client'
import  {CLIENT_REQ} from '@/constant/signaling-msg.ts'
import type { Device } from 'mediasoup-client'
import type { Producer, Transport } from 'mediasoup-client/types'
import type { JoinRoomResponse } from "@/type/conf-type.ts";

// 会议系统工具类

// 创建 producer transport
export async function createProducerTransport(
  socket: Socket,
  device: Device
): Promise<Transport> {

  // 创建 transport
  const reqParam = { type: 'producer' }
  const producerTransportParams = await socket.emitWithAck(CLIENT_REQ.CREATE_TRANSPORT, reqParam)
  const producerTransport = device.createSendTransport(producerTransportParams)

  // 监听 connect 事件
  producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    const resp = await socket.emitWithAck(CLIENT_REQ.CONNECT_TRANSPORT, {dtlsParameters, type: 'producer'})
    if (resp === 'success') {
      callback()
    } else {
      errback(new Error(`${CLIENT_REQ.CONNECT_TRANSPORT} 请求失败`))
    }
  })

  // 监听 produce 事件
  producerTransport.on('produce', async (parameters, callback, errback) => {
    const { kind, rtpParameters} = parameters
    const resp = await socket.emitWithAck(CLIENT_REQ.START_PRODUCE, {kind, rtpParameters})
    if (resp === 'error') {
      errback(new Error(`${CLIENT_REQ.START_PRODUCE} 请求失败`))
    } else {
      callback({ id: resp })
    }
    // 打印发送包信息
    // setInterval(()=>printStats(producerTransport), 1000)
  })

  return producerTransport
}

// 创建 consumer transport
export async function createConsumerTransport(

): Promise<Transport> {

}


// 创建 producer
export async function createProducer(
  localStream: MediaStream,
  producerTransport: Transport,
): Promise<{ videoProducer: Producer; audioProducer: Producer }> {

  const videoTrack = localStream.getVideoTracks()[0]
  const audioTrack = localStream.getAudioTracks()[0]

  if (!videoTrack || !audioTrack) {
    const missing = [!videoTrack && 'video', !audioTrack && 'audio'].filter(Boolean).join(' / ')
    throw new Error(`createProducers(): localStream 缺少 ${missing} track`)
  }

  // TODO 部分 track produc 失败问题处理
  // TODO 只包含 video 问题处理

  const videoProducer = await producerTransport.produce({ track: videoTrack })
  const audioProducer = await producerTransport.produce({ track: audioTrack })
  return { videoProducer, audioProducer }
}

// 创建 consumer
export async function createConsumer(

): Promise<void> {

}

// 周期打印收发包信息
export async function printStats(transport: Transport) {
  const stats = await transport.getStats()
  for (const report of stats.values()) {
    // 打印发送包数据
    if (report.type === 'transport') {
      console.log(`webrtc-transport: bytes sent ${report.bytesSent} - packets sent ${report.packetsSent}`)
    }
  }
}

/**
 * 创建连接并拉流, 有两种 Transport 架构方案(这里选择第一种):
 * ```text
 * 方案一: 1 Transport - 1 Consumer
 * 优点: 更精细的网络控制, 若某一个端连接失败或不稳定, 不会影响其他流的传输
 * 缺点: 信令交互和状态管理逻辑较复杂
 *
 * 方案二: 1 Transport - N Consumer
 * 优点: 代码逻辑简单, 对服务器来说更加高效（潜在）
 *       每个客户端仅需维护一个 upstream transport 和一个 downstream transport
 *       n 个客户端, 服务端仅需维护 2n 个 transport
 * 缺点: 网络控制不够精细, 存在单点故障风险
 * ```
 * @param consumeData 拉流所需的参数
 * @param socket Socket.IO
 * @param device Device 实例
 */
export async function requestTransportToConsume(
  consumeData: JoinRoomResponse,
  socket: Socket,
  device: Device) : Promise<void> {

  for (const audioPid of consumeData.audioPidsToCreate) {
    const i = consumeData.audioPidsToCreate.indexOf(audioPid);
    const videoPid = consumeData.videoPidsToCreate[i]
    if (!videoPid) continue;
    const consumeTransportParams = await socket.emitWithAck(CLIENT_REQ.CREATE_TRANSPORT, { type: "consumer", audioPid})
    console.log(consumeTransportParams)
  }
}

