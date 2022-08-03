'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */
 const _ = require("lodash");
 module.exports = {
   lifecycles: {
     async beforeCreate(data) {
       console.log(data);
       data = _.omit(data, ["status"]);
       data.status = "inReview";
     },
     async beforeUpdate(params, data) {
       data = _.omit(data, ["status"]);
       console.log("update", params, data);
     },
   },
 };
 


