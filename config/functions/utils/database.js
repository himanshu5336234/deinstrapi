const _ = require("lodash");
// get all of my rooms
async function getChats(user) {
  try {
    let chats = [];
    if (user.role.name === "buyer") {
      chats = await strapi.services.room.find({ buyer: user.id });
    } else if (user.role.name === "seller") {
      chats = await strapi.services.room.find({ seller: user.id });
    }
    // .populate({
    //   path: "buy_rooms",
    //   populate: {
    //     path: "users",
    //     select: { id: 1, _id: 1, name: 1, role: 1, aboutMe: 1 },
    //   },
    // });
    console.log({ chats });
    return chats;
  } catch (err) {
    console.log("error while fetching", err);
    return { success: false };
  }
}

async function getMessages({ roomId, offset, limit }) {
  try {
    const messages = await strapi
      .query("room")
      .model.findById(roomId)
      .populate({
        path: "messages",
        options: {
          limit: limit,
          sort: { created: -1 },
          skip: offset,
        },
      });
    console.log({ messages });
    return { success: true, messages: messages.messages };
  } catch (err) {
    console.log("error while fetching", err);
    return { success: false };
  }
}
async function getOffers({ roomId, offset, limit }) {
  try {
    const messages = await strapi
      .query("room")
      .model.findById(roomId)
      .populate({
        path: "offers",
        options: {
          limit: limit,
          sort: { created: -1 },
          skip: offset,
        },
      });
    // console.log({ messages });
    return messages.messages;
  } catch (err) {
    console.log("error while fetching", err);
    return { success: false };
  }
}

async function createMsg({ sender, roomId, msg, reciever }) {
  try {
    const message = await strapi.services.messages.create({
      text: msg,
      sender,
      reciever,
    });
    if (message) {
      const updatedRoom = await strapi
        .query("room")
        .model.findOneAndUpdate(
          { _id: roomId },
          { $push: { messages: message.id } },
          { new: true }
        );
      if (updatedRoom) {
        // console.log({updatedRoom});
        return {
          success: true,
          message: message,
        };
      }
    } else return { success: false };
  } catch (err) {
    console.log("error while fetching", err);
    return { success: false };
  }
}

async function createOffer({ sender, roomId, description, reciever, amount }) {
  try {
    // console.log(sender.role);
    const offer = await strapi.services.offer.create({
      description,
      amount,
      buyerAccepted: false,
    });
    if (offer) {
      const message = await strapi.services.messages.create({
        offer: offer._id,
        isFirst: false,
        isOffer: true,
        sender,
        reciever,
      });
      if (message) {
        const updatedRoom = await strapi
          .query("room")
          .model.findOneAndUpdate(
            { _id: roomId },
            { $push: { messages: message.id } },
            { new: true }
          );
        // console.log({updatedRoom});
        if (updatedRoom) {
          return {
            success: true,
            message: offer,
          };
        }
      }
    }
    return { success: false };
  } catch (err) {
    console.log("error while fetching", err);
    return { success: false };
  }
}

async function createProposal({
  sender,
  roomId,
  description,
  reciever,
  amount,
}) {
  try {
    // console.log(sender.role);
    const proposal = await strapi.services.proposal.create({
      description,
      amount,
      buyerAccepted: false,
    });
    // console.log({ proposal });
    if (proposal) {
      const message = await strapi.services.messages.create({
        proposal: proposal._id,
        isFirst: false,
        isOffer: false,
        isProposal: true,
        sender,
        reciever,
      });
      // console.log({ message });

      if (message) {
        const updatedRoom = await strapi
          .query("room")
          .model.findOneAndUpdate(
            { _id: roomId },
            { $push: { messages: message.id } },
            { new: true }
          );
        if (updatedRoom) {
          return {
            success: true,
            room: updatedRoom,
            message: "Message Saved",
          };
        }
      }
    }
    return { success: false };
  } catch (err) {
    console.log("error while fetching", err);
    return { success: false };
  }
}
async function checkRoom(roomId, id, role) {
  try {
    const user = strapi.query('room').model.findOne({
      _id: roomId,
      [role]: id
    });
    console.log({ user });
    if (user) return user;
    else return;
  } catch (err) {
    console.log("Error occured when fetching user", err);
  }
}
async function joinRoom(roomId, id, role) {
  try {
    const user = strapi.query('room').model.findOneAndUpdate(
      {
        _id: roomId,
        [role]: id,
      },
      { $push: { connected: id } }
    );
    console.log({ user });
    return user;
  } catch (err) {
    console.log("Error occured when fetching user", err);
  }
}

async function getUsersInRoom(roomId) {
  try {
    const usersInRoom = await strapi.services.room.find({ id: roomId });
    return usersInRoom.connected;
  } catch (err) {
    console.log("Error.Try again!", err);
  }
}
async function deleteUser(userId, role) {
  try {
    const rooms = await strapi.services.room.model.updateMany(
      { [role]: userId },
      { $pull: { connected: id } }
    );
    return rooms;
  } catch (err) {
    console.log("Error while deleting the User", err);
  }
}
module.exports = {
  getChats,
  createProposal,
  createMsg,
  createOffer,
  getMessages,
  deleteUser,
  getUsersInRoom,
  joinRoom,
  checkRoom
};
