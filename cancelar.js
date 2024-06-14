const api = require("./api");
require("dotenv").config();
const axios = require('axios');
const { Console } = require("console");
const crypto = require('crypto');
const apiUrl = process.env.BINANCE_API_URL
const apiUrlFutures = process.env.BINANCE_API_URL_FUTURES
var prompt = require('prompt-sync')();

const accounts = [];
const accountsFutures = [];

async function CancelOrdersSpot() {
    //alterar informações com os dados
    //exemplo: 
    //const informacoes = {
    // moeda: 'BTCUSDT',
    //apiSecret: '5uMGKhZjO98qM5xloCsti1HLdgIMsQc6Bq7Y0Nh80q2CvtZHtPD7A5JnoohLXoOj',
    //apiKey: '5YNaBS2X1nLl8HPgjHo5sBoolfEMxsFNsrsyYJPRP5yxgaoGgMw5vF03gW2NK74'
    // }
    const informacoes = {
        moeda: 'PAR',
        apiSecret: 'secret',
        apiKey: 'key'
    }
    let infos = {
        symbol: informacoes.moeda,
        timestamp: Date.now(),
        recvWindow: 60000,
    }
    const signature = crypto.createHmac('sha256', informacoes.apiSecret).update(`${new URLSearchParams(infos)}`).digest('hex');
    // console.log('signature', signature)
    const qs = `?${new URLSearchParams({ ...infos, signature })}`
    try {
        const result = await axios({
            method: 'DELETE',
            url: `${apiUrl}/v3/openOrders${qs}`,
            headers: { 'X-MBX-APIKEY': informacoes.apiKey }
        })
        // console.log('newOrder result', result)
        console.log(`SUCESSO: ${result} `)
        return result
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.log(`| FALHOU: Conta ${name} | Ordem: ${data.S} ${data.s} ${data.q} |`)
        console.log('| erro', err.response.data, ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
}

async function CancelOrdersFutures() {
    //alterar informações com os dados
    //exemplo: 
    //const informacoes = {
    // moeda: 'BTCUSDT',
    //apiSecret: '5uMGKhZjO98qM5xloCsti1HLdgIMsQc6Bq7Y0Nh80q2CvtZHtPD7A5JnoohLXoOj',
    //apiKey: '5YNaBS2X1nLl8HPgjHo5sBoolfEMxsFNsrsyYJPRP5yxgaoGgMw5vF03gW2NK74'
    // }
    const informacoes = {
        moeda: '1000XECUSDT',
        apiSecret: '5YNaBS2X1nLl8HPgjHo5sBoolfEMxsFNsrsyYJPRP5yxgaoGgMw5vF03gW2NK1dh',
        apiKey: '5uMGKhZjOZ7qM5xloCsti1HLdgIMsQc6Bq7Y0Nh80q2CvtZHtPD7A5JnoohLXoOj'
    }
    const response = await GetOrderFutures(informacoes.moeda, informacoes.apiKey, informacoes.apiSecret);

    if (!response) {
        return (`Ordem não encontrada na conta`);
    }

    response.map(async (info) => {
        console.log(info)
        let data = { symbol: informacoes.moeda };
        data.orderId = info.orderId;;
        data.clientOrderId = info.clientOrderId;;
     console.log(data)
        const res = await handleCanceledOrdersFutures(data, informacoes.apiKey, informacoes.apiSecret);
        console.log(`${res}`);
        console.log(`Ordem cancelada na conta`);

    })

}

async function handleCanceledOrdersFutures(data, apiKey, apiSecret) {
    let infos = {
        symbol: data.symbol,
        orderId: data.orderId,
        clientOrderId: data.clientOrderId,
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
            console.log(` - ORDEM CANCELADA`)
            console.log('*------------------------------------------------**************------------------------------------------------*')
        })
        return result
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU:  |`)
        console.log('| erro', err.response.data? err.response.data : err, ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
}

async function GetOrderFutures(par, key, secret) {
    let infos = {
        symbol: par,
        timestamp: Date.now(),
        recvWindow: 60000
    }
    const signature = crypto.createHmac('sha256', secret).update(`${new URLSearchParams(infos)}`).digest('hex');
    // console.log('signature', signature)
    const qs = `?${new URLSearchParams({ ...infos, signature })}`
    try {

        const result = await axios({
            method: 'GET',
            url: `${apiUrlFutures}/v1/openOrders${qs}`,
            headers: { 'X-MBX-APIKEY': key }
        })
        // console.log('GET ORDER trade', data)
        // const filter = result.data.filter((ordem) => ordem.price === data.p && ordem.side === data.S)
        if (result.data.length <=0) {
            console.log(`Ordem não encontrada na conta`);
        }
        return result.data

    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU`)
        console.log('| erro', err.response.data, ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
}

//comentar o que nao deseja e descomentar o que deseja
// CancelOrdersSpot()
//--------------------
CancelOrdersFutures()