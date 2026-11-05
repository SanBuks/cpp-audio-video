import {Client} from './Client.js'
import ws from 'nodejs-websocket'

const SIGNAL_TYPE_JOIN = "join";              // 主动加入房间
const SIGNAL_TYPE_RESP_JOIN = "resp-join";    // 告知加入者对方是谁
const SIGNAL_TYPE_LEAVE = "leave";            // 主动离开房间
const SIGNAL_TYPE_NEW_PEER = "new-peer";      // 有人加入房间，通知已经在房间的人
const SIGNAL_TYPE_PEER_LEAVE = "peer-leave";  // 有人离开房间，通知已经在房间的人
const SIGNAL_TYPE_OFFER = "offer";            // 发送 offer 给对端 peer
const SIGNAL_TYPE_ANSWER = "answer";          // 发送 offer 给对端 peer
const SIGNAL_TYPE_CANDIDATE = "candidate";    // 发送 candidate 给对端 peer

const port = 8099;               // 端口号
const roomTableMap = new Map();  // 房间列表 Map

function handleJoin(msg, conn) {
    let roomId = msg.roomId;
    let uid = msg.uid;
    console.log(`uid: ${uid} try to join room ${roomId}`);

    // 房间不存在则创建房间
    if (!roomTableMap.has(roomId)) roomTableMap.set(roomId, new Map());
    let roomMap = roomTableMap.get(roomId)
    // 判断房间满没满
    if (roomMap.size > 2) {
        console.error(`roomId: ${roomId} 已经有两人存在, 请使用其他房间`);
        // TODO 加信令通知客户端, 房间已满
        return;
    }

    // 房间存放本用户
    let client = new Client(uid, conn, roomId);
    roomMap.set(uid, client);

    if (roomMap.size > 1) {
        // 房间已经存在人, 需要通知
        for (const [mp_uid, mp_client] of roomMap.entries()) {
            if (mp_uid === uid) continue;  // 过滤调自己

            // new-peer 通知 已存在的用户
            let newPeerMsg = {
                'cmd': SIGNAL_TYPE_NEW_PEER,
                'remoteUid': uid
            };
            let newPeerStr = JSON.stringify(newPeerMsg)
            console.log(`${SIGNAL_TYPE_NEW_PEER}: ${newPeerStr}`)
            mp_client.conn.sendText(newPeerStr);

            // resp-join 通知 本用户
            let respJoinMsg = {
              'cmd': SIGNAL_TYPE_RESP_JOIN,
              'remoteUid': mp_uid
            };
            let respJoinStr = JSON.stringify(respJoinMsg)
            console.log(`${SIGNAL_TYPE_RESP_JOIN}: ${respJoinStr}`)
            client.conn.sendText(respJoinStr)
        }
    }
}

let server = ws.createServer((conn) => {
    console.log("创建一个新的连接 -------- ");
    conn.on("text", (str) => {
        console.info(`接收信息: ${str}`);
        let jsonMsg = JSON.parse(str);

        switch (jsonMsg.cmd) {
            case SIGNAL_TYPE_JOIN:
                handleJoin(jsonMsg, conn);
                break;
            default:
        }
    });
    conn.on("close", (code, reason) => {
        console.info(`连接关闭 code: ${code}, reason: ${reason}`)
    });
    conn.on("error", (err) => {
        console.info("监听到错误:" + err)
    });
}).listen(port)
