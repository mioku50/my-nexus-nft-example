/**
 * contracts/scripts/deploy.ts
 *
 * Скрипт деплоя для SimpleNFT.sol (Nexus Testnet II).
 * 
 * В Ethers v6:
 *  - метод `deployed()` убран, вместо него — `waitForDeployment()`.
 *  - адрес контракта можно получить через `simpleNFT.getAddress()` или `simpleNFT.address`.
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  // Проверка обязательных переменных
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error(
      "Переменная NEXT_PUBLIC_API_URL не задана в contracts/.env. " +
      "Скопируйте .env.example → .env и заполните PRIVATE_KEY, NEXUS_RPC_URL и NEXT_PUBLIC_API_URL."
    );
  }

  console.log("Starting SimpleNFT deployment...");

  // Берём аккаунт, чей PRIVATE_KEY в .env
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Создаём фабрику контракта SimpleNFT
  const SimpleNFT = await ethers.getContractFactory("SimpleNFT");
  console.log("Contract factory initialized");

  // Аргументы конструктора SimpleNFT (ни один не является baseUri)
  const name = "Nexus Test Collection";
  const symbol = "NNFT";
  const initialOwner = deployer.address;

  // Запускаем деплой, передаём (name, symbol, owner)
  const simpleNFT = await SimpleNFT.deploy(name, symbol, initialOwner);

  // Ждём завершения транзакции и развёртывания
  await simpleNFT.waitForDeployment();

  // Получаем адрес задеплоенного контракта
  const address = await simpleNFT.getAddress();
  console.log("SimpleNFT deployed to:", address);
  console.log("Transaction hash:", simpleNFT.deploymentTransaction()?.hash);

  // Логи дополнительной информации
  console.log({
    contractAddress: address,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name,
    blockNumber: await ethers.provider.getBlockNumber(),
  });

  // Команда для верификации (опционально)
  console.log("\nTo verify on block explorer:");
  console.log(
    `npx hardhat verify --network nexus ${address} "` +
      `${name}" "` +
      `${symbol}" ` +
      ``
  );

  // Опциональный mint первой NFT (если в SimpleNFT.sol есть метод mint())
  try {
    const mintTx = await simpleNFT.mint();
    await mintTx.wait();
    console.log("\nFirst NFT minted to deployer");
    console.log("Metadata URL (пример):", `${apiUrl}/api/metadata/1`);
  } catch (e) {
    console.log("\nMinting skipped (метод mint() мог не быть реализован):", e);
  }

  console.log("Deployment completed successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
