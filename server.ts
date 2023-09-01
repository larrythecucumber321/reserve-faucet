import express from "express";
import cors from "cors";
import path from "path";
import { BN } from "avalanche";
import { URL } from "url";
import { Client } from "twitter-api-sdk";
import serverless from "serverless-http";

import { RateLimiter, parseBody, parseURI } from "./middlewares";
import EVM from "./vms/evm";

import {
  SendTokenResponse,
  ChainType,
  EVMInstanceAndConfig,
  ERC20Type,
} from "./types";

import {
  evmchains,
  erc20tokens,
  GLOBAL_RL,
  NATIVE_CLIENT,
  DEBUG,
} from "./config.json";

require("dotenv").config();

const twitterClient = new Client(process.env.TWITTER_BEARER_TOKEN!);

const app: any = express();
const router: any = express.Router();

app.use(cors());
app.use(parseURI);
app.use(parseBody);

if (NATIVE_CLIENT) {
  app.use(express.static(path.join(__dirname, "client")));
}

new RateLimiter(app, [GLOBAL_RL]);

new RateLimiter(app, [...evmchains, ...erc20tokens]);

// address rate limiter
new RateLimiter(app, [...evmchains, ...erc20tokens], (req: any, res: any) => {
  const addr = req.body?.address;

  if (typeof addr == "string" && addr) {
    return addr.toUpperCase();
  }
});

const evms = new Map<string, EVMInstanceAndConfig>();

// Get the complete config object from the array of config objects (chains) with ID as id
const getChainByID = (
  chains: ChainType[],
  id: string
): ChainType | undefined => {
  let reply: ChainType | undefined;
  chains.forEach((chain: ChainType): void => {
    if (chain.ID == id) {
      reply = chain;
    }
  });
  return reply;
};

// Populates the missing config keys of the child using the parent's config
const populateConfig = (child: any, parent: any): any => {
  Object.keys(parent || {}).forEach((key) => {
    if (!child[key]) {
      child[key] = parent[key];
    }
  });
  return child;
};

// Setting up instance for EVM chains
evmchains.forEach((chain: ChainType): void => {
  const chainInstance: EVM = new EVM(
    chain,
    process.env[chain.ID] || process.env.PK
  );

  evms.set(chain.ID, {
    config: chain,
    instance: chainInstance,
  });
});

// Adding ERC20 token contracts to their HOST evm instances
erc20tokens.forEach((token: ERC20Type, i: number): void => {
  if (token.HOSTID) {
    token = populateConfig(token, getChainByID(evmchains, token.HOSTID));
  }

  erc20tokens[i] = token;
  const evm: EVMInstanceAndConfig = evms.get(
    getChainByID(evmchains, token.HOSTID)?.ID!
  )!;

  evm?.instance.addERC20Contract(token);
});
router.post("/verifyTweet", async (req: any, res: any) => {
  try {
    const tweetLink = req.body.tweetLink;
    const urlObj = new URL(tweetLink);
    const pathSegments = urlObj.pathname.split("/");
    const tweetId = pathSegments[pathSegments.length - 1];
    const userName = pathSegments[pathSegments.length - 3];

    let data: any;

    try {
      ({ data } = await twitterClient.tweets.findTweetById(tweetId));
    } catch (error) {
      if ((error as any).response?.status === 429) {
        // Handling rate limit
        try {
          // Fetch the most recent tweet of the user
          const { data: userNameRes } =
            await twitterClient.users.findUserByUsername(userName);
          const usersTweets = (await twitterClient.tweets.usersIdTweets(
            userNameRes?.id || "",
            {
              max_results: 5,
            }
          )) as any;

          if (usersTweets?.data?.length > 0) {
            data = usersTweets?.data[0];
          } else {
            // If the user doesn't have any tweets or another error occurred
            throw new Error("Couldn't retrieve user's latest tweet");
          }
        } catch (innerError) {
          if ((innerError as any).response?.status === 429) {
            // Naively verifying if we're rate limited twice
            res.status(200).send({
              verified: true,
              message: "Assumed verification due to rate limit.",
            });
            return;
          }
          throw innerError;
        }
      } else {
        console.error("Error in /verifyTweet:", error);
        res.status(500).send({ verified: false, message: "Server error." });
      }
    }

    const firstLineOfPreWrittenTweet = req.body.preWrittenTweet
      .split("\n")[0]
      .trim();

    if (data?.text.includes(firstLineOfPreWrittenTweet)) {
      res
        .status(200)
        .send({ verified: true, message: "Tweet verified successfully!" });
    } else {
      res.status(200).send({
        verified: false,
        message: "Provided tweet does not match.",
      });
    }
  } catch (err) {
    console.error("Error in /verifyTweet:", err);
    res.status(500).send({ verified: false, message: "Server error." });
  }
});

// POST request for sending tokens or coins
router.post("/sendToken", async (req: any, res: any) => {
  const address: string = req.body?.address;
  const chain: string = req.body?.chain;
  const hash: string = req.body?.hashedName;

  const evm: EVMInstanceAndConfig = evms.get(chain)!;

  if (evm) {
    DEBUG &&
      console.log(
        "address:",
        address,
        "chain:",
        chain,
        "ip:",
        req.headers["cf-connecting-ip"] || req.ip
      );
    evm?.instance.sendToken(address, hash, (data: SendTokenResponse) => {
      const { status, message, txHash } = data;
      res.status(status).send({ message, txHash });
    });
  } else {
    res.status(400).send({ message: "Invalid parameters passed!" });
  }
});

// GET request for fetching all the chain and token configurations
router.get("/getChainConfigs", (req: any, res: any) => {
  const configs: any = [...evmchains, ...erc20tokens];
  res.send({ configs });
});

// GET request for fetching faucet address for the specified chain
router.get("/faucetAddress", (req: any, res: any) => {
  const chain: string = req.query?.chain;
  const evm: EVMInstanceAndConfig = evms.get(chain)!;

  res.send({
    address: evm?.instance.account.address,
  });
});

// GET request for fetching faucet balance for the specified chain or token
router.get("/getBalance", (req: any, res: any) => {
  const chain: string = req.query?.chain;
  const erc20: string | undefined = req.query?.erc20;

  const evm: EVMInstanceAndConfig = evms.get(chain)!;

  let balance: BN = evm?.instance.getBalance(erc20);

  if (balance) {
    balance = balance;
  } else {
    balance = new BN(0);
  }

  res.status(200).send({
    balance: balance?.toString(),
  });
});

router.get("/faucetUsage", (req: any, res: any) => {
  const chain: string = req.query?.chain;

  const evm: EVMInstanceAndConfig = evms.get(chain)!;

  const usage: number = evm?.instance?.getFaucetUsage();

  res.status(200).send({
    usage,
  });
});

app.use("/api", router);

app.get("/health", (req: any, res: any) => {
  res.status(200).send("Server healthy");
});

app.get("/ip", (req: any, res: any) => {
  res.status(200).send({
    ip: req.headers["cf-connecting-ip"] || req.ip,
  });
});

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server started at port ${process.env.PORT || 8000}`);
});

module.exports.handler = serverless(app);
