import { Context, Telegraf } from 'telegraf'
import * as dotenv from 'dotenv'

import { getCoins, getCurrentPrice } from './coins'

// Load process.env in Typescript
dotenv.config()

// Define your own context type
interface BotContext extends Context {
    username: string
    currencies?: string
}

const bot = new Telegraf<BotContext>(process.env.TELEGRAM_TOKEN)

// Register middleware and launch your bot as usual
bot.use((ctx: BotContext, next) => {
    // Save username
    ctx.username = ctx.message.from.first_name

    // DEBUG
    console.log('Someone try to talk to me - ', ctx.message.from.first_name)

    return next()
})

bot.start((ctx: BotContext) => {
    ctx.replyWithMarkdownV2('Hello *' + ctx.username + '*, give me a crypto')
})

bot.hears('hi', (ctx) => {
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

    await ctx.reply('fetching my db...')

    try {
        const quotes = await getCoins({
            symbols: [...message.split(' ')].splice(1, 6),
        })

        for (const key in quotes.data) {
            const data = quotes.data[key]

            await ctx.reply(`*${data.name}*: ${getCurrentPrice(data, 'CAD')}`, {
                parse_mode: 'MarkdownV2',
            })
        }
    } catch (error) {
        console.error(error)

        await ctx.reply(`Oops something happened.. Can't find it.`)
    }
})

// @todo: TOP Winner ? loose ?
// @todo: News ?

bot.launch()

console.log(`I'm listening...`)

// Enable graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'))
