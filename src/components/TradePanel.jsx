import { useState, useEffect } from 'react'
import useStore from '../store/useStore'
import { formatPrice, formatNumber, formatUSD } from '../services/api'

// Detect platform from address or dexId
const detectPlatform = (token) => {
  if (!token) return null

  const address = token.address?.toLowerCase() || ''
  const dexId = token.dexId?.toLowerCase() || ''

  // Check address suffix for launchpad platforms
  if (address.endsWith('pump')) {
    return { name: 'pump.fun', color: '#00ff88', url: `https://pump.fun/coin/${token.address}` }
  }
  if (address.endsWith('bonk')) {
    return { name: 'bonk.fun', color: '#ff9500', url: `https://bonk.fun/token/${token.address}` }
  }
  if (address.endsWith('bags')) {
    return { name: 'bags.fm', color: '#a855f7', url: `https://bags.fm/token/${token.address}` }
  }

  // Check dexId for DEX platforms
  if (dexId.includes('raydium')) {
    return { name: 'Raydium', color: '#5ac4be', url: `https://raydium.io/swap/?inputMint=sol&outputMint=${token.address}` }
  }
  if (dexId.includes('orca')) {
    return { name: 'Orca', color: '#ffb238', url: `https://www.orca.so/?tokenA=So11111111111111111111111111111111111111112&tokenB=${token.address}` }
  }
  if (dexId.includes('meteora')) {
    return { name: 'Meteora', color: '#6366f1', url: `https://app.meteora.ag/` }
  }

  // Default - no badge shown
  return null
}

