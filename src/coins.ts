import * as CoinMarketCap from 'coinmarketcap-api'
import * as dotenv from 'dotenv'
import * as yup from 'yup'
import * as currencyFormatter from 'currency-formatter'

import { coinFilter, cmcQuotesResponse, coin } from './types'

// Load process.env in Typescript
dotenv.config()

const client = new CoinMarketCap(process.env.API_KEY)

/**
 * Validate symbols and currencies to be what we expect
 */
const coinsFilterValidation: yup.SchemaOf<coinFilter> = yup.object({
    currencies: yup.string().default('CAD'),
    symbols: yup
        .array()
        .transform(function (value: string[], originalValue: string) {
            // If already an array
            if (this.isType(value) && value !== null) {
                return value
            }

            return originalValue ? originalValue.split(/,/) : []
        })
        .of(yup.string()),
})

/**
 * @param {coinFilter} params
 */
export const getCoins = async (params: coinFilter): Promise<cmcQuotesResponse> => {
    let data: coinFilter
    try {
        data = await coinsFilterValidation.validate(params)
    } catch (error) {
        console.error('Validation failed', error)

        return
    }

    return (await client.getQuotes({
        symbol: data.symbols,
        convert: data.currencies,
    })) as cmcQuotesResponse
}

/**
 * Helper method to return only current crypto price
 *
 * @param {coin} crypto Information return by CMC
 * @param {string} currency
 * @returns {string}
 */
export const getCurrentPrice = (crypto: coin, currency: string): string => {
    return currencyFormatter.format(crypto.quote[currency].price, {
        code: currency,
        thousand: ',',
        decimal: '.',
    })
}
