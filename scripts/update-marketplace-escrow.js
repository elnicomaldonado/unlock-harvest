const hre = require("hardhat")

/**
 * Update CommitmentMarketplace to use the new CacaoEscrow
 * 
 * This script updates the CommitmentMarketplace to point to the new
 * CacaoEscrow contract that has the bug fix.
 */

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════╗")
  console.log("║                                                               ║")
  console.log("║   🔧 Update Marketplace to use new Escrow 🔧                  ║")
  console.log("║                                                               ║")
  console.log("╚═══════════════════════════════════════════════════════════════╝\n")

  // Get network information
  const network = hre.network.name
  const [deployer] = await hre.ethers.getSigners()
  const deployerAddress = deployer.address
  
  console.log("📋 Update Configuration")
  console.log("═".repeat(60))
  console.log(`Network:        ${network}`)
  console.log(`Deployer:       ${deployerAddress}`)
  console.log(`Balance:        ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployerAddress))} CELO`)
  console.log("═".repeat(60) + "\n")

  // ADDRESSES
  const marketplaceAddress = "0xFa8f7a5A8621C15AF2f2024e405Df20F27710813"
  const newEscrowAddress = "0x4B0291561f3Bc9cd7a72f4124E10020444f3a15d"
  const reputationBadgeAddress = "0xB2A9cfDD05E44078a1e21d9193d126BBf3ED501c"

  console.log("📍 Using addresses:")
  console.log(`   Marketplace:        ${marketplaceAddress}`)
  console.log(`   New Escrow:         ${newEscrowAddress}`)
  console.log(`   Reputation Badge:   ${reputationBadgeAddress}\n`)

  try {
    // ============================================
    // CHECK CURRENT MARKETPLACE STATE
    // ============================================
    console.log("🔍 Checking current marketplace state...")
    console.log("─".repeat(60))
    
    const marketplace = await hre.ethers.getContractAt("CommitmentMarketplace", marketplaceAddress)
    
    const currentEscrow = await marketplace.escrowContract()
    const currentReputation = await marketplace.reputationContract()
    
    console.log(`Current Escrow:       ${currentEscrow}`)
    console.log(`Current Reputation:   ${currentReputation}`)
    console.log(`Target Escrow:        ${newEscrowAddress}`)
    console.log(`Target Reputation:    ${reputationBadgeAddress}`)
    
    if (currentEscrow === newEscrowAddress) {
      console.log("✅ Marketplace already points to new escrow!")
      return
    }

    // ============================================
    // UPDATE MARKETPLACE ESCROW ADDRESS
    // ============================================
    console.log("\n🔄 Updating marketplace escrow address...")
    console.log("─".repeat(60))
    
    // Check if marketplace has updateEscrowContract function
    try {
      const updateTx = await marketplace.updateEscrowContract(newEscrowAddress)
      console.log("   Waiting for confirmation...")
      await updateTx.wait(2)
      console.log("✅ Escrow address updated successfully!")
    } catch (error) {
      console.log("❌ Error updating escrow address:", error.message)
      console.log("   This might be because the marketplace doesn't have an update function")
      console.log("   We'll need to redeploy the marketplace instead")
      return
    }

    // ============================================
    // VERIFY UPDATE
    // ============================================
    console.log("\n🔍 Verifying update...")
    console.log("─".repeat(60))
    
    const updatedEscrow = await marketplace.escrowContract()
    const updatedReputation = await marketplace.reputationContract()
    
    console.log(`Updated Escrow:       ${updatedEscrow}`)
    console.log(`Updated Reputation:   ${updatedReputation}`)
    
    if (updatedEscrow === newEscrowAddress) {
      console.log("✅ Marketplace successfully updated!")
    } else {
      console.log("❌ Update failed - escrow address doesn't match")
    }

    console.log("\n✨ Update complete! The marketplace should now use the new escrow.\n")

  } catch (error) {
    console.error("\n" + "═".repeat(60))
    console.error("❌ UPDATE FAILED")
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

// Execute update
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
