'use client'

import stockMap from '../utils/stockMap'
import { getSentiment } from '../utils/analyzeSentiment'
import { useEffect, useState } from 'react'
import axios from 'axios'

type Headline = {
  title: string
  link: string
}

type TaggedHeadline = Headline & { matchedStocks: string[] }

export default function Home() {
  const [portfolio, setPortfolio] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [news, setNews] = useState<Headline[]>([])

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get('/api/scrapeNews')
        setNews(res.data.headlines || [])
      } catch (err) {
        console.error('Error fetching news:', err)
      }
    }
    fetchNews()
  }, [])

  const handleAddStock = () => {
    const stock = input.trim().toUpperCase()
    if (stock !== '' && !portfolio.includes(stock)) {
      setPortfolio(prev => [...prev, stock])
      setInput('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-6">
        Envest Smart News + Portfolio Insights
      </h1>

      <div className="flex gap-2 mb-6">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter stock (e.g., NIFTY or PNB)"
          className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
        />
        <button
          onClick={handleAddStock}
          className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg"
        >
          Add Stock
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Your Portfolio:</h2>
        {portfolio.length === 0 ? (
          <p className="text-gray-400">No stocks added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {portfolio.map((stock, i) => (
              <span
                key={i}
                className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium border border-yellow-400"
              >
                {stock}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl text-center font-semibold mb-4">Filtered News by Stock:</h2>
        {portfolio.length === 0 ? (
          <p className="text-gray-400 text-center">Add stocks to see filtered news.</p>
        ) : (
          <div className="space-y-10">
            {portfolio.map(stock => {
              const matched = news.filter(headline => {
                const keywords = stockMap[stock] || [stock]
                return keywords.some(keyword =>
                  headline.title.toLowerCase().includes(keyword.toLowerCase())
                )
              })

              if (matched.length === 0) return null

              return (
                <div key={stock}>
                  <h3 className="text-2xl font-bold text-blue-400 mb-4 border-b border-gray-700 pb-2">
                     {stock}
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matched.map((headline, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-800 border border-gray-700 rounded-2xl shadow-md hover:shadow-2xl hover:border-blue-500 transition-all duration-300 p-5"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-white">{headline.title}</h3>
                            <a
                              href={headline.link}
                              target="_blank"
                              className="text-sm text-blue-400 hover:text-blue-300 underline"
                            >
                              🔗 Read more
                            </a>
                          </div>
                          <div className="text-2xl">{stock[0] || '📈'}</div>
                        </div>
                        <SentimentTag title={headline.title} portfolio={[stock]} />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


function SentimentTag({
  title,
  portfolio
}: {
  title: string
  portfolio: string[]
}) {
  const [sections, setSections] = useState<{
    summary?: string
    advice?: string
    outlook?: string
    sentiment?: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    const analyze = async () => {
      if (portfolio.length === 0) return

      const stock = portfolio[0]

      try {
        await sleep(1000)

        const result = await getSentiment(title, stock)
        if (cancelled || !result) return

        const summary = result.match(/1\..*?:([\s\S]*?)2\./)?.[1]?.trim()
        const advice = result.match(/2\..*?:([\s\S]*?)3\./)?.[1]?.trim()
        const outlook = result.match(/3\..*?:([\s\S]*?)4\./)?.[1]?.trim()
        const sentiment = result.match(/4\..*?:([\s\S]*)$/)?.[1]?.trim()

        if (summary || advice || outlook || sentiment) {
          setSections({ summary, advice, outlook, sentiment })
        }
      } catch (err) {
        console.error(`Error analyzing sentiment for "${title}"`, err)
      }

      if (!cancelled && !sections) {
        setSections({
          summary: 'No significant information found.',
          advice: 'Hold',
          outlook: 'Stable',
          sentiment: 'Neutral'
        })
      }
    }

    analyze()
    return () => { cancelled = true }
  }, [title, portfolio])

  if (!sections) return <p className="text-gray-400 mt-2">🧠 Analyzing...</p>

  return (
    <div className="mt-3 text-sm text-gray-300 space-y-1 border border-gray-600 p-3 rounded-xl bg-gray-900/70 shadow-inner">
      {sections.summary && <p>📊 <strong>Market Summary:</strong> {sections.summary}</p>}
      {sections.advice && <p>💡 <strong>Investment Advice:</strong> {sections.advice}</p>}
      {sections.outlook && <p>🔮 <strong>Future Outlook:</strong> {sections.outlook}</p>}
      {sections.sentiment && (
        <p className={
          sections.sentiment.includes('Positive') ? 'text-green-400' :
          sections.sentiment.includes('Negative') ? 'text-red-400' :
          'text-yellow-300'
        }>
          📈 <strong>Sentiment Impact:</strong> {sections.sentiment}
        </p>
      )}
    </div>
  )
}
