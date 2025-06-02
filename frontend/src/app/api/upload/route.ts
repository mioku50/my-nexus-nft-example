import { NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../../../config/firebase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tokenId = formData.get('tokenId') as string;
    const contractAddress = formData.get('contractAddress') as string;
    
    console.log('[upload] Request received:', { 
      contractAddress,
      tokenId, 
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size 
    });
    
    if (!file) {
      console.error('[upload] No file provided');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!contractAddress) {
      console.error('[upload] No contract address provided');
      return NextResponse.json(
        { error: 'Contract address is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('[upload] Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Create unique filename with contract address namespace
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    const filename = `collection-${sanitizedFileName}`;

    // Create storage path with contract address namespace
    const storagePath = `collections/${contractAddress.toLowerCase()}/${filename}`;

    console.log('[upload] Preparing to upload file:', {
      originalName: file.name,
      sanitizedName: sanitizedFileName,
      finalFilename: filename,
      storagePath,
      contractAddress: contractAddress.toLowerCase()
    });

    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Firebase Storage
    const storage = getStorage(app);
    const storageRef = ref(storage, storagePath);
    
    // Upload the file
    const uploadResult = await uploadBytes(storageRef, buffer, {
      contentType: file.type,
      customMetadata: {
        contractAddress: contractAddress.toLowerCase(),
        tokenId: tokenId || '',
        originalName: file.name,
        uploadTimestamp: timestamp.toString()
      }
    });

    console.log('[upload] File uploaded successfully:', {
      path: uploadResult.ref.fullPath,
      metadata: uploadResult.metadata,
      tokenId,
      contractAddress: contractAddress.toLowerCase()
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('[upload] Generated download URL:', downloadURL);
    
    return NextResponse.json({ 
      success: true,
      filename: downloadURL,
      path: uploadResult.ref.fullPath
    });
  } catch (error: any) {
    console.error('[upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
} 