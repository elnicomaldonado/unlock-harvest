# Migration to USDC (6 Decimals) - Complete

## ✅ Summary

**Date:** October 4, 2025  
**Issue:** Contract expected 18-decimal tokens (cUSD) but using 6-decimal USDC  
**Status:** ✅ Complete & Tested

---

## 🔄 Changes Made

### 1. Contract Constants (contracts/CacaoEscrow.sol)

**BEFORE (18 decimals for cUSD):**
```solidity
/// @notice Minimum escrow amount (0.01 cUSD)
uint256 public constant MIN_ESCROW_AMOUNT = 1 * 10**16; // 10,000,000,000,000,000

/// @notice Maximum escrow amount (100,000 cUSD)
uint256 public constant MAX_ESCROW_AMOUNT = 100_000 * 10**18; // 100,000,000,000,000,000,000,000
```

**AFTER (6 decimals for USDC):**
```solidity
/// @notice Minimum escrow amount (0.01 USDC - 6 decimals)
uint256 public constant MIN_ESCROW_AMOUNT = 10_000; // 0.01 USDC

/// @notice Maximum escrow amount (100,000 USDC - 6 decimals)
uint256 public constant MAX_ESCROW_AMOUNT = 100_000_000_000; // 100,000 USDC
```

---

### 2. Documentation Updates

Updated comments and NatSpec to reflect USDC instead of cUSD:

```solidity
/// @notice USDC token (6 decimals)
address public immutable cUSD; // Named cUSD for backward compatibility

/**
 * @param cUSDAddress USDC token address (6 decimals)
 * @param amount Total financing amount in USDC (6 decimals)
 */
```

---

### 3. Test Suite Updates (test/CacaoEscrow.test.js)

**Updated all token amounts from 18 to 6 decimals:**

```javascript
// Constants
const MIN_ESCROW_AMOUNT = ethers.parseUnits("0.01", 6) // 0.01 USDC
const MAX_ESCROW_AMOUNT = ethers.parseUnits("100000", 6) // 100,000 USDC

// Mock token deployment
const token = await MockERC20.deploy("USD Coin", "USDC", 6) // 6 decimals

// Test amounts
await cUSD.mint(investor.address, ethers.parseUnits("1000000", 6))
const amount = ethers.parseUnits("1000", 6)
const tooLow = ethers.parseUnits("0.009", 6)
const tooHigh = ethers.parseUnits("100001", 6)
```

**Result:** ✅ All 140 tests passing

---

### 4. Deployment Scripts (scripts/deploy.js)

```javascript
// Updated token address mapping
const USDC_ADDRESSES = {
  mainnet: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  "celo-sepolia": "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  localhost: "0x0000000000000000000000000000000000000000"
}

// Updated console logs
console.log(`   USDC Token:  ${usdcAddress} (6 decimals)`)
console.log("\n1. Fund the escrow with USDC (6 decimals) for testing")
console.log("2. Test creating an escrow via frontend or CLI (min: 0.01 USDC)")
```

---

### 5. Mock Token (contracts/test/MockERC20.sol)

```solidity
/**
 * @title MockERC20
 * @notice Mock ERC20 token for testing (simulates USDC with 6 decimals)
 */
```

---

## 📊 Amount Comparison

| Description | cUSD (18 decimals) | USDC (6 decimals) |
|-------------|-------------------|-------------------|
| **Minimum Escrow** | 10,000,000,000,000,000 units | 10,000 units |
| **Human Readable** | 0.01 cUSD | 0.01 USDC |
| **Maximum Escrow** | 100,000 × 10^18 units | 100,000 × 10^6 units |
| **Human Readable** | 100,000 cUSD | 100,000 USDC |
| **Test Amount** | 1,000 × 10^18 units | 1,000 × 10^6 units |
| **Human Readable** | 1,000 cUSD | 1,000 USDC |

---

## ✅ Verification

### Contract Compilation
```bash
✅ Compiled successfully
✅ Contract size: 7.416 KiB (-0.020 KiB optimization)
```

