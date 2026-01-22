import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { formatUSD, fetchTokenData } from '../services/api'

export default function Header() {
  const { balance, holdings, tokens, resetPortfolio } = useStore()
  const [showResetModal, setShowResetModal] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showDonate, setShowDonate] = useState(false)
  const [walletCopied, setWalletCopied] = useState(false)

  const DONATE_WALLET = '6RBwv4s2skLu9xxqREFFVcrPappyW3m6Sp154JxNing2'

  const copyWallet = () => {
    navigator.clipboard.writeText(DONATE_WALLET)
    setWalletCopied(true)
    setTimeout(() => setWalletCopied(false), 2000)
  }
  const [holdingPrices, setHoldingPrices] = useState({})

  // Fetch prices for holdings not in tokens list
  useEffect(() => {
    const fetchPrices = async () => {
      const prices = {}
      const toFetch = []

      for (const holding of holdings) {
        const existingToken = tokens.find(t => t.address === holding.tokenAddress)
        if (existingToken) {
          prices[holding.tokenAddress] = existingToken.priceUsd
        } else {
          toFetch.push(holding.tokenAddress)
        }
      }

      // Batch fetch missing tokens
      if (toFetch.length > 0) {
        const results = await Promise.all(
          toFetch.map(addr => fetchTokenData(addr))
        )
        results.forEach((tokenData, i) => {
          if (tokenData) {
            prices[toFetch[i]] = tokenData.priceUsd
          }
        })
      }

      setHoldingPrices(prices)
    }

    if (holdings.length > 0) {
      fetchPrices()
      const interval = setInterval(fetchPrices, 30000)
      return () => clearInterval(interval)
    }
  }, [holdings, tokens])

  let portfolioValue = balance
  let totalPnL = 0

  holdings.forEach(holding => {
    const currentPrice = holdingPrices[holding.tokenAddress] || holding.avgBuyPrice
    const holdingValue = holding.amount * currentPrice
    portfolioValue += holdingValue
    totalPnL += holdingValue - (holding.amount * holding.avgBuyPrice)
  })

  const pnlPercent = ((portfolioValue - 10000) / 10000) * 100

  return (
    <>
      <header className="bg-[#111116] border-b border-[#1e1e26] shrink-0">
        {/* Desktop Header */}
        <div className="hidden md:flex h-14 items-center px-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v0" />
              <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v6" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </svg>
            <span className="font-semibold text-white">Paperhand</span>
          </div>

          <div className="flex-1 flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-xs text-gray-500">Balance</div>
              <div className="text-sm font-medium text-white">{formatUSD(balance)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Portfolio</div>
              <div className="text-sm font-medium text-white">{formatUSD(portfolioValue)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">P&L</div>
              <div className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatUSD(totalPnL)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://x.com/figuregpt"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-white border border-[#2a2a36] hover:border-[#3a3a46] rounded transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <button
              onClick={() => setShowDonate(true)}
              className="px-3 py-1.5 text-xs text-[#14F195] hover:text-white border border-[#14F195]/30 hover:border-[#14F195] rounded transition-colors"
            >
              Donate
            </button>
            <button
              onClick={() => setShowHowItWorks(true)}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-[#2a2a36] hover:border-[#3a3a46] rounded transition-colors"
            >
              How it works
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-[#2a2a36] hover:border-[#3a3a46] rounded transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v0" />
                <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v6" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
              </svg>
              <span className="font-semibold text-white text-sm">Paperhand</span>
            </div>
            <div className="flex items-center gap-1">
              <a
                href="https://x.com/figuregpt"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-gray-400 border border-[#2a2a36] rounded"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <button
                onClick={() => setShowDonate(true)}
                className="px-2 py-1 text-[10px] text-[#14F195] border border-[#14F195]/30 rounded"
              >
                Donate
              </button>
              <button
                onClick={() => setShowHowItWorks(true)}
                className="px-2 py-1 text-[10px] text-gray-400 border border-[#2a2a36] rounded"
              >
                ?
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="px-2 py-1 text-[10px] text-gray-400 border border-[#2a2a36] rounded"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex justify-between text-center">
            <div className="flex-1">
              <div className="text-[10px] text-gray-500">Balance</div>
              <div className="text-xs font-medium text-white">{formatUSD(balance)}</div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-gray-500">Portfolio</div>
              <div className="text-xs font-medium text-white">{formatUSD(portfolioValue)}</div>
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-gray-500">P&L</div>
              <div className={`text-xs font-medium ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatUSD(totalPnL)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {showDonate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#16161d] border border-[#2a2a36] rounded-lg p-5 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Support Paperhand</h3>
            <p className="text-sm text-gray-400 mb-4">
              Paperhand is completely free. If you find it useful, consider sending a small donation.
            </p>
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Solana Wallet</div>
              <div className="flex items-center gap-2 bg-[#0b0b0f] border border-[#2a2a36] rounded p-2">
                <code className="flex-1 text-xs text-[#14F195] break-all">{DONATE_WALLET}</code>
                <button
                  onClick={copyWallet}
                  className="px-2 py-1 text-xs bg-[#2a2a36] hover:bg-[#3a3a46] rounded transition-colors shrink-0"
                >
                  {walletCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowDonate(false)}
              className="w-full px-4 py-2 text-sm border border-[#2a2a36] hover:bg-[#1e1e26] rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#16161d] border border-[#2a2a36] rounded-lg p-5 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">How it works</h3>
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <h4 className="text-white font-medium mb-1">Paper Trading</h4>
                <p className="text-gray-400">Practice trading Solana memecoins with $10,000 virtual money. No real funds are used.</p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Real-Time Prices</h4>
                <p className="text-gray-400">Prices are fetched live from DexScreener. Track trending tokens and new listings.</p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Slippage Simulation</h4>
                <p className="text-gray-400">Trades include realistic slippage (0.5% - 5%) to simulate real market conditions.</p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Portfolio Tracking</h4>
                <p className="text-gray-400">Track your holdings, P&L, and transaction history. Your data is saved locally in your browser.</p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Platform Detection</h4>
                <p className="text-gray-400">Tokens show their launch platform (pump.fun, bonk.fun, bags.fm) with direct links.</p>
              </div>
            </div>
            <button
              onClick={() => setShowHowItWorks(false)}
              className="w-full mt-5 px-4 py-2 text-sm bg-[#9945FF] hover:bg-[#8035EE] rounded transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#16161d] border border-[#2a2a36] rounded-lg p-5 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-3">Reset Portfolio</h3>
            <p className="text-sm text-gray-400 mb-5">
              All your trades and holdings will be deleted. Starting balance will be reset to $10,000.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 text-sm border border-[#2a2a36] rounded hover:bg-[#1e1e26] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetPortfolio()
                  setShowResetModal(false)
                }}
                className="flex-1 px-4 py-2 text-sm bg-red-500 hover:bg-red-600 rounded transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
