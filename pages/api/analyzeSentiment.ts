import { NextApiRequest, NextApiResponse } from 'next'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { headline, ticker } = req.body
  if (!headline || !ticker) {
    return res.status(400).json({ error: 'Missing headline or ticker' })
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' }) // ✅ Correct
    const prompt = `
You are a financial news analyst AI. Analyze the following headline and provide a detailed report in four sections:

1. 📊 Market Summary:
2. 💡 Investment Advice:
3. 🔮 Future Outlook:
4. 📈 Sentiment Impact:

Headline: "${headline}" — Stock: ${ticker}
    `.trim()

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ analysis: text })
  } catch (error: any) {
    console.error('Gemini API error:', error)
    res.status(500).json({
      error: 'Failed to analyze sentiment',
      details: error?.message || 'Unknown error',
    })
  }
}
