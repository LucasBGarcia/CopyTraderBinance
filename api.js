const axios = require('axios');
const crypto = require('crypto');

const apiUrl = process.env.BINANCE_API_URL

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
        console.log(filterBalance)
        return filterBalance[0].free;
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
        return result.data.balances;
    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
    }
}

function generateSignature(queryString, apiSecret) {
    return crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
}

async function connectAccount() {
    const apiKey = process.env.TRADER0_API_KEY
    try {
        const result = await axios({
            method: 'POST',
            url: `${apiUrl}/v3/userDataStream`,
            headers: { 'X-MBX-APIKEY': apiKey },
        })
        return result.data
    } catch (err) {
        console.error(err.response ? err.response : err.message)
    }
}

async function newOrder(data, apiKey, apiSecret, name) {
    data.timestamp = Date.now();
    data.recvWindow = 60000;
    const signature = crypto.createHmac('sha256', apiSecret).update(`${new URLSearchParams(data)}`).digest('hex');
    // console.log('signature', signature)
    console.log('data', data, 'NAME', name)
    const qs = `?${new URLSearchParams({ ...data, signature })}`
    try {
        const result = await axios({
            method: 'POST',
            url: `${apiUrl}/v3/order${qs}`,
            headers: { 'X-MBX-APIKEY': apiKey }
        })
        // console.log('newOrder result', result)
        return result.data
    } catch (err) {
        console.log('erro', err, 'data', data, 'NAME', name)
        console.error(err.respose ? err.respose : err.message)
    }
}

module.exports = {
    connectAccount,
    newOrder,
    InfoAccount,
    InfoAccountBalance
}