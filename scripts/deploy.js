const hre = require("hardhat")
const fs = require("fs")
const path = require("path")

/**
 * RealFi Cacao Financing Platform - Production Deployment Script
 * 
 * Deploys all three core contracts:
 * 1. CacaoHarvestNFT - Dynamic NFT for harvest tracking
 * 2. FarmerReputationBadge - Soulbound reputation tokens
 * 3. CacaoEscrow - Milestone-based escrow system
 * 
 * Handles ownership transfers and contract configuration automatically.
 */

// USDC token addresses by network (6 decimals)
const USDC_ADDRESSES = {
  mainnet: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Update with actual USDC mainnet address
  "celo-sepolia": "0x01C5C0122039549AD1493B8220cABEdD739BC44E", // Update with actual USDC Sepolia address
  localhost: "0x0000000000000000000000000000000000000000" // Will be deployed mock
}

/**
 * Delay execution for verification
 */
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Save deployed addresses to file
 */
function saveDeploymentAddresses(network, addresses) {
  const deploymentsDir = path.join(__dirname, "..", "deployments")
  
  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true })
  }

  const filename = path.join(deploymentsDir, `${network}.json`)
  const data = {
    network,
    timestamp: new Date().toISOString(),
    addresses
  }

  fs.writeFileSync(filename, JSON.stringify(data, null, 2))
  console.log(`\n✅ Deployment addresses saved to: ${filename}`)
}

/**
 * Main deployment function
 */
