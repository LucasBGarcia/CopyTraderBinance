const api = require("./api");
require("dotenv").config();
const axios = require('axios');
const crypto = require('crypto');
const apiUrl = process.env.BINANCE_API_URL
const apiUrlFutures = process.env.BINANCE_API_URL_FUTURES
var prompt = require('prompt-sync')();

const accounts = [];
const accountsFutures = [];

async function loadAccounts() {
    let i = 1;
    while (process.env[`TRADER${i}_API_KEY`]) {
        accounts.push({
            Name: process.env[`TRADER${i}_NAME`],
            apiKey: process.env[`TRADER${i}_API_KEY`],
            apiSecret: process.env[`TRADER${i}_API_SECRET`]
        });
        if (process.env[`TRADER${i}_FUTURES`] === 'true') {
            accountsFutures.push({
                Name: process.env[`TRADER${i}_NAME`],
                apiKey: process.env[`TRADER${i}_API_KEY`],
                apiSecret: process.env[`TRADER${i}_API_SECRET`]
            });
        }
        i++;
    }
    console.log(`${i - 1} copy accounts loaded`);
    return true;
}
async function VerOrdens() {
    console.clear()
    await loadAccounts()
    await Promise.all(accounts.map(async (account) => {
        await getAllOrdersSpot(account.apiKey, account.apiSecret, account.Name);
    }));
    await Promise.all(accountsFutures.map(async (account) => {
        await getAllOrdersFutures(account.apiKey, account.apiSecret, account.Name);
    }));
}

async function getAllOrdersSpot(apiKey, apiSecret, Name) {
    let infos = {
        timestamp: Date.now(),
        recvWindow: 60000,
    };
    if (!apiSecret || !apiKey) {
        throw new Error('API secret is not defined!');
    }
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(infos)}`).digest('hex');
    const qs = `?${new URLSearchParams({ ...infos, signature })}`;
    try {
        const result = await axios({
            method: 'GET',
            url: `${apiUrl}/v3/openOrders${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        console.log('*----------------------------*ORDENS SPOT*---------------------------*')
        if (result.data.length == 0) {
            console.log(`${Name} : Nenhuma ordem aberta `)
            console.log('*--------------------------------------------------------------------*')
            return
        }
        result.data.map((retorno) => {
            console.log(`${Name} - ${retorno.side} ${retorno.symbol} ${retorno.origQty} TIP0: ${retorno.type} `)
        })
        console.log('*--------------------------------------------------------------------*')
        return
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*');
        console.log('| erro', (err), ' |');
        // console.log('| erro', JSON.stringify(err.response.data, null, 2), ' |'); 
        console.log('*------------------------------------------------**************------------------------------------------------*');
    }
}


async function getAllOrdersFutures(apiKey, apiSecret, Name) {
    let infos = {
        timestamp: Date.now(),
        recvWindow: 60000,
    };
    if (!apiSecret || !apiKey) {
        throw new Error('API secret is not defined!');
    }
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(infos)}`).digest('hex');
    const qs = `?${new URLSearchParams({ ...infos, signature })}`;
    try {
        const result = await axios({
            method: 'GET',
            url: `${apiUrlFutures}/v1/openOrders${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        console.log('*--------------------------*ORDENS FUTUROS*--------------------------*')
        if (result.data.length == 0) {
            console.log(`${Name} : Nenhuma ordem aberta `)
            console.log('*--------------------------------------------------------------------*')

            return
        }
        result.data.map((retorno) => {
            console.log(`${Name} - ${retorno.side} ${retorno.symbol} PREÇO: ${retorno.price} QTD: ${retorno.origQty} TIP0: ${retorno.type} `)
        })
        console.log('*--------------------------------------------------------------------*')

        return


    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*');
        console.log('| erro', (err), ' |');
        // console.log('| erro', JSON.stringify(err.response.data, null, 2), ' |'); 
        console.log('*------------------------------------------------**************------------------------------------------------*');
    }
}

VerOrdens()