import { NEXUS_EXPLORER_URL } from '../config/constants'

interface AccountDisplayProps {
  isConnected: boolean;
  isCorrectNetwork: boolean;
  userAddress: string;
  onConnect: () => Promise<void>;
  onSwitchNetwork: () => Promise<boolean>;
}

export function AccountDisplay({ 
  isConnected, 
  isCorrectNetwork, 
  userAddress, 
  onConnect, 
  onSwitchNetwork 
}: AccountDisplayProps) {
  const formatAddress = (address: string | null | undefined) => {
    if (!address || typeof address !== 'string') return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          {!isCorrectNetwork && (
            <button
              onClick={onSwitchNetwork}
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md
                       hover:bg-red-100 transition-colors"
            >
              Switch Network
            </button>
          )}
          <a
            href={`${NEXUS_EXPLORER_URL}/address/${userAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-gray-600 bg-gray-50 rounded-md
                     hover:bg-gray-100 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-xs font-medium font-mono">
              {formatAddress(userAddress)}
            </span>
          </a>
        </>
      ) : (
        <button
          onClick={onConnect}
          className="px-3 py-1.5 text-xs font-medium text-white bg-black rounded-md
                   hover:bg-gray-800 transition-colors"
        >
          Connect Wallet
        </button>
      )}
    </div>
  )
} 