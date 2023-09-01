import axios from "axios";
import configurations from "./config.json";

export default axios.create({
  baseURL:
    process.env.NODE_ENV == "production"
      ? configurations.apiBaseEndpointProduction
      : configurations.apiBaseEndpointDevelopment,
  timeout: configurations.apiTimeout,
});

export const config = {
  api: {
    sendToken: "api/sendToken",
    getChainConfigs: "api/getChainConfigs",
    getBalance: "api/getBalance",
    faucetAddress: "api/faucetAddress",
    verifyTweet: "api/verifyTweet",
  },
  SITE_KEY: configurations.CAPTCHA.siteKey,
  V2_SITE_KEY: configurations.CAPTCHA.v2siteKey,
  ACTION: configurations.CAPTCHA.action,
  banner: configurations.banner,
};
