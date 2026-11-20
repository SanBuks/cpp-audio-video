import { Socket } from 'socket.io-client'
import  {CLIENT_REQ} from '@/constant/signaling-msg.ts'
import type { Device } from 'mediasoup-client'
import type { Producer, Transport } from 'mediasoup-client/types'

// 会议系统工具类

// 创建 producer transport
export async function createProducerTransport(socket: Socket, device: Device): Promise<Transport> {

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
  })

  return producerTransport
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

  console.log('videoProducer producing')
  const videoProducer = await producerTransport.produce({ track: videoTrack })
  console.log('audioProducer producing')
  const audioProducer = await producerTransport.produce({ track: audioTrack })
  console.log('audio-video Producer produced')
  return { videoProducer, audioProducer }
}
