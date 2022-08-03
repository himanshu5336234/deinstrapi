class WebSockets {
  constructor() {
    this.users = [];
    this.socket = null;
  }
  connection = (client) => {
    this.socket = client;
    // event fired when the chat room is disconnected
    client.on("disconnect", () => {
      // console.log(this);
      this.users = this.users.filter((user) => user.socketId !== client.id);
    });
    // add identity of user mapped to the socket id
    client.on("identity", (userId, cb) => {
      // console.log(client.handshake.user);
      this.users.push({
        socketId: client.id,
        userId: client.handshake.userId,
      });
      cb(`User connected successfully ${userId} ${client.id}`);
    });
    // subscribe person to chat & other user as well
    client.on("subscribe", (room, cb) => {
      this.subscribeOtherUser(room, client.handshake.userId);
      client.join(room);
      cb("Subscribed Successfully");
    });
    // mute a chat room
    client.on("unsubscribe", (room,cb) => {
      client.leave(room);
      cb("UnSubscribed Successfully");
    });
 


  };
  subscribeOtherUser(room, otherUserId) {
    console.log("io", strapi.io.sockets);
    const userSockets = this.users.filter(
      (user) => user.userId === otherUserId
    );
    userSockets.map((userInfo) => {
      // console.log("keyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",strapi.io.sockets.sockets.get(userInfo.socketId));
      const socketConn = strapi.io.sockets.sockets.get(userInfo.socketId);
      if (socketConn) {
        socketConn.join(room);
      }
    });
  }



}
const ws = new WebSockets();
// console.log({ws});
module.exports = ws;
