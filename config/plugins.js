module.exports = ({ env }) => ({
  // ...
  email: {
    provider: "sendinblue",
    providerOptions: {
      apiKey: env(
        "SENDINBLUE_API_KEY",
        "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"
      ),
    },
    settings: {
      defaultFrom: "info@deinhausmann.com",
      defaultFromName: "marjix",
      defaultReplyTo: "harshit@heliverse.com",
    },
  },
  upload: {
    provider: "cloudinary",
    providerOptions: {
      cloud_name: env("CLOUDINARY_NAME", "heliverse"),
      api_key: env("CLOUDINARY_KEY", "671695792554385"),
      api_secret: env("CLOUDINARY_SECRET", "I1xtja4i-TpAXd2WLEi3XFgiv4Q"),
    },
  },
});