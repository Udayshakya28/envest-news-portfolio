import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, headline, sentiment } = req.body

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ALERT_EMAIL,
      pass: process.env.ALERT_PASSWORD
    }
  })

  const mailOptions = {
    from: process.env.ALERT_EMAIL,
    to: email,
    subject: `📢 Stock Alert: ${sentiment} News`,
    html: `<h3>${headline}</h3><p>This news was marked as: <strong>${sentiment}</strong></p>`
  }

  try {
    await transporter.sendMail(mailOptions)
    res.status(200).json({ message: 'Email sent' })
  } catch (error) {
    res.status(500).json({ error: 'Email failed' })
  }
}
