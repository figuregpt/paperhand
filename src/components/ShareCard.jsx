import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { formatUSD, formatNumber, formatPrice } from '../services/api'

export default function ShareCard({ data, type, onClose }) {
  const cardRef = useRef(null)
  const [copying, setCopying] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  // type: 'holding' | 'transaction'
  const isHolding = type === 'holding'

  const pnl = isHolding
    ? (data.currentPrice - data.avgBuyPrice) * data.amount
    : data.pnl || 0

  const pnlPercent = isHolding
    ? ((data.currentPrice - data.avgBuyPrice) / data.avgBuyPrice) * 100
    : data.pnlPercent || ((data.price - data.avgBuyPrice) / data.avgBuyPrice) * 100

  const isProfit = pnl >= 0

  const downloadImage = async () => {
    if (!cardRef.current) return

    try {
      setCopying(true)
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0b0b0f'
      })

      const link = document.createElement('a')
      link.download = `paperhand-${data.symbol}-pnl.png`
      link.href = dataUrl
      link.click()
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2000)
    } catch (err) {
      console.error('Failed to generate image:', err)
    } finally {
      setCopying(false)
    }
  }

  const copyImage = async () => {
    if (!cardRef.current) return

    try {
      setCopying(true)
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0b0b0f'
      })

      const blob = await (await fetch(dataUrl)).blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 2000)
    } catch (err) {
      console.error('Failed to copy image:', err)
      // Fallback to download if copy fails
      downloadImage()
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="max-w-sm w-full">
        {/* Card Preview */}
        <div
          ref={cardRef}
          className="bg-[#0b0b0f] p-5 rounded-xl border border-[#2a2a36]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v0" />
                <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v6" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
              </svg>
              <span className="font-semibold text-white text-sm">Paperhand</span>
            </div>
            <span className="text-[10px] text-gray-500">paperhand.site</span>
          </div>

          {/* Token Info */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={data.image}
              alt={data.symbol}
              className="w-12 h-12 rounded-full bg-[#1e1e26]"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${data.symbol}&background=1e1e26&color=fff&size=48`
              }}
            />
            <div>
              <div className="font-bold text-xl text-white">{data.symbol}</div>
              <div className="text-xs text-gray-500">
                {isHolding ? 'Current Position' : (data.type === 'BUY' ? 'Buy Order' : 'Closed Position')}
              </div>
            </div>
          </div>

          {/* P&L Display */}
          <div className={`p-4 rounded-lg mb-4 ${isProfit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <div className="text-xs text-gray-400 mb-1">P&L</div>
            <div className={`text-3xl font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}{formatUSD(pnl)}
            </div>
            <div className={`text-lg font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="text-white">{formatNumber(data.amount, 4)} {data.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Entry Price</span>
              <span className="text-white">{formatPrice(data.avgBuyPrice || data.entryPrice)}</span>
            </div>
            {isHolding && (
              <div className="flex justify-between">
                <span className="text-gray-500">Current Price</span>
                <span className="text-white">{formatPrice(data.currentPrice)}</span>
              </div>
            )}
            {!isHolding && data.type === 'SELL' && (
              <div className="flex justify-between">
                <span className="text-gray-500">Exit Price</span>
                <span className="text-white">{formatPrice(data.price)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">{isHolding ? 'Value' : 'Total'}</span>
              <span className="text-white">{formatUSD(isHolding ? data.amount * data.currentPrice : data.total)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-[#2a2a36] flex items-center justify-between">
            <span className="text-[10px] text-gray-600">Paper Trading</span>
            <span className="text-[10px] text-gray-600">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-[#2a2a36] rounded text-gray-400 hover:text-white hover:border-[#3a3a46] transition-colors"
          >
            Close
          </button>
          <button
            onClick={copyImage}
            disabled={copying}
            className="flex-1 py-2.5 text-sm bg-[#9945FF] hover:bg-[#8035EE] rounded text-white font-medium transition-colors disabled:opacity-50"
          >
            {downloaded ? 'Copied!' : copying ? 'Generating...' : 'Copy Image'}
          </button>
          <button
            onClick={downloadImage}
            disabled={copying}
            className="flex-1 py-2.5 text-sm bg-green-500 hover:bg-green-600 rounded text-black font-medium transition-colors disabled:opacity-50"
          >
            {copying ? 'Saving...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  )
}
