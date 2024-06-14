const axios = require('axios');
const crypto = require('crypto');

const apiUrl = process.env.BINANCE_API_URL
const apiUrlFutures = process.env.BINANCE_API_URL_FUTURES
const apiUrlFuturesTransfer = process.env.BINANCE_API_URL_FUTURES_TRANSFER

const apiKey = process.env.TRADER0_API_KEY;
const apiSecret = process.env.TRADER0_API_SECRET;



async function InfoAccountBalance(apiSecret, apiKey) {
    try {
        if (!apiSecret) {
            throw new Error('API secret is not defined!');
        }
        const timeRes = await fetch(`https://api.binance.com/api/v3/time`);
        const timeData = await timeRes.json();
        const timestamp = timeData.serverTime;

        const queryString = `timestamp=${timestamp}`;

        const signature = generateSignature(queryString, apiSecret);

        const result = await axios({
            method: 'GET',
            url: `${apiUrl}/v3/account?${queryString}&signature=${signature}`,
            headers: {
                'X-MBX-APIKEY': apiKey
            },
        });
        const filterBalance = result.data.balances.filter(balance => balance.asset === 'USDT')
        // const filterBalanceBTC = result.data.balances.filter(balance => balance.asset === 'BTC')
        // console.log(filterBalanceBTC)
        const res = {
            valorSpot: filterBalance[0].free,
        }

        return res
    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
    }
}
async function InfoAccountBalanceFuture(apiSecret, apiKey) {
    try {
        if (!apiSecret) {
            throw new Error('API secret is not defined!');
        }
        const timeRes = await fetch(`https://api.binance.com/api/v3/time`);
        const timeData = await timeRes.json();
        const timestamp = timeData.serverTime;

        const queryString = `timestamp=${timestamp}`;

        const signature = generateSignature(queryString, apiSecret);

        const resultFutures = await axios({
            method: 'GET',
            url: `${apiUrlFutures}/v2/balance?${queryString}&signature=${signature}`,
            headers: {
                'X-MBX-APIKEY': apiKey
            },
        });

        const filterBalanceFutures = resultFutures.data.filter(balance => balance.asset === 'USDT')
        const res = {
            valorFutures: filterBalanceFutures[0].availableBalance
        }

        return res
    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
    }
}

async function InfoAccount(apiSecret, apiKey) {
    try {
        const timestamp = Date.now();
  
        const queryString = `timestamp=${timestamp}`;

        const signature = generateSignature(queryString, apiSecret);

        const result = await axios({
            method: 'GET',
            url: `${apiUrl}/v3/account?${queryString}&signature=${signature}`,
            headers: {
                'X-MBX-APIKEY': apiKey,
            },
        });

        const res = {
            spot: result.data.balances
        }
        return res
    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
    }
}

function generateSignature(queryString, apiSecret) {
    return crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
}

async function connectAccount() {
    const apiKey = process.env.TRADER0_API_KEY

    if (!apiKey || !apiSecret)
        throw new Error('Preencha corretamente sua API KEY e SECRET KEY');
    try {
        const result = await axios({
            method: 'POST',
            url: `${apiUrl}/v3/userDataStream`,
            headers: { 'X-MBX-APIKEY': apiKey },
        })
        const resultFutures = await axios({
            method: 'POST',
            url: `${apiUrlFutures}/v1/listenKey`,
            headers: { 'X-MBX-APIKEY': apiKey },
        })
        const res = {
            listenKeySpot: result.data,
            listenKeyFutures: resultFutures.data
        }
        return res
    } catch (err) {
        console.error(err.response ? err.response : err.message)
    }
}

