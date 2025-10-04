const { expect } = require("chai")
const { ethers } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers")

describe("CacaoHarvestNFT", function () {
  // Define Milestone enum to match Solidity
  const Milestone = {
    Verified: 0,
    Planted: 1,
    MidGrowth: 2,
    Harvested: 3
  }

  /**
   * Fixture for deploying contract and setting up test accounts
   */
  async function deployFixture() {
    const [owner, oracle, farmer1, farmer2, unauthorized] = await ethers.getSigners()

    const CacaoHarvestNFT = await ethers.getContractFactory("CacaoHarvestNFT")
    const nft = await CacaoHarvestNFT.deploy(oracle.address)

    return { nft, owner, oracle, farmer1, farmer2, unauthorized }
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { nft } = await loadFixture(deployFixture)
      expect(await nft.name()).to.equal("Cacao Harvest")
      expect(await nft.symbol()).to.equal("CACAO")
    })

    it("Should set the correct oracle address", async function () {
      const { nft, oracle } = await loadFixture(deployFixture)
      expect(await nft.oracle()).to.equal(oracle.address)
    })

    it("Should set the correct owner", async function () {
      const { nft, owner } = await loadFixture(deployFixture)
      expect(await nft.owner()).to.equal(owner.address)
    })

    it("Should revert if oracle address is zero", async function () {
      const CacaoHarvestNFT = await ethers.getContractFactory("CacaoHarvestNFT")
      await expect(
        CacaoHarvestNFT.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("CacaoHarvestNFT: oracle is zero address")
    })

    it("Should start with zero total harvests", async function () {
      const { nft } = await loadFixture(deployFixture)
      expect(await nft.totalHarvests()).to.equal(0)
    })
  })

  describe("Minting", function () {
    it("Should mint a new harvest NFT with correct initial data", async function () {
      const { nft, owner, farmer1 } = await loadFixture(deployFixture)
      const escrowId = 123
      const metadataURI = "ipfs://QmTest123"

      await expect(nft.mintHarvest(farmer1.address, escrowId, metadataURI))
        .to.emit(nft, "HarvestMinted")
        .withArgs(0, farmer1.address, escrowId)

      // Check NFT ownership
      expect(await nft.ownerOf(0)).to.equal(farmer1.address)

      // Check harvest data
      const data = await nft.getHarvestData(0)
      expect(data.farmerId).to.equal(farmer1.address)
      expect(data.escrowId).to.equal(escrowId)
      expect(data.currentMilestone).to.equal(Milestone.Verified)
      expect(data.deforestationStatus).to.equal(false)
      expect(data.harvestWeight).to.equal(0)
      expect(data.metadataURI).to.equal(metadataURI)
    })

    it("Should increment token IDs sequentially", async function () {
      const { nft, farmer1, farmer2 } = await loadFixture(deployFixture)

      await nft.mintHarvest(farmer1.address, 1, "ipfs://1")
      await nft.mintHarvest(farmer2.address, 2, "ipfs://2")
      await nft.mintHarvest(farmer1.address, 3, "ipfs://3")

      expect(await nft.ownerOf(0)).to.equal(farmer1.address)
      expect(await nft.ownerOf(1)).to.equal(farmer2.address)
      expect(await nft.ownerOf(2)).to.equal(farmer1.address)
      expect(await nft.totalHarvests()).to.equal(3)
    })

    it("Should track farmer harvests correctly", async function () {
      const { nft, farmer1, farmer2 } = await loadFixture(deployFixture)

      await nft.mintHarvest(farmer1.address, 1, "ipfs://1")
      await nft.mintHarvest(farmer2.address, 2, "ipfs://2")
      await nft.mintHarvest(farmer1.address, 3, "ipfs://3")

      const farmer1Harvests = await nft.getFarmerHarvests(farmer1.address)
      const farmer2Harvests = await nft.getFarmerHarvests(farmer2.address)

      expect(farmer1Harvests.length).to.equal(2)
      expect(farmer1Harvests[0]).to.equal(0)
      expect(farmer1Harvests[1]).to.equal(2)
      expect(farmer2Harvests.length).to.equal(1)
      expect(farmer2Harvests[0]).to.equal(1)
    })

    it("Should set Verified milestone timestamp on mint", async function () {
      const { nft, farmer1 } = await loadFixture(deployFixture)

      const tx = await nft.mintHarvest(farmer1.address, 1, "ipfs://1")
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt.blockNumber)

      const timestamp = await nft.getMilestoneTimestamp(0, Milestone.Verified)
      expect(timestamp).to.equal(block.timestamp)
    })

    it("Should revert if non-owner tries to mint", async function () {
      const { nft, farmer1, unauthorized } = await loadFixture(deployFixture)

      await expect(
        nft.connect(unauthorized).mintHarvest(farmer1.address, 1, "ipfs://1")
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount")
    })

    it("Should revert if farmer address is zero", async function () {
      const { nft } = await loadFixture(deployFixture)

      await expect(
        nft.mintHarvest(ethers.ZeroAddress, 1, "ipfs://1")
      ).to.be.revertedWith("CacaoHarvestNFT: farmer is zero address")
    })
  })

  describe("Milestone Updates", function () {
    async function mintedHarvestFixture() {
      const base = await deployFixture()
      await base.nft.mintHarvest(base.farmer1.address, 1, "ipfs://test")
      return base
    }

    it("Should update milestone sequentially by oracle", async function () {
      const { nft, oracle } = await loadFixture(mintedHarvestFixture)

      // Verified -> Planted
      const tx = await nft.connect(oracle).updateMilestone(0, Milestone.Planted)
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt.blockNumber)
      
      // Check event was emitted with correct timestamp (allow 2 second variance)
      const event = receipt.logs.find(log => {
        try {
          const parsed = nft.interface.parseLog(log)
          return parsed.name === "MilestoneUpdated"
        } catch {
          return false
        }
      })
      expect(event).to.not.be.undefined
      const parsedEvent = nft.interface.parseLog(event)
      expect(parsedEvent.args.tokenId).to.equal(0)
      expect(parsedEvent.args.newMilestone).to.equal(Milestone.Planted)
      expect(parsedEvent.args.timestamp).to.be.closeTo(block.timestamp, 2)

      let data = await nft.getHarvestData(0)
      expect(data.currentMilestone).to.equal(Milestone.Planted)

      // Planted -> MidGrowth
      await nft.connect(oracle).updateMilestone(0, Milestone.MidGrowth)
      data = await nft.getHarvestData(0)
      expect(data.currentMilestone).to.equal(Milestone.MidGrowth)

      // MidGrowth -> Harvested
      await nft.connect(oracle).updateMilestone(0, Milestone.Harvested)
      data = await nft.getHarvestData(0)
      expect(data.currentMilestone).to.equal(Milestone.Harvested)
    })

    it("Should record milestone timestamps", async function () {
      const { nft, oracle } = await loadFixture(mintedHarvestFixture)

      const tx = await nft.connect(oracle).updateMilestone(0, Milestone.Planted)
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt.blockNumber)

      const timestamp = await nft.getMilestoneTimestamp(0, Milestone.Planted)
      expect(timestamp).to.equal(block.timestamp)
    })

    it("Should revert if trying to skip milestones", async function () {
      const { nft, oracle } = await loadFixture(mintedHarvestFixture)

      // Try to jump from Verified to MidGrowth (skipping Planted)
      await expect(
        nft.connect(oracle).updateMilestone(0, Milestone.MidGrowth)
      ).to.be.revertedWith("CacaoHarvestNFT: invalid milestone progression")
    })

    it("Should revert if trying to go backwards", async function () {
      const { nft, oracle } = await loadFixture(mintedHarvestFixture)

      await nft.connect(oracle).updateMilestone(0, Milestone.Planted)

      // Try to go back to Verified
      await expect(
        nft.connect(oracle).updateMilestone(0, Milestone.Verified)
      ).to.be.revertedWith("CacaoHarvestNFT: invalid milestone progression")
    })

    it("Should revert if non-oracle tries to update", async function () {
      const { nft, unauthorized } = await loadFixture(mintedHarvestFixture)

      await expect(
        nft.connect(unauthorized).updateMilestone(0, Milestone.Planted)
      ).to.be.revertedWith("CacaoHarvestNFT: caller is not oracle or owner")
    })

    it("Should revert if token does not exist", async function () {
      const { nft, oracle } = await loadFixture(deployFixture)

      await expect(
        nft.connect(oracle).updateMilestone(999, Milestone.Planted)
      ).to.be.revertedWith("CacaoHarvestNFT: token does not exist")
    })
  })

  describe("Harvest Weight Recording", function () {
    async function harvestedFixture() {
      const base = await deployFixture()
      await base.nft.mintHarvest(base.farmer1.address, 1, "ipfs://test")
      // Progress to Harvested milestone
      await base.nft.connect(base.oracle).updateMilestone(0, Milestone.Planted)
      await base.nft.connect(base.oracle).updateMilestone(0, Milestone.MidGrowth)
      await base.nft.connect(base.oracle).updateMilestone(0, Milestone.Harvested)
      return base
    }

    it("Should record harvest weight at Harvested milestone", async function () {
      const { nft, oracle } = await loadFixture(harvestedFixture)
      const weight = ethers.parseUnits("1500", 0) // 1500 kg

      await expect(nft.connect(oracle).recordHarvestWeight(0, weight))
        .to.emit(nft, "HarvestWeightRecorded")
        .withArgs(0, weight)

      const data = await nft.getHarvestData(0)
      expect(data.harvestWeight).to.equal(weight)
    })

    it("Should revert if not at Harvested milestone", async function () {
      const { nft, oracle, farmer1 } = await loadFixture(deployFixture)
      await nft.mintHarvest(farmer1.address, 1, "ipfs://test")

      await expect(
        nft.connect(oracle).recordHarvestWeight(0, 1000)
      ).to.be.revertedWith("CacaoHarvestNFT: can only record weight at Harvested milestone")
    })

    it("Should revert if weight already recorded", async function () {
      const { nft, oracle } = await loadFixture(harvestedFixture)

      await nft.connect(oracle).recordHarvestWeight(0, 1000)

      await expect(
        nft.connect(oracle).recordHarvestWeight(0, 2000)
      ).to.be.revertedWith("CacaoHarvestNFT: weight already recorded")
    })

    it("Should revert if weight is zero", async function () {
      const { nft, oracle } = await loadFixture(harvestedFixture)

      await expect(
        nft.connect(oracle).recordHarvestWeight(0, 0)
      ).to.be.revertedWith("CacaoHarvestNFT: weight must be positive")
    })

    it("Should revert if non-oracle tries to record", async function () {
      const { nft, unauthorized } = await loadFixture(harvestedFixture)

      await expect(
        nft.connect(unauthorized).recordHarvestWeight(0, 1000)
      ).to.be.revertedWith("CacaoHarvestNFT: caller is not oracle")
    })
  })

  describe("Deforestation Flagging", function () {
    async function mintedHarvestFixture() {
      const base = await deployFixture()
      await base.nft.mintHarvest(base.farmer1.address, 1, "ipfs://test")
      return base
    }

    it("Should flag harvest for deforestation by oracle", async function () {
      const { nft, oracle, farmer1 } = await loadFixture(mintedHarvestFixture)

      await expect(nft.connect(oracle).flagDeforestation(0))
        .to.emit(nft, "DeforestationDetected")

      const data = await nft.getHarvestData(0)
      expect(data.deforestationStatus).to.equal(true)
      expect(await nft.isDeforestationFlagged(0)).to.equal(true)
    })

    it("Should revert if already flagged", async function () {
      const { nft, oracle } = await loadFixture(mintedHarvestFixture)

      await nft.connect(oracle).flagDeforestation(0)

      await expect(
        nft.connect(oracle).flagDeforestation(0)
      ).to.be.revertedWith("CacaoHarvestNFT: already flagged")
    })

    it("Should revert if non-oracle tries to flag", async function () {
      const { nft, unauthorized } = await loadFixture(mintedHarvestFixture)

      await expect(
        nft.connect(unauthorized).flagDeforestation(0)
      ).to.be.revertedWith("CacaoHarvestNFT: caller is not oracle or owner")
    })

    it("Should emit DeforestationDetected event with farmer address", async function () {
      const { nft, oracle, farmer1 } = await loadFixture(mintedHarvestFixture)

      const tx = await nft.connect(oracle).flagDeforestation(0)
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt.blockNumber)

      await expect(tx)
        .to.emit(nft, "DeforestationDetected")
        .withArgs(0, farmer1.address, block.timestamp)
    })
  })

  describe("Metadata URI Updates", function () {
    async function mintedHarvestFixture() {
      const base = await deployFixture()
      await base.nft.mintHarvest(base.farmer1.address, 1, "ipfs://original")
      return base
    }

    it("Should update metadata URI by oracle", async function () {
      const { nft, oracle } = await loadFixture(mintedHarvestFixture)
      const newURI = "ipfs://updated"

      await expect(nft.connect(oracle).updateMetadataURI(0, newURI))
        .to.emit(nft, "MetadataURIUpdated")
        .withArgs(0, newURI)

      expect(await nft.tokenURI(0)).to.equal(newURI)
      const data = await nft.getHarvestData(0)
      expect(data.metadataURI).to.equal(newURI)
    })

    it("Should allow multiple updates", async function () {
      const { nft, oracle } = await loadFixture(mintedHarvestFixture)

      await nft.connect(oracle).updateMetadataURI(0, "ipfs://update1")
      await nft.connect(oracle).updateMetadataURI(0, "ipfs://update2")
      await nft.connect(oracle).updateMetadataURI(0, "ipfs://update3")

      expect(await nft.tokenURI(0)).to.equal("ipfs://update3")
    })

    it("Should revert if non-oracle tries to update", async function () {
      const { nft, unauthorized } = await loadFixture(mintedHarvestFixture)

      await expect(
        nft.connect(unauthorized).updateMetadataURI(0, "ipfs://hack")
      ).to.be.revertedWith("CacaoHarvestNFT: caller is not oracle")
    })
  })

  describe("View Functions", function () {
    it("Should return empty array for farmer with no harvests", async function () {
      const { nft, farmer1 } = await loadFixture(deployFixture)

      const harvests = await nft.getFarmerHarvests(farmer1.address)
      expect(harvests.length).to.equal(0)
    })

    it("Should return false for non-flagged harvest", async function () {
      const { nft, farmer1 } = await loadFixture(deployFixture)
      await nft.mintHarvest(farmer1.address, 1, "ipfs://test")

      expect(await nft.isDeforestationFlagged(0)).to.equal(false)
    })

    it("Should return zero for unrecorded milestone timestamp", async function () {
      const { nft, farmer1 } = await loadFixture(deployFixture)
      await nft.mintHarvest(farmer1.address, 1, "ipfs://test")

      expect(await nft.getMilestoneTimestamp(0, Milestone.Planted)).to.equal(0)
      expect(await nft.getMilestoneTimestamp(0, Milestone.MidGrowth)).to.equal(0)
      expect(await nft.getMilestoneTimestamp(0, Milestone.Harvested)).to.equal(0)
    })

    it("Should revert view functions for non-existent token", async function () {
      const { nft } = await loadFixture(deployFixture)

      await expect(
        nft.getHarvestData(999)
      ).to.be.revertedWith("CacaoHarvestNFT: token does not exist")

      await expect(
        nft.isDeforestationFlagged(999)
      ).to.be.revertedWith("CacaoHarvestNFT: token does not exist")

      await expect(
        nft.getMilestoneTimestamp(999, Milestone.Planted)
      ).to.be.revertedWith("CacaoHarvestNFT: token does not exist")
    })
  })

  describe("ERC721 Standard Compliance", function () {
    it("Should support ERC721 interface", async function () {
      const { nft } = await loadFixture(deployFixture)

      // ERC721 interface ID
      expect(await nft.supportsInterface("0x80ac58cd")).to.equal(true)
    })

    it("Should allow NFT transfers", async function () {
      const { nft, farmer1, farmer2 } = await loadFixture(deployFixture)
      await nft.mintHarvest(farmer1.address, 1, "ipfs://test")

      await nft.connect(farmer1).transferFrom(farmer1.address, farmer2.address, 0)

      expect(await nft.ownerOf(0)).to.equal(farmer2.address)
    })

    it("Should maintain harvest data after transfer", async function () {
      const { nft, farmer1, farmer2 } = await loadFixture(deployFixture)
      await nft.mintHarvest(farmer1.address, 1, "ipfs://test")

      await nft.connect(farmer1).transferFrom(farmer1.address, farmer2.address, 0)

      const data = await nft.getHarvestData(0)
      expect(data.farmerId).to.equal(farmer1.address) // Original farmer unchanged
      expect(await nft.ownerOf(0)).to.equal(farmer2.address) // New owner
    })
  })

  describe("Gas Optimization", function () {
    it("Should efficiently mint multiple harvests to same farmer", async function () {
      const { nft, farmer1 } = await loadFixture(deployFixture)

      const tx1 = await nft.mintHarvest(farmer1.address, 1, "ipfs://1")
      const receipt1 = await tx1.wait()

      const tx2 = await nft.mintHarvest(farmer1.address, 2, "ipfs://2")
      const receipt2 = await tx2.wait()

      console.log(`Gas used for first mint: ${receipt1.gasUsed}`)
      console.log(`Gas used for second mint: ${receipt2.gasUsed}`)

      // Second mint uses LESS gas - reusing existing storage slots (efficient!)
      expect(receipt2.gasUsed).to.be.lessThan(receipt1.gasUsed)
    })

    it("Should report gas usage for oracle operations", async function () {
      const { nft, oracle, farmer1 } = await loadFixture(deployFixture)
      await nft.mintHarvest(farmer1.address, 1, "ipfs://1")

      const txUpdate = await nft.connect(oracle).updateMilestone(0, Milestone.Planted)
      const receiptUpdate = await txUpdate.wait()

      const txFlag = await nft.connect(oracle).flagDeforestation(0)
      const receiptFlag = await txFlag.wait()

      console.log(`Gas used for milestone update: ${receiptUpdate.gasUsed}`)
      console.log(`Gas used for deforestation flag: ${receiptFlag.gasUsed}`)

      // Both operations should be reasonably cheap
      expect(receiptUpdate.gasUsed).to.be.lessThan(100000)
      expect(receiptFlag.gasUsed).to.be.lessThan(100000)
    })
  })
})

