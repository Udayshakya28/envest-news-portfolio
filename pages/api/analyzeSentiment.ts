import { NextApiRequest, NextApiResponse } from 'next'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { headline, ticker } = req.body

  if (!headline || !ticker) {
    return res.status(400).json({ error: 'Missing headline or ticker' })
  }

  const prompt = `
You are a financial news analyst AI. Analyze the headline below and provide a structured report with the following sections:

1. 📊 Market Summary:
2. 💡 Investment Advice:
3. 🔮 Future Outlook:
4. 📈 Sentiment Impact (Positive, Neutral, or Negative):

Headline: "${headline}" — Stock: ${ticker}
`.trim()

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const analysis = response.text()

    res.status(200).json({ analysis })
  } catch (error: unknown) {
    console.error('Gemini API error:', error)

    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    res.status(500).json({
      error: 'Failed to analyze sentiment with Gemini AI',
      details: errorMessage,
    })
  }
}