async function connectAccountFuture() {
    const apiKey = process.env.TRADER0_API_KEY;
    try {
        const result = await axios({
            method: "POST",
            url: `${apiUrl}/v1/listenKey`,
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        return result.data;
    } catch (err) {
        console.error(err.response ? err.response : err);
    }
}

async function CancelAllOrders(data, apiKey, apiSecret, name, quantidade, type) {
    let infos = {
        symbol: 'BTCUSDT',
        timestamp: Date.now(),
        recvWindow: 60000,
    }
    const signature = crypto.createHmac('sha256', 'SxiKw8iguQj73fU2YgEkh8ukgZqtpgGMzcN61ASwhElaAgosMrKOlx3vHgyTebXp').update(`${new URLSearchParams(infos)}`).digest('hex');
    // console.log('signature', signature)
    const qs = `?${new URLSearchParams({ ...infos, signature })}`
    try {
        const result = await axios({
            method: 'DELETE',
            url: `${apiUrl}/v3/openOrders${qs}`,
            headers: { 'X-MBX-APIKEY': '6p6A9X4sY23SggxyE1T5RQ6xI6lBcJQtbitKqwdCmzpSIYPL94uKCYiTi823VxNk' }
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

async function CancelOrder(data, apiKey, apiSecret, name, quantidade, type) {
    let infos = {
        symbol: data.symbol,
        orderId: data.orderId,
        timestamp: Date.now(),
        recvWindow: 60000,
    }
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(infos)}`).digest('hex');
    // console.log('signature', signature)
    const qs = `?${new URLSearchParams({ ...infos, signature })}`
    try {
        const result = await axios({
            method: 'DELETE',
            url: `${apiUrl}/v3/order${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        })
        // console.log('newOrder result', result)
        console.log(`SUCESSO: Conta ${name} | Ordem deletada: Conta ${name} | Ordem: ${type} ${data.symbol} Preço: ${quantidade} `)
        return result
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU: Conta ${name} | Ordem: ${data.S} ${data.s} ${data.q} |`)
        console.log('| erro', err.response.data, ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
}
async function CancelOrderFutures(data, apiKey, apiSecret, name, quantidade, type) {
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
        // console.log(`SUCESSO: Conta ${name} | Ordem deletada: Conta ${name} | Ordem: ${type} ${data.symbol} Preço: ${quantidade} `)
        return `SUCESSO: Conta ${name} | Ordem deletada: Conta ${name} | Ordem: ${type} ${data.symbol} Preço: ${quantidade} `
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU: Conta ${name} | Ordem: ${data.S} ${data.s} ${data.q} |`)
        console.log('| erro', err.response.data, ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
}
async function GetOrder(data, apiKey, apiSecret, name, isFutures) {
    let infos = {
        symbol: data.s,
        timestamp: Date.now(),
        recvWindow: 60000
    }
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(infos)}`).digest('hex');
    // console.log('signature', signature)
    const qs = `?${new URLSearchParams({ ...infos, signature })}`
    try {
        if (!isFutures) {
            const result = await axios({
                method: 'GET',
                url: `${apiUrl}/v3/openOrders${qs}`,
                headers: { 'X-MBX-APIKEY': apiKey }
            })
            // console.log('newOrder result', result)
            const filter = result.data.filter((ordem) => ordem.price === data.p && ordem.side === data.S)
            return filter[0]
        } else {
            const result = await axios({
                method: 'GET',
                url: `${apiUrlFutures}/v1/openOrders${qs}`,
                headers: { 'X-MBX-APIKEY': apiKey }
            })
            // console.log('GET ORDER result', result.data)
            // console.log('GET ORDER trade', data)
            const filter = result.data.filter((ordem) => ordem.price === data.p && ordem.side === data.S)
            return filter[0]

        }
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU: Conta ${name} | Ordem: ${data.S} ${data.s} ${data.q} |`)
        console.log('| erro', err.response.data, ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
}
async function GetPriceFutures(symbol) {
    try {
        const qs = `?${new URLSearchParams({ symbol })}`

        const result = await axios({
            method: 'GET',
            url: `${apiUrlFutures}/v1/premiumIndex${qs}`,
        })
        // console.log(result.data)
        return result.data.markPrice
    } catch (err) {
        console.log('err ao capturar valor atual', err)
    }
}

async function GetOrderFutures(data, apiKey, apiSecret, name) {
    let infos = {
        symbol: data.s,
        timestamp: Date.now(),
        recvWindow: 60000
    }
    let res
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(infos)}`).digest('hex');
    // console.log('signature', signature)
    const qs = `?${new URLSearchParams({ ...infos, signature })}`
    try {
        const result = await axios({
            method: 'GET',
            url: `${apiUrlFutures}/v2/positionRisk${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        })
        const filter = result.data.filter((ordem) => ordem.symbol === data.s)
        if (Number(filter[0].positionAmt) >= 0 && data.S === 'BUY') {
            // console.log('caiu no buy')
            return res = {
                openPosition: true,
                positionAmt: filter[0].positionAmt
            }
        } else if (Number(filter[0].positionAmt) <= 0 && data.S === 'SELL') {
            // console.log('caiu no sell')
            return res = {
                openPosition: true,
                positionAmt: filter[0].positionAmt
            }
        } else {
            // console.log('caiu no else')
            return res = {
                openPosition: false,
                positionAmt: filter[0].positionAmt
            }
        }
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU: Conta ${name} | Ordem: ${data.S} ${data.s} ${data.q} |`)
        console.log('| erro', err.response.data, ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
}
async function GetAllOrder(data, apiKey, apiSecret, name) {
    let infos = {
        symbol: data.s,
        timestamp: Date.now(),
        recvWindow: 60000
    }
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(infos)}`).digest('hex');
    // console.log('signature', signature)
    const qs = `?${new URLSearchParams({ ...infos, signature })}`
    try {
        const result = await axios({
            method: 'GET',
            url: `${apiUrl}/v3/allOrders${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        })
        // console.log('newOrder result', result)
        console.log(`SUCESSO: Conta ${name} | Ordem: ${data.side} ${data.symbol} ${data.quantity}`)
        return result.data
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU: Conta ${name} | Ordem: ${data.side} ${data.symbol} ${data.quantity} |`)
        console.log('| erro', err.response.data, ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
}

async function newOrder(data, apiKey, apiSecret, name) {
    data.timestamp = Date.now();
    data.recvWindow = 60000;
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(data)}`).digest('hex');
    // console.log('signature', signature)
    const qs = `?${new URLSearchParams({ ...data, signature })}`
    try {
        const result = await axios({
            method: 'POST',
            url: `${apiUrl}/v3/order${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        })
        // console.log('newOrder result', result)
        console.log(`SUCESSO: Conta ${name} | Ordem: ${data.side} ${data.symbol} ${data.quantity}`)
        return result.data
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU: Conta ${name} | Ordem: ${data.side} ${data.symbol} ${data.quantity} |`)
        console.log('| erro', err.response.data, ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
}

async function newOrderFutures(data, apiKey, apiSecret, name) {
    if (!apiKey || !apiSecret)
        throw new Error('Preencha corretamente sua API KEY e SECRET KEY');
    data.timestamp = Date.now();
    data.recvWindow = 60000;//máximo permitido, default 5000
    // console.log('data new order futures', data)
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(`${new URLSearchParams(data)}`)
        .digest('hex');

    const qs = `?${new URLSearchParams({ ...data, signature })}`;
    try {
        const result = await axios({
            method: "POST",
            url: `${apiUrlFutures}/v1/order${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        return result.data;
    } catch (err) {
        if (err.response.data.code === -2015) {
            console.log(`Sem permissão na conta ${name}`)
        } else {
            console.error(err.response ? err.response.data : err.data);
        }
    }
}

async function ChangeLeverage(data, apiKey, apiSecret, name) {
    if (!apiKey || !apiSecret)
        throw new Error('Preencha corretamente sua API KEY e SECRET KEY');

    data.timestamp = Date.now();
    data.recvWindow = 60000;//máximo permitido, default 5000
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(`${new URLSearchParams(data)}`)
        .digest('hex');

    const qs = `?${new URLSearchParams({ ...data, signature })}`;

    try {
        const result = await axios({
            method: "POST",
            url: `${apiUrlFutures}/v1/leverage${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        return result.data;
    } catch (err) {
        if (err.response.data.code === -2015) {
            console.log(`Sem permissão na conta ${name}`)
        } else {
            console.error(err.response ? err.response.data : err.data);
        }
    }
}

async function ChangeMarginType(data, apiKey, apiSecret, name) {
    if (!apiKey || !apiSecret)
        throw new Error('Preencha corretamente sua API KEY e SECRET KEY');

    data.timestamp = Date.now();
    data.recvWindow = 60000;//máximo permitido, default 5000
    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(`${new URLSearchParams(data)}`)
        .digest('hex');

    const qs = `?${new URLSearchParams({ ...data, signature })}`;

    try {
        const result = await axios({
            method: "POST",
            url: `${apiUrlFutures}/v1/marginType${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        });
        return result.data;
    } catch (err) {
        if (err.response.data.code === -2015) {
            console.log(`Sem permissão na conta ${name}`)
        } else {
            console.error(err.response ? err.response.data : err.data);
        }
    }
}

async function TransferFuturesToSpot(data, apiKey, apiSecret, name) {
    data.timestamp = Date.now();
    data.recvWindow = 60000;
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(data)}`).digest('hex');
    const qs = `?${new URLSearchParams({ ...data, signature })}`
    try {
        const result = await axios({
            method: 'POST',
            url: `${apiUrlFuturesTransfer}/v1/asset/transfer${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        })
        // console.log('newOrder result', result)
        if (data.type === 'UMFUTURE_MAIN') {
            console.log(`SUCESSO: Conta ${name} | Transferencia: ${data.asset} ${data.amount} FUTUROS -> SPOT`)
        } else if (data.type === 'MAIN_UMFUTURE') {
            console.log(`SUCESSO: Conta ${name} | Transferencia: ${data.asset} ${data.amount} SPOT -> FUTUROS`)

        }
        return result.data
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU: Conta ${name} | Transferencia: ${data.asset} ${data.amount} FUTUROS -> SPOT  |`)
        console.log('| erro', err.response.data?err.response.data: err , ' |')
        console.log('*------------------------------------------------**************------------------------------------------------*')
        // console.error(err.respose ? err.respose : err.message)
    }
}


module.exports = {
    connectAccount,
    newOrder,
    InfoAccount,
    InfoAccountBalance,
    CancelOrder,
    GetOrder,
    GetAllOrder,
    newOrderFutures,
    connectAccountFuture,
    InfoAccountBalanceFuture,
    ChangeLeverage,
    ChangeMarginType,
    GetOrderFutures,
    CancelOrderFutures,
    GetPriceFutures,
    CancelAllOrders,
    TransferFuturesToSpot
}