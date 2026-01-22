import { useState, useEffect, useCallback } from 'react'
import useStore from '../store/useStore'
import { fetchTrendingTokens, fetchNewTokens, searchTokens, fetchMultipleTokens, fetchTokenData, POPULAR_TOKENS, formatPrice } from '../services/api'

function TokenRow({ token, isSelected, onClick, isFavorite, onToggleFavorite }) {
  const change = token.priceChange24h || 0
  const shortAddress = token.address.slice(0, 4) + '...' + token.address.slice(-4)

  const handleFavorite = (e) => {
    e.stopPropagation()
    onToggleFavorite(token)
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-[#1e1e26] transition-colors
                ${isSelected ? 'bg-[#1e1e26]' : 'hover:bg-[#16161d]'}`}
    >
      <img
        src={token.image}
        alt={token.symbol}
        className="w-8 h-8 rounded-full bg-[#1e1e26]"
        onError={(e) => {
          e.target.src = `https://ui-avatars.com/api/?name=${token.symbol}&background=1e1e26&color=fff&size=32`
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-white">{token.symbol}</span>
          {token.isNew && (
            <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-500 rounded">NEW</span>
          )}
        </div>
        <div className="text-xs text-gray-500">{shortAddress}</div>
      </div>
      <button
        onClick={handleFavorite}
        className="p-1.5 hover:bg-[#2a2a36] rounded transition-colors"
      >
        <svg
          className={`w-4 h-4 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'}`}
          fill={isFavorite ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
      <div className="text-right">
        <div className="text-sm font-medium text-white">{formatPrice(token.priceUsd)}</div>
        <div className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

export default function TokenList({ onTokenSelect }) {
  const {
    activeTab, setActiveTab, searchQuery, setSearchQuery,
    trendingTokens, setTrendingTokens,
    newTokens, setNewTokens,
    tokens, setTokens,
    selectedToken, setSelectedToken,
    favorites, toggleFavorite, isFavorite
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [favoriteTokens, setFavoriteTokens] = useState([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [trending, newTkns, popular] = await Promise.all([
        fetchTrendingTokens(),
        fetchNewTokens(),
        fetchMultipleTokens(POPULAR_TOKENS.map(t => t.address))
      ])

      setTrendingTokens(trending.length > 0 ? trending : popular)
      setNewTokens(newTkns)

      const allTokens = [...trending, ...newTkns, ...popular]
      const uniqueTokens = Array.from(
        new Map(allTokens.map(t => [t.address, t])).values()
      )
      setTokens(uniqueTokens)
    } catch (error) {
      console.error('Error loading data:', error)
      const popular = await fetchMultipleTokens(POPULAR_TOKENS.map(t => t.address))
      setTrendingTokens(popular)
      setTokens(popular)
    }
    setLoading(false)
  }, [setTrendingTokens, setNewTokens, setTokens])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Load favorite tokens data
  useEffect(() => {
    const loadFavorites = async () => {
      if (favorites.length === 0) {
        setFavoriteTokens([])
        return
      }
      const addresses = favorites.map(f => f.address)
      const tokenData = await fetchMultipleTokens(addresses)
      setFavoriteTokens(tokenData)
    }
    loadFavorites()
  }, [favorites])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const searchDebounce = setTimeout(async () => {
      setSearching(true)
      try {
        const query = searchQuery.trim()
        // Check if it's a Solana address (32-44 chars, base58)
        const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query)

        if (isSolanaAddress) {
          // Fetch specific token by address
          const tokenData = await fetchTokenData(query)
          setSearchResults(tokenData ? [tokenData] : [])
        } else {
          const results = await searchTokens(query)
          setSearchResults(results)
        }
      } catch (error) {
        console.error('Search error:', error)
      }
      setSearching(false)
    }, 300)

    return () => clearTimeout(searchDebounce)
  }, [searchQuery])

  const displayTokens = searchQuery.trim()
    ? searchResults
    : activeTab === 'trending'
      ? trendingTokens
      : activeTab === 'new'
        ? newTokens
        : favoriteTokens

  return (
    <div className="flex flex-col h-full bg-[#0e0e12]">
      {/* Search */}
      <div className="p-3 border-b border-[#1e1e26] shrink-0">
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-[#16161d] border border-[#2a2a36] rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3a3a46]"
        />
      </div>

      {/* Tabs */}
      {!searchQuery && (
        <div className="flex border-b border-[#1e1e26] shrink-0">
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors relative
                      ${activeTab === 'trending' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Trending
            {activeTab === 'trending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9945FF]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors relative
                      ${activeTab === 'new' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            New
            {activeTab === 'new' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#14F195]"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors relative
                      ${activeTab === 'favorites' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Favorites
            {favorites.length > 0 && (
              <span className="ml-1 text-[10px] text-yellow-500">({favorites.length})</span>
            )}
            {activeTab === 'favorites' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-500"></div>
            )}
          </button>
        </div>
      )}

      {/* Token List - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading || searching ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 border-b border-[#1e1e26]">
              <div className="w-8 h-8 rounded-full bg-[#1e1e26] animate-pulse"></div>
              <div className="flex-1">
                <div className="h-3.5 w-16 bg-[#1e1e26] rounded animate-pulse mb-1.5"></div>
                <div className="h-3 w-24 bg-[#1e1e26] rounded animate-pulse"></div>
              </div>
              <div className="text-right">
                <div className="h-3.5 w-14 bg-[#1e1e26] rounded animate-pulse mb-1.5"></div>
                <div className="h-3 w-10 bg-[#1e1e26] rounded animate-pulse"></div>
              </div>
            </div>
          ))
        ) : displayTokens.length > 0 ? (
          displayTokens.map((token) => (
            <TokenRow
              key={token.address}
              token={token}
              isSelected={selectedToken?.address === token.address}
              isFavorite={isFavorite(token.address)}
              onToggleFavorite={toggleFavorite}
              onClick={() => {
                setSelectedToken(token)
                onTokenSelect?.()
              }}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            {searchQuery ? 'No tokens found' : activeTab === 'favorites' ? 'No favorites yet' : 'No tokens available'}
          </div>
        )}
      </div>

      {/* Refresh */}
      <div className="p-2 border-t border-[#1e1e26] shrink-0">
        <button
          onClick={loadData}
          disabled={loading}
          className="w-full py-2 text-xs text-gray-400 hover:text-white border border-[#2a2a36] hover:border-[#3a3a46] rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}
