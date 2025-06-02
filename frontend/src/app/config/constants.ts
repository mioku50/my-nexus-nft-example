// Chain configuration
export const CHAIN_ID_DECIMAL = 393;
export const NEXUS_CHAIN_ID_HEX = `0x${CHAIN_ID_DECIMAL.toString(16)}`;
export const NEXUS_RPC_URL = 'https://rpc.nexus.xyz/http';
export const NEXUS_EXPLORER_URL = 'https://explorer.nexus.xyz';

// URL Configuration
export const BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : (process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000');

export const API_URL = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');

// Metadata Configuration
export const getMetadataBaseURI = (contractAddress: string) => 
  `${API_URL}/api/metadata/?contract=${contractAddress}&tokenId=`; 