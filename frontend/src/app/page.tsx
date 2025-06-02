'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ethers } from 'ethers'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { NEXUS_EXPLORER_URL, NEXUS_RPC_URL, NEXUS_CHAIN_ID_HEX, getMetadataBaseURI } from './config/constants'
import { SimpleNFT__factory } from '../types/contracts/factories/contracts/SimpleNFT__factory'
import { Navbar } from './components/Navbar'

// Add this function after the imports
const generateNFTSymbol = (name: string): string => {
  // Remove special characters and split into words
  const words = name.replace(/[^\w\s]/gi, '').split(/\s+/)
  
  if (words.length === 0) return 'NFT'
  
  if (words.length === 1) {
    const word = words[0].toUpperCase()
    // If single word is 4 letters or less, use it as is
    if (word.length <= 4) return word
    // For longer words, use first 3-4 consonants or first 3-4 letters if not enough consonants
    const consonants = word.replace(/[aeiou]/gi, '')
    return consonants.length >= 3 ? consonants.slice(0, 4) : word.slice(0, 4)
  }
  
  // For multiple words, use first letter of each word (up to 4)
  const initials = words.map(word => word[0].toUpperCase()).join('')
  return initials.slice(0, 4)
}

export default function Home() {
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(false)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [userAddress, setUserAddress] = useState('')
  const [nftName, setNftName] = useState('MyNFT')
  const [status, setStatus] = useState('')
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [visitAddress, setVisitAddress] = useState('')

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      // Instead of uploading, just store the file and show preview
      setUploadedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Instead of uploading, just store the file and show preview
      setUploadedImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })
    const isNexus = chainId === NEXUS_CHAIN_ID_HEX
    setIsCorrectNetwork(isNexus)
    return isNexus
  }, [])

  const switchNetwork = async () => {
    if (!window.ethereum) return false
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NEXUS_CHAIN_ID_HEX }],
      })
      return await checkNetwork()
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: NEXUS_CHAIN_ID_HEX,
              rpcUrls: [NEXUS_RPC_URL],
              chainName: 'Nexus Testnet',
              nativeCurrency: {
                name: 'NEXUS',
                symbol: 'NEXUS',
                decimals: 18
              },
            }],
          })
          return await checkNetwork()
        } catch (addError) {
          console.error('Error adding network:', addError)
          return false
        }
      }
      console.error('Error switching network:', switchError)
      return false
    }
  }

  const checkWalletConnection = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          setIsConnected(true)
          setUserAddress(accounts[0].address)
          await checkNetwork()
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
  }, [checkNetwork])

  useEffect(() => {
    checkWalletConnection()

    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkNetwork)
      window.ethereum.on('accountsChanged', checkWalletConnection)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkNetwork)
        window.ethereum.removeListener('accountsChanged', checkWalletConnection)
      }
    }
  }, [checkNetwork, checkWalletConnection])

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send('eth_requestAccounts', [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        setUserAddress(address.toString())
        setIsConnected(true)
        await checkNetwork()
      } catch (error) {
        console.error('Error connecting wallet:', error)
      }
    }
  }

  const deployNFT = async () => {
    if (!isConnected) {
      setStatus('Please connect your wallet first')
      return
    }

    try {
      setIsDeploying(true)
      setStatus('Preparing deployment...')

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      // Get the current network to ensure we're on the right chain
      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)
      const targetChainId = parseInt(NEXUS_CHAIN_ID_HEX, 16)
      
      if (chainId !== targetChainId) {
        await switchNetwork()
      }

      // Generate contract factory
      const SimpleNFT = new SimpleNFT__factory(signer)
      
      setStatus('Deploying NFT collection...')

      // Get current nonce and gas price
      const [nonce, feeData] = await Promise.all([
        provider.getTransactionCount(await signer.getAddress()),
        provider.getFeeData()
      ])

      // Deploy with optimized parameters
      const nft = await SimpleNFT.deploy(
        nftName,                    // Collection name
        generateNFTSymbol(nftName), // Collection symbol
        await signer.getAddress(),  // Initial owner
        {
          nonce,
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
          gasLimit: 3000000 // Fixed gas limit that should be sufficient
        }
      )

      setStatus(`Deploying... Transaction: ${nft.deploymentTransaction()?.hash}`)

      // Wait for deployment
      await nft.waitForDeployment()
      const contractAddress = await nft.getAddress()

      // Set the base URI after deployment with contract address
      const baseUri = getMetadataBaseURI(contractAddress)
      const tx = await nft.setBaseURI(baseUri)
      await tx.wait()

      // Upload collection image if one was provided
      if (uploadedImage) {
        setStatus('Uploading collection image...')
        const formData = new FormData()
        formData.append('file', uploadedImage)
        formData.append('contractAddress', contractAddress)

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error('Failed to upload image')
          }
        } catch (error) {
          console.error('Image upload error:', error)
          setStatus('Warning: Failed to upload collection image, but contract was deployed')
        }
      }

      setStatus(`NFT Collection deployed successfully
        Contract: ${contractAddress}
        View on Explorer: ${NEXUS_EXPLORER_URL}/address/${contractAddress}`)

      // After successful deployment, navigate to the collection page
      router.push(`/collection/${contractAddress}`)
    } catch (error: any) {
      console.error('Deployment error:', error)
      setStatus(`Deployment failed: ${error.message || 'Unknown error'}`)
      setIsDeploying(false)
    }
  }

  const formatStatusDisplay = (status: string) => {
    // For contract deployment success
    if (status.includes('NFT contract deployed successfully')) {
      return (
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-gray-600">Contract deployed</span>
          </div>
          <a
            href={`${NEXUS_EXPLORER_URL}/tx/${status.match(/Transaction: (0x[a-fA-F0-9]+)/)?.[1]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View on Explorer
          </a>
        </div>
      )
    }
    
    // For in-progress status
    if (status.includes('Deploying')) {
      return (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
          <span className="text-sm text-gray-600">{status.split('\n')[0]}</span>
        </div>
      )
    }

    // For errors or other status messages
    return <p className="text-sm text-gray-600 text-center py-2">{status}</p>
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar
        title="Nexus NFT"
        isConnected={isConnected}
        isCorrectNetwork={isCorrectNetwork}
        userAddress={userAddress}
        onConnect={connectWallet}
        onSwitchNetwork={switchNetwork}
        onNavigateHome={() => router.push('/')}
      />

      {/* Main Content */}
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center pt-14">
        <div className="w-full max-w-lg mx-auto px-4">
          {/* Visit Collection Card */}
          <div className="w-full bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-900">Visit Collection</h2>
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contract address (0x...)"
                    value={visitAddress}
                    onChange={(e) => setVisitAddress(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-white rounded-md border border-gray-200 
                             focus:ring-1 focus:ring-black focus:border-transparent
                             text-gray-900 placeholder-gray-400 font-mono"
                  />
                  <button
                    onClick={() => router.push(`/collection/${visitAddress}`)}
                    disabled={!ethers.isAddress(visitAddress)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                              ${ethers.isAddress(visitAddress)
                                ? 'bg-black text-white hover:bg-gray-800'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Deploy Collection Card */}
          {isConnected && isCorrectNetwork ? (
            <div className="w-full mt-4 bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900">Deploy New Collection</h2>
                <div className="mt-4 space-y-4">
                  {/* Collection Name Input */}
                  <input
                    type="text"
                    placeholder="Collection name"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white rounded-md border border-gray-200 
                             focus:ring-1 focus:ring-black focus:border-transparent
                             text-gray-900 placeholder-gray-400"
                  />

                  {/* Image Drop Area */}
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={(e) => e.preventDefault()}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full aspect-square border-2 border-dashed rounded-lg 
                              flex flex-col items-center justify-center gap-2 
                              transition-colors cursor-pointer
                              ${isDragging ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    {previewUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={previewUrl}
                          alt="Collection preview"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="text-sm text-gray-500">
                          Drop image here or click to upload
                        </p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Deploy Button */}
                  <button
                    onClick={deployNFT}
                    disabled={!uploadedImage || !nftName.trim() || isDeploying}
                    className={`w-full py-2.5 text-sm font-medium rounded-md transition-colors
                              ${uploadedImage && nftName.trim() && !isDeploying
                                ? 'bg-black text-white hover:bg-gray-800'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                  >
                    {isDeploying ? 'Deploying...' : 'Deploy Collection'}
                  </button>

                  {/* Status Message */}
                  {status && (
                    <div className="w-full text-center">
                      {formatStatusDisplay(status)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
} 