import { NextResponse } from 'next/server';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { app } from '../../../config/firebase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const contractAddress = url.searchParams.get('contract');
    const tokenId = url.searchParams.get('tokenId');
    
    console.log('[metadata] Request received for token:', tokenId);
    
    if (!contractAddress) {
      console.error('[metadata] Contract address is missing from request:', request.url);
      return NextResponse.json(
        { error: 'Contract address is required' },
        { status: 400 }
      );
    }

    if (!tokenId) {
      console.error('[metadata] Token ID is missing from request:', request.url);
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';

    // Check for collection image
    const uploadedImage = await findUploadedImage(contractAddress);
    console.log('[metadata] Collection image check result:', {
      contractAddress,
      hasUploadedImage: !!uploadedImage,
      uploadedImageUrl: uploadedImage
    });

    // Generate OpenSea-compatible metadata
    const metadata = {
      name: `MyNFT #${tokenId}`,
      description: `NFT #${tokenId} on the Nexus network.`,
      image: uploadedImage || `${apiUrl}/api/image/${tokenId}`,
      external_url: `${websiteUrl}/nft/${tokenId}`,
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

    console.log('[metadata] Serving metadata:', {
      tokenId,
      imageUrl: metadata.image,
      imageType: uploadedImage ? "Uploaded" : "Generated"
    });
    
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
      { status: 500 }
    );
  }
}

async function findUploadedImage(contractAddress: string): Promise<string | null> {
  try {
    const storage = getStorage(app);
    const collectionPath = `collections/${contractAddress.toLowerCase()}`;
    const listRef = ref(storage, collectionPath);
    
    try {
      const { items } = await listAll(listRef);
      const collectionImage = items.find(item => 
        item.name.startsWith('collection-')
      );

      if (!collectionImage) {
        return null;
      }

      return await getDownloadURL(collectionImage);
    } catch (error) {
      console.error('[metadata] Error listing files:', error);
      return null;
    }
  } catch (error) {
    console.error('[metadata] Error initializing storage:', error);
    return null;
  }
} 