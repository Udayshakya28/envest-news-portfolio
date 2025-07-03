// pages/api/analyzeSentiment.ts
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
console.log('🔑 API Key:', process.env.OPENAI_API_KEY ? 'Exists' : 'Missing')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { headline, ticker } = req.body

  if (!headline || !ticker) {
    return res.status(400).json({ error: 'Missing headline or ticker' })
  }

  try {
    const prompt = `
You are a financial news analyst AI. Analyze the following headline and provide a detailed report in four sections:

1. 📊 Market Summary: Briefly summarize what this headline implies about the overall market or the specific stock (${ticker}).
2. 💡 Investment Advice: Offer concise advice for investors — for example, "Hold", "Watch closely", "Buy on dips", or "Avoid for now".
3. 🔮 Future Outlook: Predict the possible short-term direction (e.g., bullish, bearish, volatile, stable) for ${ticker} based on this news.
4. 📈 Sentiment Impact: Choose one of [Positive, Negative, Neutral] to indicate the direct impact of the news on ${ticker}.

Headline:
"${headline}"

Format the output exactly with numbered sections as instructed.
    `.trim()

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a financial sentiment assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    })
    
    console.log('🔑 API Key:', process.env.OPENAI_API_KEY ? 'Exists' : 'Missing')
    
    
    const analysis = completion.choices[0].message.content?.trim() ?? 'Analysis not available.'
    console.log('🔍 OpenAI Completion:', analysis)
    res.status(200).json({ analysis })
  } catch (error) {
    console.error('OpenAI API error:', error)
    res.status(500).json({ error: 'Failed to analyze sentiment' })
  }
}
