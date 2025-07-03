export async function getSentiment(headline: string, ticker: string): Promise<string> {
  try {
    const res = await fetch('/api/analyzeSentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline, ticker }),
    })

    const data = await res.json()
    console.log('🧠 API Response:', data)
    return data.analysis || 'Neutral'  // 👈 Make sure this key matches your API
  } catch (err) {
    console.error('Sentiment fetch error:', err)
    return 'Neutral'
  }
}
