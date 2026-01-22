import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import useStore from '../store/useStore'
import { formatUSD, formatNumber, formatPrice, fetchTokenData } from '../services/api'

export default function Portfolio({ onTokenSelect }) {
  const { holdings, transactions, portfolioHistory, tokens, balance, setSelectedToken } = useStore()
  const [activeView, setActiveView] = useState('holdings')
  const [holdingPrices, setHoldingPrices] = useState({})

  // Fetch current prices for all holdings
  useEffect(() => {
    const fetchHoldingPrices = async () => {
      const prices = {}
      const toFetch = []

      // First check which tokens need fetching
      for (const holding of holdings) {
        const existingToken = tokens.find(t => t.address === holding.tokenAddress)
        if (existingToken) {
          prices[holding.tokenAddress] = existingToken
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
            prices[toFetch[i]] = tokenData
          }
        })
      }

      setHoldingPrices(prices)
    }

    if (holdings.length > 0) {
      fetchHoldingPrices()
      // Refresh prices every 30 seconds
      const interval = setInterval(fetchHoldingPrices, 30000)
      return () => clearInterval(interval)
    }
  }, [holdings, tokens])

  // Calculate values using fetched prices
  let totalValue = balance
  let totalPnL = 0

  holdings.forEach(holding => {
    const tokenData = holdingPrices[holding.tokenAddress]
    const currentPrice = tokenData?.priceUsd || holding.avgBuyPrice
    const holdingValue = holding.amount * currentPrice
    totalValue += holdingValue
    totalPnL += holdingValue - (holding.amount * holding.avgBuyPrice)
  })

  const pnlPercent = ((totalValue - 10000) / 10000) * 100

  const chartData = portfolioHistory.map((entry, index) => ({
    index,
    time: new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    value: entry.totalValue,
    transaction: entry.transaction
  }))

  const tradePoints = chartData.filter(d => d.transaction)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-[#16161d] border border-[#2a2a36] rounded px-3 py-2 text-xs">
          <div className="text-white font-medium">{formatUSD(data.value)}</div>
          <div className="text-gray-500">{data.time}</div>
          {data.transaction && (
            <div className={`mt-1 ${data.transaction.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
              {data.transaction.type} {data.transaction.symbol}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  const handleHoldingClick = (holding) => {
    // First check cached prices
    const cachedToken = holdingPrices[holding.tokenAddress]
    if (cachedToken) {
      setSelectedToken(cachedToken)
      onTokenSelect?.()
      return
    }

    // Then check tokens list
    const token = tokens.find(t => t.address === holding.tokenAddress)
    if (token) {
      setSelectedToken(token)
      onTokenSelect?.()
      return
    }

    // Fetch from API as fallback
    fetchTokenData(holding.tokenAddress).then(tokenData => {
      if (tokenData) {
        setSelectedToken(tokenData)
        onTokenSelect?.()
      } else {
        // Last resort fallback
        setSelectedToken({
          address: holding.tokenAddress,
          symbol: holding.symbol,
          name: holding.name,
          image: holding.image,
          priceUsd: holding.avgBuyPrice,
          priceChange24h: 0,
          marketCap: 0,
          volume24h: 0,
          liquidity: 0
        })
        onTokenSelect?.()
      }
    })
  }

  return (
    <div className="h-full flex flex-col bg-[#0e0e12]">
      {/* Summary */}
      <div className="p-4 border-b border-[#1e1e26] shrink-0">
        <div className="text-xs text-gray-500 mb-1">Total Portfolio Value</div>
        <div className="text-2xl font-semibold text-white mb-1">{formatUSD(totalValue)}</div>
        <div className={`text-sm ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {totalPnL >= 0 ? '+' : ''}{formatUSD(totalPnL)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
        </div>

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="mt-4 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={totalPnL >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={totalPnL >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={totalPnL >= 0 ? '#22c55e' : '#ef4444'}
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
                {tradePoints.map((point, i) => (
                  <ReferenceDot
                    key={i}
                    x={point.index}
                    y={point.value}
                    r={4}
                    fill={point.transaction.type === 'BUY' ? '#22c55e' : '#ef4444'}
                    stroke="#0e0e12"
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {tradePoints.length > 0 && (
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Buy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Sell</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e1e26] shrink-0">
        <button
          onClick={() => setActiveView('holdings')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors relative
                    ${activeView === 'holdings' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Holdings ({holdings.length})
          {activeView === 'holdings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9945FF]"></div>
          )}
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors relative
                    ${activeView === 'history' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          History
          {activeView === 'history' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9945FF]"></div>
          )}
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeView === 'holdings' ? (
          <div className="p-3 space-y-2">
            {/* Cash */}
            <div className="flex items-center justify-between p-3 bg-[#16161d] rounded">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold text-sm">$</div>
                <div>
                  <div className="text-sm font-medium text-white">USD Cash</div>
                  <div className="text-xs text-gray-500">Available balance</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">{formatUSD(balance)}</div>
                <div className="text-xs text-gray-500">{((balance / totalValue) * 100).toFixed(1)}%</div>
              </div>
            </div>

            {/* Holdings */}
            {holdings.length > 0 ? (
              holdings.map((holding) => {
                const tokenData = holdingPrices[holding.tokenAddress]
                const currentPrice = tokenData?.priceUsd || holding.avgBuyPrice
                const currentValue = holding.amount * currentPrice
                const pnl = currentValue - (holding.amount * holding.avgBuyPrice)
                const pnlPercent = ((currentPrice - holding.avgBuyPrice) / holding.avgBuyPrice) * 100

                return (
                  <div
                    key={holding.tokenAddress}
                    onClick={() => handleHoldingClick(holding)}
                    className="flex items-center justify-between p-3 bg-[#16161d] rounded cursor-pointer hover:bg-[#1e1e26] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={holding.image}
                        alt={holding.symbol}
                        className="w-8 h-8 rounded-full bg-[#1e1e26]"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${holding.symbol}&background=1e1e26&color=fff&size=32`
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium text-white">{holding.symbol}</div>
                        <div className="text-xs text-gray-500">
                          {formatNumber(holding.amount, 4)} @ {formatPrice(holding.avgBuyPrice)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{formatUSD(currentValue)}</div>
                      <div className={`text-xs ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {pnl >= 0 ? '+' : ''}{formatUSD(pnl)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No holdings yet
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-[#16161d] rounded">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                                  ${tx.type === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {tx.type === 'BUY' ? 'B' : 'S'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {tx.type === 'BUY' ? 'Bought' : 'Sold'} {tx.symbol}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatNumber(tx.amount, 4)} @ {formatPrice(tx.price)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${tx.type === 'BUY' ? 'text-red-500' : 'text-green-500'}`}>
                      {tx.type === 'BUY' ? '-' : '+'}{formatUSD(tx.total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {tx.pnl !== undefined && (
                      <div className={`text-xs ${tx.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        P&L: {tx.pnl >= 0 ? '+' : ''}{formatUSD(tx.pnl)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No transactions yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