### Test Results
```bash
✅ CacaoHarvestNFT:        38/38 tests passing
✅ FarmerReputationBadge:  50/50 tests passing  
✅ CacaoEscrow:            52/52 tests passing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:                     140/140 (100%) ✅
```

---

## 🔍 Why 6 Decimals?

**USDC Standard:**
- USDC (USD Coin) uses 6 decimals across all EVM chains
- This is the standard for fiat-pegged stablecoins
- Smaller numbers reduce gas costs and simplify calculations

**Example:**
- 1 USDC = 1,000,000 units (10^6)
- vs. 1 cUSD = 1,000,000,000,000,000,000 units (10^18)

---

## 🚀 Deployment Notes

### Token Addresses

**Celo Sepolia USDC:**
- Update `USDC_ADDRESSES["celo-sepolia"]` with actual USDC Sepolia address
- Current placeholder: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`

**Celo Mainnet USDC:**
- Update `USDC_ADDRESSES["mainnet"]` with actual USDC mainnet address
- Find official address at: https://docs.celo.org/token-addresses

### Deployment Command
```bash
npx hardhat run scripts/deploy.js --network celo-sepolia
```

### Verification
```bash
# Verify CacaoEscrow with USDC address
npx hardhat verify --network celo-sepolia <ESCROW_ADDRESS> \
  <USDC_ADDRESS> <ORACLE_ADDRESS> <NFT_ADDRESS> <BADGE_ADDRESS>
```

---

## ⚠️ Important Notes

### Backward Compatibility
- Variable `cUSD` kept in contract for backward compatibility
- Actually holds USDC address (6 decimals)
- Comment added for clarity: `// Named cUSD for backward compatibility`

### Frontend Integration
When integrating with frontend:
```javascript
// Use 6 decimals for USDC
const amount = ethers.parseUnits("100", 6) // 100 USDC

// Minimum is 0.01 USDC (10,000 units)
const min = 10000

// Maximum is 100,000 USDC (100,000,000,000 units)  
const max = 100000000000
```

### Testing with USDC
```javascript
// Mint USDC for testing (6 decimals)
await usdc.mint(userAddress, ethers.parseUnits("1000", 6))

// Approve escrow
await usdc.approve(escrowAddress, ethers.MaxUint256)

// Create escrow with 100 USDC
await escrow.createEscrow(
  farmerAddress,
  ethers.parseUnits("100", 6),
  0,
  "ipfs://metadata"
)
```

---

## 📝 Files Modified

- ✅ `contracts/CacaoEscrow.sol` - Updated constants and comments
- ✅ `contracts/test/MockERC20.sol` - Updated comment
- ✅ `test/CacaoEscrow.test.js` - Updated all amounts to 6 decimals
- ✅ `scripts/deploy.js` - Updated USDC addresses and logs
- ✅ `hardhat.config.js` - Updated RPC URL and gas price

---

## 🎯 Next Steps

1. **Get USDC Address:**
   - Find official USDC contract address for Celo Sepolia
   - Update `USDC_ADDRESSES` in `scripts/deploy.js`

2. **Deploy Contracts:**
   ```bash
   npx hardhat run scripts/deploy.js --network celo-sepolia
   ```

3. **Test with Real USDC:**
   - Get USDC from faucet or bridge
   - Create test escrow with 0.01 USDC minimum
   - Verify milestone releases work correctly

4. **Update Frontend:**
   - Use 6 decimals for all USDC amounts
   - Update token display formatting
   - Test user flows with real USDC

---

## ✅ Migration Complete!

All code has been successfully migrated from 18-decimal cUSD to 6-decimal USDC:

- ✅ Contract constants updated
- ✅ All tests passing (140/140)
- ✅ Deployment scripts updated
- ✅ Documentation updated
- ✅ Contract size optimized (-0.020 KiB)
- ✅ No breaking changes to functionality

**Ready to deploy with USDC! 🚀**

