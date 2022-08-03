"use strict";
const { sanitizeEntity } = require("strapi-utils");
const { v4: uuidv4 } = require("uuid");
const _ = require("lodash");
var otpGenerator = require("otp-generator");
const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

// twillio connection
const client = require("twilio")(
  strapi.config.get("server.twillioSid"),
  strapi.config.get("server.twillioToken")
);
const sendMessage = (phone, otp) => {
  // get token
  client.messages
    .create({
      from: strapi.config.get("server.twillioPhone"),
      to: `+91${phone}`,
      body: `Dein Hausmann Registeration!, Your OTP is: ${otp}`,
      message: `Hi This is your OTP, ${otp}`,
    })
    .then((message) => console.log(message))
    .catch((err) => {
      console.error(err);
    });
};
const generateOTP = () => {
  // generate OTP
  let otp = otpGenerator.generate(6, {
    alphabets: false,
    upperCase: false,
    specialChars: false,
  });

  return otp;
};
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  resendOtp: async (ctx) => {
    try {
      const {
        body: { phone },
      } = ctx.request;

      if (phone) {
        let otp = generateOTP(phone);
        let user = await strapi
          .query("user", "users-permissions")
          .model.findOneAndUpdate({ phone }, { otp });
        if (!user) {
          // No such entry exists
          return ctx.badRequest(
            null,
            formatError({
              id: "Auth.form.error.user.notFound",
              message: "No Entry with such Phone number exists.",
            })
          );
        }
        // clean data
        const sanitizedUser = sanitizeEntity(user, {
          model: strapi.query("user", "users-permissions").model,
        });
        sendMessage(sanitizedUser.phone, otp);
        return ctx.send({
          success: true,
          message: "OTP Sent Succesfuly!",
        });
      } else return { error: "Invalid Phone" };
    } catch (err) {
      console.error(err);
    }
  },

  verify: async (ctx) => {
    try {
      const {
        body: { otp, phone },
      } = ctx.request;

      if (otp && phone) {
        let user = await strapi
          .query("user", "users-permissions")
          .model.findOneAndUpdate({ phone, otp }, { phoneVerified: true }).populate('role');
        if (user) {
          // clean data
          const sanitizedUser = sanitizeEntity(user, {
            model: strapi.query("user", "users-permissions").model,
          });
          const jwt = strapi.plugins["users-permissions"].services.jwt.issue(
            _.pick(user, ["id"])
          );
          // get token
          return ctx.send({
            jwt,
            success: true,
            user: sanitizedUser,
          });
        } else
          return ctx.badRequest(
            null,
            formatError({
              id: "Auth.form.error.phoneAndOtp.notFound",
              message: "Invalid OTP, Try Again.",
            })
          );
      } else {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.phoneAndOtp.notFound",
            message: "Please provide valid OTP.",
          })
        );
      }
    } catch (err) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.advanced.allow_register",
          message: err.message,
        })
      );
    }
  },
  // create user with phone only
  create: async (ctx) => {
    try {
      let { phone } = ctx.request.body;
      if(phone.length === 12)
        phone = phone.substr(2);
        console.log({phone});
      const pluginStore = await strapi.store({
        environment: "",
        type: "plugin",
        name: "users-permissions",
      });

      const settings = await pluginStore.get({
        key: "advanced",
      });
      if (!settings.allow_register) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.advanced.allow_register",
            message: "Register action is currently disabled.",
          })
        );
      }
      // get default role
      const role = await strapi
        .query("role", "users-permissions")
        .findOne({ type: settings.default_role }, []);

      if (!role) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.role.notFound",
            message: "Impossible to find the default role.",
          })
        );
      }
      //find user
      let user = await strapi.query("user", "users-permissions").findOne({
        phone: phone,
      });
      let otp = generateOTP();
      // if already a user
      if (!user) {
        user = await strapi.query("user", "users-permissions").create({
          phone: phone,
          role: role.id,
          provider: "local",
          username: uuidv4(),
          otp,
        });
      }
      // sanitize user
      const sanitizedUser = sanitizeEntity(user, {
        model: strapi.query("user", "users-permissions").model,
      });

      // send OTP to phone
      sendMessage(sanitizedUser.phone, otp);

      // send user created
      return ctx.send({
        // jwt,
        success: true,
        message: "User Created Successfully",
        user: sanitizedUser,
      });
    } catch (err) {
      console.error(err);
    }
  },
  findOne: async (ctx) => {
    // console.log(ctx.query);
    let services = await strapi.services.serivces.find();
    // console.log({ services });
    return services.map((service) => ({
      name: service.name,
      _id: service._id,
      id: service.id,
      link: `/gigs?service=${service.name}&id=${service.id}&query=${ctx.query.search}`,
    }));
  },
};
