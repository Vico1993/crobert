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
    ctx.reply('Welcome ' + ctx.username)
})

bot.hears('hi', (ctx) => {
    ctx.reply('Hey there *' + ctx.username + '*', { parse_mode: 'MarkdownV2' })
})

// @todo: find a better way to have a list of Crypto
bot.hears(/!price [A-Z]/i, async (ctx) => {
    const message = ctx.message.text

    // ctx.reply('fetching my db...')

    getCoins({
        symbols: [...message.split(' ')].splice(1, 6),
    })
        .then((quotes) => {
            for (const key in quotes.data) {
                const data = quotes.data[key]

                ctx.reply(`*${data.slug}*: ${getCurrentPrice(data, 'CAD')}`, {
                    parse_mode: 'MarkdownV2',
                })
            }
        })
        .catch((error) => {
            console.error(error)

            ctx.reply(`Something came up, and I can't do it... see you later`)
        })
})

// bot.help((ctx) => ctx.reply('Send me a sticker'))
// bot.on('sticker', (ctx) => ctx.reply('👍'))
// bot.launch()

bot.launch()

// Enable graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'))
