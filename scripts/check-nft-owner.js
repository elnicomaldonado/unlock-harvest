const hre = require("hardhat")

async function main() {
  const nftAddress = "0xB28e3a03A73Ee67604F019C56E27382b133240Bb"
  const nft = await hre.ethers.getContractAt("CacaoHarvestNFT", nftAddress)
  
  console.log("🔍 Checking CacaoHarvestNFT ownership...")
  console.log("═".repeat(60))
  console.log(`NFT Address: ${nftAddress}`)
  console.log(`Current owner: ${await nft.owner()}`)
  console.log(`Pending owner: ${await nft.pendingOwner()}`)
  
  // Check if there's a pending ownership transfer
  try {
    const pendingOwner = await nft.pendingOwner()
    if (pendingOwner !== "0x0000000000000000000000000000000000000000") {
      console.log(`⚠️  There's a pending ownership transfer to: ${pendingOwner}`)
    } else {
      console.log("✅ No pending ownership transfer")
    }
  } catch (error) {
    console.log("❌ Error checking pending owner:", error.message)
  }
}

main().catch(console.error)
