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
async function StartCancela() {
    console.clear()
    await loadAccounts()
    await Promise.all(accounts.map(async (account) => {
        await getAllOrdersSpot(account.apiKey, account.apiSecret, account.Name);
    }));
    await Promise.all(accountsFutures.map(async (account) => {
        await getAllOrdersFutures(account.apiKey, account.apiSecret, account.Name);
    }));
    console.log('Digite 1 para cancelar ordem SPOT')
    console.log('Digite 2 para cancelar ordem FUTUROS')
    let opcao = +prompt('1 ou 2? ')
    let par = prompt('qual par de moedas quer cancelar? ')
    if (opcao === 1) {
        await Promise.all(accounts.map(async (account) => {
            await CancelOrdersSpot(par.toLocaleUpperCase(), account.apiKey, account.apiSecret, account.Name);
        }));
    } else if (opcao === 2) {
        await handleCanceledOrdersFutures(par.toLocaleLowerCase())
        return
    }
}

async function CancelOrdersSpot(par, apiKey, apiSecret, Name) {
    let infos = {
        symbol: par,
        timestamp: Date.now(),
        recvWindow: 60000,
    }
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(infos)}`).digest('hex');
    // console.log('signature', signature)
    const qs = `?${new URLSearchParams({ ...infos, signature })}`
    try {
        const result = await axios({
            method: 'DELETE',
            url: `${apiUrl}/v3/openOrders${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        })
        const retornoSTR = JSON.stringify(result.data, null, 2)
        const retornoParse = JSON.parse(retornoSTR)
        retornoParse.map((retorno) => {
            console.log('*------------------------------------------------**************------------------------------------------------*')
            console.log(`${Name} - ORDEM CANCELADA ${retorno.side} ${retorno.symbol} ${retorno.origQty} TIP0: ${retorno.type} `)
            console.log('*------------------------------------------------**************------------------------------------------------*')
        })
        return result
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU: Conta ${Name} |`)
        console.log('| erro', err, ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
}

async function handleCanceledOrdersFutures(data) {
    const trade = {
        s: data
    }
    console.log('trade ', trade)
    const pr = accountsFutures.map(async (acc) => {
        const infos = { symbol: trade.s };
        const response = await api.GetOrder(trade, acc.apiKey, acc.apiSecret, acc.Name, true);

        if (!response) {
            return (`Ordem não encontrada na conta ${acc.Name}`);
        }
        const orderId = response.orderId;
        const clientOrderId = response.clientOrderId;
        infos.orderId = orderId;
        infos.clientOrderId = clientOrderId;
        const res = await api.CancelOrderFutures(infos, acc.apiKey, acc.apiSecret, acc.Name, trade.p, trade.S);
        console.log(`${res}`);
        console.log(`Ordem cancelada na conta ${acc.Name}`);
    });

    await handlePromise(pr);
}

async function CancelOrdersFutures(par, apiKey, apiSecret, Name) {
    let infos = {
        symbol: par,
        timestamp: Date.now(),
        recvWindow: 60000,
    }
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(infos)}`).digest('hex');
    // console.log('signature', signature)
    const qs = `?${new URLSearchParams({ ...infos, signature })}`
    try {
        const result = await axios({
            method: 'DELETE',
            url: `${apiUrlFutures}/v1/order${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        })
        const retornoSTR = JSON.stringify(result.data, null, 2)
        const retornoParse = JSON.parse(retornoSTR)
        retornoParse.map((retorno) => {
            console.log('*------------------------------------------------**************------------------------------------------------*')
            console.log(`${Name} - ORDEM CANCELADA ${retorno.side} ${retorno.symbol} ${retorno.origQty} TIP0: ${retorno.type} `)
            console.log('*------------------------------------------------**************------------------------------------------------*')
        })
        return result
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU: Conta ${Name} |`)
        console.log('| erro', err, ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
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
async function handlePromise(pr) {
    try {
        const results = await Promise.allSettled(pr);
        console.log('resultado', results);
        // await ShowBalances()
        console.log('waiting trades...');
        // process.exit(0)
    } catch (error) {
        console.log('erro:', error);
    }
}


StartCancela()