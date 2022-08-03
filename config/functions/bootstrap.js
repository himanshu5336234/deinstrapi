"use strict";

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */
const WebSockets = require("./utils/WebSockets.js");
const stripe = require("stripe")('sk_test_51KyKExSGgexb5Zedoz9mCeKrQmo4Sh11TG8AJ17Lb6lqNCR1dW6FiDRgIs4bpJmxT3gqHEYURwLgQWteF3QgRG0f009g7noV4H');
const {
  getChats,
  createMsg,
  createOffer,
  getMessages,
  createProposal,
  checkRoom,
  deleteUser,
  joinRoom,
  getUsersInRoom,
} = require("./utils/database");

module.exports = () => {
  var io = require("socket.io")(strapi.server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["Authorization"],
      credentials: true,
    },
  });
  io.use(async (socket, next) => {
    const header = socket.handshake.headers["authorization"];
    // TODO: Need Authentication here
    const ctx = { request: { body: {}, header: socket.handshake.headers } };

    const u = await strapi.plugins["users-permissions"].services.jwt.getToken(ctx);
    let user = await strapi
      .query("user", "users-permissions")
      .findOne({ id: u.id });
    if (user.id) {
      socket.handshake.userId = user.id;
      socket.handshake.role = user.role.name;
      next();
    } else {
      next(new Error("invalid Auth"));
    }
  });
  io.on("connection", (socket) => {
    socket.on("proposals", async (payload, callback) => {
      try {
        const oldOrder = await strapi.services.orders.find({
          id: payload.orderId,
        });

        const arr = oldOrder[0].timeline

        if (arr.length != 0) {

          if (arr[arr.length - 1].status != "Quotation Accepted") {

            if (payload.status == "Quotation Accepted" || payload.status == "payment done") {
              const order = await strapi.services.orders.update(
                { id: payload.orderId },
                {
                  $set: {
                    timeline: [
                      ...oldOrder[0].timeline,
                      {
                        status: payload.status,
                        amount: payload.amount,
                        createdBy: payload.createdBy,
                      },
                    ],
                    amount: payload.amount,
                    clientStatus: payload.status,
                  },
                }
              );
              socket.local.emit("getproposals", { order: order });
              callback({ success: true });
            }
            else {
              const order = await strapi.services.orders.update(
                { id: payload.orderId },
                {
                  $set: {
                    timeline: [
                      ...oldOrder[0].timeline,
                      {
                        status: payload.status,
                        amount: payload.amount,
                        createdBy: payload.createdBy,
                      },
                    ],
                    // amount: payload.amount,
                    clientStatus: payload.status,
                  },
                }
              );
              socket.local.emit("getproposals", { order: order });
              callback({ success: true });
            }
          } else {

            callback({ msg: "You an't ", success: true });
          }
        }
        else {
          // console.log("khali hi h ")
          const order = await strapi.services.orders.update(
            { id: payload.orderId },
            {
              $set: {
                timeline: [
                  ...oldOrder[0].timeline,
                  {
                    status: payload.status,
                    amount: payload.amount,
                    createdBy: payload.createdBy,
                  },
                ],
                // amount: payload.amount,
                clientStatus: payload.status,
              },
            }
          );
          socket.local.emit("getproposals", { order: order });
          callback({ success: true });
        }

      } catch (error) {
        throw error;
      }
    });



    socket.on("payment", async (payload, callback) => {
      try {

        const orderId = payload.orderId; // Using Express
        const oldOrder = await strapi.services.orders.find({ id: orderId });
        console.log(oldOrder)
        const charge = await stripe.charges.create({
          amount: oldOrder[0]?.amount,
          currency: "usd",
          description: oldOrder[0]?.service?.description,
          source: oldOrder[0].buyer.card_id,
        }); 
//          const session = await stripe.checkout.sessions.create({
//           line_items: [
//             {
//               price_data: {
//                 currency: 'inr',
//                 product_data: {
//                   name: 'T-shirt',
//                 },
//                 unit_amount: 2000,
//               },
//               quantity: 1,
//             },
//           ],
//           mode: 'payment',
//  success_url: "http://localhost:3000",
//   cancel_url: "http://localhost:3000"
//         });
      
      
        // const session = await stripe.checkout.sessions.create({
        //   submit_type: 'donate',
        //   payment_method_types: ['card'],
        //   line_items: [{
        //     price: oldOrder[0]?.amount * 100,
        //     quantity: 1,
        //   }],
        //   mode: 'payment',
       

        // });

        console.log(session, "lol")
        if (charge.status == "succeeded") {
          callback({ msg: charge, status: true });
          const order = await strapi.services.orders.update(
            { id: payload.orderId },
            {
              $set: {
                timeline: [
                  ...oldOrder[0].timeline,
                  {
                    status: "payment done",
                    amount: oldOrder[0]?.amount.toString(),
                    createdBy: "buyer",
                  },
                ],
                amount: oldOrder[0]?.amount,
                clientStatus: "payment done",
              },
            }
          );
          socket.local.emit("getproposals", { order });

          const chatRoom = await strapi.services["chat-rooms"].createChatRoom({
            seller: oldOrder[0].seller._id,
            buyer: oldOrder[0].buyer._id,
            order: payload.orderId,
            messages: [],
          });

          const chatMessage = strapi.query("chat-messages").model;
          const post = await chatMessage.create({
            chatRoom: chatRoom.chatRoom,
            messages: [],
          });

        } else {
          callback({ msg: charge, status: false });
        }
      } catch (error) {
        callback(error);
      }
    });
    socket.on("sendMessage", async (payload) => {
      try {
        console.log("mei cha rah hu")
        const chatRoom = await strapi.services["chat-rooms"].find({
          order: payload.order,
        });
        const msg = {
          messages: payload.message,
          cretedAt: payload.createdAt,
          postedBy: payload.postedBy,
        };
        const data = await strapi.services["chat-rooms"].update(
          { _id: chatRoom[0]._id },
          {
            $set: {
              messages: [...chatRoom[0].messages, msg],
            },
          }
        );
        if (data) {
          console.log(" or mei bhi cha rah hu")

          socket.emit("gotchat", { msg: msg });
          socket.local.emit("gotchat", { msg: msg });
        }
      } catch (error) { }
    });

    socket.on("order", async (payload, callback) => {
      try {
        const seller = await strapi.services.gigs.find({ id: payload.gig });
        console.log(seller, " Seller");
        const order = await strapi.services["orders"].createOrder({
          amount: payload.amount,
          sellerId: seller[0].user.id,
          buyerId: payload.buyer,
          state: payload.status,
          clientStatus: payload.clientStatus,
          service: seller[0].serivce.id,
          timeline: [],
        });
        callback({ success: true });
        socket.local.emit("getproposals", { newProposal: "sxsxsx" });
      } catch (error) {
        console.log("error on start chat method", error);
        throw error;
      }
    });
  });
  strapi.io = io;
};
