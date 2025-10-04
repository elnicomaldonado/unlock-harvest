const { expect } = require("chai")
const { ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers")

describe("FarmerReputationBadge", function () {
  // Define Tier enum to match Solidity
  const Tier = {
    Bronze: 0,
    Silver: 1,
    Gold: 2,
    Platinum: 3
  }

  // Define constants matching contract
  const POINTS_PER_MILESTONE = 25
  const ZERO_DEFORESTATION_BONUS = 50
  const PREMIUM_QUALITY_BONUS = 30
  const DEFORESTATION_PENALTY = 100
  const SILVER_THRESHOLD = 200
  const GOLD_THRESHOLD = 300
  const PLATINUM_THRESHOLD = 400

  /**
   * Fixture for deploying contract
   */
  async function deployFixture() {
    const [owner, escrow, farmer1, farmer2, farmer3, unauthorized] = await ethers.getSigners()

    const FarmerReputationBadge = await ethers.getContractFactory("FarmerReputationBadge")
    const badge = await FarmerReputationBadge.deploy(escrow.address)

    return { badge, owner, escrow, farmer1, farmer2, farmer3, unauthorized }
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { badge } = await loadFixture(deployFixture)
      expect(await badge.name()).to.equal("Farmer Reputation Badge")
      expect(await badge.symbol()).to.equal("REPUTATION")
    })

    it("Should set the correct escrow contract", async function () {
      const { badge, escrow } = await loadFixture(deployFixture)
      expect(await badge.escrowContract()).to.equal(escrow.address)
    })

    it("Should set the correct owner", async function () {
      const { badge, owner } = await loadFixture(deployFixture)
      expect(await badge.owner()).to.equal(owner.address)
    })

    it("Should have correct scoring constants", async function () {
      const { badge } = await loadFixture(deployFixture)
      expect(await badge.POINTS_PER_MILESTONE()).to.equal(POINTS_PER_MILESTONE)
      expect(await badge.ZERO_DEFORESTATION_BONUS()).to.equal(ZERO_DEFORESTATION_BONUS)
      expect(await badge.PREMIUM_QUALITY_BONUS()).to.equal(PREMIUM_QUALITY_BONUS)
      expect(await badge.DEFORESTATION_PENALTY()).to.equal(DEFORESTATION_PENALTY)
    })

    it("Should have correct tier thresholds", async function () {
      const { badge } = await loadFixture(deployFixture)
      expect(await badge.SILVER_THRESHOLD()).to.equal(SILVER_THRESHOLD)
      expect(await badge.GOLD_THRESHOLD()).to.equal(GOLD_THRESHOLD)
      expect(await badge.PLATINUM_THRESHOLD()).to.equal(PLATINUM_THRESHOLD)
    })
  })

  describe("Badge Minting", function () {
    it("Should mint badge for a farmer", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(deployFixture)

      await expect(badge.connect(escrow).mintBadge(farmer1.address))
        .to.emit(badge, "BadgeMinted")
        .withArgs(farmer1.address, 0)

      expect(await badge.ownerOf(0)).to.equal(farmer1.address)
      expect(await badge.hasBadge(farmer1.address)).to.equal(true)
    })

    it("Should initialize farmer stats at Bronze tier with 0 score", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(deployFixture)

      await badge.connect(escrow).mintBadge(farmer1.address)

      const stats = await badge.getFarmerStats(farmer1.address)
      expect(stats.score).to.equal(0)
      expect(stats.tier).to.equal(Tier.Bronze)
      expect(stats.totalHarvests).to.equal(0)
      expect(stats.successfulHarvests).to.equal(0)
      expect(stats.deforestationIncidents).to.equal(0)
      expect(stats.onTimeCompletions).to.equal(0)
      expect(stats.premiumQualityCount).to.equal(0)
    })

    it("Should increment token IDs sequentially", async function () {
      const { badge, escrow, farmer1, farmer2, farmer3 } = await loadFixture(deployFixture)

      await badge.connect(escrow).mintBadge(farmer1.address)
      await badge.connect(escrow).mintBadge(farmer2.address)
      await badge.connect(escrow).mintBadge(farmer3.address)

      expect(await badge.ownerOf(0)).to.equal(farmer1.address)
      expect(await badge.ownerOf(1)).to.equal(farmer2.address)
      expect(await badge.ownerOf(2)).to.equal(farmer3.address)
    })

    it("Should revert if non-escrow tries to mint", async function () {
      const { badge, unauthorized, farmer1 } = await loadFixture(deployFixture)

      await expect(
        badge.connect(unauthorized).mintBadge(farmer1.address)
      ).to.be.revertedWith("FarmerReputationBadge: caller is not escrow")
    })

    it("Should revert if farmer already has badge", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(deployFixture)

      await badge.connect(escrow).mintBadge(farmer1.address)

      await expect(
        badge.connect(escrow).mintBadge(farmer1.address)
      ).to.be.revertedWith("FarmerReputationBadge: farmer already has badge")
    })

    it("Should revert if minting to zero address", async function () {
      const { badge, escrow } = await loadFixture(deployFixture)

      await expect(
        badge.connect(escrow).mintBadge(ethers.ZeroAddress)
      ).to.be.revertedWith("FarmerReputationBadge: zero address")
    })
  })

  describe("Score Updates - Basic", function () {
    async function mintedBadgeFixture() {
      const base = await deployFixture()
      await base.badge.connect(base.escrow).mintBadge(base.farmer1.address)
      return base
    }

    it("Should award points for on-time milestones", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      await badge.connect(escrow).updateScore(
        farmer1.address,
        4, // 4 milestones
        true, // on time
        false, // no deforestation bonus
        false // no premium bonus
      )

      const score = await badge.getFarmerScore(farmer1.address)
      expect(score).to.equal(4 * POINTS_PER_MILESTONE) // 100 points
    })

    it("Should award zero deforestation bonus", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      await badge.connect(escrow).updateScore(
        farmer1.address,
        4,
        true,
        true, // zero deforestation
        false
      )

      const score = await badge.getFarmerScore(farmer1.address)
      expect(score).to.equal(4 * POINTS_PER_MILESTONE + ZERO_DEFORESTATION_BONUS) // 150
    })

    it("Should award premium quality bonus", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      await badge.connect(escrow).updateScore(
        farmer1.address,
        4,
        true,
        false,
        true // premium quality
      )

      const score = await badge.getFarmerScore(farmer1.address)
      expect(score).to.equal(4 * POINTS_PER_MILESTONE + PREMIUM_QUALITY_BONUS) // 130
    })

    it("Should award all bonuses combined", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      await badge.connect(escrow).updateScore(
        farmer1.address,
        4,
        true,
        true, // all bonuses
        true
      )

      const score = await badge.getFarmerScore(farmer1.address)
      expect(score).to.equal(4 * POINTS_PER_MILESTONE + ZERO_DEFORESTATION_BONUS + PREMIUM_QUALITY_BONUS) // 180
    })

    it("Should not award points if not on time", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      await badge.connect(escrow).updateScore(
        farmer1.address,
        4,
        false, // not on time
        true,
        true
      )

      const score = await badge.getFarmerScore(farmer1.address)
      // Should only get bonuses, no milestone points
      expect(score).to.equal(ZERO_DEFORESTATION_BONUS + PREMIUM_QUALITY_BONUS) // 80
    })

    it("Should update stats correctly", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      await badge.connect(escrow).updateScore(farmer1.address, 4, true, true, true)

      const stats = await badge.getFarmerStats(farmer1.address)
      expect(stats.totalHarvests).to.equal(1)
      expect(stats.successfulHarvests).to.equal(1)
      expect(stats.onTimeCompletions).to.equal(4)
      expect(stats.premiumQualityCount).to.equal(1)
    })

    it("Should emit ScoreUpdated event", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      await expect(
        badge.connect(escrow).updateScore(farmer1.address, 4, true, true, true)
      ).to.emit(badge, "ScoreUpdated")
    })

    it("Should accumulate score across multiple updates", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      // First harvest: 100 points
      await badge.connect(escrow).updateScore(farmer1.address, 4, true, false, false)
      expect(await badge.getFarmerScore(farmer1.address)).to.equal(100)

      // Second harvest: +150 points
      await badge.connect(escrow).updateScore(farmer1.address, 4, true, true, false)
      expect(await badge.getFarmerScore(farmer1.address)).to.equal(250)

      // Third harvest: +130 points
      await badge.connect(escrow).updateScore(farmer1.address, 4, true, false, true)
      expect(await badge.getFarmerScore(farmer1.address)).to.equal(380)
    })

    it("Should revert if non-escrow tries to update score", async function () {
      const { badge, unauthorized, farmer1 } = await loadFixture(mintedBadgeFixture)

      await expect(
        badge.connect(unauthorized).updateScore(farmer1.address, 4, true, false, false)
      ).to.be.revertedWith("FarmerReputationBadge: caller is not escrow")
    })

    it("Should revert if farmer has no badge", async function () {
      const { badge, escrow, farmer2 } = await loadFixture(mintedBadgeFixture)

      await expect(
        badge.connect(escrow).updateScore(farmer2.address, 4, true, false, false)
      ).to.be.revertedWith("FarmerReputationBadge: farmer has no badge")
    })

    it("Should revert if milestone count is invalid", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      await expect(
        badge.connect(escrow).updateScore(farmer1.address, 5, true, false, false)
      ).to.be.revertedWith("FarmerReputationBadge: invalid milestone count")
    })
  })

  describe("Deforestation Penalties", function () {
    async function mintedBadgeFixture() {
      const base = await deployFixture()
      await base.badge.connect(base.escrow).mintBadge(base.farmer1.address)
      return base
    }

    it("Should apply deforestation penalty", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      // Start with some positive score
      await badge.connect(escrow).updateScore(farmer1.address, 4, true, true, true)
      const initialScore = await badge.getFarmerScore(farmer1.address)

      await expect(badge.connect(escrow).applyDeforestationPenalty(farmer1.address))
        .to.emit(badge, "DeforestationPenalty")
        .withArgs(farmer1.address, DEFORESTATION_PENALTY)

      const newScore = await badge.getFarmerScore(farmer1.address)
      expect(newScore).to.equal(initialScore - BigInt(DEFORESTATION_PENALTY))
    })

    it("Should make score negative if penalty exceeds current score", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      // Score starts at 0
      await badge.connect(escrow).applyDeforestationPenalty(farmer1.address)

      const score = await badge.getFarmerScore(farmer1.address)
      expect(score).to.equal(-DEFORESTATION_PENALTY)
    })

    it("Should increment deforestation incidents counter", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      await badge.connect(escrow).applyDeforestationPenalty(farmer1.address)
      let stats = await badge.getFarmerStats(farmer1.address)
      expect(stats.deforestationIncidents).to.equal(1)

      await badge.connect(escrow).applyDeforestationPenalty(farmer1.address)
      stats = await badge.getFarmerStats(farmer1.address)
      expect(stats.deforestationIncidents).to.equal(2)
    })

    it("Should not increment successfulHarvests on penalty", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      await badge.connect(escrow).applyDeforestationPenalty(farmer1.address)

      const stats = await badge.getFarmerStats(farmer1.address)
      expect(stats.successfulHarvests).to.equal(0)
      expect(stats.totalHarvests).to.equal(1)
    })
  })

  describe("Tier System", function () {
    async function mintedBadgeFixture() {
      const base = await deployFixture()
      await base.badge.connect(base.escrow).mintBadge(base.farmer1.address)
      return base
    }

    it("Should start at Bronze tier", async function () {
      const { badge, farmer1 } = await loadFixture(mintedBadgeFixture)
      expect(await badge.getFarmerTier(farmer1.address)).to.equal(Tier.Bronze)
    })

    it("Should upgrade to Silver at 200 points", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      // Get to 200 points: 4 harvests * 50 points each (4 milestones on time)
      for (let i = 0; i < 4; i++) {
        await badge.connect(escrow).updateScore(farmer1.address, 2, true, false, false)
      }

      const tier = await badge.getFarmerTier(farmer1.address)
      expect(tier).to.equal(Tier.Silver)
    })

    it("Should emit TierUpgraded event", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      // Reach Silver threshold
      await expect(
        badge.connect(escrow).updateScore(farmer1.address, 4, true, true, true)
      ).to.not.emit(badge, "TierUpgraded") // Still Bronze at 180

      await expect(
        badge.connect(escrow).updateScore(farmer1.address, 4, true, false, false)
      ).to.emit(badge, "TierUpgraded")
        .withArgs(farmer1.address, Tier.Bronze, Tier.Silver)
    })

    it("Should upgrade to Gold at 300 points", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      // Get to 300+ points
      for (let i = 0; i < 6; i++) {
        await badge.connect(escrow).updateScore(farmer1.address, 2, true, false, false)
      }

      const tier = await badge.getFarmerTier(farmer1.address)
      expect(tier).to.equal(Tier.Gold)
    })

    it("Should upgrade to Platinum at 400 points", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      // Get to 400+ points
      for (let i = 0; i < 8; i++) {
        await badge.connect(escrow).updateScore(farmer1.address, 2, true, false, false)
      }

      const tier = await badge.getFarmerTier(farmer1.address)
      expect(tier).to.equal(Tier.Platinum)
    })

    it("Should downgrade tier when score drops", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      // Get to Silver
      for (let i = 0; i < 4; i++) {
        await badge.connect(escrow).updateScore(farmer1.address, 2, true, false, false)
      }
      expect(await badge.getFarmerTier(farmer1.address)).to.equal(Tier.Silver)

      // Apply penalties to drop below Silver threshold
      await badge.connect(escrow).applyDeforestationPenalty(farmer1.address)
      await badge.connect(escrow).applyDeforestationPenalty(farmer1.address)

      expect(await badge.getFarmerTier(farmer1.address)).to.equal(Tier.Bronze)
    })

    it("Should emit TierDowngraded event", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      // Get to Silver
      for (let i = 0; i < 4; i++) {
        await badge.connect(escrow).updateScore(farmer1.address, 2, true, false, false)
      }

      // Apply penalty to downgrade
      await expect(badge.connect(escrow).applyDeforestationPenalty(farmer1.address))
        .to.emit(badge, "TierDowngraded")
        .withArgs(farmer1.address, Tier.Silver, Tier.Bronze)
    })
  })

  describe("View Functions", function () {
    async function mintedBadgeFixture() {
      const base = await deployFixture()
      await base.badge.connect(base.escrow).mintBadge(base.farmer1.address)
      return base
    }

    it("Should return correct tier names", async function () {
      const { badge } = await loadFixture(deployFixture)

      expect(await badge.getTierName(Tier.Bronze)).to.equal("Bronze")
      expect(await badge.getTierName(Tier.Silver)).to.equal("Silver")
      expect(await badge.getTierName(Tier.Gold)).to.equal("Gold")
      expect(await badge.getTierName(Tier.Platinum)).to.equal("Platinum")
    })

    it("Should return correct tier colors", async function () {
      const { badge } = await loadFixture(deployFixture)

      expect(await badge.getTierColor(Tier.Bronze)).to.equal("#CD7F32")
      expect(await badge.getTierColor(Tier.Silver)).to.equal("#C0C0C0")
      expect(await badge.getTierColor(Tier.Gold)).to.equal("#FFD700")
      expect(await badge.getTierColor(Tier.Platinum)).to.equal("#E5E4E2")
    })

    it("Should return correct tier thresholds", async function () {
      const { badge } = await loadFixture(deployFixture)

      expect(await badge.getTierThreshold(Tier.Bronze)).to.equal(0)
      expect(await badge.getTierThreshold(Tier.Silver)).to.equal(SILVER_THRESHOLD)
      expect(await badge.getTierThreshold(Tier.Gold)).to.equal(GOLD_THRESHOLD)
      expect(await badge.getTierThreshold(Tier.Platinum)).to.equal(PLATINUM_THRESHOLD)
    })

    it("Should return farmer token ID", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(deployFixture)

      await badge.connect(escrow).mintBadge(farmer1.address)
      expect(await badge.getFarmerTokenId(farmer1.address)).to.equal(0)
    })

    it("Should return false for farmers without badges", async function () {
      const { badge, farmer1 } = await loadFixture(deployFixture)

      expect(await badge.hasBadge(farmer1.address)).to.equal(false)
    })

    it("Should revert view functions for farmers without badges", async function () {
      const { badge, farmer1 } = await loadFixture(deployFixture)

      await expect(
        badge.getFarmerScore(farmer1.address)
      ).to.be.revertedWith("FarmerReputationBadge: farmer has no badge")

      await expect(
        badge.getFarmerTier(farmer1.address)
      ).to.be.revertedWith("FarmerReputationBadge: farmer has no badge")

      await expect(
        badge.getFarmerStats(farmer1.address)
      ).to.be.revertedWith("FarmerReputationBadge: farmer has no badge")
    })
  })

  describe("Soulbound Enforcement", function () {
    async function mintedBadgeFixture() {
      const base = await deployFixture()
      await base.badge.connect(base.escrow).mintBadge(base.farmer1.address)
      return base
    }

    it("Should revert on transferFrom", async function () {
      const { badge, farmer1, farmer2 } = await loadFixture(mintedBadgeFixture)

      await expect(
        badge.connect(farmer1).transferFrom(farmer1.address, farmer2.address, 0)
      ).to.be.revertedWith("FarmerReputationBadge: soulbound token cannot be transferred")
    })

    it("Should revert on safeTransferFrom", async function () {
      const { badge, farmer1, farmer2 } = await loadFixture(mintedBadgeFixture)

      await expect(
        badge.connect(farmer1)["safeTransferFrom(address,address,uint256)"](
          farmer1.address,
          farmer2.address,
          0
        )
      ).to.be.revertedWith("FarmerReputationBadge: soulbound token cannot be transferred")
    })

    it("Should revert on approve", async function () {
      const { badge, farmer1, farmer2 } = await loadFixture(mintedBadgeFixture)

      await expect(
        badge.connect(farmer1).approve(farmer2.address, 0)
      ).to.be.revertedWith("FarmerReputationBadge: soulbound token cannot be approved")
    })

    it("Should revert on setApprovalForAll", async function () {
      const { badge, farmer1, farmer2 } = await loadFixture(mintedBadgeFixture)

      await expect(
        badge.connect(farmer1).setApprovalForAll(farmer2.address, true)
      ).to.be.revertedWith("FarmerReputationBadge: soulbound token cannot be approved")
    })
  })

  describe("Metadata Generation", function () {
    async function mintedBadgeFixture() {
      const base = await deployFixture()
      await base.badge.connect(base.escrow).mintBadge(base.farmer1.address)
      return base
    }

    it("Should generate tokenURI with base64 JSON", async function () {
      const { badge, farmer1 } = await loadFixture(mintedBadgeFixture)

      const uri = await badge.tokenURI(0)
      expect(uri).to.include("data:application/json;base64,")
    })

    it("Should update metadata when tier changes", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      const uriBronze = await badge.tokenURI(0)

      // Upgrade to Silver
      for (let i = 0; i < 4; i++) {
        await badge.connect(escrow).updateScore(farmer1.address, 2, true, false, false)
      }

      const uriSilver = await badge.tokenURI(0)
      expect(uriSilver).to.not.equal(uriBronze) // Metadata changed
    })
  })

  describe("Admin Functions", function () {
    it("Should allow owner to update escrow contract", async function () {
      const { badge, owner, farmer2 } = await loadFixture(deployFixture)

      await badge.connect(owner).setEscrowContract(farmer2.address)
      expect(await badge.escrowContract()).to.equal(farmer2.address)
    })

    it("Should revert if non-owner tries to update escrow", async function () {
      const { badge, unauthorized, farmer2 } = await loadFixture(deployFixture)

      await expect(
        badge.connect(unauthorized).setEscrowContract(farmer2.address)
      ).to.be.revertedWithCustomError(badge, "OwnableUnauthorizedAccount")
    })

    it("Should revert if setting escrow to zero address", async function () {
      const { badge, owner } = await loadFixture(deployFixture)

      await expect(
        badge.connect(owner).setEscrowContract(ethers.ZeroAddress)
      ).to.be.revertedWith("FarmerReputationBadge: zero address")
    })
  })

  describe("Complex Scenarios", function () {
    async function mintedBadgeFixture() {
      const base = await deployFixture()
      await base.badge.connect(base.escrow).mintBadge(base.farmer1.address)
      return base
    }

    it("Should handle mixed performance over multiple harvests", async function () {
      const { badge, escrow, farmer1 } = await loadFixture(mintedBadgeFixture)

      // Excellent first harvest: +180 points
      await badge.connect(escrow).updateScore(farmer1.address, 4, true, true, true)
      expect(await badge.getFarmerTier(farmer1.address)).to.equal(Tier.Bronze)

      // Good second harvest: +100 points (280 total)
      await badge.connect(escrow).updateScore(farmer1.address, 4, true, false, false)
      expect(await badge.getFarmerTier(farmer1.address)).to.equal(Tier.Silver)

      // Deforestation penalty: -100 points (180 total)
      await badge.connect(escrow).applyDeforestationPenalty(farmer1.address)
      expect(await badge.getFarmerTier(farmer1.address)).to.equal(Tier.Bronze)

      // Recovery harvest: +150 points (330 total)
      await badge.connect(escrow).updateScore(farmer1.address, 4, true, true, false)
      expect(await badge.getFarmerTier(farmer1.address)).to.equal(Tier.Gold)

      const stats = await badge.getFarmerStats(farmer1.address)
      expect(stats.totalHarvests).to.equal(4)
      expect(stats.successfulHarvests).to.equal(3)
      expect(stats.deforestationIncidents).to.equal(1)
    })

    it("Should track multiple farmers independently", async function () {
      const { badge, escrow, farmer1, farmer2, farmer3 } = await loadFixture(deployFixture)

      // Mint badges for all farmers
      await badge.connect(escrow).mintBadge(farmer1.address)
      await badge.connect(escrow).mintBadge(farmer2.address)
      await badge.connect(escrow).mintBadge(farmer3.address)

      // Farmer1: Excellent performer
      for (let i = 0; i < 5; i++) {
        await badge.connect(escrow).updateScore(farmer1.address, 4, true, true, true)
      }

      // Farmer2: Average performer
      for (let i = 0; i < 3; i++) {
        await badge.connect(escrow).updateScore(farmer2.address, 4, true, false, false)
      }

      // Farmer3: Poor performer
      await badge.connect(escrow).updateScore(farmer3.address, 2, false, false, false)
      await badge.connect(escrow).applyDeforestationPenalty(farmer3.address)

      expect(await badge.getFarmerTier(farmer1.address)).to.equal(Tier.Platinum) // 900 points
      expect(await badge.getFarmerTier(farmer2.address)).to.equal(Tier.Gold) // 300 points
      expect(await badge.getFarmerTier(farmer3.address)).to.equal(Tier.Bronze) // -100 points
    })
  })
})

