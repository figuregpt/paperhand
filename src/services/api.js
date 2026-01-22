const DEXSCREENER_API = 'https://api.dexscreener.com/latest'

export const POPULAR_TOKENS = [
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'Bonk' },
  { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter' },
  { address: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', symbol: 'POPCAT', name: 'Popcat' },
  { address: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', symbol: 'MEW', name: 'cat in a dogs world' },
  { address: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', symbol: 'BOME', name: 'BOOK OF MEME' },
  { address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF', name: 'dogwifhat' },
  { address: 'A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump', symbol: 'FARTCOIN', name: 'Fartcoin' },
  { address: 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump', symbol: 'GOAT', name: 'Goatseus Maximus' },
  { address: 'GJAFwWjJ3vnTsrQVabjBVK2TYB1YtRCQXRDfDgUnpump', symbol: 'ACT', name: 'Act I : The AI Prophecy' },
  { address: '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump', symbol: 'PNUT', name: 'Peanut the Squirrel' },
  { address: 'ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY', symbol: 'MOODENG', name: 'Moo Deng' },
  { address: 'Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs', symbol: 'GRASS', name: 'Grass' },
]

export const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null || num === 0) return '0'
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K'
  if (num < 0.00001) return num.toExponential(2)
  return num.toFixed(decimals)
}

export const formatPrice = (price) => {
  if (!price) return '$0'
  if (price >= 1) return '$' + price.toFixed(2)
  if (price >= 0.01) return '$' + price.toFixed(4)
  if (price >= 0.0001) return '$' + price.toFixed(6)
  if (price >= 0.00000001) return '$' + price.toFixed(10)
  // For very small numbers, show subscript notation like $0.0₅1234
  const str = price.toFixed(20)
  const match = str.match(/^0\.(0+)/)
  if (match) {
    const zeros = match[1].length
    const significant = price.toFixed(zeros + 4).slice(zeros + 2)
    return `$0.0${subscript(zeros)}${significant}`
  }
  return '$' + price.toFixed(10)
}

const subscript = (n) => {
  const subs = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']
  return String(n).split('').map(d => subs[parseInt(d)]).join('')
}

export const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const fetchTokenData = async (address) => {
  try {
    const response = await fetch(`${DEXSCREENER_API}/dex/tokens/${address}`)
    const data = await response.json()

    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]

      // Extract social links
      const socials = pair.info?.socials || []
      const websites = pair.info?.websites || []

      return {
        address: address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        priceUsd: parseFloat(pair.priceUsd) || 0,
        priceChange24h: pair.priceChange?.h24 || 0,
        priceChange1h: pair.priceChange?.h1 || 0,
        priceChange5m: pair.priceChange?.m5 || 0,
        volume24h: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
        marketCap: pair.marketCap || pair.fdv || 0,
        image: pair.info?.imageUrl || `https://dd.dexscreener.com/ds-data/tokens/solana/${address}.png`,
        pairAddress: pair.pairAddress,
        dexId: pair.dexId,
        txns24h: pair.txns?.h24 || { buys: 0, sells: 0 },
        twitter: socials.find(s => s.type === 'twitter')?.url || null,
        telegram: socials.find(s => s.type === 'telegram')?.url || null,
        discord: socials.find(s => s.type === 'discord')?.url || null,
        website: websites[0]?.url || null
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching token:', error)
    return null
  }
}

export const fetchMultipleTokens = async (addresses) => {
  const tokens = await Promise.all(addresses.map(addr => fetchTokenData(addr)))
  return tokens.filter(t => t !== null)
}

export const fetchTrendingTokens = async () => {
  try {
    // Get token addresses from boosts endpoint (just for discovery)
    const response = await fetch('https://api.dexscreener.com/token-boosts/top/v1')
    const boostData = await response.json()

    const solanaAddresses = boostData
      .filter(t => t.chainId === 'solana')
      .map(t => t.tokenAddress)
      .slice(0, 20)

    if (solanaAddresses.length === 0) {
      return fetchMultipleTokens(POPULAR_TOKENS.map(t => t.address))
    }

    // Fetch actual token data
    const tokens = await fetchMultipleTokens(solanaAddresses)

    // Sort by 24h volume (organic ranking)
    tokens.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))

    return tokens.length > 0 ? tokens : fetchMultipleTokens(POPULAR_TOKENS.map(t => t.address))
  } catch (error) {
    console.error('Error fetching trending tokens:', error)
    return fetchMultipleTokens(POPULAR_TOKENS.map(t => t.address))
  }
}

export const fetchNewTokens = async () => {
  try {
    // Use token profiles endpoint for recently updated tokens
    const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1')
    const data = await response.json()

    if (Array.isArray(data)) {
      const solanaTokens = data.filter(t => t.chainId === 'solana').slice(0, 10)

      // Batch fetch with delays
      const detailedTokens = []
      const batchSize = 5

      for (let i = 0; i < solanaTokens.length; i += batchSize) {
        const batch = solanaTokens.slice(i, i + batchSize)
        const batchResults = await Promise.all(
          batch.map(async (t) => {
            const tokenData = await fetchTokenData(t.tokenAddress)
            if (tokenData) {
              return { ...tokenData, isNew: true }
            }
            return null
          })
        )
        detailedTokens.push(...batchResults.filter(t => t !== null))
        if (i + batchSize < solanaTokens.length) {
          await new Promise(r => setTimeout(r, 100))
        }
      }

      return detailedTokens
    }
    return []
  } catch (error) {
    console.error('Error fetching new tokens:', error)
    return []
  }
}

export const searchTokens = async (query) => {
  try {
    const response = await fetch(`${DEXSCREENER_API}/dex/search?q=${encodeURIComponent(query)}`)
    const data = await response.json()

    if (data.pairs) {
      const solanaPairs = data.pairs
        .filter(pair => pair.chainId === 'solana')
        .slice(0, 20)

      const seen = new Set()
      const uniqueTokens = []

      for (const pair of solanaPairs) {
        if (!seen.has(pair.baseToken.address)) {
          seen.add(pair.baseToken.address)
          uniqueTokens.push({
            address: pair.baseToken.address,
            symbol: pair.baseToken.symbol,
            name: pair.baseToken.name,
            priceUsd: parseFloat(pair.priceUsd) || 0,
            priceChange24h: pair.priceChange?.h24 || 0,
            priceChange1h: pair.priceChange?.h1 || 0,
            volume24h: pair.volume?.h24 || 0,
            liquidity: pair.liquidity?.usd || 0,
            marketCap: pair.marketCap || pair.fdv || 0,
            image: pair.info?.imageUrl || `https://dd.dexscreener.com/ds-data/tokens/solana/${pair.baseToken.address}.png`
          })
        }
      }

      return uniqueTokens
    }
    return []
  } catch (error) {
    console.error('Error searching tokens:', error)
    return []
  }
}
