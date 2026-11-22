import { Transport } from "mediasoup/types";

// 周期打印收发包信息
export async function printStats(transport: Transport) {
  const stats: any = await transport.getStats()
  for (const report of stats.values()) {
    console.log(report.type)
    // 打印接收包数据
    if (report.type === 'webrtc-transport') {
      console.log(`webrtc-transport: bytes sent ${report.bytesSent} - bytes received ${report.bytesReceived}`)
    }
  }
}
