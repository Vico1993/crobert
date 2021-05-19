import * as dotenv from 'dotenv'
import { Context, Telegraf } from 'telegraf'
import * as LocalSession from 'telegraf-session-local'

import { getCoins, getCurrentPrice } from './coins'

// Load process.env in Typescript
dotenv.config()

// Define your own context type
interface BotContext extends Context {
    username: string
    session: {
        currency: string
    }
}

const bot = new Telegraf<BotContext>(process.env.TELEGRAM_TOKEN)

// Use a local DB in JSON for extra information like the currencies
bot.use(new LocalSession({ database: 'bot_db.json' }).middleware())

bot.use((ctx: BotContext, next) => {
    // Save username
    ctx.username = ctx.message.from.first_name

    // If no currency choose by user set a default
    if (!ctx.session.currency) {
        ctx.session.currency = 'CAD'
    }

    return next()
})

bot.start((ctx: BotContext) => {
    ctx.replyWithMarkdownV2('Hello *' + ctx.username + '*, give me a crypto')
})

bot.hears(/hi|hello|hey/i, (ctx) => {
    ctx.replyWithMarkdownV2('Hey there *' + ctx.username + '*, how your portfolio is doing today')
})

bot.help(async (ctx) => {
    await ctx.replyWithMarkdownV2(`Here is how I can help you\\.`)

    await ctx.replyWithMarkdownV2(
        `I can give you the price of a cryptocurrencies at some point\\. Just send me:`,
    )

    await ctx.replyWithMarkdownV2(`\`!price {cryptoCode1} {cryptoCode2} \\.\\.\\.\``)

    await ctx.replyWithMarkdownV2(`For example: \`!price ETH BTC\` `)

    await ctx.replyWithMarkdownV2(
        `For any command you can give me an extra parameters with a specific currency with this tag \`currencie:CAD\``,
    )
})

// @todo: find a better way to have a list of Crypto
bot.hears(/!price [\w| ]*/i, async (ctx) => {
    const message = ctx.message.text
    const currency = ctx.session.currency

    await ctx.reply('fetching my db...')

    try {
        const quotes = await getCoins({
            symbols: [...message.split(' ')].splice(1, 6),
            currencies: currency,
        })

        for (const key in quotes.data) {
            const data = quotes.data[key]

            await ctx.reply(`*${data.name}*: ${getCurrentPrice(data, currency)}`, {
                parse_mode: 'MarkdownV2',
            })
        }
    } catch (error) {
        console.error(error)

        await ctx.reply(`Oops something happened.. Can't find it.`)
    }
})

/**
 * Update Currency
 */
bot.hears(/!currency [\w]*/i, async (ctx) => {
    const message = ctx.message.text
    const newCurrency = message.split(' ').splice(1, 1).shift()

    if (newCurrency === ctx.session.currency) {
        ctx.reply(`Hum\\.\\.\\. you are already set for ${newCurrency}`, {
            parse_mode: 'MarkdownV2',
        })
    }
    await ctx.reply(`Switched *${ctx.session.currency}* for *${newCurrency}*`, {
        parse_mode: 'MarkdownV2',
    })

    ctx.session.currency = newCurrency
})

// @todo: Send Error message if not valid currency
// @todo: TOP Winner ? loose ?
// @todo: News ?

bot.launch()

console.log(`I'm listening...`)

// Enable graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'))
