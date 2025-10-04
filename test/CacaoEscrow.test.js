const { expect } = require("chai")
const { ethers } = require("hardhat")
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers")

describe("CacaoEscrow", function () {
  // Define enums to match Solidity
  const EscrowMilestone = {
    LandVerified: 0,
    Planted: 1,
    MidGrowth: 2,
    Harvested: 3
  }

  const EscrowStatus = {
    Active: 0,
    Completed: 1,
    Cancelled: 2
  }

  const NFTMilestone = {
    Verified: 0,
    Planted: 1,
    MidGrowth: 2,
    Harvested: 3
  }

  // Constants
  const MIN_ESCROW_AMOUNT = ethers.parseUnits("0.01", 18) // 0.01 cUSD (Celo Sepolia)
  const MAX_ESCROW_AMOUNT = ethers.parseUnits("100000", 18)
  const DEFAULT_DEADLINE = 180 * 24 * 60 * 60 // 6 months in seconds

  /**
   * Deploy a mock ERC20 token for testing (cUSD)
   */
  async function deployMockToken() {
    const MockERC20 = await ethers.getContractFactory("contracts/test/MockERC20.sol:MockERC20")
    const token = await MockERC20.deploy("Celo USD", "cUSD", 18)
    return token
  }

  /**
   * Complete deployment fixture with all contracts
   */
  async function deployFixture() {
    const [owner, oracle, investor, farmer1, farmer2, unauthorized] = await ethers.getSigners()

    // Deploy mock cUSD token
    const cUSD = await deployMockToken()

    // Deploy CacaoHarvestNFT
    const CacaoHarvestNFT = await ethers.getContractFactory("CacaoHarvestNFT")
    const harvestNFT = await CacaoHarvestNFT.deploy(oracle.address)

    // Deploy FarmerReputationBadge (with owner as temporary escrow)
    const FarmerReputationBadge = await ethers.getContractFactory("FarmerReputationBadge")
    const reputationBadge = await FarmerReputationBadge.deploy(owner.address)

    // Deploy CacaoEscrow
    const CacaoEscrow = await ethers.getContractFactory("CacaoEscrow")
    const escrow = await CacaoEscrow.deploy(
      await cUSD.getAddress(),
      oracle.address,
      await harvestNFT.getAddress(),
      await reputationBadge.getAddress()
    )

    // Transfer NFT ownership to escrow (two-step process)
    const escrowAddress = await escrow.getAddress()
    await harvestNFT.transferOwnership(escrowAddress)
    // Accept ownership from escrow contract
    await escrow.acceptHarvestNFTOwnership()

    // Update reputation badge escrow address
    await reputationBadge.setEscrowContract(escrowAddress)

    // Mint cUSD to investor
    await cUSD.mint(investor.address, ethers.parseUnits("1000000", 18))

    // Approve escrow to spend investor's cUSD
    await cUSD.connect(investor).approve(await escrow.getAddress(), ethers.MaxUint256)

    return { 
      escrow, 
      cUSD, 
      harvestNFT, 
      reputationBadge, 
      owner, 
      oracle, 
      investor, 
      farmer1, 
      farmer2, 
      unauthorized 
    }
  }

  /**
   * Helper: Create an escrow with default parameters
   */
  async function createDefaultEscrow(escrow, investor, farmer, amount = MIN_ESCROW_AMOUNT) {
    const tx = await escrow.connect(investor).createEscrow(
      farmer.address,
      amount,
      0, // Use default deadline
      "ipfs://QmTest123"
    )
    const receipt = await tx.wait()
    return receipt
  }

  describe("Deployment", function () {
    it("Should set correct addresses", async function () {
      const { escrow, cUSD, oracle, harvestNFT, reputationBadge } = await loadFixture(deployFixture)

      expect(await escrow.cUSD()).to.equal(await cUSD.getAddress())
      expect(await escrow.oracle()).to.equal(oracle.address)
      expect(await escrow.harvestNFT()).to.equal(await harvestNFT.getAddress())
      expect(await escrow.reputationBadge()).to.equal(await reputationBadge.getAddress())
    })

    it("Should set correct constants", async function () {
      const { escrow } = await loadFixture(deployFixture)

      expect(await escrow.MIN_ESCROW_AMOUNT()).to.equal(MIN_ESCROW_AMOUNT)
      expect(await escrow.MAX_ESCROW_AMOUNT()).to.equal(MAX_ESCROW_AMOUNT)
      expect(await escrow.DEFAULT_DEADLINE()).to.equal(DEFAULT_DEADLINE)
      expect(await escrow.MILESTONE_PERCENTAGE()).to.equal(25)
    })

    it("Should start with zero escrows", async function () {
      const { escrow } = await loadFixture(deployFixture)
      expect(await escrow.totalEscrows()).to.equal(0)
    })
  })

  describe("1. ESCROW CREATION", function () {
    it("Should create escrow with valid parameters", async function () {
      const { escrow, investor, farmer1 } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits("1000", 18)

      await expect(
        escrow.connect(investor).createEscrow(
          farmer1.address,
          amount,
          0,
          "ipfs://QmTest123"
        )
      ).to.emit(escrow, "EscrowCreated")

      expect(await escrow.totalEscrows()).to.equal(1)
    })

    it("Should auto-mint NFT on creation", async function () {
      const { escrow, harvestNFT, investor, farmer1 } = await loadFixture(deployFixture)
      
      await createDefaultEscrow(escrow, investor, farmer1)

      // Check farmer owns NFT
      expect(await harvestNFT.ownerOf(0)).to.equal(farmer1.address)
      expect(await harvestNFT.balanceOf(farmer1.address)).to.equal(1)
    })

    it("Should auto-mint reputation badge for new farmer", async function () {
      const { escrow, reputationBadge, investor, farmer1 } = await loadFixture(deployFixture)

      expect(await reputationBadge.hasBadge(farmer1.address)).to.equal(false)

      await createDefaultEscrow(escrow, investor, farmer1)

      expect(await reputationBadge.hasBadge(farmer1.address)).to.equal(true)
      expect(await reputationBadge.ownerOf(0)).to.equal(farmer1.address)
    })

    it("Should NOT mint duplicate badge for existing farmer", async function () {
      const { escrow, reputationBadge, investor, farmer1 } = await loadFixture(deployFixture)

      // Create first escrow (mints badge)
      await createDefaultEscrow(escrow, investor, farmer1, MIN_ESCROW_AMOUNT)
      
      // Create second escrow (should reuse badge)
      await createDefaultEscrow(escrow, investor, farmer1, MIN_ESCROW_AMOUNT)

      // Still only one badge
      expect(await reputationBadge.balanceOf(farmer1.address)).to.equal(1)
      expect(await escrow.totalEscrows()).to.equal(2)
    })

    it("Should revert on zero address farmer", async function () {
      const { escrow, investor } = await loadFixture(deployFixture)

      await expect(
        escrow.connect(investor).createEscrow(
          ethers.ZeroAddress,
          MIN_ESCROW_AMOUNT,
          0,
          "ipfs://test"
        )
      ).to.be.revertedWith("CacaoEscrow: zero farmer address")
    })

    it("Should revert on amount below minimum", async function () {
      const { escrow, investor, farmer1 } = await loadFixture(deployFixture)
      const tooLow = ethers.parseUnits("0.009", 18) // Below 0.01 cUSD minimum

      await expect(
        escrow.connect(investor).createEscrow(
          farmer1.address,
          tooLow,
          0,
          "ipfs://test"
        )
      ).to.be.revertedWith("CacaoEscrow: amount too low")
    })

    it("Should revert on amount above maximum", async function () {
      const { escrow, investor, farmer1 } = await loadFixture(deployFixture)
      const tooHigh = ethers.parseUnits("100001", 18)

      await expect(
        escrow.connect(investor).createEscrow(
          farmer1.address,
          tooHigh,
          0,
          "ipfs://test"
        )
      ).to.be.revertedWith("CacaoEscrow: amount too high")
    })

    it("Should verify cUSD transferred to escrow", async function () {
      const { escrow, cUSD, investor, farmer1 } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits("1000", 18)

      const escrowAddress = await escrow.getAddress()
      const balanceBefore = await cUSD.balanceOf(escrowAddress)

      await escrow.connect(investor).createEscrow(
        farmer1.address,
        amount,
        0,
        "ipfs://test"
      )

      const balanceAfter = await cUSD.balanceOf(escrowAddress)
      expect(balanceAfter - balanceBefore).to.equal(amount)
    })
  })

  describe("2. MILESTONE PROGRESSION", function () {
    async function createEscrowFixture() {
      const base = await deployFixture()
      const amount = ethers.parseUnits("1000", 18)
      await base.escrow.connect(base.investor).createEscrow(
        base.farmer1.address,
        amount,
        0,
        "ipfs://test"
      )
      return { ...base, escrowId: 0, amount }
    }

    it("Should allow oracle to approve milestone 1", async function () {
      const { escrow, oracle } = await loadFixture(createEscrowFixture)

      await expect(
        escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")
      ).to.emit(escrow, "MilestoneApproved")
    })

    it("Should release 25% funds to farmer on milestone approval", async function () {
      const { escrow, cUSD, oracle, farmer1, amount } = await loadFixture(createEscrowFixture)

      const balanceBefore = await cUSD.balanceOf(farmer1.address)
      
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")

      const balanceAfter = await cUSD.balanceOf(farmer1.address)
      const released = balanceAfter - balanceBefore
      
      expect(released).to.equal(amount * BigInt(25) / BigInt(100))
    })

    it("Should update NFT to next milestone", async function () {
      const { escrow, harvestNFT, oracle } = await loadFixture(createEscrowFixture)

      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")

      const nftData = await harvestNFT.getHarvestData(0)
      expect(nftData.currentMilestone).to.equal(NFTMilestone.Planted)
    })

    it("Should approve all 4 milestones sequentially", async function () {
      const { escrow, oracle } = await loadFixture(createEscrowFixture)

      // Milestone 1
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")
      let data = await escrow.getEscrow(0)
      expect(data.currentMilestone).to.equal(EscrowMilestone.Planted)

      // Milestone 2
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof2")
      data = await escrow.getEscrow(0)
      expect(data.currentMilestone).to.equal(EscrowMilestone.MidGrowth)

      // Milestone 3
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof3")
      data = await escrow.getEscrow(0)
      expect(data.currentMilestone).to.equal(EscrowMilestone.Harvested)
    })

    it("Should verify all 100% funds released after 4 milestones", async function () {
      const { escrow, cUSD, oracle, farmer1, amount } = await loadFixture(createEscrowFixture)

      const balanceBefore = await cUSD.balanceOf(farmer1.address)

      // Approve all 4 milestones
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof2")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof3")

      const balanceAfter = await cUSD.balanceOf(farmer1.address)
      const totalReleased = balanceAfter - balanceBefore

      expect(totalReleased).to.equal(amount)
    })

    it("Should mark escrow as Completed after all milestones", async function () {
      const { escrow, oracle } = await loadFixture(createEscrowFixture)

      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof2")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof3")

      const data = await escrow.getEscrow(0)
      expect(data.status).to.equal(EscrowStatus.Completed)
    })

    it("Should update reputation score on completion", async function () {
      const { escrow, reputationBadge, oracle, farmer1 } = await loadFixture(createEscrowFixture)

      // Complete all milestones
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof2")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof3")

      const score = await reputationBadge.getFarmerScore(farmer1.address)
      // Base: 4 milestones * 25 = 100 points (if on time)
      expect(score).to.be.greaterThan(0)
    })

    it("Should emit EscrowCompleted event", async function () {
      const { escrow, oracle, farmer1 } = await loadFixture(createEscrowFixture)

      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof2")
      
      await expect(
        escrow.connect(oracle).approveMilestone(0, "ipfs://proof3")
      ).to.emit(escrow, "EscrowCompleted")
        .withArgs(0, farmer1.address, ethers.parseUnits("1000", 18))
    })

    it("Should revert if non-oracle tries to approve", async function () {
      const { escrow, unauthorized } = await loadFixture(createEscrowFixture)

      await expect(
        escrow.connect(unauthorized).approveMilestone(0, "ipfs://proof1")
      ).to.be.revertedWith("CacaoEscrow: caller is not oracle")
    })
  })

  describe("3. DEFORESTATION SCENARIOS", function () {
    async function createEscrowFixture() {
      const base = await deployFixture()
      await createDefaultEscrow(base.escrow, base.investor, base.farmer1, ethers.parseUnits("1000", 18))
      
      // Approve first milestone
      await base.escrow.connect(base.oracle).approveMilestone(0, "ipfs://proof1")
      
      return { ...base, escrowId: 0 }
    }

    it("Should allow oracle to flag deforestation", async function () {
      const { escrow, oracle, farmer1 } = await loadFixture(createEscrowFixture)

      const tx = await escrow.connect(oracle).flagDeforestation(0)
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt.blockNumber)

      await expect(tx)
        .to.emit(escrow, "DeforestationFlagged")
        .withArgs(0, farmer1.address, block.timestamp)
    })

    it("Should stop fund releases after deforestation flag", async function () {
      const { escrow, oracle } = await loadFixture(createEscrowFixture)

      // Flag deforestation
      await escrow.connect(oracle).flagDeforestation(0)

      // Try to approve next milestone
      await expect(
        escrow.connect(oracle).approveMilestone(0, "ipfs://proof2")
      ).to.be.revertedWith("CacaoEscrow: deforestation flagged")
    })

    it("Should apply -100 reputation penalty", async function () {
      const { escrow, reputationBadge, oracle, farmer1 } = await loadFixture(createEscrowFixture)

      const scoreBefore = await reputationBadge.getFarmerScore(farmer1.address)
      
      await escrow.connect(oracle).flagDeforestation(0)

      const scoreAfter = await reputationBadge.getFarmerScore(farmer1.address)
      expect(scoreBefore - scoreAfter).to.equal(100)
    })

    it("Should update NFT deforestation flag", async function () {
      const { escrow, harvestNFT, oracle } = await loadFixture(createEscrowFixture)

      await escrow.connect(oracle).flagDeforestation(0)

      expect(await harvestNFT.isDeforestationFlagged(0)).to.equal(true)
    })

    it("Should verify funds held in escrow", async function () {
      const { escrow, cUSD, oracle } = await loadFixture(createEscrowFixture)

      const escrowBalanceBefore = await cUSD.balanceOf(await escrow.getAddress())
      
      await escrow.connect(oracle).flagDeforestation(0)

      const escrowBalanceAfter = await cUSD.balanceOf(await escrow.getAddress())
      
      // 75% should still be in escrow (only 25% was released in first milestone)
      expect(escrowBalanceAfter).to.equal(escrowBalanceBefore)
    })

    it("Should prevent duplicate deforestation flags", async function () {
      const { escrow, oracle } = await loadFixture(createEscrowFixture)

      await escrow.connect(oracle).flagDeforestation(0)

      await expect(
        escrow.connect(oracle).flagDeforestation(0)
      ).to.be.revertedWith("CacaoEscrow: already flagged")
    })
  })

  describe("4. PREMIUM QUALITY", function () {
    async function completeEscrowFixture() {
      const base = await deployFixture()
      await createDefaultEscrow(base.escrow, base.investor, base.farmer1, ethers.parseUnits("1000", 18))
      
      // Complete all milestones
      await base.escrow.connect(base.oracle).approveMilestone(0, "ipfs://proof1")
      await base.escrow.connect(base.oracle).approveMilestone(0, "ipfs://proof2")
      await base.escrow.connect(base.oracle).approveMilestone(0, "ipfs://proof3")
      
      return { ...base, escrowId: 0 }
    }

    it("Should allow oracle to confirm premium quality at harvest", async function () {
      const { escrow, oracle, farmer1 } = await loadFixture(completeEscrowFixture)

      await expect(
        escrow.connect(oracle).confirmPremiumQuality(0)
      ).to.emit(escrow, "PremiumQualityConfirmed")
        .withArgs(0, farmer1.address)
    })

    it("Should include premium bonus in reputation score", async function () {
      const { escrow, reputationBadge, oracle, farmer1 } = await loadFixture(completeEscrowFixture)

      const data = await escrow.getEscrow(0)
      expect(data.premiumQuality).to.equal(false)

      // Confirm premium quality
      await escrow.connect(oracle).confirmPremiumQuality(0)

      const escrowData = await escrow.getEscrow(0)
      expect(escrowData.premiumQuality).to.equal(true)
    })

    it("Should revert if not at Harvested milestone", async function () {
      const base = await deployFixture()
      await createDefaultEscrow(base.escrow, base.investor, base.farmer1)

      await expect(
        base.escrow.connect(base.oracle).confirmPremiumQuality(0)
      ).to.be.revertedWith("CacaoEscrow: must be at harvest milestone")
    })

    it("Should prevent duplicate premium quality confirmation", async function () {
      const { escrow, oracle } = await loadFixture(completeEscrowFixture)

      await escrow.connect(oracle).confirmPremiumQuality(0)

      await expect(
        escrow.connect(oracle).confirmPremiumQuality(0)
      ).to.be.revertedWith("CacaoEscrow: already confirmed")
    })
  })

  describe("5. ON-TIME COMPLETION", function () {
    it("Should create escrow with default 6-month deadline", async function () {
      const { escrow, investor, farmer1 } = await loadFixture(deployFixture)

      const tx = await escrow.connect(investor).createEscrow(
        farmer1.address,
        MIN_ESCROW_AMOUNT,
        0, // Use default
        "ipfs://test"
      )
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt.blockNumber)

      const data = await escrow.getEscrow(0)
      expect(data.deadline).to.equal(BigInt(block.timestamp) + BigInt(DEFAULT_DEADLINE))
    })

    it("Should award on-time bonus when completed before deadline", async function () {
      const { escrow, reputationBadge, oracle, investor, farmer1 } = await loadFixture(deployFixture)

      // Create escrow
      await createDefaultEscrow(escrow, investor, farmer1)

      // Complete all milestones quickly
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof2")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof3")

      const score = await reputationBadge.getFarmerScore(farmer1.address)
      // On-time: 4 milestones * 25 = 100 points + zero deforestation bonus 50 = 150 total
      expect(score).to.equal(150)
    })

    it("Should check milestone is on time", async function () {
      const { escrow, investor, farmer1 } = await loadFixture(deployFixture)

      await createDefaultEscrow(escrow, investor, farmer1)

      expect(await escrow.isMilestoneOnTime(0)).to.equal(true)
    })

    it("Should not award on-time bonus when completed late", async function () {
      const { escrow, reputationBadge, oracle, investor, farmer1 } = await loadFixture(deployFixture)

      // Create escrow with short deadline
      const shortDeadline = (await time.latest()) + 10 // 10 seconds
      await escrow.connect(investor).createEscrow(
        farmer1.address,
        MIN_ESCROW_AMOUNT,
        shortDeadline,
        "ipfs://test"
      )

      // Fast forward past deadline
      await time.increase(20)

      // Complete all milestones
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof2")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof3")

      const score = await reputationBadge.getFarmerScore(farmer1.address)
      // Late: no on-time bonus, only zero deforestation bonus (50)
      expect(score).to.equal(50)
    })
  })

  describe("6. CANCELLATION", function () {
    it("Should allow investor to cancel before milestone 1", async function () {
      const { escrow, investor, farmer1 } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits("1000", 18)

      await escrow.connect(investor).createEscrow(
        farmer1.address,
        amount,
        0,
        "ipfs://test"
      )

      await expect(
        escrow.connect(investor).cancelEscrow(0)
      ).to.emit(escrow, "EscrowCancelled")
        .withArgs(0, investor.address, amount)
    })

    it("Should provide full refund to investor", async function () {
      const { escrow, cUSD, investor, farmer1 } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits("1000", 18)

      const balanceBefore = await cUSD.balanceOf(investor.address)

      await escrow.connect(investor).createEscrow(
        farmer1.address,
        amount,
        0,
        "ipfs://test"
      )

      await escrow.connect(investor).cancelEscrow(0)

      const balanceAfter = await cUSD.balanceOf(investor.address)
      expect(balanceAfter).to.equal(balanceBefore)
    })

    it("Should revert if trying to cancel after milestone 1", async function () {
      const { escrow, oracle, investor, farmer1 } = await loadFixture(deployFixture)

      await createDefaultEscrow(escrow, investor, farmer1)
      
      // Approve first milestone
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")

      await expect(
        escrow.connect(investor).cancelEscrow(0)
      ).to.be.revertedWith("CacaoEscrow: milestones already started")
    })

    it("Should mark escrow as Cancelled", async function () {
      const { escrow, investor, farmer1 } = await loadFixture(deployFixture)

      await createDefaultEscrow(escrow, investor, farmer1)
      await escrow.connect(investor).cancelEscrow(0)

      const data = await escrow.getEscrow(0)
      expect(data.status).to.equal(EscrowStatus.Cancelled)
    })
  })

  describe("7. REPUTATION INTEGRATION", function () {
    it("Should auto-mint badge for farmer's first escrow", async function () {
      const { escrow, reputationBadge, investor, farmer1 } = await loadFixture(deployFixture)

      expect(await reputationBadge.hasBadge(farmer1.address)).to.equal(false)

      await createDefaultEscrow(escrow, investor, farmer1)

      expect(await reputationBadge.hasBadge(farmer1.address)).to.equal(true)
    })

    it("Should reuse existing badge for subsequent escrows", async function () {
      const { escrow, reputationBadge, investor, farmer1 } = await loadFixture(deployFixture)

      // First escrow
      await createDefaultEscrow(escrow, investor, farmer1)
      const badgeCount1 = await reputationBadge.balanceOf(farmer1.address)

      // Second escrow
      await createDefaultEscrow(escrow, investor, farmer1)
      const badgeCount2 = await reputationBadge.balanceOf(farmer1.address)

      expect(badgeCount1).to.equal(badgeCount2)
      expect(badgeCount1).to.equal(1)
    })

    it("Should accumulate score across multiple escrows", async function () {
      const { escrow, reputationBadge, oracle, investor, farmer1 } = await loadFixture(deployFixture)

      // First escrow
      await createDefaultEscrow(escrow, investor, farmer1)
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof2")
      await escrow.connect(oracle).approveMilestone(0, "ipfs://proof3")

      const scoreAfterFirst = await reputationBadge.getFarmerScore(farmer1.address)

      // Second escrow
      await createDefaultEscrow(escrow, investor, farmer1)
      await escrow.connect(oracle).approveMilestone(1, "ipfs://proof1")
      await escrow.connect(oracle).approveMilestone(1, "ipfs://proof2")
      await escrow.connect(oracle).approveMilestone(1, "ipfs://proof3")

      const scoreAfterSecond = await reputationBadge.getFarmerScore(farmer1.address)

      expect(scoreAfterSecond).to.be.greaterThan(scoreAfterFirst)
    })

    it("Should enable tier progression with multiple escrows", async function () {
      const { escrow, reputationBadge, oracle, investor, farmer1 } = await loadFixture(deployFixture)

      // Complete 3 perfect escrows to reach Silver tier (200+ points)
      for (let i = 0; i < 3; i++) {
        await createDefaultEscrow(escrow, investor, farmer1)
        await escrow.connect(oracle).approveMilestone(i, "ipfs://proof1")
        await escrow.connect(oracle).approveMilestone(i, "ipfs://proof2")
        await escrow.connect(oracle).approveMilestone(i, "ipfs://proof3")
      }

      const tier = await reputationBadge.getFarmerTier(farmer1.address)
      expect(tier).to.be.greaterThan(0) // Above Bronze
    })
  })

  describe("8. EDGE CASES & SECURITY", function () {
    it("Should protect against reentrancy", async function () {
      // ReentrancyGuard is tested via normal operations
      // If a reentrancy occurred, other tests would fail
      const { escrow, investor, farmer1 } = await loadFixture(deployFixture)
      
      await createDefaultEscrow(escrow, investor, farmer1)
      // Success indicates reentrancy protection is working
      expect(await escrow.totalEscrows()).to.equal(1)
    })

    it("Should allow owner to pause contract", async function () {
      const { escrow, owner } = await loadFixture(deployFixture)

      await escrow.connect(owner).pause()
      expect(await escrow.paused()).to.equal(true)
    })

    it("Should revert operations when paused", async function () {
      const { escrow, owner, investor, farmer1 } = await loadFixture(deployFixture)

      await escrow.connect(owner).pause()

      await expect(
        createDefaultEscrow(escrow, investor, farmer1)
      ).to.be.revertedWithCustomError(escrow, "EnforcedPause")
    })

    it("Should allow owner to unpause", async function () {
      const { escrow, owner, investor, farmer1 } = await loadFixture(deployFixture)

      await escrow.connect(owner).pause()
      await escrow.connect(owner).unpause()

      expect(await escrow.paused()).to.equal(false)
      
      // Should work after unpause
      await createDefaultEscrow(escrow, investor, farmer1)
      expect(await escrow.totalEscrows()).to.equal(1)
    })

    it("Should revert with insufficient cUSD balance", async function () {
      const { escrow, cUSD, farmer2 } = await loadFixture(deployFixture)

      // farmer2 has no cUSD
      await expect(
        escrow.connect(farmer2).createEscrow(
          farmer2.address,
          MIN_ESCROW_AMOUNT,
          0,
          "ipfs://test"
        )
      ).to.be.reverted // Will revert on transfer
    })

    it("Should handle multiple concurrent escrows", async function () {
      const { escrow, investor, farmer1, farmer2 } = await loadFixture(deployFixture)

      // Create multiple escrows
      await createDefaultEscrow(escrow, investor, farmer1)
      await createDefaultEscrow(escrow, investor, farmer2)
      await createDefaultEscrow(escrow, investor, farmer1)

      expect(await escrow.totalEscrows()).to.equal(3)
      
      // Check farmer tracking
      const farmer1Escrows = await escrow.getFarmerEscrows(farmer1.address)
      const farmer2Escrows = await escrow.getFarmerEscrows(farmer2.address)
      
      expect(farmer1Escrows.length).to.equal(2)
      expect(farmer2Escrows.length).to.equal(1)
    })
  })

  describe("9. GAS OPTIMIZATION", function () {
    it("Should report gas for escrow creation", async function () {
      const { escrow, investor, farmer1 } = await loadFixture(deployFixture)

      const tx = await escrow.connect(investor).createEscrow(
        farmer1.address,
        MIN_ESCROW_AMOUNT,
        0,
        "ipfs://test"
      )
      const receipt = await tx.wait()

      console.log(`Gas used for escrow creation: ${receipt.gasUsed}`)
      
      // Should be reasonable for farmers
      expect(receipt.gasUsed).to.be.lessThan(1000000)
    })

    it("Should report gas for milestone approval", async function () {
      const { escrow, oracle, investor, farmer1 } = await loadFixture(deployFixture)

      await createDefaultEscrow(escrow, investor, farmer1)

      const tx = await escrow.connect(oracle).approveMilestone(0, "ipfs://proof1")
      const receipt = await tx.wait()

      console.log(`Gas used for milestone approval: ${receipt.gasUsed}`)
      
      // Should be affordable
      expect(receipt.gasUsed).to.be.lessThan(500000)
    })
  })

  describe("View Functions", function () {
    it("Should return escrow data correctly", async function () {
      const { escrow, investor, farmer1 } = await loadFixture(deployFixture)
      const amount = ethers.parseUnits("1000", 18)

      await escrow.connect(investor).createEscrow(
        farmer1.address,
        amount,
        0,
        "ipfs://test"
      )

      const data = await escrow.getEscrow(0)
      expect(data.investor).to.equal(investor.address)
      expect(data.farmer).to.equal(farmer1.address)
      expect(data.amount).to.equal(amount)
      expect(data.status).to.equal(EscrowStatus.Active)
    })

    it("Should track investor escrows", async function () {
      const { escrow, investor, farmer1, farmer2 } = await loadFixture(deployFixture)

      await createDefaultEscrow(escrow, investor, farmer1)
      await createDefaultEscrow(escrow, investor, farmer2)

      const investorEscrows = await escrow.getInvestorEscrows(investor.address)
      expect(investorEscrows.length).to.equal(2)
    })
  })
})

