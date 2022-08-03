'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles:{ 
    beforeSave: async function(ctx){
      ctx.data=Date.now();
    }
  }
};
