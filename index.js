require("dotenv").config();
var prompt = require('prompt-sync')()
const WebSocket = require('ws')
const api = require("./api")
const accounts = []
let ValorTotalMaster;
let PorcentagemMaster

async function loadAccounts() {
    const { listenKey } = await api.connectAccount()
    let i = 1;
    while (process.env[`TRADER${i}_API_KEY`]) {
        accounts.push({
            Name: process.env[`TRADER${i}_NAME`],
            apiKey: process.env[`TRADER${i}_API_KEY`],
            apiSecret: process.env[`TRADER${i}_API_SECRET`]
        })
        i++
    }
    console.log(`${i - 1} copy accounts loaded`)
    return listenKey
}

async function tradePorcentageMaster() {
    const ValueAfterTrade = await api.InfoAccountBalance(process.env.TRADER0_API_SECRET, process.env.TRADER0_API_KEY)
    const valorgasto = ValorTotalMaster - ValueAfterTrade
    const porcentagem = (valorgasto / ValorTotalMaster) * 100;
    return porcentagem.toFixed(2);
}

function encontrarPrimeiroNaoZero(numero) {
    let valorSplit = numero.split('.')
    let valor = valorSplit[1]
    let contador = 0
    for (let i = valor.length - 1; i >= 0; i--) {
        contador++
        if (valor[i] !== '0') {
            return valor.length - contador + 1;
        }
    }
    return 0; // Retorna 0 se todos os dígitos forem zeros
}

function calcularValorPorPorcentagem(valorCarteira, porcentagem, tradeq, valorAtual, apiName) {
    const valor = encontrarPrimeiroNaoZero(tradeq)
    const valorReferentePorcentagem = (porcentagem / 100) * valorCarteira;
    const result = valorReferentePorcentagem / valorAtual
    console.log(`${apiName} - Valor gasto: USDT ${valorReferentePorcentagem}`)
    return result.toFixed(valor)
}

async function PegaMoedar(apiSecret, moeda, apiKey) {
    const ValorCarteiraCliente = await api.InfoAccount(apiSecret, apiKey);
    const moedaSplitCliente = moeda.split('U')
    const moedaCliente = ValorCarteiraCliente.filter(pares => pares.asset === moedaSplitCliente[0])
    return (moedaCliente)
}
function buscaValor(symbol) {
    return new Promise((resolve, reject) => {
        const wsPrice = new WebSocket(`${process.env.STREAM_URL}/${symbol.toLowerCase()}@ticker`);
        wsPrice.onmessage = (event) => {
            const obj = JSON.parse(event.data);
            const currentPrice = parseFloat(obj.a);
            resolve(currentPrice);
        };
        wsPrice.onerror = (error) => {
            reject(error);
        };
    });
}
async function copyTrade(trade, apiSecret, apiKey, apiName) {
    let CompraCliente
    let VendaCliente
    const valorAtual = await buscaValor(trade.s);
    if (trade.S == 'BUY') {
        const ValorCarteiraCliente = await api.InfoAccountBalance(apiSecret, apiKey)
        CompraCliente = calcularValorPorPorcentagem(ValorCarteiraCliente, PorcentagemMaster, trade.q, valorAtual, apiName)
    }
    if (trade.S == 'SELL') {
        const posicZero = encontrarPrimeiroNaoZero(trade.q)
        const ValorCarteiraCliente = await PegaMoedar(apiSecret, trade.s, apiKey)
        const valor = Number(ValorCarteiraCliente[0].free)
        const fator = Math.pow(10, posicZero)
        const arredonda = Math.floor(valor * fator) / fator
        VendaCliente = arredonda.toFixed(posicZero)

    }
    const data = {
        symbol: trade.s,
        side: trade.S,
        type: trade.o
    }
    if (trade.q && parseFloat(trade.q)) {
        if (CompraCliente) {
            data.quantity = Math.abs(CompraCliente).toString()
        } else if (VendaCliente) {
            data.quantity = Math.abs(VendaCliente).toString()
        } else {
            data.quantity = trade.q
        }
    }
    if (trade.p && parseFloat(trade.p)) {
        data.price = trade.p
        data.timeInForce = trade.f
    }
    if (trade.f && trade.f !== "GTC") {
        data.timeInForce = trade.f
    }
    if (trade.P && parseFloat(trade.P)) {
        data.stopPrice = trade.P
    }
    // if (trade.Q && parseFloat(trade.Q)) {
    //     data.quoteOrderQty = trade.Q
    // }
    // console.log(`Conta - ${apiName}: QTD entrada/saida -${trade.s} ${CompraCliente ? CompraCliente : VendaCliente}`)
    return data;
}


const oldOrders = {}
async function start() {
    console.clear();
    ValorTotalMaster = await api.InfoAccountBalance(process.env.TRADER0_API_SECRET, process.env.TRADER0_API_KEY);
    const bruno = await api.InfoAccount(process.env.TRADER1_API_SECRET, process.env.TRADER1_API_KEY);
    console.log(bruno);
    const listenKey = await loadAccounts();
    const ws = new WebSocket(`${process.env.BINANCE_WS_URL}/${listenKey}`);
    ws.onmessage = async (event) => {
        const trade = JSON.parse(event.data);
        if (trade.e === 'executionReport' && !oldOrders[trade.i]) {
            oldOrders[trade.i] = true;
            PorcentagemMaster = await tradePorcentageMaster();
            const pr = accounts.map(async (acc) => {
                const data = await copyTrade(trade, acc.apiSecret, acc.apiKey, acc.Name);
                if (trade.f === 'GTC') {
                    const infos = {}
                    const response = await api.GetOrder(trade.s)
                    const orderId = response.orderId
                    const clientOrderId = response.clientOrderId
                    infos.orderId = orderId
                    infos.clientOrderId = clientOrderId
                    infos.symbol = trade.s
                    const DeleteOrder = await api.CancelOrder(infos, acc.apiKey, acc.apiSecret, acc.Name)
                    console.log('DELETE_ORDER: ', DeleteOrder)
                } else {
                    const promises = await api.newOrder(data, acc.apiKey, acc.apiSecret, acc.Name);
                    return promises;
                }
                console.log('trade', trade)
                console.log('data', data)
            });
            if (pr) {
                const results = await Promise.allSettled(pr);
                console.log('resultado', results);
            } else {
                console.log('erro no if pr');
            }
            process.exit(0)
        }

    };
    console.log('waiting')

    setInterval(() => {
        api.connectAccount();
    }, 59 * 60 * 1000);

}

start()