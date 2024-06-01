import hre from "hardhat";
import path from "path";
import fs from "fs";
import axios from "axios";
import { fileURLToPath } from 'url';

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ETHERSCAN_API_KEY = process.env.VITE_APP_ETHERSCAN_API || "";

// Main deployment function
const deploy = async () => {
  const [deployer] = await hre.ethers.getSigners();

  // Deploy the NFT contract
  const contractFactory = await hre.ethers.getContractFactory("Users");
  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();

  // Get deployment transaction receipt
  const receipt = await hre.ethers.provider.getTransactionReceipt(
    contract.deploymentTransaction().hash
  );
  const gasUsed = receipt.gasUsed.toString();

  let gasPrice;
  try {
    // Get the current gas price from Etherscan
    const gasPriceResponse = await axios.get(
      `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`
    );
    gasPrice = gasPriceResponse.data.result.ProposeGasPrice; // in Gwei
    if (!gasPrice) throw new Error("Gas price not found in response");
  } catch (error) {
    console.error("Error fetching gas price:", error);
    gasPrice = "20"; // Fallback to a default gas price in Gwei if the API call fails
  }

  // Get the current ETH price from CoinGecko
  let ethPrice;
  try {
    const ethPriceResponse = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    ethPrice = ethPriceResponse.data.ethereum.usd; // in USD
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    ethPrice = 3807.04; // Fallback to a default ETH price in USD if the API call fails
  }

  const gasPriceInETH = gasPrice * 1e-9; // Convert Gwei to ETH
  const deploymentCostInETH = gasUsed * gasPriceInETH;
  const deploymentCostInUSD = deploymentCostInETH * ethPrice;

  // Log deployment details
  console.log({
    "Chain ID": (await hre.ethers.provider.getNetwork()).chainId,
    "Deploying Account": await deployer.getAddress(),
    "Account Balance": (await hre.ethers.provider.getBalance(deployer.address)).toString(),
    "Deployed Contract Address": contract.target,
    "Gas Used": gasUsed,
    "Gas Price (Gwei)": gasPrice,
    "ETH Price (USD)": ethPrice,
    "Deployment Cost (ETH)": deploymentCostInETH,
    "Deployment Cost (USD)": deploymentCostInUSD,
  });

  // Save configuration and contract ABI
  updateFrontendConfiguration(
    (await hre.ethers.provider.getNetwork()).chainId,
    contract.target
  );
};

// Update frontend configuration and save contract ABI
const updateFrontendConfiguration = (chainId, contractAddress) => {
  const configDirectory = path.resolve(__dirname, "../src/contracts");
  const configFilePath = path.join(configDirectory, "config.json");

  // Ensure contracts directory exists
  if (!fs.existsSync(configDirectory)) {
    fs.mkdirSync(configDirectory);
  }

  // Update or initialize configuration
  let config = {};
  if (fs.existsSync(configFilePath)) {
    config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  }

  // Set or update the NFT address
  config[chainId] = { address: contractAddress };
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));

  // Save contract ABI
  const contractABI = hre.artifacts.readArtifactSync("Users");
  fs.writeFileSync(
    path.join(configDirectory, "Users.json"),
    JSON.stringify(contractABI, null, 2)
  );
};

// Run the deployment and handle errors
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment error:", error);
    process.exit(1);
  });
