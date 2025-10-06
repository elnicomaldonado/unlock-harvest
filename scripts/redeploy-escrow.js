const hre = require("hardhat")
const fs = require("fs")
const path = require("path")

/**
 * Redeploy CacaoEscrow with bug fix
 * 
 * This script redeploys CacaoEscrow with the fixed _completeEscrow function
 * that no longer duplicates the final milestone payment.
 */

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════╗")
  console.log("║                                                               ║")
  console.log("║   🔧 Redeploy CacaoEscrow - Fix Duplicate Payment Bug 🔧      ║")
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
    usdc: "0x456a3D042C0DbD3db53D5489e98dFb038553B0d0",          // Your USDC
    oracle: "0x751E3EF3858102230FcbFcbaD0B212a4235DF59C",        // Oracle
    harvestNFT: "0xB28e3a03A73Ee67604F019C56E27382b133240Bb",    // Harvest NFT
    reputationBadge: "0xB2A9cfDD05E44078a1e21d9193d126BBf3ED501c" // Reputation Badge
  }

  console.log("📍 Using addresses:")
  console.log(`   USDC:             ${CORRECT_ADDRESSES.usdc}`)
  console.log(`   Oracle:           ${CORRECT_ADDRESSES.oracle}`)
  console.log(`   Harvest NFT:      ${CORRECT_ADDRESSES.harvestNFT}`)
  console.log(`   Reputation Badge: ${CORRECT_ADDRESSES.reputationBadge}\n`)

  try {
    // ============================================
    // DEPLOY NEW CACAO ESCROW
    // ============================================
    console.log("🚀 Deploying NEW CacaoEscrow (with bug fix)...")
    console.log("─".repeat(60))
    
    const CacaoEscrow = await hre.ethers.getContractFactory("CacaoEscrow")
    const escrow = await CacaoEscrow.deploy(
      CORRECT_ADDRESSES.usdc,
      CORRECT_ADDRESSES.oracle,
      CORRECT_ADDRESSES.harvestNFT,
      CORRECT_ADDRESSES.reputationBadge
    )
    await escrow.waitForDeployment()
    
    // Wait for 2 block confirmations
    console.log("   Waiting for block confirmations...")
    await escrow.deploymentTransaction().wait(2)
    
    const escrowAddress = await escrow.getAddress()
    
    console.log(`✅ NEW CacaoEscrow deployed to: ${escrowAddress}`)
    console.log(`   Owner: ${await escrow.owner()}`)
    console.log(`   Oracle: ${await escrow.oracle()}`)
    console.log(`   USDC: ${await escrow.cUSD()}`)
    console.log(`   Harvest NFT: ${await escrow.harvestNFT()}`)
    console.log(`   Reputation Badge: ${await escrow.reputationBadge()}\n`)

    // ============================================
    // TRANSFER NFT OWNERSHIP TO ESCROW
    // ============================================
    console.log("🔄 Transferring CacaoHarvestNFT ownership to new Escrow...")
    console.log("─".repeat(60))
    
    const harvestNFT = await hre.ethers.getContractAt("CacaoHarvestNFT", CORRECT_ADDRESSES.harvestNFT)
    const transferTx = await harvestNFT.transferOwnership(escrowAddress)
    console.log("   Waiting for confirmation...")
    await transferTx.wait(2)
    
    console.log(`✅ Ownership transfer initiated`)
    console.log(`   Pending owner: ${await harvestNFT.pendingOwner()}\n`)

    // ============================================
    // ACCEPT OWNERSHIP IN ESCROW
    // ============================================
    console.log("🔄 Accepting CacaoHarvestNFT ownership in new Escrow...")
    console.log("─".repeat(60))
    
    const acceptTx = await escrow.acceptHarvestNFTOwnership()
    console.log("   Waiting for confirmation...")
    await acceptTx.wait(2)
    
    console.log(`✅ Ownership accepted`)
    console.log(`   New NFT owner: ${await harvestNFT.owner()}\n`)

    // ============================================
    // SET ESCROW ADDRESS IN REPUTATION BADGE
    // ============================================
    console.log("🔄 Setting new Escrow address in FarmerReputationBadge...")
    console.log("─".repeat(60))
    
    const reputationBadge = await hre.ethers.getContractAt("FarmerReputationBadge", CORRECT_ADDRESSES.reputationBadge)
    const setEscrowTx = await reputationBadge.setEscrowContract(escrowAddress)
    console.log("   Waiting for confirmation...")
    await setEscrowTx.wait(2)
    
    console.log(`✅ Escrow address updated`)
    console.log(`   Badge escrow: ${await reputationBadge.escrowContract()}\n`)

    // ============================================
    // UPDATE DEPLOYMENT FILE
    // ============================================
    console.log("📝 Updating deployment file...")
    console.log("─".repeat(60))
    
    const deploymentsDir = path.join(__dirname, "..", "deployments")
    const deploymentFile = path.join(deploymentsDir, `${network}.json`)
    
    if (fs.existsSync(deploymentFile)) {
      const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'))
      deploymentData.addresses.escrow = escrowAddress
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
          oracle: CORRECT_ADDRESSES.oracle,
          usdc: CORRECT_ADDRESSES.usdc,
          harvestNFT: CORRECT_ADDRESSES.harvestNFT,
          reputationBadge: CORRECT_ADDRESSES.reputationBadge,
          escrow: escrowAddress,
          marketplace: "0xFa8f7a5A8621C15AF2f2024e405Df20F27710813"
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
    console.log(`CacaoHarvestNFT:        ${CORRECT_ADDRESSES.harvestNFT}`)
    console.log(`FarmerReputationBadge:  ${CORRECT_ADDRESSES.reputationBadge}`)
    console.log(`CacaoEscrow:            ${escrowAddress} ← NEW! (Bug Fixed)`)
    console.log(`CommitmentMarketplace:  ${"0xFa8f7a5A8621C15AF2f2024e405Df20F27710813"}`)
    console.log(`\nUSDC Token:             ${CORRECT_ADDRESSES.usdc}`)
    console.log("\n" + "═".repeat(60))

    // ============================================
    // NEXT STEPS
    // ============================================
    console.log("\n🎯 NEXT STEPS:")
    console.log("═".repeat(60))
    console.log("\n1. Update your frontend contracts.ts:")
    console.log(`   CacaoEscrow: '${escrowAddress}',`)
    console.log("\n2. Test the complete flow:")
    console.log("   - Create a commitment")
    console.log("   - Apply as farmer")
    console.log("   - Accept farmer")
    console.log("   - Approve all 4 milestones")
    console.log("   - Should complete successfully!")
    console.log("\n3. Verify on Blockscout:")
    console.log(`   https://celo-sepolia.blockscout.com/address/${escrowAddress}`)
    console.log("\n" + "═".repeat(60))

    // ============================================
    // CONTRACT VERIFICATION
    // ============================================
    if (network === "celo-sepolia") {
      console.log("\n🔍 Attempting contract verification...")
      console.log("─".repeat(60))
      
      try {
        await hre.run("verify:verify", {
          address: escrowAddress,
          constructorArguments: [
            CORRECT_ADDRESSES.usdc,
            CORRECT_ADDRESSES.oracle,
            CORRECT_ADDRESSES.harvestNFT,
            CORRECT_ADDRESSES.reputationBadge
          ]
        })
        console.log("✅ Contract verified on Blockscout!")
      } catch (error) {
        console.log(`⚠️  Verification failed: ${error.message}`)
        console.log("\nManual verification command:")
        console.log(`npx hardhat verify --network celo-sepolia ${escrowAddress} ${CORRECT_ADDRESSES.usdc} ${CORRECT_ADDRESSES.oracle} ${CORRECT_ADDRESSES.harvestNFT} ${CORRECT_ADDRESSES.reputationBadge}`)
      }
    }

    console.log("\n✨ Redeploy complete! The escrow should now work correctly.\n")

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
