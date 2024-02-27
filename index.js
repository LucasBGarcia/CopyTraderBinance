require("dotenv").config();
const frm = document.querySelector("input");
const axios = require('axios');
const crypto = require('crypto');
const WebSocket = require('ws')
const fs = require('fs');

const accounts = []

const apiUrl = process.env.BINANCE_API_URL

async function connectAccount() {
    const apiKey = process.env.TRADER0_API_KEY
    try {
        const result = await axios({
            method: 'POST',
            url: `${apiUrl}/v3/userDataStream`,
            headers: { 'X-MBX-APIKEY': apiKey },
        })
        console.log('resultado', result.data)
        return result.data
    } catch (err) {
        console.error(err.response ? err.response : err.message)
    }
}

async function newOrder(data, apiKey, apiSecret) {
    data.timestamp = Date.now();
    data.recvWindow = 60000;
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(data)}`).digest('hex');
    console.log('signature', signature)

    const qs = `?${new URLSearchParams({ ...data, signature })}`
    console.log('qs', qs)
    try {
        const result = await axios({
            method: 'POST',
            url: `${apiUrl}/v3/order${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        })
        console.log('newOrder result', result)
        return result.data
    } catch (err) {
        console.log('erro', err)
        console.error(err.respose ? err.respose : err.message)
    }
}
function teste() {
    const rawData = fs.readFileSync('config.json');
    const config = JSON.parse(rawData);
    console.log('BINANCE_API_URL:', config.BINANCE_API_URL);
    console.log('BINANCE_WS_URL:', config.BINANCE_WS_URL);
    console.log('API_KEY do Trader 0:', config.TRADER[0].API_KEY);
    console.log('API_SECRET do Trader 0:', config.TRADER[0].API_SECRET);
    console.log('API_KEY do Trader 1:', config.TRADER[1].API_KEY);
    console.log('API_SECRET do Trader 1:', config.TRADER[1].API_SECRET);
    const divAlert = document.querySelector(".alert"); // Mova a inicialização aqui
    alert("Função chamada com sucesso!");
    if (divAlert) {
        divAlert.className = "alert alert-success mt-3";
        divAlert.innerText = `Ok! waiting trades... `;
    } else {
        console.error("Div 'alert' not found.");
    }
}
async function loadAccounts() {
    const { listenKey } = await connectAccount()
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
    const divAlert = document.querySelector(".alert");
    const listenKey = await loadAccounts()
    const ws = new WebSocket(`${process.env.BINANCE_WS_URL}/${listenKey}`)
    if (listenKey) {
        divAlert.className = "alert alert-success mt-3";
        divAlert.innerText = `Ok! waiting trades... `;
    }
    ws.onmessage = async (event) => {
        const trade = JSON.parse(event.data)
        if (trade.e === 'executionReport' && !oldOrders[trade.i]) {
            oldOrders[trade.i] = true
            console.clear()
            console.log(trade)
            const data = copyTrade(trade)

            console.log('data', data)
            const promises = accounts.map(acc => newOrder(data, acc.apiKey, acc.apiSecret))
            const results = await Promise.allSettled(promises)
            divAlert.className = "alert alert-success mt-3";
            divAlert.innerText = `Ok! Vinho  cadastrado com sucesso. Código: `;
            console.log('resultado', results)
            process.exit(0)
        }
    }
    console.log('waiting trades...')
    alert("waiting trades...");
    setInterval(() => {
        connectAccount()
    }, 59 * 60 * 1000)
}
