"use strict";
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
// import * as _ from "lodash";
const _ = require("lodash");
module.exports = {
  lifecycles: {
    async beforeCreate(data) {
      data = _.omit(data, ["status"]);
      data.status = "paused";
    },
    async beforeUpdate(params, data) {
      data = _.omit(data, ["status"]);
      console.log("update", params, data);
    },
    async afterFindOne(result,params,populate){
      console.log({result,params,populate});
      let related = await strapi.services.gigs.find({user:result.user.id});
      result.related = related;
    }
  },
};
