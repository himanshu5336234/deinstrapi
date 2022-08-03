"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {


    let query = new RegExp(ctx.query.search);

    let services = await strapi.services.serivces.find({
         name:{$regex:query}
       
     });
//  strapi.query('serivces').find({
//      "$or":[
//    { "name":{$regex:query}},
//    { "description":{$regex:query}}
//      ]
    
//  },function(err,result){
//      if(err){
//          console.log(err)
//      }
//      console.log(result);
//  });
 console.log(services);
    return services.map((service) => ({
      name: service.name,
      _id: service._id,
      id: service.id,
      link: `/gigs?service=${service.name}&id=${service.id}&query=${ctx.query.search}`,
    }));
  },
};
