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

// Bot initialisation
const bot = new Telegraf<BotContext>(process.env.TELEGRAM_TOKEN)

/**
 * Welcome message
 *
 * @param {BotContext} ctx
 */
const welcome = (ctx: BotContext) => {
    ctx.replyWithMarkdownV2('Hey there *' + ctx.username + '*, how your portfolio is doing today')
}

// Use a local DB in JSON for extra information like the currencies
bot.use(new LocalSession({ database: 'bot_db.json' }).middleware())
bot.use(async (ctx: BotContext, next) => {
    // Save username
    ctx.username = ctx.message.from.first_name

    // If no currency choose by user set a default
    if (!ctx.session.currency) {
        ctx.session.currency = 'CAD'
    }

    try {
        await next()
    } catch (error) {
        console.log(error)

        const currencyRegex = new RegExp(ctx.session.currency, 'g')
        const errorMessage = error.message as string

        // Check if the error message is because of the currency
        if (errorMessage.match(currencyRegex)) {
            await ctx.reply(
                `Sorry but I don't understand your currency: *${ctx.session.currency}*`,
                {
                    parse_mode: 'MarkdownV2',
                },
            )
        } else {
            await ctx.reply(`Oops something happened.. Can't find it.`)
        }
    }
})

// Welcome + Hi message regroup
bot.start(welcome)
bot.hears(/hi|hello|hey/i, welcome)

bot.help(async (ctx) => {
    await ctx.replyWithMarkdownV2(`Here is how I can help you\\.`)

    await ctx.replyWithMarkdownV2(
        `I can give you the price of a cryptocurrencies at some point\\. Just send me:`,
    )

    await ctx.replyWithMarkdownV2(`\`!price {cryptoCode1} {cryptoCode2} \\.\\.\\.\``)
    await ctx.replyWithMarkdownV2(`For example: \`!price ETH BTC\` `)

    await ctx.replyWithMarkdownV2(
        `Don't forget to give me your currency, by default I returned *CAD*`,
    )

    await ctx.replyWithMarkdownV2(`\`!currency {currencyCode}\``)
    await ctx.replyWithMarkdownV2(`For example: \`!currency CAD\` `)
})

// @todo: find a better way to have a list of Crypto
bot.hears(/!price [\w| ]*/i, async (ctx) => {
    const message = ctx.message.text
    const currency = ctx.session.currency

    await ctx.reply('fetching my db...')

    const quotes = await getCoins({
        symbols: [...message.split(' ')].splice(1, 6),
        currencies: currency,
    })

    // Doesn't seems to throw an error when receive a 400
    // @todo: Check why no error when receive a 400
    if (quotes.status.error_code == 400 && quotes.status.error_message !== '') {
        throw new Error(quotes.status.error_message)
    }

    for (const key in quotes.data) {
        const data = quotes.data[key]

        await ctx.reply(
            `<b>${data.name}</b>

<b>Price</b>: ${getCurrentPrice(data, currency)}
<b>1h</b>: ${data.quote[currency].percent_change_1h} %
<b>24h</b>: ${data.quote[currency].percent_change_24h} %`,
            {
                parse_mode: 'HTML',
            },
        )
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
