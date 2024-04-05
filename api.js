const axios = require('axios');
const crypto = require('crypto');

const apiUrl = process.env.BINANCE_API_URL
const apiUrlFutures = process.env.BINANCE_API_URL_FUTURES

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

        const resultFutures = await axios({
            method: 'GET',
            url: `${apiUrlFutures}/v2/balance?${queryString}&signature=${signature}`,
            headers: {
                'X-MBX-APIKEY': apiKey
            },
        });

        const filterBalance = result.data.balances.filter(balance => balance.asset === 'USDT')
        const filterBalanceFutures = resultFutures.data.filter(balance => balance.asset === 'USDT')
        const res = {
            valorSpot: filterBalance[0].free,
            valorFutures: filterBalanceFutures[0].availableBalance
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
        const filterBalance = resultFutures.data.filter(balance => balance.asset === 'USDT')
        // console.log('resultFutures', resultFutures)
        return filterBalance[0].balance
    } catch (err) {
        console.log('error', err)
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
        const resultFutures = await axios({
            method: 'GET',
            url: `${apiUrlFutures}/v2/balance?${queryString}&signature=${signature}`,
            headers: {
                'X-MBX-APIKEY': apiKey
            },
        });
        // console.log(resultFutures.data)
        const res = {
            spot: result.data.balances,
            futures: resultFutures.data
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
        console.log('cancelOrder Futures result', result)
        console.log('cancelOrder Futures data', data)
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
async function GetOrder(data, apiKey, apiSecret, name) {
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
            url: `${apiUrl}/v3/openOrders${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        })
        // console.log('newOrder result', result)
        const filter = result.data.filter((ordem) => ordem.price === data.p && ordem.side === data.S)
        return filter[0]
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
        console.log(result.data)
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

        console.log('GetOrderFutures result', result.data)
        // console.log('GetOrderFutures data', data)
        // const filter = result.data.filter((ordem) => ordem.positionSide === opostoDataS && ordem.symbol === data.s)
        const filter = result.data.filter((ordem) => ordem.symbol === data.s)
        console.log('filter', filter[0])
        console.log('Number(filter[0].positionAmt)', Number(filter[0].positionAmt))
        console.log('data.S', data.S)

        if (Number(filter[0].positionAmt) >= 0 && data.S === 'BUY') {
            console.log('caiu no buy')
            return res = {
                openPosition: true,
                positionAmt: filter[0].positionAmt
            }
        } else if (Number(filter[0].positionAmt) <= 0 && data.S === 'SELL') {
            console.log('caiu no sell')
            return res = {
                openPosition: true,
                positionAmt: filter[0].positionAmt
            }
        } else {
            console.log('caiu no else')
            return res = {
                openPosition: false,
                positionAmt: filter[0].positionAmt
            }
        }
    } catch (err) {
        console.log('*------------------------------------------------**************------------------------------------------------*')
        console.log(`| FALHOU: Conta ${name} | Ordem: ${data.S} ${data.s} ${data.q} |`)
        console.log('| erro', err, ' |')
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
        //VERIFICAR SE ESTÁ CORRETO, FAZENDO SEM TESTE
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

async function newOrderFutures(data, apiKey, apiSecret) {
    if (!apiKey || !apiSecret)
        throw new Error('Preencha corretamente sua API KEY e SECRET KEY');

    data.timestamp = Date.now();
    data.recvWindow = 60000;//máximo permitido, default 5000
    console.log('data new order futures', data)
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
        console.error(err.response.data);
    }
}

async function ChangeLeverage(data, apiKey, apiSecret) {
    if (!apiKey || !apiSecret)
        throw new Error('Preencha corretamente sua API KEY e SECRET KEY');

    data.timestamp = Date.now();
    data.recvWindow = 60000;//máximo permitido, default 5000
    console.log('data CHANGE LEVERAGE', data)
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
        console.error(err.response ? err.response : err.data);
    }
}

async function ChangeMarginType(data, apiKey, apiSecret) {
    if (!apiKey || !apiSecret)
        throw new Error('Preencha corretamente sua API KEY e SECRET KEY');

    data.timestamp = Date.now();
    data.recvWindow = 60000;//máximo permitido, default 5000
    console.log('data CHANGE LEVERAGE', data)
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
        console.error(err.response.data);
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
    GetPriceFutures
}