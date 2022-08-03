"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const mongoose = require("mongoose");

module.exports = {
  markMessageRead: async function (chatRoom, currentUserOnlineId) {
    try {
      const read = strapi.query("read-by-recipients").model.create({
        user: mongoose.Types.ObjectId(currentUserOnlineId),
        readAt: Date.now(),
      });
      console.log({ read });
      const chatMsgModel = strapi.query("chat-messages").model;
      return chatMsgModel.updateMany(
        {
          chatRoom,
          "readBy.user": { $ne: mongoose.Types.ObjectId(currentUserOnlineId) },
        },
        {
          $addToSet: {
            readBy: read._id,
          },
        },
        {
          multi: true,
        }
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
};
