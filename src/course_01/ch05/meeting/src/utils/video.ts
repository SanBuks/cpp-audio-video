const SIGNAL_TYPE_JOIN = "join";              // 主动加入房间
const SIGNAL_TYPE_RESP_JOIN = "resp-join";    // 告知加入者对方是谁
const SIGNAL_TYPE_LEAVE = "leave";            // 主动离开房间
const SIGNAL_TYPE_NEW_PEER = "new-peer";      // 有人加入房间，通知已经在房间的人
const SIGNAL_TYPE_PEER_LEAVE = "peer-leave";  // 有人离开房间，通知已经在房间的人
const SIGNAL_TYPE_OFFER = "offer";            // 发送 offer 给对端 peer
const SIGNAL_TYPE_ANSWER = "answer";          // 发送 offer 给对端 peer
const SIGNAL_TYPE_CANDIDATE = "candidate";    // 发送 candidate 给对端 peer

export class WebRTCEngine {

    wsUrl: string;                     // ws 地址
    signaling: WebSocket | null;       // ws 连接
    roomId: string | null;             // 房间 ID

    localUserId: string | null;            // 本地用户 ID
    localVideo: HTMLVideoElement;   // 本地视频控件
    localStream: MediaStream | null;       // 本地流
    remoteUserId: string | null;           // 对端用户 ID
    remoteVideo: HTMLVideoElement;  // 对端视频控件
    remoteStream: MediaStream | null;      // 远程流

    pc: RTCPeerConnection | null;      // RtcPeerConnection
    conf: RTCConfiguration | null;            // RtcPeerConnection 配置

