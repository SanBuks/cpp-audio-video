export class Client {
    uid = null;
    conn = null;
    roomId = null;

    constructor(uid, conn, roomId) {
        this.uid = uid
        this.conn = conn
        this.roomId = roomId
    }
}
