module.exports = ({ env }) => ({
  host: env('HOST', 'https://dein-admin.herokuapp.com'),
  port: env.int('PORT', 1337),
  twillioSid:env("TWILIO_ACCOUNT_SID",'ACbe7864b25acc8b1c1011c385f0ad4dc3'),
  twillioToken:env("TWILIO_AUTH_TOKEN",'b767292eeef2cf9a939e8fd752f0a8e8'),
  twillioPhone:env("TWILIO_PHONE_NUMBER",'+12676425591'),
  twillioCell:env("CELL_PHONE_NUMBER",'+12676425591'),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'fa910054fd4bbadced8e9c5245cbf0ab'),
    },
  },
});
