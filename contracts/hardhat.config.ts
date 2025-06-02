import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    nexus: {
      url: process.env.NEXUS_RPC_URL || "https://rpc.testnet.nexus.xyz/http",
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 393,
    },
  },
  etherscan: {
    apiKey: {
      nexus: process.env.BLOCK_EXPLORER_API_KEY || "",
    },
    customChains: [
      {
        network: "nexus",
        chainId: 393,
        urls: {
          apiURL: "https://explorer.nexus.xyz/api",
          browserURL: "https://explorer.nexus.xyz",
        },
      },
    ],
  },
};

export default config;
