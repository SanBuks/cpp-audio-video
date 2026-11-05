const SIGNAL_TYPE_JOIN = "join";              // 主动加入房间
const SIGNAL_TYPE_RESP_JOIN = "resp-join";    // 告知加入者对方是谁
const SIGNAL_TYPE_LEAVE = "leave";            // 主动离开房间
const SIGNAL_TYPE_NEW_PEER = "new-peer";      // 有人加入房间，通知已经在房间的人
const SIGNAL_TYPE_PEER_LEAVE = "peer-leave";  // 有人离开房间，通知已经在房间的人
const SIGNAL_TYPE_OFFER = "offer";            // 发送 offer 给对端 peer
const SIGNAL_TYPE_ANSWER = "answer";          // 发送 offer 给对端 peer
const SIGNAL_TYPE_CANDIDATE = "candidate";    // 发送 candidate 给对端 peer

export class WebRTCEngine {

    wsUrl: string;
    signaling: WebSocket | null;
    localUserId: string | null;    // 本地用户 ID
    remoteUserId: string | null;   // 对端用户 ID

    constructor(wsUrl: string) {
        this.wsUrl = wsUrl;
        this.signaling = null;
        this.localUserId = Math.random().toString(36).substring(2);
        this.remoteUserId = null;
    }

    createWebsocket(): void {
        this.signaling = new WebSocket(this.wsUrl);
        this.signaling.onopen = this.onOpen.bind(this);
        this.signaling.onmessage = this.onMessage.bind(this);
        this.signaling.onerror = this.onError.bind(this);
        this.signaling.onclose =  this.onClose.bind(this);
    }

    onOpen(event: Event) {
        console.log("websocket open: " + event.type);
    }
    onMessage(event: MessageEvent) {
        console.log("onMessage: " + event.data);
        let jsonMsg = JSON.parse(event.data)
        switch(jsonMsg.cmd) {
            case SIGNAL_TYPE_NEW_PEER:
                this.handleRemoteNewPeer(jsonMsg)
                break;
            case SIGNAL_TYPE_RESP_JOIN:
                this.handleRemoteRespJoin(jsonMsg)
                break;
            default:
                break;
        }
    }
    onError(event: Event) {
        console.log("onError: " + event.type);
    }
    onClose(event: CloseEvent) {
        console.log("onClose -> code: " + event.code + ", reason:" + event.reason);
    }


    // 通用传递数据工具函数
    private sendMsg(msg: string) {
        if (this.signaling === null) {
            console.error('信令服务器 ws 连接未建立!')
        } else {
            this.signaling.send(msg);
        }
    }

    // 加入房间
    doJoin(roomId: string) {
        let joinMsg = {
          'cmd': SIGNAL_TYPE_JOIN,
          'roomId': roomId,
          'uid': this.localUserId,
        };
        let msg = JSON.stringify(joinMsg);
        this.sendMsg(msg);
        console.log(`doJoin msg : ${msg}`)
    }

    handleRemoteNewPeer(jsonMsg: any) {
        console.info(`handleRemoteNewPeer remoteUid: ${jsonMsg.remoteUid}`)
        this.remoteUserId = jsonMsg.remoteUid
    }
    handleRemoteRespJoin(jsonMsg: any) {
        console.info(`handleRemoteRespJoin remoteUid: ${jsonMsg.remoteUid}`)
        this.remoteUserId = jsonMsg.remoteUid
        // doOffer
    }
}