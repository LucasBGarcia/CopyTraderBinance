const axios = require('axios');
const crypto = require('crypto');

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

module.exports = {
    connectAccount,
    newOrder
}