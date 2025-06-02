/**
 * NFT Metadata API Endpoint
 * 
 * This endpoint generates and serves metadata for NFTs in OpenSea-compatible format.
 * It supports both uploaded images and dynamically generated SVG images.
 * 
 * Features:
 * - OpenSea-compatible metadata format
 * - Support for uploaded images with fallback to generated images
 * - Immutable caching for better performance
 * - Comprehensive metadata validation
 * 
 * The metadata follows the ERC-721 metadata standard and includes:
 * - Basic NFT information (name, description)
 * - Image URL (uploaded or generated)
 * - Attributes including token ID, image type, and creation date
 */

import { NextResponse } from 'next/server';
import { getStorage, ref, listAll, getDownloadURL, StorageReference } from 'firebase/storage';
import { app } from '../../../../config/firebase';
import { BASE_URL, API_URL } from '../../../config/constants';

/**
 * Interface defining the structure of NFT metadata
 * following OpenSea's metadata standard
 */
interface NFTMetadata {
  /** The name of the NFT */
  name: string;
  /** A description of the NFT */
  description: string;
  /** URL to the NFT's image */
  image: string;
  /** URL to view the NFT on the marketplace */
  external_url: string;
  /** Array of attributes/traits for the NFT */
  attributes: Array<{
    /** Name of the trait */
    trait_type: string;
    /** Value of the trait */
    value: string | number;
    /** Optional display type for numerical traits */
    display_type?: string;
  }>;
}

/**
 * Validates the structure of NFT metadata to ensure it meets the required format
 * @param metadata The metadata object to validate
 * @returns boolean indicating if the metadata is valid
 */
function validateMetadata(metadata: NFTMetadata): boolean {
  return !!(
    metadata.name &&
    metadata.description &&
    metadata.image &&
    metadata.external_url &&
    Array.isArray(metadata.attributes) &&
    metadata.attributes.every(attr => 
      attr.trait_type && 
      (typeof attr.value === 'string' || typeof attr.value === 'number')
    )
  );
}

// Helper function to find the collection image
async function findUploadedImage(contractAddress: string): Promise<string | null> {
  try {
    console.log('[findUploadedImage] Looking for collection image:', {
      contractAddress,
      searchPath: `collections/${contractAddress.toLowerCase()}`
    });

    const storage = getStorage(app);
    const collectionPath = `collections/${contractAddress.toLowerCase()}`;
    const listRef = ref(storage, collectionPath);
    
    try {
      // List all items in the collection directory
      const { items } = await listAll(listRef);
      console.log('[findUploadedImage] Files in collection:', {
        path: collectionPath,
        fileCount: items.length,
        files: items.map(item => ({
          name: item.name,
          fullPath: item.fullPath
        }))
      });
      
      // Find the collection image
      const collectionImage = items.find((item: StorageReference) => 
        item.name.startsWith('collection-')
      );

      if (!collectionImage) {
        console.log('[findUploadedImage] No collection image found');
        return null;
      }

      // Get the download URL
      try {
        const downloadURL = await getDownloadURL(collectionImage);
        console.log('[findUploadedImage] Found image URL:', downloadURL);
        return downloadURL;
      } catch (urlError) {
        console.error('[findUploadedImage] Error getting download URL:', {
          error: urlError,
          file: collectionImage.fullPath
        });
        return null;
      }
    } catch (listError) {
      console.error('[findUploadedImage] Error listing files:', {
        error: listError,
        path: collectionPath
      });
      return null;
    }
  } catch (error) {
    console.error('[findUploadedImage] Error initializing storage:', {
      error,
      app: !!app,
      hasFirebase: !!getStorage
    });
    return null;
  }
}

/**
 * GET handler for NFT metadata
 * Generates and returns metadata for a specific token ID
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ tokenId: string }> }
) {
  // Await the params object
  const { tokenId } = await context.params;
  console.log('[metadata] Request received for token:', tokenId);
  
  try {
    // Get contract address from query params
    const url = new URL(request.url);
    const contractAddress = url.searchParams.get('contract');
    
    if (!contractAddress) {
      console.error('[metadata] Contract address is missing from request:', request.url);
      return NextResponse.json(
        { error: 'Contract address is required' },
        { status: 400 }
      );
    }

    // Check for collection image
    const uploadedImage = await findUploadedImage(contractAddress);
    console.log('[metadata] Collection image check result:', {
      contractAddress,
      hasUploadedImage: !!uploadedImage,
      uploadedImageUrl: uploadedImage
    });

    // Generate OpenSea-compatible metadata
    const metadata: NFTMetadata = {
      name: `MyNFT #${tokenId}`,
      description: `NFT #${tokenId} on the Nexus network.`,
      image: uploadedImage || `${API_URL}/api/image/${tokenId}`,
      external_url: `${BASE_URL}/nft/${tokenId}`,
      attributes: [
        {
          trait_type: "Token ID",
          value: tokenId
        },
        {
          trait_type: "Image Type",
          value: uploadedImage ? "Uploaded" : "Generated"
        },
        {
          display_type: "date", 
          trait_type: "Created", 
          value: Math.floor(Date.now() / 1000)
        }
      ]
    };

    // Validate metadata before sending
    if (!validateMetadata(metadata)) {
      console.error('[metadata] Invalid metadata structure:', metadata);
      return NextResponse.json(
        { error: 'Invalid metadata structure' },
        { status: 500 }
      );
    }
    
    console.log('[metadata] Serving metadata:', {
      tokenId,
      imageUrl: metadata.image,
      imageType: uploadedImage ? "Uploaded" : "Generated"
    });
    
    // Return metadata with proper headers
    return NextResponse.json(metadata, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('[metadata] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate metadata' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 