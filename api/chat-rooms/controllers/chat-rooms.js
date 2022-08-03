"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
module.exports = {
  // Read
  async markConversationReadByRoomId(ctx) {
    try {
      const { roomId } = ctx.params;
      const room = await strapi.services["chat-rooms"].getChatRoomByRoomId(
        roomId
      );
      if (!room) {
        return ctx.send({
          success: false,
          message: "No room exists for this id",
        });
      }
      const currentLoggedUser = ctx.state.user.id;
      const result = await strapi.services["chat-messages"].markMessageRead(
        roomId,
        currentLoggedUser
      );
      return ctx.send({ success: true, data: result });
    } catch (error) {
      console.log(error);
      return ctx.send({ success: false, error });
    }
  },
  // find chat room by id
  async findOne(ctx) {
    try {
      // console.log("finding");
      // const conversations = await strapi.services[
      //   "chat-rooms"
      // ].getConversationByRoomId(
      //   ctx.params.roomId,

      // );
      console.log(ctx.params)
      const msg = await  strapi.services["chat-rooms"].find({ order: ctx.params.roomId })
      if(msg){
        console.log("uuuuuuuuuuuuuuuuuuuuuuuuuuuuuu")
        ctx.send({msg,success: true});
      }
     
    } catch (error) {
      console.log({ error });
      return ctx.send({ success: false, error: error });
    }
  },
  // find my
  async findMyRooms(ctx) {
    try {
      const user = ctx.state.user.id;
      if (!user) ctx.response.unauthorized("you need to login");
      const myRooms = await strapi
        .query("chat-rooms")
        .model.find({ users: { $in: [user] } });
      console.log({ myRooms });
      // console.log({co nversations});
      ctx.send({ success: true, myRooms });
    } catch (error) {
      console.log({ error });
      return ctx.send({ success: false, error: error });
    }
  },
  // creating chatroom
  async create(ctx) {
    try {
      // console.log("create user");
      // console.log(ctx.request.body);
      // console.log(ctx.state.user.id)
      // validate
      const chatInitiator = ctx.state.user.id;
      if (!chatInitiator) throw "Unauthorized";
      const { gig,  initiate } = ctx.request.body;
      console.log(initiate,"initiate")
     const userId = await strapi.services.gigs.find({
      id:gig
        });

      // console.log(userId[0].user.id,"userid");


      // console.log("---------------------------")
      // console.log(userId[0].user,"userid2");
      //  console.log(userId,"user");
      if (!initiate) return ctx.send({ success: false, error: "Data not found" });

      const chatRoom = await strapi.services["chat-rooms"].createChatRoom({
        user: userId[0].user.id,
        sellerId:userId[0].user.id,
        buyerId:chatInitiator,
        type: "cutomer-to-customer",
        chat_initiator:  chatInitiator,
        status: "Awaiting",
      });
      if (chatRoom) {
        const post = await strapi.services["proposals"].createProposalInChatRoom(
          chatRoom._id,
          chatInitiator,
          initiate,
          null, 
          "",
          "Service_Requested"
        );
        // create Proposal
        ctx.send({ success: true,chatRoom});
      }
     
    } catch (error) {
      console.log({ error });
      return ctx.send({ success: false, error: error });
    }
  },
  // async create(ctx) {
  //   try {
  //     // validate
  //     const chatInitiator = ctx.state.user.id;
  //     if (!chatInitiator) throw "Unauthorized";
  //     const { gig , initiate } = ctx.request.body;
  //     if (!initiate) return ctx.send({ success: false, error: "Data not found" });
  //     const chatRoom = await strapi.services["chat-rooms"].createChatRoom({
  //       users: [...users, chatInitiator],
  //       type: "cutomer-to-customer",
  //       chatInitiator,
  //       status: "Awaiting",
  //     });
  //     if (chatRoom) {
  //       const post = await strapi.services[
  //         "proposals"
  //       ].createProposalInChatRoom(
  //         chatRoom._id,
  //         chatInitiator,
  //         data,
  //         null,
  //         "",
  //         "Service_Requested"
  //       );
  //       // create Proposal
  //     }
  //     ctx.send({ success: true, chatRoom });
  //   } catch (error) {
  //     console.log({ error });
  //     return ctx.send({ success: false, error: error });
  //   }
  // },
};
