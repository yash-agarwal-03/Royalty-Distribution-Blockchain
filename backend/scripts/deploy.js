const hre = require("hardhat");

async function main() {
  // 1. Get the account that will sign the transaction (your Private Key wallet)
  const [deployer] = await hre.ethers.getSigners();

  console.log("----------------------------------------------------");
  console.log(`🚀 Deploying to network: ${hre.network.name}`);
  console.log(`👤 Deploying with account: ${deployer.address}`);
  console.log("----------------------------------------------------");

  // 2. Get the Contract Factory
  const MusicRoyaltyMarketplace = await hre.ethers.getContractFactory("MusicRoyaltyMarketplace");

  // 3. Deploy the Contract
  // Your constructor takes NO arguments, so we leave .deploy() empty
  const contract = await MusicRoyaltyMarketplace.deploy();

  console.log("⏳ Waiting for transaction confirmation...");

  // 4. Wait for deployment to finish
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("----------------------------------------------------");
  console.log("✅ Deployment Successful!");
  console.log(`📍 Contract Address: ${address}`);
  console.log("----------------------------------------------------");
  console.log("👉 ACTION REQUIRED: Copy the address above and paste it into src/utils/constants.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});