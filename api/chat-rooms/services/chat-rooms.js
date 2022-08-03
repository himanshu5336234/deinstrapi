"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const mongoose = require("mongoose");
module.exports = {
  createMessageInChatRoom: async (chatRoom, message, postedBy) => {
    try {
      const chatMessage = strapi.query("chat-messages").model;
      const readByRecipients = strapi.query("read-by-recipients").model;
      const readBy = await readByRecipients.create({
        user: postedBy,
        readAt: Date.now(),
      
      });
      console.log("l,l")
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
  },
  getMessages: async function (chatRoom, options = {}) {
    try {
      console.log("getting conversations");
      const chatMsgModel = strapi.query("chat-messages").model;
      const messages = await chatMsgModel.aggregate([
        { $match: { chatRoom: mongoose.Types.ObjectId(chatRoom) } },
        { $sort: { createdAt: -1 } },
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
        // apply pagination
        { $skip: options.page * options.limit },
        { $limit: options.limit },
        { $sort: { createdAt: 1 } },
      ]);
      return messages;
    } catch (error) {
    
      throw error;
    }
  },
  getProposals: async function (chatRoom, options = {}) {
    try {
      console.log("getting proposals");
      const proposalModel = strapi.query("proposals").model;
      const proposals = await proposalModel.aggregate([
        { $match: { chatRoom: mongoose.Types.ObjectId(chatRoom) } },
        { $sort: { createdAt: -1 } },
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
        // apply pagination
        { $skip: options.page * options.limit },
        { $limit: options.limit },
        { $sort: { createdAt: 1 } },
      ]);
      // console.log({ aggregate });
      return proposals;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  getUserByIds: async function (ids) {
    try {
      const UserModel = strapi.query("user", "users-permissions").model;
      const users = await UserModel.find({
        _id: {
          $in: ids,
        },
      });
      return users;
    } catch (error) {
      console.log("error user", error);
      throw error;
    }
  },
  createChatRoom: async ({seller, buyer,messages,order,}) => {
    console.log(
      seller,
      buyer,
      messages,
      order,
      "chat room payload"
    );
    try {
      const chatRoom = strapi.query("chat-rooms").model;

      const newRoom = await chatRoom.create({
        seller,
        buyer,
        messages,
        order,
      });
      return {
        isNew: true,
        message: "creating a new chatroom",
        chatRoom: newRoom._id,
        type: newRoom.type,
      };
    } catch (error) {
      console.log("error on start chat method", error);
      throw error;
    }
  },
  getChatRoomByRoomId: async (roomId) => {
    try {
      const chatRoom = strapi.query("chat-rooms").model;
      const room = await chatRoom.findOne({
        _id: roomId,
      });
      return room;
    } catch (error) {
      console.log("get by roomid", error);
      throw error;
    }
  },
  getConversationByRoomId: async (roomId,) => {
    try {
      const room = await strapi.services["chat-rooms"].getChatRoomByRoomId(
        roomId
      );
      if (!room) {
        return {
          success: false,
          message: "No room exists for this id",
        };
      }
      const users = await strapi.services["chat-rooms"].getUserByIds(
        room.users
      );
      const options = {
        page: parseInt(page) || 0,
        limit: parseInt(limit) || 10,
      };
      let conversation;
      if (type === "messages") {
        conversation = await strapi.services["chat-rooms"].getMessages(
          roomId,
          options
        );
      } else {
        conversation = await strapi.services["chat-rooms"].getProposals(
          roomId,
          options
        );
      }
      return {
        success: true,
        conversation,
        users,
      };
    } catch (error) {
      console.log("convo by roomid", error);
      return {
        success: false,
        error,
      };
    }
  },
};
