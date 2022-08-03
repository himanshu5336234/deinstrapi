"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  createOrder: async ({
      
      sellerId,
      buyerId,
      amount,
      state,
      clientStatus,
      timeline,
      service
  }) => {
    console.log(
        sellerId,
        buyerId,
      timeline,
        state,
        clientStatus,
        "order service calll"
     
      
    );
    try {
      const order = strapi.query("orders").model;
 

        const newOrder = await order.create({
          seller:sellerId,
          buyer:buyerId,
          state,
          clientStatus,
          amount,
          timeline,
          service
        });
        console.log(newOrder,"new order");
      return {
        isNew: true,
        message: "order successful created",
        data:newOrder,
        
      };
    } catch (error) {
      console.log("error on start chat method", error);
      throw error;
    }
  },
};
