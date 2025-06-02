import { ReactNode } from 'react'
import { AccountDisplay } from './AccountDisplay'

interface NavbarProps {
  title?: string;
  subtitle?: ReactNode;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  userAddress: string;
  onConnect: () => Promise<void>;
  onSwitchNetwork: () => Promise<boolean>;
  onNavigateHome: () => void;
}

export function Navbar({
  title = 'Nexus NFT',
  subtitle,
  isConnected,
  isCorrectNetwork,
  userAddress,
  onConnect,
  onSwitchNetwork,
  onNavigateHome
}: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <button 
              onClick={onNavigateHome}
              className="text-sm font-medium text-gray-900 hover:text-black"
            >
              {title}
            </button>
            {subtitle && (
              <>
                <span className="text-sm text-gray-400">·</span>
                <h1 className="text-sm font-medium text-gray-600">{subtitle}</h1>
              </>
            )}
          </div>
          
          <AccountDisplay
            isConnected={isConnected}
            isCorrectNetwork={isCorrectNetwork}
            userAddress={userAddress}
            onConnect={onConnect}
            onSwitchNetwork={onSwitchNetwork}
          />
        </div>
      </div>
    </header>
  )
} 