async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════╗")
  console.log("║                                                               ║")
  console.log("║   🌱 RealFi Cacao Financing Platform - Deployment 🌱          ║")
  console.log("║                                                               ║")
  console.log("╚═══════════════════════════════════════════════════════════════╝\n")

  // Get network information
  const network = hre.network.name
  const [deployer] = await hre.ethers.getSigners()
  const deployerAddress = deployer.address
  
  console.log("📋 Deployment Configuration")
  console.log("═".repeat(60))
  console.log(`Network:        ${network}`)
  console.log(`Deployer:       ${deployerAddress}`)
  console.log(`Balance:        ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployerAddress))} CELO`)
  console.log("═".repeat(60) + "\n")

  // Determine USDC address
  let usdcAddress = USDC_ADDRESSES[network] || USDC_ADDRESSES["celo-sepolia"]
  
  // Get oracle address from environment or use deployer
  const oracleAddress = process.env.ORACLE_ADDRESS || deployerAddress
  
  if (oracleAddress === deployerAddress) {
    console.log("⚠️  WARNING: Using deployer as oracle (for testing only)")
  }

  console.log("📍 Configuration:")
  console.log(`   Oracle:      ${oracleAddress}`)
  console.log(`   USDC Token:  ${usdcAddress} (6 decimals)\n`)

  // Track all deployed addresses
  const deployedAddresses = {
    deployer: deployerAddress,
    oracle: oracleAddress,
    usdc: usdcAddress
  }

  try {
    // ============================================
    // 1. DEPLOY CACAO HARVEST NFT
    // ============================================
    console.log("🚀 Step 1/6: Deploying CacaoHarvestNFT...")
    console.log("─".repeat(60))
    
    const CacaoHarvestNFT = await hre.ethers.getContractFactory("CacaoHarvestNFT")
    const harvestNFT = await CacaoHarvestNFT.deploy(oracleAddress)
    await harvestNFT.waitForDeployment()
    
    // Wait for 2 block confirmations to ensure contract is indexed
    console.log("   Waiting for block confirmations...")
    await harvestNFT.deploymentTransaction().wait(2)
    
    const harvestNFTAddress = await harvestNFT.getAddress()
    
    deployedAddresses.harvestNFT = harvestNFTAddress
    
    console.log(`✅ CacaoHarvestNFT deployed to: ${harvestNFTAddress}`)
    console.log(`   Owner: ${await harvestNFT.owner()}`)
    console.log(`   Oracle: ${await harvestNFT.oracle()}\n`)

    // ============================================
    // 2. DEPLOY FARMER REPUTATION BADGE
    // ============================================
    console.log("🚀 Step 2/6: Deploying FarmerReputationBadge...")
    console.log("─".repeat(60))
    
    const FarmerReputationBadge = await hre.ethers.getContractFactory("FarmerReputationBadge")
    // Deploy with deployer as temporary escrow (will update later)
    const reputationBadge = await FarmerReputationBadge.deploy(deployerAddress)
    await reputationBadge.waitForDeployment()
    
    // Wait for 2 block confirmations to ensure contract is indexed
    console.log("   Waiting for block confirmations...")
    await reputationBadge.deploymentTransaction().wait(2)
    
    const reputationBadgeAddress = await reputationBadge.getAddress()
    
    deployedAddresses.reputationBadge = reputationBadgeAddress
    
    console.log(`✅ FarmerReputationBadge deployed to: ${reputationBadgeAddress}`)
    console.log(`   Owner: ${await reputationBadge.owner()}`)
    console.log(`   Escrow (temporary): ${deployerAddress}\n`)

    // ============================================
    // 3. DEPLOY CACAO ESCROW
    // ============================================
    console.log("🚀 Step 3/6: Deploying CacaoEscrow...")
    console.log("─".repeat(60))
    
    const CacaoEscrow = await hre.ethers.getContractFactory("CacaoEscrow")
    const escrow = await CacaoEscrow.deploy(
      usdcAddress,
      oracleAddress,
      harvestNFTAddress,
      reputationBadgeAddress
    )
    await escrow.waitForDeployment()
    
    // Wait for 2 block confirmations to ensure contract is indexed
    console.log("   Waiting for block confirmations...")
    await escrow.deploymentTransaction().wait(2)
    
    const escrowAddress = await escrow.getAddress()
    
    deployedAddresses.escrow = escrowAddress
    
    console.log(`✅ CacaoEscrow deployed to: ${escrowAddress}`)
    console.log(`   Owner: ${await escrow.owner()}`)
    console.log(`   Oracle: ${await escrow.oracle()}`)
    console.log(`   USDC: ${await escrow.cUSD()}`) // Variable named cUSD for backward compatibility
    console.log(`   Harvest NFT: ${await escrow.harvestNFT()}`)
    console.log(`   Reputation Badge: ${await escrow.reputationBadge()}\n`)

    // ============================================
    // 4. TRANSFER NFT OWNERSHIP TO ESCROW
    // ============================================
    console.log("🔄 Step 4/6: Transferring CacaoHarvestNFT ownership to Escrow...")
    console.log("─".repeat(60))
    
    const transferTx = await harvestNFT.transferOwnership(escrowAddress)
    console.log("   Waiting for confirmation...")
    await transferTx.wait(2)
    
    console.log(`✅ Ownership transfer initiated`)
    console.log(`   Pending owner: ${await harvestNFT.pendingOwner()}\n`)

    // ============================================
    // 5. ACCEPT OWNERSHIP IN ESCROW
    // ============================================
    console.log("🔄 Step 5/6: Accepting CacaoHarvestNFT ownership in Escrow...")
    console.log("─".repeat(60))
    
    const acceptTx = await escrow.acceptHarvestNFTOwnership()
    console.log("   Waiting for confirmation...")
    await acceptTx.wait(2)
    
    console.log(`✅ Ownership accepted`)
    console.log(`   New NFT owner: ${await harvestNFT.owner()}\n`)

    // ============================================
    // 6. SET ESCROW ADDRESS IN REPUTATION BADGE
    // ============================================
    console.log("🔄 Step 6/6: Setting Escrow address in FarmerReputationBadge...")
    console.log("─".repeat(60))
    
    const setEscrowTx = await reputationBadge.setEscrowContract(escrowAddress)
    console.log("   Waiting for confirmation...")
    await setEscrowTx.wait(2)
    
    console.log(`✅ Escrow address updated`)
    console.log(`   Badge escrow: ${await reputationBadge.escrowContract()}\n`)

    // ============================================
    // DEPLOYMENT SUMMARY
    // ============================================
    console.log("\n" + "═".repeat(60))
    console.log("🎉 DEPLOYMENT SUCCESSFUL!")
    console.log("═".repeat(60))
    console.log("\n📋 Deployed Contract Addresses:\n")
    console.log(`CacaoHarvestNFT:       ${harvestNFTAddress}`)
    console.log(`FarmerReputationBadge: ${reputationBadgeAddress}`)
    console.log(`CacaoEscrow:           ${escrowAddress}`)
    console.log(`\nOracle:                ${oracleAddress}`)
    console.log(`USDC Token:            ${usdcAddress} (6 decimals)`)
    console.log("\n" + "═".repeat(60))

    // Save deployment addresses
    saveDeploymentAddresses(network, deployedAddresses)

    // ============================================
    // CONTRACT VERIFICATION INSTRUCTIONS
    // ============================================
    if (network !== "hardhat" && network !== "localhost") {
      console.log("\n" + "═".repeat(60))
      console.log("📝 CONTRACT VERIFICATION")
      console.log("═".repeat(60))
      console.log("\nWaiting 30 seconds before verification to allow Celoscan to index...\n")
      
      await delay(30000)

      console.log("Run the following commands to verify contracts on Celoscan:\n")
      
      console.log("# 1. Verify CacaoHarvestNFT")
      console.log(`npx hardhat verify --network ${network} ${harvestNFTAddress} ${oracleAddress}\n`)
      
      console.log("# 2. Verify FarmerReputationBadge")
      console.log(`npx hardhat verify --network ${network} ${reputationBadgeAddress} ${deployerAddress}\n`)
      
      console.log("# 3. Verify CacaoEscrow")
      console.log(`npx hardhat verify --network ${network} ${escrowAddress} ${usdcAddress} ${oracleAddress} ${harvestNFTAddress} ${reputationBadgeAddress}\n`)
      
      console.log("═".repeat(60))

      // Auto-verify if on testnet
      if (network === "alfajores") {
        console.log("\n🔍 Attempting automatic verification...\n")
        
        try {
          console.log("Verifying CacaoHarvestNFT...")
          await hre.run("verify:verify", {
            address: harvestNFTAddress,
            constructorArguments: [oracleAddress]
          })
          console.log("✅ CacaoHarvestNFT verified\n")
        } catch (error) {
          console.log(`⚠️  CacaoHarvestNFT verification failed: ${error.message}\n`)
        }

        try {
          console.log("Verifying FarmerReputationBadge...")
          await hre.run("verify:verify", {
            address: reputationBadgeAddress,
            constructorArguments: [deployerAddress]
          })
          console.log("✅ FarmerReputationBadge verified\n")
        } catch (error) {
          console.log(`⚠️  FarmerReputationBadge verification failed: ${error.message}\n`)
        }

        try {
          console.log("Verifying CacaoEscrow...")
          await hre.run("verify:verify", {
            address: escrowAddress,
            constructorArguments: [usdcAddress, oracleAddress, harvestNFTAddress, reputationBadgeAddress]
          })
          console.log("✅ CacaoEscrow verified\n")
        } catch (error) {
          console.log(`⚠️  CacaoEscrow verification failed: ${error.message}\n`)
        }
      }
    }

    // ============================================
    // NEXT STEPS
    // ============================================
    console.log("\n" + "═".repeat(60))
    console.log("🎯 NEXT STEPS")
    console.log("═".repeat(60))
    console.log("\n1. Fund the escrow with USDC (6 decimals) for testing")
    console.log("2. Test creating an escrow via frontend or CLI (min: 0.01 USDC)")
    console.log("3. Oracle approves milestones to release funds")
    console.log("4. Monitor farmer reputation scores")
    console.log("5. Build React frontend dashboard")
    console.log("\n" + "═".repeat(60))

    console.log("\n✨ Deployment complete! Platform is ready for testing.\n")

  } catch (error) {
    console.error("\n" + "═".repeat(60))
    console.error("❌ DEPLOYMENT FAILED")
    console.error("═".repeat(60))
    console.error(`\nError: ${error.message}`)
    
    if (error.transaction) {
      console.error(`\nTransaction Hash: ${error.transaction.hash}`)
    }
    
    console.error("\nStack trace:")
    console.error(error.stack)
    
    process.exit(1)
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
