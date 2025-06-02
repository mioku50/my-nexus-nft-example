/**
 * NFTCard Component
 * 
 * A reusable component that displays an individual NFT card with its metadata,
 * ownership information, and transfer functionality.
 * 
 * Features:
 * - Displays NFT image and metadata
 * - Shows collection name and token ID
 * - Displays ownership information
 * - Provides transfer functionality for owners
 * - Fetches collection name directly from the smart contract
 * 
 * The component uses a hybrid approach where static metadata (image, attributes)
 * comes from the API, but dynamic data (collection name, ownership) is fetched
 * directly from the blockchain for maximum accuracy.
 */

import { useState, useEffect } from 'react';
import { NFTMetadata } from '../types/nft';
import { NEXUS_EXPLORER_URL } from '../config/constants';
import type { SimpleNFT } from '../../types/contracts/contracts/SimpleNFT';
import Image from 'next/image';

interface NFTCardProps {
  /** The token ID of the NFT */
  tokenId: string;
  /** Metadata containing the NFT's attributes, image URL, etc. */
  metadata: NFTMetadata | null;
  /** The current user's wallet address */
  userAddress: string;
  /** Instance of the NFT contract for blockchain interactions */
  nftContract: SimpleNFT | null;
  /** Callback function to handle NFT transfers */
  onTransfer: (tokenId: string, to: string) => Promise<void>;
}

/**
 * Formats an Ethereum address for display by showing only the first 6 and last 4 characters
 */
const formatAddress = (address: string | null | undefined) => {
  if (!address || typeof address !== 'string') return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function NFTCard({ tokenId, metadata, userAddress, nftContract, onTransfer }: NFTCardProps) {
  // State for owner's address and ownership status
  const [owner, setOwner] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  // State for transfer functionality
  const [transferAddress, setTransferAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  // State for collection name from blockchain
  const [collectionName, setCollectionName] = useState<string>('');

  // Fetch owner and collection name from blockchain
  useEffect(() => {
    const fetchOwnerAndName = async () => {
      if (nftContract) {
        try {
          // Fetch owner and name in parallel for better performance
          const [ownerAddress, name] = await Promise.all([
            nftContract.ownerOf(tokenId),
            nftContract.name()
          ]);
          setOwner(ownerAddress);
          setIsOwner(ownerAddress.toLowerCase() === userAddress?.toLowerCase());
          setCollectionName(name);
        } catch (error) {
          console.error('Error fetching owner or name:', error);
        }
      }
    };
    fetchOwnerAndName();
  }, [nftContract, tokenId, userAddress]);

  // Handle NFT transfer
  const handleTransfer = async () => {
    if (!transferAddress) return;
    setIsTransferring(true);
    try {
      await onTransfer(tokenId, transferAddress);
      setTransferAddress('');
    } catch (error) {
      console.error('Transfer error:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  // Format NFT name using collection name from contract
  const formattedName = collectionName ? `${collectionName} #${tokenId}` : `#${tokenId}`;

  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300 border border-gray-100">
      {metadata ? (
        <>
          {/* NFT Image Container */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden">
            <Image
              src={metadata.image || '/placeholder.png'}
              alt={formattedName}
              fill
              className="object-cover"
              priority={false}
            />
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded-full">
              <span className="text-xs font-medium text-white">#{tokenId}</span>
            </div>
          </div>

          {/* Owner Information */}
          {owner && !isOwner && (
            <div className="mt-1.5">
              <a
                href={`${NEXUS_EXPLORER_URL}/address/${owner}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 text-sm font-medium text-white bg-black/90
                         hover:bg-black transition-all group flex items-center justify-center gap-2
                         border-t border-gray-800 rounded-lg"
              >
                <span>Owned by {formatAddress(owner)}</span>
                <svg 
                  className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                  />
                </svg>
              </a>
            </div>
          )}

          {/* Transfer Controls (shown only to owner) */}
          {isOwner && (
            isTransferring ? (
              <div className="px-3 py-2 mt-1.5 border-t border-gray-100">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Recipient address (0x...)"
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs bg-white rounded-md border border-gray-200 
                             focus:ring-1 focus:ring-black focus:border-transparent
                             text-gray-900 placeholder-gray-400"
                  />
                  <button
                    onClick={handleTransfer}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-black rounded-md
                             hover:bg-gray-800 transition-colors flex items-center gap-1.5
                             disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <span>Send</span>
                    <svg 
                      className="w-3 h-3 -rotate-45" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-1.5">
                <button
                  onClick={() => setIsTransferring(true)}
                  className="w-full py-2.5 text-sm font-medium text-white bg-black/90
                           hover:bg-black transition-all group flex items-center justify-center gap-2
                           border-t border-gray-800 rounded-lg"
                >
                  <span>Transfer NFT</span>
                  <svg 
                    className="w-4 h-4 -rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                    />
                  </svg>
                </button>
              </div>
            )
          )}
        </>
      ) : (
        // Loading State
        <div className="aspect-square w-full flex items-center justify-center bg-gray-50">
          <p className="text-xs text-gray-400">Loading #{tokenId}</p>
        </div>
      )}
    </div>
  );
} 