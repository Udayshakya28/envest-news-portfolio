import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'
import Parser from 'rss-parser'

const parser = new Parser()

const headers = {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
const headlines: { title: string; link: string }[] = []

// Moneycontrol
try {
const { data } = await axios.get('https://www.moneycontrol.com/news/business/markets/', { headers })
const $ = cheerio.load(data)
$('li.clearfix').each((_, el) => {
const title = $(el).find('h2').text().trim()
const link = $(el).find('a').attr('href') || ''
if (title && link) {
headlines.push({ title, link })
}
})
} catch (err) {
console.error('❌ Moneycontrol scraping failed:', err)
}

// Economic Times
try {
const { data } = await axios.get('https://economictimes.indiatimes.com/markets', { headers })
const $ = cheerio.load(data)
$('ul.data-list li a').each((_, el) => {
const title = $(el).text().trim()
const link = $(el).attr('href') || ''
if (title && link) {
headlines.push({
title,
link: link.startsWith('http') ? link: link.startsWith('http') ? link : `https://economictimes.indiatimes.com${link}`
})
}
})
} catch (err) {
console.error('❌ Economic Times scraping failed:', err)
}

// LiveMint
try {
const { data } = await axios.get('https://www.livemint.com/market', { headers })
const $ = cheerio.load(data)
$('div.listingNews a').each((_, el) => {
const title = $(el).text().trim()
const link = $(el).attr('href') || ''
if (title && link) {
headlines.push({
title,
link: link.startsWith('http') ? link : `https://www.livemint.com${link}`
})
}
})
} catch (err) {
console.error('❌ LiveMint scraping failed:', err)
}

// Business Standard
try {
const { data } = await axios.get('https://www.business-standard.com/category/markets/news', { headers })
const $ = cheerio.load(data)
$('div.listing-txt a').each((_, el) => {
const title = $(el).text().trim()
const link = $(el).attr('href') || ''
if (title && link) {
headlines.push({
title,
link: link.startsWith('http') ? link : `https://www.business-standard.com${link}`
})
}
})
} catch (err) {
console.error('❌ Business Standard scraping failed:', err)
}

// Google News RSS (fallback)
try {
const feed = await parser.parseURL('https://news.google.com/rss/search?q=indian+stock+market')
feed.items.forEach((item) => {
if (item.title && item.link) {
headlines.push({ title: item.title, link: item.link })
}
})
} catch (err) {
console.error('❌ Google News RSS failed:', err)
}

if (headlines.length === 0) {
res.status(500).json({ error: 'No headlines fetched from any source.' })
} else {
res.status(200).json({ headlines })
}
}