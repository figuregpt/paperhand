import { useState } from 'react'
import Header from './components/Header'
import TokenList from './components/TokenList'
import TradePanel from './components/TradePanel'
import Portfolio from './components/Portfolio'
import useStore from './store/useStore'

function App() {
  const [mobileTab, setMobileTab] = useState('tokens')
  const { selectedToken } = useStore()

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0b0b0f]">
      <Header />

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="w-[320px] border-r border-[#1e1e26] overflow-hidden">
          <TokenList />
        </div>
        <div className="flex-1 border-r border-[#1e1e26] overflow-hidden">
          <TradePanel />
        </div>
        <div className="w-[340px] overflow-hidden">
          <Portfolio />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-hidden min-h-0">
          {mobileTab === 'tokens' && <TokenList onTokenSelect={() => setMobileTab('trade')} />}
          {mobileTab === 'trade' && <TradePanel />}
          {mobileTab === 'portfolio' && <Portfolio onTokenSelect={() => setMobileTab('trade')} />}
        </div>

        <nav className="bg-[#111116] border-t border-[#1e1e26] shrink-0 safe-area-bottom">
          <div className="flex">
            <button
              onClick={() => setMobileTab('tokens')}
              className={`flex-1 py-3 text-xs font-medium transition-colors flex flex-col items-center gap-1
                        ${mobileTab === 'tokens' ? 'text-[#9945FF]' : 'text-gray-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tokens
            </button>
            <button
              onClick={() => setMobileTab('trade')}
              className={`flex-1 py-3 text-xs font-medium transition-colors flex flex-col items-center gap-1 relative
                        ${mobileTab === 'trade' ? 'text-green-500' : 'text-gray-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Trade
              {selectedToken && mobileTab !== 'trade' && (
                <span className="absolute top-2 right-1/4 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setMobileTab('portfolio')}
              className={`flex-1 py-3 text-xs font-medium transition-colors flex flex-col items-center gap-1
                        ${mobileTab === 'portfolio' ? 'text-[#9945FF]' : 'text-gray-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
              Portfolio
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default App
