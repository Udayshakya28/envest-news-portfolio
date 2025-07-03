'use client'

import stockMap from '../utils/stockMap'
import { getSentiment } from '../utils/analyzeSentiment'
import { useEffect, useState } from 'react'
import axios from 'axios'

type Headline = {
  title: string
  link: string
}

export default function Home() {
  const [portfolio, setPortfolio] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [news, setNews] = useState<Headline[]>([])
type TaggedHeadline = Headline & { matchedStocks: string[] }
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
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-6">
      <h1 className="text-3xl font-bold">Smart News + Portfolio Insights</h1>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter stock (e.g., TCS or Infosys)"
          className="px-4 py-2 text-black rounded"
        />
        <button onClick={handleAddStock} className="bg-blue-600 px-4 py-2 rounded">
          Add Stock
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mt-4">Your Portfolio:</h2>
        <p className="text-yellow-400">{portfolio.join(', ') || 'None'}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mt-4">Filtered News:</h2>
        {filteredNews.length === 0 ? (
          <p className="text-gray-400">No matching news found.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-4">
            {filteredNews.map((item, idx) => (
              <li key={idx}>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  {item.title}
                </a>
              <SentimentTag title={item.title} portfolio={item.matchedStocks} />

              </li>
            ))}
          </ul>
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
    const analyze = async () => {
      for (const stock of portfolio) {
        try {
          const result = await getSentiment(title, stock)
          if (cancelled || !result) return

          // Extract all 4 sections
          const summary = result.match(/1\.\s*📊.*?:([\s\S]*?)2\./)?.[1]?.trim()
          const advice = result.match(/2\.\s*💡.*?:([\s\S]*?)3\./)?.[1]?.trim()
          const outlook = result.match(/3\.\s*🔮.*?:([\s\S]*?)4\./)?.[1]?.trim()
          const sentiment = result.match(/4\.\s*📈.*?:([\s\S]*)$/)?.[1]?.trim()

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
    return () => {
      cancelled = true
    }
  }, [title, portfolio])

  if (!sections) return <p className="text-gray-400">🧠 Analyzing...</p>

  return (
    <div className="mt-1 text-sm text-gray-300 space-y-1 border border-gray-600 p-2 rounded bg-gray-800">
      {sections.summary && <p>📊 <strong>Market Summary:</strong> {sections.summary}</p>}
      {sections.advice && <p>💡 <strong>Investment Advice:</strong> {sections.advice}</p>}
      {sections.outlook && <p>🔮 <strong>Future Outlook:</strong> {sections.outlook}</p>}
      {sections.sentiment && (
        <p className={
          `📈 Sentiment Impact: ${sections.sentiment}`.includes('Positive') ? 'text-green-400' :
          `📈 Sentiment Impact: ${sections.sentiment}`.includes('Negative') ? 'text-red-400' :
          'text-yellow-400'
        }>
          📈 <strong>Sentiment Impact:</strong> {sections.sentiment}
        </p>
      )}
    </div>
  )
}



