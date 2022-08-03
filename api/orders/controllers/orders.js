"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const stripe = require("stripe")("sk_test_51JiN5uSAtXuzxLfbGiHTdpKKGuRDEPEbMt2v24QYHBtxX8A5ByCV8a5dO76gFIITxwozB39ZJaArLDhpSU952U7J00apTg36iQ")
const paypal = require('@paypal/payouts-sdk');
module.exports = {


  async payoutToSeller(ctx){
    try {
      console.log(ctx);
      const { amount, receiver } = ctx.state.user;
      // Creating an environment
      let clientId = "AaLgUJ-2S6M7kSruO4Gnx9zKqkbNS6pgQ1fXG56HE9d__a_vObaA9IV18lH3zuWFJIAB0awrkKg8KDzE";
      let clientSecret = "EGcK6zaWSCCOyoenIOuV5fGFUnQYUQbrzbXaJKQKH5z-kUegdRFanXUj9enk5u9c2zeOAQCZ8Q77zzKl";
      let environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
      let client = new paypal.core.PayPalHttpClient(environment);
  
      let requestBody = {
        "sender_batch_header": {
          "recipient_type": "EMAIL",
          "email_message": "SDK payouts test txn",
          "note": "Enjoy your Payout!!",
          "sender_batch_id": Math.random().toString(16).slice(2),
          "email_subject": "This is a test transaction from SDK"
        },
        "items": [{
          "note": "Your 1$ Payout!",
          "amount": {
            "currency": "USD",
            "value": amount
          },
          "receiver": receiver,
          "sender_item_id": "Test_txn_1"
        }]
      }
  
      // Construct a request object and set desired parameters
      // Here, PayoutsPostRequest() creates a POST request to /v1/payments/payouts
      let request = new paypal.payouts.PayoutsPostRequest();
      request.requestBody(requestBody);
  
      // Call API with your client and get a response for your call
      let createPayouts = async function () {
        let response = await client.execute(request);
        console.log(`Response: ${JSON.stringify(response)}`);
        // If call returns body in response, you can get the deserialized version from the result attribute of the response.
        console.log(`Payouts Create Response: ${JSON.stringify(response.result)}`);
        return response.result
      }
      const response = await createPayouts();
      await User.findByIdAndUpdate(req.user.id, { $inc: { amount: -amount } })
      const updateAmount = await User.findById(req.user.id);
      res.json({ amount: updateAmount.amount, status: true })
    } catch (err) {
      return res.json({ message: err, status: false })
    }
  
  },
  

  async create(ctx) {
    console.log(ctx.state, "state");
    console.log(ctx.state.user._id, "ctx from order");
    try {
      const buyerId = ctx.state.user._id;
      if (!buyerId) throw "Unauthorized";
      const { gig } = ctx.request.body;
      const serllerId = await strapi.services.gigs.find({
        id: gig
      });
      const order = await strapi.services["orders"].createOrder({
        // buyer: userId[0].user.id,
        sellerId: serllerId[0].user.id,
        buyerId,
        state: "false",
        clientStatus: "accepted"
      });

      console.log(order, "order come from controller");

      if (order) {
        strapi.io.sockets.emit("new_order", { order });
        ctx.send({ success: true, order });
      }
    } catch (error) {
      console.log({ error });
      return ctx.send({ success: false, error: error });
    }
  },

  async find(ctx) {
    console.log(ctx.state, "find data come");
    const type = ctx.state.user.role.name;
    const userId = ctx.state.user._id;
    console.log(userId, "user Id of order");
    console.log(type, "user type");

    if (type == "buyer") {
      const order = await strapi.services.orders.find({
        buyer: userId
      });
      console.log(order, "order come to mongodb buyer");

      return ctx.send({ order, status: true, type: "buyer" })
    }
    if (type == "seller") {
      const order = await strapi.services.orders.find({
        seller: userId
      });
      console.log(order, "order come to mongodb seller");
      return ctx.send({ order, status: true, type: "seller" })
    }

    return ctx.send({ msg: "order not found", status: false });
  },

  acceptPayment: async (ctx) => {

    // const { orderId } = ctx.request.body; // Using Express
    // const order = await strapi.services.orders.find({ id: orderId })
    // const charge = await stripe.charges.create({
    //   amount: order[0]?.amount * 100,
    //   currency: 'inr',
    //   description: order[0]?.service?.description,
    //   source: order[0].buyer.card_id,
    // });
    // return ctx.send({ msg: charge, status: true })
  },
  addCards: async (ctx) => {
    const { token, userId } = ctx.request.body; // Using Express
    const UserModel = strapi.query("user", "users-permissions").model;
    const users = await UserModel.findByIdAndUpdate(userId, { card_id: token });
    return ctx.send({ msg: "Add card Successfully", users, status: true })
  }
};
