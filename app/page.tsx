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
    <div className="min-h-screen bg-gray-900 text-white p-6 ">
      <h1 className="text-3xl font-bold text-center mb-4"> Envest Smart News + Portfolio Insights</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter stock (e.g., PNB or NIFTY)"
          className="px-4 py-2 text-white rounded"
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
  {filteredNews.map((item, idx) => (
    <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-5 hover:shadow-xl transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
          <a href={item.link} target="_blank" className="text-sm text-blue-400 underline">
            Read more
          </a>
        </div>
        <div className="text-2xl">{item.matchedStocks[0]?.[0] || '📈'}</div>
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

      const stock = portfolio[0] // Only analyze for first matched stock

      try {
        await sleep(1000) // Delay to reduce API load

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
    <div className="mt-3 text-sm text-gray-300 space-y-1 border border-gray-600 p-2 rounded bg-gray-800">
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
