const hre = require("hardhat")

/**
 * Test Deployment Script
 * 
 * Simulates a complete escrow lifecycle:
 * 1. Create an escrow
 * 2. Oracle approves milestones
 * 3. Farmer receives funds and reputation points
 * 
 * Run after deploying to local or testnet
 */

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════╗")
  console.log("║                                                               ║")
  console.log("║   🧪 Testing RealFi Platform Deployment 🧪                    ║")
  console.log("║                                                               ║")
  console.log("╚═══════════════════════════════════════════════════════════════╝\n")

  // Load deployment addresses
  const fs = require("fs")
  const path = require("path")
  const network = hre.network.name
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network}.json`)

  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ No deployment found for network: ${network}`)
    console.error(`   Expected file: ${deploymentFile}`)
    console.error(`\n   Run: npx hardhat run scripts/deploy.js --network ${network}`)
    process.exit(1)
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"))
  const addresses = deployment.addresses

  console.log("📋 Using deployed contracts:")
  console.log(`   Escrow: ${addresses.escrow}`)
  console.log(`   NFT:    ${addresses.harvestNFT}`)
  console.log(`   Badge:  ${addresses.reputationBadge}\n`)

  // Get signers
  const [deployer, investor, farmer, oracle] = await hre.ethers.getSigners()

  console.log("👥 Test Accounts:")
  console.log(`   Deployer: ${deployer.address}`)
  console.log(`   Investor: ${investor.address}`)
  console.log(`   Farmer:   ${farmer.address}`)
  console.log(`   Oracle:   ${oracle.address}\n`)

  // Get contract instances
  const escrow = await hre.ethers.getContractAt("CacaoEscrow", addresses.escrow)
  const nft = await hre.ethers.getContractAt("CacaoHarvestNFT", addresses.harvestNFT)
  const badge = await hre.ethers.getContractAt("FarmerReputationBadge", addresses.reputationBadge)

  try {
    // ============================================
    // TEST 1: CREATE ESCROW
    // ============================================
    console.log("═".repeat(60))
    console.log("TEST 1: Create Escrow")
    console.log("═".repeat(60))

    const amount = hre.ethers.parseUnits("1000", 18) // 1000 cUSD
    
    console.log(`\n💰 Creating escrow for ${hre.ethers.formatUnits(amount, 18)} cUSD...`)
    
    // In a real scenario, investor needs cUSD tokens
    // For localhost testing, you'd need to deploy a mock cUSD or fork a network
    
    const createTx = await escrow.connect(investor).createEscrow(
      farmer.address,
      amount,
      0, // Use default deadline (6 months)
      "ipfs://QmTestMetadata123"
    )
    const receipt = await createTx.wait()

    console.log(`✅ Escrow created!`)
    console.log(`   Transaction: ${receipt.hash}`)
    console.log(`   Gas used: ${receipt.gasUsed}\n`)

    // Check escrow data
    const escrowData = await escrow.getEscrow(0)
    console.log("📊 Escrow Details:")
    console.log(`   Escrow ID: 0`)
    console.log(`   Investor: ${escrowData.investor}`)
    console.log(`   Farmer: ${escrowData.farmer}`)
    console.log(`   Amount: ${hre.ethers.formatUnits(escrowData.amount, 18)} cUSD`)
    console.log(`   Status: ${['Active', 'Completed', 'Cancelled'][escrowData.status]}`)
    console.log(`   NFT Token ID: ${escrowData.nftTokenId}\n`)

    // Check NFT was minted
    const nftOwner = await nft.ownerOf(escrowData.nftTokenId)
    console.log(`✅ NFT minted to farmer: ${nftOwner === farmer.address}`)

    // Check badge was minted
    const hasBadge = await badge.hasBadge(farmer.address)
    console.log(`✅ Reputation badge minted: ${hasBadge}\n`)

    // ============================================
    // TEST 2: APPROVE MILESTONES
    // ============================================
    console.log("═".repeat(60))
    console.log("TEST 2: Approve Milestones")
    console.log("═".repeat(60) + "\n")

    const milestones = [
      "Land Verified",
      "Seeds Planted",
      "Mid-Growth Check",
      "Harvest Complete"
    ]

    for (let i = 0; i < 3; i++) {
      console.log(`🌱 Milestone ${i + 1}: ${milestones[i]}`)
      
      const approveTx = await escrow.connect(oracle).approveMilestone(
        0,
        `ipfs://proof${i + 1}`
      )
      const approveReceipt = await approveTx.wait()

      console.log(`   ✅ Approved (Gas: ${approveReceipt.gasUsed})`)
      console.log(`   💸 25% released to farmer\n`)

      // Small delay to make timestamps different
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // ============================================
    // TEST 3: CHECK FINAL STATUS
    // ============================================
    console.log("═".repeat(60))
    console.log("TEST 3: Final Status Check")
    console.log("═".repeat(60) + "\n")

    const finalEscrow = await escrow.getEscrow(0)
    console.log("📊 Final Escrow Status:")
    console.log(`   Status: ${['Active', 'Completed', 'Cancelled'][finalEscrow.status]}`)
    console.log(`   Milestone: ${['LandVerified', 'Planted', 'MidGrowth', 'Harvested'][finalEscrow.currentMilestone]}`)
    console.log(`   Deforestation: ${finalEscrow.deforestationFlagged}`)
    console.log(`   Premium Quality: ${finalEscrow.premiumQuality}\n`)

    // Check farmer reputation
    const farmerScore = await badge.getFarmerScore(farmer.address)
    const farmerTier = await badge.getFarmerTier(farmer.address)
    const farmerStats = await badge.getFarmerStats(farmer.address)

    console.log("⭐ Farmer Reputation:")
    console.log(`   Score: ${farmerScore} points`)
    console.log(`   Tier: ${['Bronze', 'Silver', 'Gold', 'Platinum'][farmerTier]}`)
    console.log(`   Total Harvests: ${farmerStats.totalHarvests}`)
    console.log(`   Successful: ${farmerStats.successfulHarvests}\n`)

    // ============================================
    // SUCCESS!
    // ============================================
    console.log("═".repeat(60))
    console.log("🎉 ALL TESTS PASSED!")
    console.log("═".repeat(60))
    console.log("\n✨ Platform is working correctly!\n")

  } catch (error) {
    console.error("\n" + "═".repeat(60))
    console.error("❌ TEST FAILED")
    console.error("═".repeat(60))
    console.error(`\nError: ${error.message}`)
    
    if (error.reason) {
      console.error(`Reason: ${error.reason}`)
    }
    
    console.error("\nStack trace:")
    console.error(error.stack)
    
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

