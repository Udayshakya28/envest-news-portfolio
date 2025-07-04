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
  const [filteredNews, setFilteredNews] = useState<TaggedHeadline[]>([])

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

  useEffect(() => {
    const filtered: TaggedHeadline[] = news.map(headline => {
      const matchedStocks = portfolio.filter(ticker => {
        const keywords = stockMap[ticker] || [ticker]
        return keywords.some(keyword =>
          headline.title.toLowerCase().includes(keyword.toLowerCase())
        )
      })
      return matchedStocks.length > 0
        ? { ...headline, matchedStocks }
        : null
    }).filter(Boolean) as TaggedHeadline[]

    setFilteredNews(filtered)
  }, [news, portfolio])

  const handleAddStock = () => {
    const stock = input.trim().toUpperCase()
    if (stock !== '' && !portfolio.includes(stock)) {
      setPortfolio(prev => [...prev, stock])
      setInput('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Smart News + Portfolio Insights</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter stock (e.g., TCS or Infosys)"
          className="px-4 py-2 text-black rounded"
        />
        <button onClick={handleAddStock} className="bg-blue-600 px-4 py-2 rounded">Add Stock</button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Your Portfolio:</h2>
        <p className="text-yellow-400">{portfolio.join(', ') || 'None'}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Filtered News:</h2>
        {filteredNews.length === 0 ? (
          <p className="text-gray-400">No matching news found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNews.map((item, idx) => (
              <div key={idx} className="bg-gray-800 p-4 rounded-xl shadow-lg">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-lg font-semibold">
                  {item.title}
                </a>
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.matchedStocks.map(stock => (
                    <span key={stock} className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">📈 {stock}</span>
                  ))}
                </div>
                <SentimentTag title={item.title} portfolio={item.matchedStocks} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SentimentTag({ title, portfolio }: { title: string; portfolio: string[] }) {
  const [sections, setSections] = useState<{
    summary?: string
    advice?: string
    outlook?: string
    sentiment?: string
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    const analyze = async () => {
      for (const stock of portfolio) {
        try {
          const result = await getSentiment(title, stock)
          if (cancelled || !result) return

          const summary = result.match(/1\..*?:([\s\S]*?)2\./)?.[1]?.trim()
          const advice = result.match(/2\..*?:([\s\S]*?)3\./)?.[1]?.trim()
          const outlook = result.match(/3\..*?:([\s\S]*?)4\./)?.[1]?.trim()
          const sentiment = result.match(/4\..*?:([\s\S]*)$/)?.[1]?.trim()

          if (summary || advice || outlook || sentiment) {
            setSections({ summary, advice, outlook, sentiment })
            return
          }
        } catch (err) {
          console.error(`Error analyzing sentiment for "${title}"`, err)
        }
      }

      if (!cancelled) {
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
    <div className="mt-3 text-sm text-gray-300 space-y-1">
      {sections.summary && <p>📊 <strong>Market Summary:</strong> {sections.summary}</p>}
      {sections.advice && <p>💡 <strong>Investment Advice:</strong> {sections.advice}</p>}
      {sections.outlook && <p>🔮 <strong>Future Outlook:</strong> {sections.outlook}</p>}
      {sections.sentiment && (
        <p className={
          sections.sentiment.includes('Positive') ? 'text-green-400' :
          sections.sentiment.includes('Negative') ? 'text-red-400' :
          'text-yellow-400'
        }>
          📈 <strong>Sentiment Impact:</strong> {sections.sentiment}
        </p>
      )}
    </div>
  )
}
