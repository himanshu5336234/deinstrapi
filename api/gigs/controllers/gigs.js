"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require("strapi-utils");
const checkGig = async (id) => {
  const gig = await strapi.services.gigs.findOne({ id });
  if (gig) {
    return true;
  }
  return false;
};
module.exports = {
  async me(ctx) {
    try {
      const id = ctx.state.user.id;
      console.log(id);
      if (!id) {
        return { success: false, message: "Invalid User" };
      }
      const myGigs = await strapi.services.gigs.find({ user: id });
      if (myGigs) {
        return myGigs.map((entity) =>
          sanitizeEntity(entity, { model: strapi.models.gigs })
        );
      }
      return [];
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
  async saveGig(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { id } = ctx.params;
      console.log(userId);
      if (userId && id && checkGig(id)) {
        const user = await strapi
          .query("user", "users-permissions")
          .model.findOneAndUpdate(
            { _id: userId, savedgigs: { $ne: id } },
            {
              $push: { savedgigs: id },
            },
            { new: true }
          );
        console.log(user);
        if (user) {
          return sanitizeEntity(user, {
            model: strapi.query("user", "users-permissions").model,
          });
        } else return { success: true, message };
      }
      return { success: false, message: "Invalid User" };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
  async unsaveGig(ctx) {
    try {
      const userId = ctx.state.user.id;
      const { id } = ctx.params;
      console.log(userId);
      if (userId && id && checkGig(id)) {
        const user = await strapi
          .query("user", "users-permissions")
          .model.findOneAndUpdate(
            { _id: userId, savedgigs: { $in: id } },
            {
              $pull: { savedgigs: id },
            },
            { new: true }
          );
        console.log(user);
        if (user) {
          return sanitizeEntity(user, {
            model: strapi.query("user", "users-permissions").model,
          });
        } else return { success: true, message };
      }
      return { success: false, message: "Invalid User" };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
};
