import { Room } from "@/model/Room.js";
import { ActiveSpeakerObserverDominantSpeaker } from "mediasoup/types";
import { Socket } from "socket.io";

export async function newDominantSpeaker(
  ds: ActiveSpeakerObserverDominantSpeaker,
  room: Room,
  io: Socket
): Promise<void> {
  // 遍历房间中的活跃主讲人, 提到最前列表
  const idx = room.activeSpeakerList.findIndex(pid => pid === ds.producer.id)
  if (idx > -1) {
    const [pid] = room.activeSpeakerList.splice(idx, 1)
    room.activeSpeakerList.unshift(pid)
  } else {
    room.activeSpeakerList.unshift(ds.producer.id)
  }
  // TODO activeSpeakerList 改变
  // TODO mute, unmute, get new transport
}
