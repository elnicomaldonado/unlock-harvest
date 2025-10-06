/**
 * Smart Contract Addresses and ABIs
 * RealFi Cacao Financing Platform - Celo Sepolia
 * 
 * Generated: October 4, 2025
 * Network: Celo Sepolia Testnet
 * Chain ID: 11142220
 */

import CacaoHarvestNFTArtifact from '../../../artifacts/contracts/CacaoHarvestNFT.sol/CacaoHarvestNFT.json';
import FarmerReputationBadgeArtifact from '../../../artifacts/contracts/FarmerReputationBadge.sol/FarmerReputationBadge.json';
import CacaoEscrowArtifact from '../../../artifacts/contracts/CacaoEscrow.sol/CacaoEscrow.json';
import CommitmentMarketplaceArtifact from '../../../artifacts/contracts/CommitmentMarketplace.sol/CommitmentMarketplace.json';

// ============================================
// CONTRACT ADDRESSES (Celo Sepolia)
// ============================================

export const CONTRACTS = {
  CacaoHarvestNFT: '0xB28e3a03A73Ee67604F019C56E27382b133240Bb',
  FarmerReputationBadge: '0xB2A9cfDD05E44078a1e21d9193d126BBf3ED501c',
  CacaoEscrow: '0x4B0291561f3Bc9cd7a72f4124E10020444f3a15d',
  CommitmentMarketplace: '0x5e3b189eA42c90d23796Ee21e44f56b8B219e48a',
} as const;

// ============================================
// TOKEN ADDRESSES
// ============================================

export const TOKENS = {
  USDC: '0x456a3D042C0DbD3db53D5489e98dFb038553B0d0', // 6 decimals
} as const;

// ============================================
// ORACLE ADDRESS
// ============================================

export const ORACLE_ADDRESS = '0x751E3EF3858102230FcbFcbaD0B212a4235DF59C';

// ============================================
// NETWORK CONFIGURATION
// ============================================

export const NETWORK = {
  chainId: 11142220,
  name: 'Celo Sepolia Testnet',
  rpcUrl: 'https://forno.celo-sepolia.celo-testnet.org',
  blockExplorer: 'https://celo-sepolia.blockscout.com',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  faucet: 'https://faucet.celo.org',
} as const;

// ============================================
// CONTRACT ABIs
// ============================================

export const ABIS = {
  CacaoHarvestNFT: CacaoHarvestNFTArtifact.abi,
  FarmerReputationBadge: FarmerReputationBadgeArtifact.abi,
  CacaoEscrow: CacaoEscrowArtifact.abi,
  CommitmentMarketplace: CommitmentMarketplaceArtifact.abi,
} as const;

// ============================================
// EXPLORER LINKS
// ============================================

export function getExplorerLink(type: 'address' | 'tx' | 'token', value: string): string {
  const base = NETWORK.blockExplorer;
  switch (type) {
    case 'address':
      return `${base}/address/${value}`;
    case 'tx':
      return `${base}/tx/${value}`;
    case 'token':
      return `${base}/token/${value}`;
    default:
      return base;
  }
}

// ============================================
// CONSTANTS
// ============================================

export const MIN_ESCROW_AMOUNT = 10_000n; // 0.01 USDC (6 decimals)
export const MAX_ESCROW_AMOUNT = 100_000_000_000n; // 100,000 USDC (6 decimals)
export const DEFAULT_DEADLINE_SECONDS = 180 * 24 * 60 * 60; // 6 months

export const MILESTONE_NAMES = ['Land Verified', 'Planted', 'Mid-Growth', 'Harvested'] as const;

export const REPUTATION_TIERS = {
  Bronze: { min: 0, max: 199, color: '#CD7F32' },
  Silver: { min: 200, max: 299, color: '#C0C0C0' },
  Gold: { min: 300, max: 399, color: '#FFD700' },
  Platinum: { min: 400, max: Infinity, color: '#E5E4E2' },
} as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type ContractName = keyof typeof CONTRACTS;
export type TokenName = keyof typeof TOKENS;
export type ReputationTier = keyof typeof REPUTATION_TIERS;
export type MilestoneName = (typeof MILESTONE_NAMES)[number];

// ============================================
// CONTRACT INTERFACES
// ============================================

export interface EscrowData {
  investor: string;
  farmer: string;
  amount: bigint;
  currentMilestone: number;
  milestonePaidAmount: [bigint, bigint, bigint, bigint];
  nftTokenId: bigint;
  createdAt: bigint;
  deadline: bigint;
  deforestationFlagged: boolean;
  premiumQuality: boolean;
  status: number; // 0: Active, 1: Completed, 2: Cancelled
}

export interface FarmerStats {
  score: bigint;
  tier: number; // 0: Bronze, 1: Silver, 2: Gold, 3: Platinum
  totalHarvests: bigint;
  successfulHarvests: bigint;
  deforestationIncidents: bigint;
  onTimeCompletions: bigint;
  premiumQualityCount: bigint;
  lastUpdateTimestamp: bigint;
}

export interface Commitment {
  buyer: string;
  amount: bigint;
  minReputation: bigint;
  deadline: bigint;
  createdAt: bigint;
  metadataURI: string;
  status: number; // 0: Open, 1: Accepted, 2: Cancelled, 3: Expired
  acceptedFarmer: string;
  escrowId: bigint;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format USDC amount (6 decimals) to human-readable string
 */
export function formatUSDC(amount: bigint): string {
  const formatted = Number(amount) / 1_000_000;
  return formatted.toFixed(2);
}

/**
 * Parse human-readable USDC amount to contract units
 */
export function parseUSDC(amount: string | number): bigint {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.floor(value * 1_000_000));
}

/**
 * Get reputation tier name from score
 */
export function getReputationTier(score: number): ReputationTier {
  if (score >= 400) return 'Platinum';
  if (score >= 300) return 'Gold';
  if (score >= 200) return 'Silver';
  return 'Bronze';
}

/**
 * Get milestone progress percentage
 */
export function getMilestoneProgress(currentMilestone: number): number {
  return ((currentMilestone + 1) / 4) * 100;
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString();
}

/**
 * Check if deadline has passed
 */
export function isExpired(deadline: bigint): boolean {
  return Number(deadline) * 1000 < Date.now();
}

/**
 * Get days until deadline
 */
export function getDaysUntil(deadline: bigint): number {
  const now = Date.now();
  const deadlineMs = Number(deadline) * 1000;
  const diff = deadlineMs - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ============================================
// CONTRACT VERIFICATION URLS
// ============================================

export const VERIFICATION_URLS = {
  CacaoHarvestNFT: `${NETWORK.blockExplorer}/address/${CONTRACTS.CacaoHarvestNFT}#code`,
  FarmerReputationBadge: `${NETWORK.blockExplorer}/address/${CONTRACTS.FarmerReputationBadge}#code`,
  CacaoEscrow: `${NETWORK.blockExplorer}/address/${CONTRACTS.CacaoEscrow}#code`,
  CommitmentMarketplace: `${NETWORK.blockExplorer}/address/${CONTRACTS.CommitmentMarketplace}#code`,
} as const;


