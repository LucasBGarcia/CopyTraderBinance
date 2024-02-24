require("dotenv").config();
const WebSocket = require('ws')
const api = require("./api")
const accounts = []

async function loadAccounts() {
    const { listenKey } = await api.connectAccount()
    console.log(`listenKey: ${listenKey}`)
    let i = 1;
    while (process.env[`TRADER${i}_API_KEY`]) {
        accounts.push({
            apiKey: process.env[`TRADER${i}_API_KEY`],
            apiSecret: process.env[`TRADER${i}_API_SECRET`]
        })
        i++
    }
    console.log(`${i - 1} copy accounts loaded`)
    return listenKey
}
function copyTrade(trade) {
    const data = {
        symbol: trade.s,
        side: trade.S,
        type: trade.o
    }
    if (trade.q && parseFloat(trade.q)) {
        data.quantity = trade.q
    }
    if (trade.p && parseFloat(trade.p)) {
        data.price = trade.p
    }
    if (trade.f && trade.f !== "GTC") {
        data.timeInForce = trade.f
    }
    if (trade.P && parseFloat(trade.P)) {
        data.stopPrice = trade.P
    }
    if (trade.Q && parseFloat(trade.Q)) {
        data.quoteOrderQty = trade.Q
    }

    return data;
}

const oldOrders = {}
async function start() {
    const listenKey = await loadAccounts()
    const ws = new WebSocket(`${process.env.BINANCE_WS_URL}/${listenKey}`)
    ws.onmessage = async (event) => {
        const trade = JSON.parse(event.data)
        if (trade.e === 'executionReport' && !oldOrders[trade.i]) {
            oldOrders[trade.i] = true
            console.clear()
            console.log(trade)
            const data = copyTrade(trade)

            console.log('data', data)
            const promises = accounts.map(acc => api.newOrder(data, acc.apiKey, acc.apiSecret))
            const results = await Promise.allSettled(promises)
            console.log('resultado', results)
            process.exit(0)
        }
    }
    console.log('waiting trades...')
    setInterval(() => {
        api.connectAccount()
    }, 59 * 60 * 1000)
}

start()