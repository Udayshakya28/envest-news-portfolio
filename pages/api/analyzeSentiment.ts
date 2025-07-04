// pages/api/analyzeSentiment.ts
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Change to 'gpt-4' if needed and available
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    const result = completion.choices[0].message.content?.trim()

    res.status(200).json({ analysis: result })
 } catch (error: unknown) {
  console.error('OpenAI API error:', error);

  let errorMessage = 'Unknown error';
  if (error instanceof Error) {
    errorMessage = error.message;
  }

  res.status(500).json({
    error: 'Failed to analyze sentiment with OpenAI',
    details: errorMessage,
  });
}
}
