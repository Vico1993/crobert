import {
    getCoins,
    getCurrentPrice
} from './coins'

// Basic example
getCoins({
    symbols: 'ETH,ICP,BTC'
}).then( quotes => {
    for (const key in quotes.data) {
        const data = quotes.data[key]

        console.log(
            data.slug,
            getCurrentPrice(data, 'CAD')
        )
    }
}).catch(console.error)
