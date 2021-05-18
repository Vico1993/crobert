import * as CoinMarketCap from 'coinmarketcap-api'
import * as dotenv from 'dotenv';

dotenv.config();

const client = new CoinMarketCap(process.env.API_KEY)

client.getTickers().then(console.log).catch(console.error)