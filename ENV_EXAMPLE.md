# Environment Variables Configuration

Create a `.env` file in the root directory with these variables:

```bash
# RealFi Cacao Financing Platform - Environment Variables

# ============================================
# DEPLOYMENT CONFIGURATION
# ============================================

# Oracle address (university verification system)
# If not set, deployer will be used as oracle (testing only)
ORACLE_ADDRESS=

# Deployer private key (NEVER commit the actual .env file!)
PRIVATE_KEY=your_private_key_here

# ============================================
# NETWORK RPC ENDPOINTS
# ============================================

# Celo Mainnet
CELO_MAINNET_RPC=https://forno.celo.org

# Celo Sepolia Testnet
CELO_SEPOLIA_RPC=https://forno.celo.org/celo-sepolia

# ============================================
# BLOCK EXPLORER API KEYS
# ============================================

# Celoscan API key for contract verification (mainnet only)
# Get yours at: https://celoscan.io/myapikey
# Note: Celo Sepolia uses Blockscout - no API key needed
CELOSCAN_API_KEY=your_celoscan_api_key_here

# ============================================
# TOKEN ADDRESSES (Pre-configured)
# ============================================

# cUSD addresses (same on mainnet and Celo Sepolia)
CUSD_MAINNET=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
CUSD_CELO_SEPOLIA=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1

# ============================================
# GAS CONFIGURATION
# ============================================

# Gas price in gwei (optional, uses network default if not set)
GAS_PRICE=

# Gas limit multiplier (optional, default is 1.2)
GAS_MULTIPLIER=1.2

# ============================================
# DEVELOPMENT
# ============================================

# Report gas usage in tests
REPORT_GAS=true

# Coinmarketcap API key for USD gas reporting (optional)
COINMARKETCAP_API_KEY=
```

## Security Notes

⚠️ **NEVER commit your `.env` file to git!**
⚠️ **NEVER share your private keys!**
⚠️ **ALWAYS use a dedicated deployer wallet with limited funds**
⚠️ **ALWAYS verify contracts after deployment**

## Getting API Keys

### Celoscan API Key
1. Visit https://celoscan.io/myapikey
2. Create an account
3. Generate an API key
4. Add it to your `.env` file

### Getting Testnet CELO
1. Visit https://faucet.celo.org
2. Select "Celo Sepolia Testnet"
3. Enter your wallet address
4. Receive free testnet CELO
5. Use it to deploy and test

### Network Info
- **Testnet:** Celo Sepolia (Chain ID: 11142220)
- **RPC:** https://forno.celo.org/celo-sepolia
- **Explorer:** https://celo-sepolia.blockscout.com
- **Minimum Escrow:** 0.01 cUSD (reduced for testing)