    constructor(wsUrl: string, localVideo: HTMLVideoElement, remoteVideo: HTMLVideoElement) {
        this.wsUrl = wsUrl;
        this.roomId = null;
        this.signaling = null;

        this.localUserId = Math.random().toString(36).substring(2);
        this.localVideo = localVideo;
        this.localStream = null;

        this.remoteUserId = null;
        this.remoteVideo = remoteVideo;
        this.remoteStream = null;

        this.pc = null;
        this.conf = null;
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
                this.handleRemoteNewPeer(jsonMsg);
                break;
            case SIGNAL_TYPE_RESP_JOIN:
                this.handleRemoteRespJoin(jsonMsg);
                break;
            case SIGNAL_TYPE_PEER_LEAVE:
                this.handlePeerLeave(jsonMsg);
                break;
            case SIGNAL_TYPE_OFFER:
                this.handleRemoteOffer(jsonMsg);
                break;
            case SIGNAL_TYPE_ANSWER:
                this.handleRemoteAnswer(jsonMsg);
                break;
            case SIGNAL_TYPE_CANDIDATE:
                this.handleRemoteCandidate(jsonMsg);
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

    // 工具函数 传递数据
    private sendMsg(msg: string): void {
        if (this.signaling === null) {
            console.error('信令服务器 ws 连接未建立!')
        } else {
            this.signaling.send(msg);
        }
    }

    // 工具函数 创建连接对象
    private createPeerConnection() {
        console.log('create PeerConnection');

        this.conf = {
            bundlePolicy: "max-bundle",
            rtcpMuxPolicy: "require",
            iceTransportPolicy: "relay",  // relay 或者 all
            // 修改 ice 数组测试效果, 需要进行封装
            iceServers: [
                {
                    "urls": [
                        "turn:192.168.10.113:3478?transport=udp",
                        "turn:192.168.10.113:3478?transport=tcp"       // 可以插入多个进行备选
                    ],
                    "username": "lqf",
                    "credential": "123456"
                },
                {
                    "urls": [
                        "stun:192.168.10.113:3478"

                    ]
                }
            ]
        };

        this.pc = new RTCPeerConnection(this.conf);
        this.pc.onicecandidate = this.handleIceCandidate.bind(this);
        this.pc.ontrack = this.handleRemoteStreamAdd.bind(this);
        this.localStream!.getTracks()
            .forEach(
                (track: MediaStreamTrack) =>
                this.pc!.addTrack(track, this.localStream!)
            );
    }

    setLocalDescAndSendOfferMessage(session: RTCLocalSessionDescriptionInit) {
        this.pc?.setLocalDescription(session)
                .then(() => {
                    let offerMsg = {
                        'cmd': SIGNAL_TYPE_OFFER,
                        'roomId': this.roomId,
                        'uid': this.localUserId,
                        'remoteUid': this.remoteUserId,
                        'msg': JSON.stringify(session)
                    };
                    let offerMsgStr = JSON.stringify(offerMsg)
                    this.sendMsg(offerMsgStr);
                    console.info(`${SIGNAL_TYPE_OFFER} msg: ${offerMsgStr}`)
                }).catch((err)=>{
                    console.error(`setLocalDescription error: ${err}`)
                })
    }

    setLocalDescAndSendAnswerMessage(session: RTCLocalSessionDescriptionInit) {
        this.pc?.setLocalDescription(session)
                .then(() => {
                    let answerMsg = {
                      'cmd': SIGNAL_TYPE_ANSWER,
                      'roomId': this.roomId,
                      'uid': this.localUserId,
                      'remoteUid':this.remoteUserId,
                      'msg': JSON.stringify(session)
                    };
                    let answerMsgStr = JSON.stringify(answerMsg)
                    this.sendMsg(answerMsgStr);
                    console.info(`${SIGNAL_TYPE_ANSWER} msg: ${answerMsgStr}`)
                }).catch((err)=>{
                    console.error(`setLocalDescription error: ${err}`)
                })
    }

    // 设置本地流并打开, 在创建 PeerConnection 之前调用
    openLocalStream(stream: MediaStream): void {
        this.localStream = stream;
        this.localVideo.srcObject = stream;
    }

    // 加入房间
    doJoin(roomId: string) {
        let joinMsg = {
          'cmd': SIGNAL_TYPE_JOIN,
          'roomId': roomId,
          'uid': this.localUserId,
        };
        this.roomId = roomId;
        let msg = JSON.stringify(joinMsg);
        this.sendMsg(msg);
        console.log(`doJoin msg: ${msg}`)
    }
    // 离开房间
    doLeave(roomId: string) {
        let leaveMsg = {
          'cmd': SIGNAL_TYPE_LEAVE,
          'roomId': roomId,
          'uid': this.localUserId,
        };
        let msg = JSON.stringify(leaveMsg)
        this.sendMsg(msg)
        console.log(`doLeave msg: ${msg}`)
        this.doHangUp();
    }
    // 创建 offer
    doOffer() {
        if (this.pc == null) {
            this.createPeerConnection()
        }
        this.pc!.createOffer()
                .then(this.setLocalDescAndSendOfferMessage.bind(this))
                .catch((err) => console.error(`createOffer error : ${err}`))
    }
    // 回应
    doAnswer() {
        this.pc!.createAnswer()
                .then(this.setLocalDescAndSendAnswerMessage.bind(this))
                .catch((err) => console.error(`createAnswer error : ${err}`))
    }
    // 挂断
    doHangUp() {
        // 控件关闭
        this.localVideo.srcObject = null;
        this.remoteVideo.srcObject = null;
        // pc 连接关闭
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        // 流关闭
        this.localStream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }

    handleRemoteNewPeer(jsonMsg: any) {
        console.info(`handleRemoteNewPeer remoteUid: ${jsonMsg.remoteUid}`);
        this.remoteUserId = jsonMsg.remoteUid;
        this.doOffer();
    }
    handleRemoteRespJoin(jsonMsg: any) {
        console.info(`handleRemoteRespJoin remoteUid: ${jsonMsg.remoteUid}`)
        this.remoteUserId = jsonMsg.remoteUid
    }
    handlePeerLeave(jsonMsg: any) {
        console.info(`handlePeerLeave remoteUid: ${jsonMsg.remoteUid}`)
        this.remoteVideo.srcObject = null
        this.remoteUserId = null
        // pc 连接关闭
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
    }
    handleRemoteOffer(jsonMsg: any) {
        console.info(`handleRemoteOffer remoteUid: ${jsonMsg.remoteUid}`)
        if (this.pc == null) {
            this.createPeerConnection();
        }
        let desc = JSON.parse(jsonMsg.msg);
        this.pc!.setRemoteDescription(desc)
                .then(() => this.doAnswer())
                .catch((err)=>console.error(`setRemoteDescription error ${err}`));

    }
    handleRemoteAnswer(jsonMsg: any) {
        console.info(`handleRemoteAnswer remoteUid: ${jsonMsg.remoteUid}`)
        let desc = JSON.parse(jsonMsg.msg);
        this.pc!.setRemoteDescription(desc).catch(err => console.error(`setRemoteDescription error ${err}`));
    }
    handleRemoteCandidate(jsonMsg: any) {
        console.info(`handleRemoteCandidate remoteUid: ${jsonMsg.remoteUid}`)
        let candidate = JSON.parse(jsonMsg.msg)
        this.pc!.addIceCandidate(candidate).catch(err => console.error(`addIceCandidate error ${err}`));
    }

    handleIceCandidate(event: RTCPeerConnectionIceEvent) {
        console.info(`handleIceCandidate`)
        if (!event.candidate) {
            console.warn('End of candidate')
            return;
        }
        let candidateMsg = {
          'cmd': SIGNAL_TYPE_CANDIDATE,
          'roomId': this.roomId,
          'uid': this.localUserId,
          'remoteUid': this.remoteUserId,
          'msg': JSON.stringify(event.candidate)
        }
        let message = JSON.stringify(candidateMsg);
        this.sendMsg(message);
        console.info(`${ SIGNAL_TYPE_CANDIDATE}: ${message}`)
    }
    handleRemoteStreamAdd(event: RTCTrackEvent) {
        console.info(`handleRemoteStreamAdd`)
        if (!event.streams[0]) {
            console.warn(`handleRemoteStreamAdd event stream[0] is null!`);
            return;
        }
        this.remoteStream = event.streams[0]
        this.remoteVideo.srcObject = this.remoteStream
    }
}