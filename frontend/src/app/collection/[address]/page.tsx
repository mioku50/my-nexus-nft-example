'use client'

import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { NEXUS_CHAIN_ID_HEX } from '../../config/constants'
import { SimpleNFT__factory } from '../../../types/contracts/factories/contracts/SimpleNFT__factory'
import type { SimpleNFT } from '../../../types/contracts/contracts/SimpleNFT'
import { NFTCard } from '../../components/NFTCard'
import { Navbar } from '../../components/Navbar'
import { ExplorerLink } from '../../components/ExplorerLink'

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
}

export default function Collection({ params: paramsPromise }: { params: Promise<{ address: string }> }) {
  const { address } = use(paramsPromise)
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(false)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [userAddress, setUserAddress] = useState('')
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'info'; message: string; tx?: string }>({ type: 'info', message: '' })
  const [nftContract, setNftContract] = useState<SimpleNFT | null>(null)
  const [isMinting, setIsMinting] = useState(false)
  const [ownedNFTs, setOwnedNFTs] = useState<Array<{ tokenId: string; metadata: NFTMetadata | null }>>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)
  const [collectionName, setCollectionName] = useState('')
  const [isOwner, setIsOwner] = useState(false)

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
      // Handle network switching errors
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

  const loadContract = useCallback(async () => {
    if (!ethers.isAddress(address)) {
      router.push('/')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = SimpleNFT__factory.connect(address, provider)
      
      // Load contract details
      const [name, owner] = await Promise.all([
        contract.name(),
        contract.owner()
      ])

      setCollectionName(name)
      setIsOwner(owner.toLowerCase() === userAddress.toLowerCase())
      setNftContract(contract)
      
      // Load NFTs
      await fetchCollectionNFTs(contract)
    } catch (error) {
      console.error('Error loading contract:', error)
      router.push('/')
    }
  }, [address, router, userAddress])

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

  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      loadContract()
    }
  }, [isConnected, isCorrectNetwork, loadContract])

  const fetchCollectionNFTs = async (contract: SimpleNFT) => {
    if (!contract) return

    try {
      setIsLoadingNFTs(true)
      const totalSupply = await contract.totalSupply()
      const nfts: Array<{ tokenId: string; metadata: NFTMetadata | null }> = []
      
      for (let i = 1; i <= Number(totalSupply); i++) {
        try {
          const tokenURI = await contract.tokenURI(i)
          const response = await fetch(tokenURI)
          const metadata = response.ok ? await response.json() : null
          nfts.push({ tokenId: i.toString(), metadata })
        } catch (error) {
          console.error(`Error fetching NFT ${i}:`, error)
          nfts.push({ tokenId: i.toString(), metadata: null })
        }
      }
      
      setOwnedNFTs(nfts)
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  const mintNFT = async () => {
    if (!nftContract) {
      setStatus({ type: 'error', message: 'No NFT contract available' })
      return
    }

    try {
      setIsMinting(true)
      setStatus({ type: 'info', message: 'Initiating NFT mint...' })

      const signer = await new ethers.BrowserProvider(window.ethereum).getSigner()
      const contractWithSigner = nftContract.connect(signer)
      
      const tx = await contractWithSigner.mint()
      setStatus({ 
        type: 'info', 
        message: 'Minting NFT... Monitoring transaction status...',
        tx: tx.hash 
      })

      const receipt = await tx.wait()
      
      if (receipt && receipt.status === 1) {
        const mintEvent = receipt.logs.find(
          (log) => {
            try {
              const parsedLog = nftContract.interface.parseLog(log)
              return parsedLog?.name === 'Transfer' && 
                     parsedLog.args[0] === ethers.ZeroAddress
            } catch {
              return false
            }
          }
        )

        let newTokenId = 'unknown'
        try {
          if (mintEvent) {
            const parsedLog = nftContract.interface.parseLog(mintEvent)
            if (parsedLog) {
              newTokenId = parsedLog.args[2].toString()
            }
          }
        } catch (error) {
          console.error('Error parsing mint event:', error)
        }

        setStatus({ 
          type: 'success', 
          message: `NFT #${newTokenId} minted successfully`, 
          tx: tx.hash 
        })

        // Refresh the gallery
        await fetchCollectionNFTs(nftContract)
      } else {
        setStatus({ type: 'error', message: 'Minting failed. Please try again.' })
      }
    } catch (error: any) {
      console.error('Minting error:', error)
      // Only show user-friendly error messages
      if (error?.code === 'ACTION_REJECTED') {
        setStatus({ type: 'info', message: 'Transaction cancelled' })
      } else {
        setStatus({ type: 'error', message: 'Failed to mint NFT. Please try again.' })
      }
    } finally {
      setIsMinting(false)
    }
  }

  const handleTransfer = async (tokenId: string, to: string) => {
    if (!nftContract || !to) return
    
    try {
      const signer = await new ethers.BrowserProvider(window.ethereum).getSigner()
      const contractWithSigner = nftContract.connect(signer)
      
      const tx = await contractWithSigner.transferFrom(userAddress, to, tokenId)
      setStatus({ type: 'info', message: 'Transferring NFT...', tx: tx.hash })
      
      await tx.wait()
      setStatus({ type: 'success', message: 'NFT transferred successfully', tx: tx.hash })
      await fetchCollectionNFTs(nftContract)
    } catch (error: any) {
      console.error('Transfer error:', error)
      if (error?.code === 'ACTION_REJECTED') {
        setStatus({ type: 'info', message: 'Transfer cancelled' })
      } else {
        setStatus({ type: 'error', message: 'Failed to transfer NFT. Please try again.' })
      }
    }
  }

  return (
    <main className="min-h-screen bg-white pt-14">
      <Navbar
        title="Nexus NFT"
        isConnected={isConnected}
        isCorrectNetwork={isCorrectNetwork}
        userAddress={userAddress}
        onConnect={connectWallet}
        onSwitchNetwork={switchNetwork}
        onNavigateHome={() => router.push('/')}
      />

      {/* Collection Header */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Collection Info */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {collectionName || 'Loading...'}
                </h1>
                {isOwner && (
                  <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                    Owner
                  </span>
                )}
              </div>

              {/* Contract Address */}
              <ExplorerLink
                type="address"
                value={address}
                className="text-sm text-gray-500 hover:text-gray-700"
              />
            </div>

            {/* Mint Button and Status */}
            {isOwner && (
              <div className="flex flex-col items-stretch md:items-end gap-2">
                <button
                  onClick={mintNFT}
                  disabled={isMinting || !isCorrectNetwork}
                  className={`w-full md:w-auto px-6 py-2.5 text-sm font-medium rounded-lg transition-all
                            inline-flex items-center justify-center gap-2 min-w-[160px]
                            ${isMinting || !isCorrectNetwork
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-black text-white hover:bg-gray-800 hover:shadow-sm active:transform active:scale-[0.98]'
                            }`}
                >
                  <span>{isMinting ? 'Minting...' : 'Mint New NFT'}</span>
                  {!isMinting && (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>

                {/* Status Messages */}
                {status.message && (
                  <div className="text-right">
                    <p className={`text-sm ${
                      status.type === 'error' ? 'text-red-600' :
                      status.type === 'success' ? 'text-green-600' :
                      'text-gray-600'
                    }`}>
                      {status.message}
                      {status.tx && (
                        <>
                          <span className="mx-1">·</span>
                          <ExplorerLink
                            type="transaction"
                            value={status.tx}
                            className={status.type === 'success' ? 'text-green-600' : 'text-gray-600'}
                            showPrefix
                          />
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col gap-6">
            {/* NFT Gallery */}
            {isLoadingNFTs ? (
              <div className="w-full flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-black"></div>
              </div>
            ) : ownedNFTs.length === 0 ? (
              <div className="w-full py-16">
                <p className="text-center text-gray-400">No NFTs in collection</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ownedNFTs.map(({ tokenId, metadata }) => (
                  <NFTCard
                    key={tokenId}
                    tokenId={tokenId}
                    metadata={metadata}
                    userAddress={userAddress}
                    nftContract={nftContract}
                    onTransfer={handleTransfer}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
} 