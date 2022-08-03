"use strict";

// const { create } = require("../../chat-rooms/controllers/chat-rooms");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const createPostInChatRoom = async (chatRoom, message, postedBy) => {
  try {
    const chatMessage = strapi.query("chat-messages").model;
    const readByRecipients = strapi.query("read-by-recipients").model;
    const readBy = await readByRecipients.create({
      user: postedBy,
      readAt: Date.now(),
    });
    const post = await chatMessage.create({
      chatRoom,
      message: message.messageText,
      postedBy,
      readBy: [readBy._id],
    });
    console.log({ post });
    const aggregate = await chatMessage.aggregate([
      // get post where _id = post._id
      { $match: { _id: post._id } },
      // do a join on another table called users, and
      // get me a user whose _id = postedBy
      {
        $lookup: {
          from: "users-permissions_user",
          localField: "postedBy",
          foreignField: "_id",
          as: "postedBy",
        },
      },
      { $unwind: "$postedBy" },
      // do a join on another table called chatrooms, and
      // get me a chatroom whose _id = chatRoom
      {
        $lookup: {
          from: "chat_rooms",
          localField: "chatRoom",
          foreignField: "_id",
          as: "chatRoomInfo",
        },
      },
      { $unwind: "$chatRoomInfo" },
      { $unwind: "$chatRoomInfo.users" },
      // do a join on another table called users, and
      // get me a user whose _id = userIds
      {
        $lookup: {
          from: "users-permissions_user",
          localField: "chatRoomInfo.users",
          foreignField: "_id",
          as: "chatRoomInfo.userProfile",
        },
      },
      { $unwind: "$chatRoomInfo.userProfile" },
      // group data
      {
        $group: {
          _id: "$chatRoomInfo._id",
          postId: { $last: "$_id" },
          chatRoom: { $last: "$chatRoomInfo._id" },
          message: { $last: "$message" },
          type: { $last: "$type" },
          postedBy: { $last: "$postedBy" },
          readBy: { $last: "$readBy" },
          chatRoomInfo: { $addToSet: "$chatRoomInfo.userProfile" },
          createdAt: { $last: "$createdAt" },
          updatedAt: { $last: "$updatedAt" },
        },
      },
    ]);
    console.log(aggregate);
    return aggregate[0];
  } catch (error) {
    console.log(error);
    throw error;
  }
};

module.exports = {
  async createMessage(ctx) {
    try {
      const { roomId } = ctx.params;
      const currentLoggedUser = ctx.state.user.id;
      const messagePayload = {
        messageText: ctx.request.body.messageText,
      };
      if (!currentLoggedUser) throw "Unauthorized";
      const post = await strapi.services["chat-rooms"].createMessageInChatRoom(
        roomId,
        messagePayload,
        currentLoggedUser
      );
      strapi.io.sockets.in(roomId).emit("new message", { message: post });
      return ctx.send({ success: true, post });
    } catch (error) {
      console.log(error);
      return ctx.send({ success: false, error: error });
    }
  },
};
