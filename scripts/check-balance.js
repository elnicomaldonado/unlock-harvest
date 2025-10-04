const hre = require("hardhat")

/**
 * Check Deployer Balance
 * 
 * Verifies that the deployer wallet has sufficient funds for deployment
 */

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════╗")
  console.log("║                                                               ║")
  console.log("║              💰 Deployer Balance Check 💰                     ║")
  console.log("║                                                               ║")
  console.log("╚═══════════════════════════════════════════════════════════════╝\n")

  const network = hre.network.name
  const [deployer] = await hre.ethers.getSigners()
  const address = deployer.address

  console.log(`Network:  ${network}`)
  console.log(`Address:  ${address}\n`)

  // Get balance
  const balance = await hre.ethers.provider.getBalance(address)
  const balanceInCelo = hre.ethers.formatEther(balance)

  console.log("═".repeat(60))
  console.log(`Current Balance: ${balanceInCelo} CELO`)
  console.log("═".repeat(60) + "\n")

  // Estimated deployment cost
  const estimatedCost = 0.2 // CELO
  const recommended = 0.5 // CELO

  console.log("💡 Deployment Requirements:")
  console.log(`   Estimated Cost:  ~${estimatedCost} CELO`)
  console.log(`   Recommended:     ~${recommended} CELO (includes buffer)`)
  console.log()

  // Check if sufficient
  if (parseFloat(balanceInCelo) < estimatedCost) {
    console.log("❌ INSUFFICIENT BALANCE")
    console.log(`   You need at least ${estimatedCost} CELO to deploy.`)
    console.log(`   Current balance: ${balanceInCelo} CELO\n`)

    if (network === "celo-sepolia") {
      console.log("💡 Get testnet CELO:")
      console.log("   Visit: https://faucet.celo.org")
      console.log(`   Enter your address: ${address}\n`)
    } else if (network === "celo") {
      console.log("💡 Get mainnet CELO:")
      console.log("   Purchase from an exchange (Coinbase, Binance, etc.)")
      console.log("   Transfer to your deployer wallet\n")
    }

    process.exit(1)
  } else if (parseFloat(balanceInCelo) < recommended) {
    console.log("⚠️  LOW BALANCE")
    console.log(`   You have enough to deploy (${balanceInCelo} CELO)`)
    console.log(`   But recommended balance is ${recommended} CELO for safety.`)
    console.log()
  } else {
    console.log("✅ SUFFICIENT BALANCE")
    console.log(`   You have ${balanceInCelo} CELO`)
    console.log("   Ready to deploy!\n")
  }

  // Show network info
  if (network === "celo-sepolia") {
    console.log("📍 Network Info:")
    console.log("   Testnet: Celo Sepolia")
    console.log("   Explorer: https://celo-sepolia.blockscout.com")
    console.log(`   Your Address: https://celo-sepolia.blockscout.com/address/${address}\n`)
  } else if (network === "celo") {
    console.log("📍 Network Info:")
    console.log("   Mainnet: Celo")
    console.log("   Explorer: https://celoscan.io")
    console.log(`   Your Address: https://celoscan.io/address/${address}\n`)
  }

  console.log("═".repeat(60))
  console.log("Ready to deploy? Run:")
  console.log(`npx hardhat run scripts/deploy.js --network ${network}`)
  console.log("═".repeat(60) + "\n")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

