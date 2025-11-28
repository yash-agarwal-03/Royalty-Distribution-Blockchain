const hre = require("hardhat");

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  console.log("----------------------------------------------------");
  console.log("🚀 Starting Local Deployment...");
  console.log("----------------------------------------------------");

  // 1. Get the Contract Factory
  const MusicRoyaltyMarketplace = await hre.ethers.getContractFactory("MusicRoyaltyMarketplace");

  // 2. Deploy the Contract
  const contract = await MusicRoyaltyMarketplace.deploy();

  // 3. Wait for deployment to finish
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("✅ Deployment Successful!");
  console.log(`📍 Contract Address: ${address}`);
  console.log("----------------------------------------------------");
  console.log("⚠️  Keep this terminal running if you used 'npx hardhat node'!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});