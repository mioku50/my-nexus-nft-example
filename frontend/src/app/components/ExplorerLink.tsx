import { NEXUS_EXPLORER_URL } from '../config/constants'

interface ExplorerLinkProps {
  type: 'transaction' | 'address';
  value: string;
  className?: string;
  showPrefix?: boolean;
}

export function ExplorerLink({ type, value, className = '', showPrefix = false }: ExplorerLinkProps) {
  const formatValue = (value: string) => {
    if (!value) return ''
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  const getUrl = () => {
    switch (type) {
      case 'transaction':
        return `${NEXUS_EXPLORER_URL}/tx/${value}`
      case 'address':
        return `${NEXUS_EXPLORER_URL}/address/${value}`
      default:
        return '#'
    }
  }

  return (
    <a
      href={getUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-xs font-mono hover:underline ${className}`}
    >
      {showPrefix && (type === 'transaction' ? 'tx: ' : '')}
      {formatValue(value)}
    </a>
  )
} 