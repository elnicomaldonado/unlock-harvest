const hre = require("hardhat")
const fs = require("fs")
const path = require("path")

/**
 * Redeploy CommitmentMarketplace with correct addresses
 * 
 * This script fixes the issue where CommitmentMarketplace was deployed
 * with the old FarmerReputationBadge address.
 */

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════╗")
  console.log("║                                                               ║")
  console.log("║   🔧 Redeploy CommitmentMarketplace - Fix Address Issue 🔧    ║")
  console.log("║                                                               ║")
  console.log("╚═══════════════════════════════════════════════════════════════╝\n")

  // Get network information
  const network = hre.network.name
  const [deployer] = await hre.ethers.getSigners()
  const deployerAddress = deployer.address
  
  console.log("📋 Redeploy Configuration")
  console.log("═".repeat(60))
  console.log(`Network:        ${network}`)
  console.log(`Deployer:       ${deployerAddress}`)
  console.log(`Balance:        ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployerAddress))} CELO`)
  console.log("═".repeat(60) + "\n")

  // CORRECT ADDRESSES (from your working setup)
  const CORRECT_ADDRESSES = {
    escrow: "0x4B0291561f3Bc9cd7a72f4124E10020444f3a15d",        // NEW escrow with bug fix
    reputationBadge: "0xB2A9cfDD05E44078a1e21d9193d126BBf3ED501c", // Your working badge
    usdc: "0x456a3D042C0DbD3db53D5489e98dFb038553B0d0"          // Your USDC
  }

  console.log("📍 Using CORRECT addresses:")
  console.log(`   Escrow:           ${CORRECT_ADDRESSES.escrow}`)
  console.log(`   Reputation Badge: ${CORRECT_ADDRESSES.reputationBadge}`)
  console.log(`   USDC:             ${CORRECT_ADDRESSES.usdc}\n`)

  try {
    // ============================================
    // DEPLOY NEW COMMITMENT MARKETPLACE
    // ============================================
    console.log("🚀 Deploying NEW CommitmentMarketplace...")
    console.log("─".repeat(60))
    
    const CommitmentMarketplace = await hre.ethers.getContractFactory("CommitmentMarketplace")
    const marketplace = await CommitmentMarketplace.deploy(
      CORRECT_ADDRESSES.escrow,
      CORRECT_ADDRESSES.reputationBadge
    )
    await marketplace.waitForDeployment()
    
    // Wait for 2 block confirmations
    console.log("   Waiting for block confirmations...")
    await marketplace.deploymentTransaction().wait(2)
    
    const marketplaceAddress = await marketplace.getAddress()
    
    console.log(`✅ NEW CommitmentMarketplace deployed to: ${marketplaceAddress}`)
    console.log(`   Owner: ${await marketplace.owner()}`)
    console.log(`   Escrow Contract: ${await marketplace.escrowContract()}`)
    console.log(`   Reputation Contract: ${await marketplace.reputationContract()}`)
    console.log(`   USDC: ${await marketplace.usdc()}\n`)

    // ============================================
    // VERIFY INTEGRATION
    // ============================================
    console.log("🔍 Verifying integration...")
    console.log("─".repeat(60))
    
    // Check that addresses match
    const escrowInContract = await marketplace.escrowContract()
    const reputationInContract = await marketplace.reputationContract()
    
    if (escrowInContract === CORRECT_ADDRESSES.escrow) {
      console.log("✅ Escrow address correct")
    } else {
      console.log("❌ Escrow address mismatch!")
      console.log(`   Expected: ${CORRECT_ADDRESSES.escrow}`)
      console.log(`   Got:      ${escrowInContract}`)
    }
    
    if (reputationInContract === CORRECT_ADDRESSES.reputationBadge) {
      console.log("✅ Reputation Badge address correct")
    } else {
      console.log("❌ Reputation Badge address mismatch!")
      console.log(`   Expected: ${CORRECT_ADDRESSES.reputationBadge}`)
      console.log(`   Got:      ${reputationInContract}`)
    }

    // ============================================
    // UPDATE DEPLOYMENT FILE
    // ============================================
    console.log("\n📝 Updating deployment file...")
    console.log("─".repeat(60))
    
    const deploymentsDir = path.join(__dirname, "..", "deployments")
    const deploymentFile = path.join(deploymentsDir, `${network}.json`)
    
    if (fs.existsSync(deploymentFile)) {
      const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
      deploymentData.addresses.marketplace = marketplaceAddress
      deploymentData.timestamp = new Date().toISOString()
      
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2))
      console.log(`✅ Updated ${deploymentFile}`)
    } else {
      console.log("⚠️  Deployment file not found, creating new one...")
      
      if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true })
      }
      
      const newDeploymentData = {
        network,
        timestamp: new Date().toISOString(),
        addresses: {
          deployer: deployerAddress,
          oracle: "0x751E3EF3858102230FcbFcbaD0B212a4235DF59C",
          usdc: CORRECT_ADDRESSES.usdc,
          harvestNFT: "0xB28e3a03A73Ee67604F019C56E27382b133240Bb",
          reputationBadge: CORRECT_ADDRESSES.reputationBadge,
          escrow: CORRECT_ADDRESSES.escrow,
          marketplace: marketplaceAddress
        }
      }
      
      fs.writeFileSync(deploymentFile, JSON.stringify(newDeploymentData, null, 2))
      console.log(`✅ Created ${deploymentFile}`)
    }

    // ============================================
    // SUCCESS SUMMARY
    // ============================================
    console.log("\n" + "═".repeat(60))
    console.log("🎉 REDEPLOY SUCCESSFUL!")
    console.log("═".repeat(60))
    console.log("\n📋 Updated Contract Addresses:\n")
    console.log(`CacaoHarvestNFT:        ${"0xB28e3a03A73Ee67604F019C56E27382b133240Bb"}`)
    console.log(`FarmerReputationBadge:  ${CORRECT_ADDRESSES.reputationBadge}`)
    console.log(`CacaoEscrow:            ${CORRECT_ADDRESSES.escrow}`)
    console.log(`CommitmentMarketplace:  ${marketplaceAddress} ← NEW!`)
    console.log(`\nUSDC Token:             ${CORRECT_ADDRESSES.usdc}`)
    console.log("\n" + "═".repeat(60))

    // ============================================
    // NEXT STEPS
    // ============================================
    console.log("\n🎯 NEXT STEPS:")
    console.log("═".repeat(60))
    console.log("\n1. Update your frontend web3.ts:")
    console.log(`   CommitmentMarketplace: '${marketplaceAddress}',`)
    console.log("\n2. Test the Apply flow:")
    console.log("   - Create a commitment")
    console.log("   - Apply as farmer")
    console.log("   - Should work without 'no reputation badge' error")
    console.log("\n3. Verify on Blockscout:")
    console.log(`   https://celo-sepolia.blockscout.com/address/${marketplaceAddress}`)
    console.log("\n" + "═".repeat(60))

    // ============================================
    // CONTRACT VERIFICATION
    // ============================================
    if (network === "celo-sepolia") {
      console.log("\n🔍 Attempting contract verification...")
      console.log("─".repeat(60))
      
      try {
        await hre.run("verify:verify", {
          address: marketplaceAddress,
          constructorArguments: [CORRECT_ADDRESSES.escrow, CORRECT_ADDRESSES.reputationBadge]
        })
        console.log("✅ Contract verified on Blockscout!")
      } catch (error) {
        console.log(`⚠️  Verification failed: ${error.message}`)
        console.log("\nManual verification command:")
        console.log(`npx hardhat verify --network celo-sepolia ${marketplaceAddress} ${CORRECT_ADDRESSES.escrow} ${CORRECT_ADDRESSES.reputationBadge}`)
      }
    }

    console.log("\n✨ Redeploy complete! The marketplace should now work correctly.\n")

  } catch (error) {
    console.error("\n" + "═".repeat(60))
    console.error("❌ REDEPLOY FAILED")
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

// Execute redeploy
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
