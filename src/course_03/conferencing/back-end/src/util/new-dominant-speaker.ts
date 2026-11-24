import { Room } from "@/model/Room.js";
import { ActiveSpeakerObserverDominantSpeaker } from "mediasoup/types";
import { Socket } from "socket.io";
import { Logger, getLogger } from '@/util/get-logger.js'
import { updateActiveSpeakers } from "@/util/update-active-speakers.js";
import { SERVER_REQ } from "@/constant/signaling-msg.js";

const logger: Logger = getLogger();

// 处理 主要发言者 事件
export async function newDominantSpeaker(
  ds: ActiveSpeakerObserverDominantSpeaker,
  room: Room,
  io: Socket
): Promise<void> {

  logger.info("---- ds ----", ds.producer.id)

  // 遍历房间中的活跃主讲人, 提到最前列表
  const idx = room.activeSpeakerList.findIndex(pid => pid === ds.producer.id)
  if (idx > -1) {
    const [pid] = room.activeSpeakerList.splice(idx, 1)
    room.activeSpeakerList.unshift(pid)
  } else {
    room.activeSpeakerList.unshift(ds.producer.id)
  }
  logger.info(room.activeSpeakerList)

  // 更细发言列表
  const newTransportsByPeer = await updateActiveSpeakers(room, io)
  // 找到 socket 发送 NEW_PRODUCER 消息
  for (const [socketId, audioPidsToCreate] of newTransportsByPeer.entries()) {
    console.log(socketId, audioPidsToCreate)
    const videoPidsToCreate = audioPidsToCreate.map(aPid => {
      const producerClient = room!.clients.find(c => c.producer?.audio?.id == aPid)
      const returnId = producerClient?.producer?.video?.id
      return returnId ? returnId : null
    })
    const associatedUserNames = audioPidsToCreate.map(aPid => {
      const producerClient = room!.clients.find(c => c.producer?.audio?.id == aPid)
      const returnName = producerClient?.userName
      return returnName ? returnName : null
    })
    io.to(socketId).emit(SERVER_REQ.NEW_PRODUCER, {
      routerRtpCapabilities: room!.router!.rtpCapabilities,
      audioPidsToCreate,
      videoPidsToCreate,
      associatedUserNames,
      activeSpeakerList: room!.activeSpeakerList.slice(0, 5)
    })
  }
}