export default function TradePanel() {
  const { selectedToken, setSelectedToken, balance, holdings, buyToken, sellToken } = useStore()
  const [activeView, setActiveView] = useState('trade') // 'chart' | 'trade'
  const [tradeType, setTradeType] = useState('buy')
  const [amount, setAmount] = useState('')
  const [usdAmount, setUsdAmount] = useState('')
  const [slippage, setSlippage] = useState(0.5)
  const [showSlippage, setShowSlippage] = useState(false)
  const [notification, setNotification] = useState(null)
  const [copied, setCopied] = useState(false)

  const holding = selectedToken
    ? holdings.find(h => h.tokenAddress === selectedToken.address)
    : null

  const platform = detectPlatform(selectedToken)

  // Removed auto-sync to prevent input issues

  useEffect(() => {
    setAmount('')
    setUsdAmount('')
  }, [selectedToken?.address])

  const parseNumber = (value) => {
    // Accept both comma and period as decimal separator
    const normalized = value.replace(',', '.')
    return parseFloat(normalized)
  }

  const handleAmountChange = (value) => {
    // Normalize: replace comma with period
    const normalized = value.replace(',', '.')
    setAmount(normalized)
    const num = parseNumber(normalized)
    if (selectedToken && normalized && !isNaN(num)) {
      const usd = num * selectedToken.priceUsd
      setUsdAmount(usd.toFixed(2))
    } else {
      setUsdAmount('')
    }
  }

  const handleUsdChange = (value) => {
    // Normalize: replace comma with period
    const normalized = value.replace(',', '.')
    setUsdAmount(normalized)
    const num = parseNumber(normalized)
    if (selectedToken && normalized && !isNaN(num)) {
      const tokens = num / selectedToken.priceUsd
      setAmount(tokens.toFixed(6))
    } else {
      setAmount('')
    }
  }

  const handlePercentage = (percent) => {
    if (tradeType === 'buy') {
      const maxUsd = balance * (percent / 100)
      setUsdAmount(maxUsd.toFixed(2))
      if (selectedToken) {
        const tokens = maxUsd / selectedToken.priceUsd
        setAmount(tokens.toFixed(6))
      }
    } else if (holding) {
      const tokenAmount = holding.amount * (percent / 100)
      setAmount(tokenAmount.toFixed(6))
      if (selectedToken) {
        const usd = tokenAmount * selectedToken.priceUsd
        setUsdAmount(usd.toFixed(2))
      }
    }
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(selectedToken.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleTrade = () => {
    if (!selectedToken || !amount || parseFloat(amount) <= 0) return

    const tokenAmount = parseFloat(amount)
    let result

    if (tradeType === 'buy') {
      result = buyToken(selectedToken, tokenAmount, selectedToken.priceUsd, slippage)
    } else {
      result = sellToken(selectedToken, tokenAmount, selectedToken.priceUsd, slippage)
    }

    if (result.success) {
      setNotification({
        type: 'success',
        message: `${tradeType === 'buy' ? 'Bought' : 'Sold'} ${tokenAmount.toFixed(4)} ${selectedToken.symbol}`
      })
      setAmount('')
      setUsdAmount('')
    } else {
      setNotification({ type: 'error', message: result.error })
    }

    setTimeout(() => setNotification(null), 3000)
  }

  if (!selectedToken) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-[#0b0b0f]">
        <div className="text-center">
          <div className="text-sm">Select a token to trade</div>
        </div>
      </div>
    )
  }

  const slippageMultiplier = tradeType === 'buy' ? 1 + (slippage / 100) : 1 - (slippage / 100)
  const effectivePrice = selectedToken.priceUsd * slippageMultiplier
  const total = parseFloat(amount || 0) * effectivePrice

  const canTrade = tradeType === 'buy'
    ? total > 0 && total <= balance
    : parseFloat(amount) > 0 && holding && parseFloat(amount) <= holding.amount

  const shortAddress = selectedToken.address.slice(0, 6) + '...' + selectedToken.address.slice(-4)

  return (
    <div className="h-full flex flex-col bg-[#0b0b0f]">
      {/* Token Header - Compact */}
      <div className="p-3 border-b border-[#1e1e26] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={selectedToken.image}
              alt={selectedToken.symbol}
              className="w-8 h-8 rounded-full bg-[#1e1e26]"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${selectedToken.symbol}&background=1e1e26&color=fff`
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{selectedToken.symbol}</span>
                {platform && (
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-1.5 py-0.5 text-[10px] rounded font-medium hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: platform.color + '20', color: platform.color }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {platform.name}
                  </a>
                )}
              </div>
              <button
                onClick={copyAddress}
                className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                {copied ? (
                  <span className="text-green-500">Copied!</span>
                ) : (
                  <>
                    <span>{shortAddress}</span>
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-white">{formatPrice(selectedToken.priceUsd)}</div>
              <div className={`text-xs ${selectedToken.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {selectedToken.priceChange24h >= 0 ? '+' : ''}{selectedToken.priceChange24h?.toFixed(2)}%
              </div>
            </div>
            <button
              onClick={() => setSelectedToken(null)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4 mt-2 text-xs">
          <div>
            <span className="text-gray-500">MCap </span>
            <span className="text-white">${formatNumber(selectedToken.marketCap)}</span>
          </div>
          <div>
            <span className="text-gray-500">Vol </span>
            <span className="text-white">${formatNumber(selectedToken.volume24h)}</span>
          </div>
          <div>
            <span className="text-gray-500">Liq </span>
            <span className="text-white">${formatNumber(selectedToken.liquidity)}</span>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-2 mt-2">
          {/* DexScreener - Always show */}
          <a
            href={`https://dexscreener.com/solana/${selectedToken.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-[#16161d] hover:bg-[#1e1e26] rounded transition-colors"
            title="DexScreener"
          >
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </a>

          {selectedToken.twitter && (
            <a
              href={selectedToken.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-[#16161d] hover:bg-[#1e1e26] rounded transition-colors"
              title="Twitter"
            >
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          )}

          {selectedToken.telegram && (
            <a
              href={selectedToken.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-[#16161d] hover:bg-[#1e1e26] rounded transition-colors"
              title="Telegram"
            >
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          )}

          {selectedToken.discord && (
            <a
              href={selectedToken.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-[#16161d] hover:bg-[#1e1e26] rounded transition-colors"
              title="Discord"
            >
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
              </svg>
            </a>
          )}

          {selectedToken.website && (
            <a
              href={selectedToken.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-[#16161d] hover:bg-[#1e1e26] rounded transition-colors"
              title="Website"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-[#1e1e26] shrink-0">
        <button
          onClick={() => setActiveView('trade')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors relative
                    ${activeView === 'trade' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Trade
          {activeView === 'trade' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"></div>
          )}
        </button>
        <button
          onClick={() => setActiveView('chart')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors relative
                    ${activeView === 'chart' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Chart
          {activeView === 'chart' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9945FF]"></div>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeView === 'chart' ? (
          /* Chart View */
          <div className="h-full flex flex-col">
            {selectedToken.pairAddress ? (
              <iframe
                src={`https://dexscreener.com/solana/${selectedToken.pairAddress}?embed=1&theme=dark&trades=0&info=0`}
                className="flex-1 w-full border-0"
                title="Price Chart"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                Chart not available
              </div>
            )}

            {/* Quick Trade Buttons on Chart View */}
            <div className="p-3 border-t border-[#1e1e26] flex gap-2 shrink-0">
              <button
                onClick={() => setActiveView('trade')}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-black rounded font-medium text-sm transition-colors"
              >
                Buy
              </button>
              {holding && (
                <button
                  onClick={() => {
                    setActiveView('trade')
                    setTradeType('sell')
                  }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded font-medium text-sm transition-colors"
                >
                  Sell
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Trade View */
          <div className="h-full flex flex-col min-h-0">
            <div className="flex-1 p-4 overflow-y-auto min-h-0">
              {holding && (
                <div className="mb-4 p-3 bg-[#16161d] rounded border border-[#2a2a36]">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Your Holdings</span>
                    <span className="text-white font-medium">{formatNumber(holding.amount, 4)} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-500">Value</span>
                    <span className="text-white">{formatUSD(holding.amount * selectedToken.priceUsd)}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-500">P&L</span>
                    {(() => {
                      const pnl = (selectedToken.priceUsd - holding.avgBuyPrice) * holding.amount
                      const pnlPct = ((selectedToken.priceUsd - holding.avgBuyPrice) / holding.avgBuyPrice) * 100
                      return (
                        <span className={pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {pnl >= 0 ? '+' : ''}{formatUSD(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                        </span>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Buy/Sell Toggle */}
              <div className="flex bg-[#16161d] rounded p-1 mb-4">
                <button
                  onClick={() => setTradeType('buy')}
                  className={`flex-1 py-2.5 rounded text-sm font-medium transition-colors
                            ${tradeType === 'buy' ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTradeType('sell')}
                  disabled={!holding}
                  className={`flex-1 py-2.5 rounded text-sm font-medium transition-colors
                            ${tradeType === 'sell' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}
                            disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  Sell
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Amount ({selectedToken.symbol})</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-[#16161d] border border-[#2a2a36] rounded text-white placeholder-gray-600 focus:outline-none focus:border-[#3a3a46]"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">USD Value</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={usdAmount}
                    onChange={(e) => handleUsdChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-[#16161d] border border-[#2a2a36] rounded text-white placeholder-gray-600 focus:outline-none focus:border-[#3a3a46]"
                  />
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="flex gap-2 mb-4">
                {[25, 50, 75, 100].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => handlePercentage(percent)}
                    className="flex-1 py-2 text-xs border border-[#2a2a36] rounded text-gray-400 hover:text-white hover:border-[#3a3a46] transition-colors"
                  >
                    {percent}%
                  </button>
                ))}
              </div>

              {/* Slippage */}
              <div className="mb-4">
                <button
                  onClick={() => setShowSlippage(!showSlippage)}
                  className="flex items-center justify-between w-full text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <span>Slippage: {slippage}%</span>
                  <span>{showSlippage ? '−' : '+'}</span>
                </button>

                {showSlippage && (
                  <div className="flex gap-2 mt-2">
                    {[0.5, 1, 2, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSlippage(s)}
                        className={`flex-1 py-1.5 text-xs rounded transition-colors
                                  ${slippage === s ? 'bg-[#9945FF] text-white' : 'border border-[#2a2a36] text-gray-400 hover:text-white'}`}
                      >
                        {s}%
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Summary */}
              {amount && parseFloat(amount) > 0 && (
                <div className="p-3 bg-[#16161d] rounded text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="text-white">{formatPrice(selectedToken.priceUsd)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Slippage ({slippage}%)</span>
                    <span className={tradeType === 'buy' ? 'text-red-400' : 'text-green-400'}>
                      {tradeType === 'buy' ? '+' : '-'}{formatPrice(selectedToken.priceUsd * (slippage / 100))}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#2a2a36]">
                    <span className="text-gray-400 font-medium">Total</span>
                    <span className="text-white font-medium">{formatUSD(total)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Trade Button */}
            <div className="p-4 border-t border-[#1e1e26] shrink-0">
              <button
                onClick={handleTrade}
                disabled={!canTrade}
                className={`w-full py-3 rounded font-medium transition-colors
                          ${tradeType === 'buy'
                            ? 'bg-green-500 hover:bg-green-600 text-black disabled:bg-green-500/30 disabled:text-green-500/50'
                            : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-500/30 disabled:text-red-500/50'}
                          disabled:cursor-not-allowed`}
              >
                {tradeType === 'buy' ? `Buy ${selectedToken.symbol}` : `Sell ${selectedToken.symbol}`}
              </button>

              {tradeType === 'buy' && total > balance && (
                <p className="text-red-500 text-xs text-center mt-2">Insufficient balance</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-20 lg:bottom-4 right-4 px-4 py-3 rounded shadow-lg z-50 text-sm
                       ${notification.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}
