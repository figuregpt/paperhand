import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const INITIAL_BALANCE = 10000

const useStore = create(
  persist(
    (set, get) => ({
      balance: INITIAL_BALANCE,
      holdings: [],
      transactions: [],
      portfolioHistory: [{ timestamp: Date.now(), totalValue: INITIAL_BALANCE }],
      favorites: [],

      selectedToken: null,
      searchQuery: '',
      activeTab: 'trending',

      tokens: [],
      trendingTokens: [],
      newTokens: [],

      setSelectedToken: (token) => set({ selectedToken: token }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setTokens: (tokens) => set({ tokens }),
      setTrendingTokens: (tokens) => set({ trendingTokens: tokens }),
      setNewTokens: (tokens) => set({ newTokens: tokens }),

      toggleFavorite: (token) => {
        const { favorites } = get()
        const exists = favorites.find(f => f.address === token.address)
        if (exists) {
          set({ favorites: favorites.filter(f => f.address !== token.address) })
        } else {
          set({ favorites: [...favorites, {
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            image: token.image
          }] })
        }
      },

      isFavorite: (address) => {
        const { favorites } = get()
        return favorites.some(f => f.address === address)
      },

      buyToken: (token, amount, price, slippage = 0.5) => {
        const { balance, holdings, transactions } = get()
        const slippageMultiplier = 1 + (slippage / 100)
        const effectivePrice = price * slippageMultiplier
        const total = amount * effectivePrice

        if (total > balance) {
          return { success: false, error: 'Insufficient balance' }
        }

        const existingHolding = holdings.find(h => h.tokenAddress === token.address)
        let newHoldings

        if (existingHolding) {
          const totalAmount = existingHolding.amount + amount
          const totalCost = (existingHolding.amount * existingHolding.avgBuyPrice) + total
          const newAvgPrice = totalCost / totalAmount

          newHoldings = holdings.map(h =>
            h.tokenAddress === token.address
              ? { ...h, amount: totalAmount, avgBuyPrice: newAvgPrice }
              : h
          )
        } else {
          newHoldings = [...holdings, {
            tokenAddress: token.address,
            symbol: token.symbol,
            name: token.name,
            amount,
            avgBuyPrice: effectivePrice,
            image: token.image
          }]
        }

        const newTransaction = {
          id: Date.now(),
          type: 'BUY',
          tokenAddress: token.address,
          symbol: token.symbol,
          amount,
          price: effectivePrice,
          total,
          timestamp: new Date().toISOString(),
          slippage
        }

        const newBalance = balance - total

        set({
          balance: newBalance,
          holdings: newHoldings,
          transactions: [newTransaction, ...transactions]
        })

        get().updatePortfolioHistory(newTransaction)

        return { success: true, transaction: newTransaction }
      },

      sellToken: (token, amount, price, slippage = 0.5) => {
        const { holdings, balance, transactions } = get()
        const holding = holdings.find(h => h.tokenAddress === token.address)

        if (!holding || holding.amount < amount) {
          return { success: false, error: 'Insufficient token balance' }
        }

        const slippageMultiplier = 1 - (slippage / 100)
        const effectivePrice = price * slippageMultiplier
        const total = amount * effectivePrice

        let newHoldings
        if (holding.amount === amount) {
          newHoldings = holdings.filter(h => h.tokenAddress !== token.address)
        } else {
          newHoldings = holdings.map(h =>
            h.tokenAddress === token.address
              ? { ...h, amount: h.amount - amount }
              : h
          )
        }

        const newTransaction = {
          id: Date.now(),
          type: 'SELL',
          tokenAddress: token.address,
          symbol: token.symbol,
          amount,
          price: effectivePrice,
          total,
          timestamp: new Date().toISOString(),
          slippage,
          pnl: (effectivePrice - holding.avgBuyPrice) * amount
        }

        set({
          balance: balance + total,
          holdings: newHoldings,
          transactions: [newTransaction, ...transactions]
        })

        get().updatePortfolioHistory(newTransaction)

        return { success: true, transaction: newTransaction }
      },

      updatePortfolioHistory: (transaction = null) => {
        const { balance, holdings, tokens, portfolioHistory } = get()

        let totalValue = balance
        holdings.forEach(holding => {
          const token = tokens.find(t => t.address === holding.tokenAddress)
          if (token) {
            totalValue += holding.amount * token.priceUsd
          } else {
            totalValue += holding.amount * holding.avgBuyPrice
          }
        })

        const newEntry = {
          timestamp: Date.now(),
          totalValue,
          transaction: transaction ? {
            type: transaction.type,
            symbol: transaction.symbol,
            total: transaction.total
          } : null
        }

        const updatedHistory = [...portfolioHistory, newEntry].slice(-200)
        set({ portfolioHistory: updatedHistory })
      },

      getTotalPortfolioValue: () => {
        const { balance, holdings, tokens } = get()
        let total = balance

        holdings.forEach(holding => {
          const token = tokens.find(t => t.address === holding.tokenAddress)
          if (token) {
            total += holding.amount * token.priceUsd
          } else {
            total += holding.amount * holding.avgBuyPrice
          }
        })

        return total
      },

      getTotalPnL: () => {
        const { holdings, tokens } = get()
        let totalPnL = 0

        holdings.forEach(holding => {
          const token = tokens.find(t => t.address === holding.tokenAddress)
          if (token) {
            const currentValue = holding.amount * token.priceUsd
            const costBasis = holding.amount * holding.avgBuyPrice
            totalPnL += currentValue - costBasis
          }
        })

        return totalPnL
      },

      resetPortfolio: () => {
        set({
          balance: INITIAL_BALANCE,
          holdings: [],
          transactions: [],
          portfolioHistory: [{ timestamp: Date.now(), totalValue: INITIAL_BALANCE }]
        })
      }
    }),
    {
      name: 'paperhand-storage',
      partialize: (state) => ({
        balance: state.balance,
        holdings: state.holdings,
        transactions: state.transactions,
        portfolioHistory: state.portfolioHistory,
        favorites: state.favorites
      })
    }
  )
)

export default useStore
