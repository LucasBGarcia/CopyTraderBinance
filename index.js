require("dotenv").config();
var prompt = require('prompt-sync')()
const WebSocket = require('ws')
const api = require("./api")
const accounts = []
let ValorTotalMasterSpot;
let ValorTotalMasterFuturos;
let PorcentagemMaster
let AlavancagemMaster

async function loadAccounts() {
    const listenKey = await api.connectAccount()
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

    await Promise.all(accounts.map(async (account) => {
        let balance = await api.InfoAccountBalance(account.apiSecret, account.apiKey);
        console.log(`${account.Name} USDT SPOT ${balance.valorSpot} | USDT FUTURES ${balance.valorFutures}`);
    }));
    return listenKey
}

async function tradePorcentageMaster() {
    const ValueAfterTrade = await api.InfoAccountBalance(process.env.TRADER0_API_SECRET, process.env.TRADER0_API_KEY)
    const valorgasto = ValorTotalMasterSpot - ValueAfterTrade.valorSpot
    const porcentagem = (valorgasto / ValorTotalMasterSpot) * 100;
    return porcentagem.toFixed(2);
}
async function tradePorcentageMasterFuturos(trade) {
    const valorgasto = trade.wb - trade.cw
    // const ValueAfterTrade = await api.InfoAccountBalance(process.env.TRADER0_API_SECRET, process.env.TRADER0_API_KEY)
    // const valorgasto = ValorTotalMasterFuturos - ValueAfterTrade.valorFutures
    const porcentagem = (valorgasto / ValorTotalMasterFuturos) * 100;
    console.log('trade porcentagem ', trade)
    console.log('trade porcentagem retorno', porcentagem.toFixed(2))
    const porcentagemFinal = porcentagem.toFixed(2) * AlavancagemMaster
    return porcentagemFinal.toFixed(2);
}

function encontrarPrimeiroNaoZero(numero) {
    const string = numero.toString();
    let valorSplit = string.split('.')
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
    console.log('porcentagem recebida', porcentagem)
    console.log('Valor da carteira', valorCarteira)
    console.log('valor atual', valorAtual)
    const quantidadeNumber = Number(tradeq)
    const valor = encontrarPrimeiroNaoZero(quantidadeNumber.toFixed(8))
    const valorReferentePorcentagem = (porcentagem / 100) * valorCarteira;
    const result = valorReferentePorcentagem / valorAtual
    console.log(`${apiName} - Valor gasto: USDT ${valorReferentePorcentagem}`)
    return result.toFixed(valor)
}

async function PegaMoedar(apiSecret, moeda, apiKey) {
    const ValorCarteiraCliente = await api.InfoAccount(apiSecret, apiKey);
    const moedaSplitCliente = moeda.split('U')
    const moedaCliente = ValorCarteiraCliente.spot.filter(pares => pares.asset === moedaSplitCliente[0])
    return (moedaCliente)
}
function buscaValor(symbol) {
    return new Promise((resolve, reject) => {
        const wsPrice = new WebSocket(`${process.env.BINANCE_WS_URL}/${symbol.toLowerCase()}@ticker`);
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
        CompraCliente = calcularValorPorPorcentagem(ValorCarteiraCliente.valorSpot, PorcentagemMaster, trade.q, valorAtual, apiName)
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
async function copyTradeFutures(trade, apiSecret, apiKey, apiName, isNewOrder) {
    let ValorEntrada
    console.log('isNewOrder', isNewOrder)
    // const valorAtual = await api.GetPriceFutures(trade.s);
    if (isNewOrder.openPosition) {
        const ValorCarteiraCliente = await api.InfoAccountBalance(apiSecret, apiKey)
        ValorEntrada = calcularValorPorPorcentagem(ValorCarteiraCliente.valorFutures, PorcentagemMaster, trade.q, trade.L, apiName)
    }
    // const newTrade = await handleCanceledOrdersFutures(trade)
    console.log('compra Cliente', ValorEntrada)

    const data = {
        symbol: trade.s,
        side: trade.S,
        type: trade.o
    }
    if (trade.q && parseFloat(trade.q)) {
        console.log(PorcentagemMaster)
        if (ValorEntrada) {
            console.log('compra Cliente', ValorEntrada)
            data.quantity = Math.abs(ValorEntrada).toString()
        } else {
            data.quantity = isNewOrder.positionAmt
        }
    }
    if (trade.p && parseFloat(trade.p))
        data.price = trade.p

    if (trade.f && trade.f !== "GTC")
        data.timeInForce = trade.f;

    if (trade.sp && parseFloat(trade.sp))
        data.stopPrice = trade.sp;

    if (trade.ps)
        data.positionSide = trade.ps;

    if (trade.AP && parseFloat(trade.AP))
        data.activationPrice = trade.AP;

    if (trade.cr && parseFloat(trade.cr))
        data.callbackRate = trade.cr;
    console.log("data", data)
    return data;

}

async function calcPorcFuturos(trade) {
    if (trade.a && trade.a.B[0]) {
        PorcentagemMaster = await tradePorcentageMasterFuturos(trade.a.B[0]);
    }
}

const oldOrders = {}
async function start() {
    console.clear();

    const valoresIniciais = await api.InfoAccountBalance(process.env.TRADER0_API_SECRET, process.env.TRADER0_API_KEY);
    ValorTotalMasterSpot = valoresIniciais.valorSpot
    ValorTotalMasterFuturos = valoresIniciais.valorFutures

    const listenKey = await loadAccounts();
    const ws = new WebSocket(`${process.env.BINANCE_WS_URL}/${listenKey.listenKeySpot.listenKey}`);
    const wsFuture = new WebSocket(`${process.env.BINANCE_WS_URL_FUTURE}/${listenKey.listenKeyFutures.listenKey}`);

    // const falseTrade = {
    //     s: 'IOSTUSDT',
    //     c: 'web_XUPFQD3qDq1yAGGI3Fia',
    //     S: 'SELL',
    //     o: 'MARKET',
    //     f: 'GTC',
    //     q: '556',
    //     p: '0',
    //     ap: '0.010794',
    //     sp: '0',
    //     x: 'TRADE',
    //     X: 'FILLED',
    //     i: 7028302073,
    //     l: '556',
    //     z: '556',
    //     L: '0.010794',
    //     n: '0.00300073',
    //     N: 'USDT',
    //     T: 1712149384113,
    //     t: 219254694,
    //     b: '0',
    //     a: '0',
    //     m: false,
    //     R: true,
    //     wt: 'CONTRACT_PRICE',
    //     ot: 'MARKET',
    //     ps: 'BOTH',
    //     cp: false,
    //     rp: '0.00555999',
    //     pP: false,
    //     si: 0,
    //     ss: 0,
    //     V: 'NONE',
    //     pm: 'NONE',
    //     gtd: 0
    // }

    // const pr = accounts.map(async (acc) => {
    //     const response = await api.GetOrderFutures(falseTrade, acc.apiKey, acc.apiSecret, acc.Name);
    // })

    wsFuture.onmessage = async (event) => {
        const trade = JSON.parse(event.data);

        console.log("trade", trade)
        if (trade.a && trade.a.m === 'MARGIN_TYPE_CHANGE') {
            console.log(trade.a.P[0].mt)
            await handleChangeMarginType(trade.a)
        }
        if (trade.e === 'ACCOUNT_CONFIG_UPDATE') {
            await handleChangeLeverage(trade.ac)
        }
        // await calcPorcFuturos(trade)
        if (trade.a && trade.a.B[0]) {
            PorcentagemMaster = await tradePorcentageMasterFuturos(trade.a.B[0]);
        }
        if (trade.e === "ORDER_TRADE_UPDATE") {
            // oldOrders[trade.i] = true;
            await handleNewOrdersFutures(trade.o);
        }
    }

    ws.onmessage = async (event) => {
        const trade = JSON.parse(event.data);

        if (trade.e === 'executionReport' && trade.o === 'LIMIT' && trade.x === 'CANCELED') {
            oldOrders[trade.i] = true;
            await handleCanceledOrders(trade);
        }

        if (trade.e === 'executionReport' && !oldOrders[trade.i]) {
            oldOrders[trade.i] = true;
            PorcentagemMaster = await tradePorcentageMaster();
            await handleNewOrders(trade);
        }
    };


    console.log('waiting trades...');
    setInterval(api.connectAccount, 59 * 60 * 1000);
}


async function handleCanceledOrders(trade) {
    const pr = accounts.map(async (acc) => {
        const infos = { symbol: trade.s };
        const response = await api.GetOrder(trade, acc.apiKey, acc.apiSecret, acc.Name);

        if (!response) {
            return (`Ordem não encontrada na conta ${acc.Name}`);
        }

        const orderId = response.orderId;
        const clientOrderId = response.clientOrderId;
        infos.orderId = orderId;
        infos.clientOrderId = clientOrderId;
        await api.CancelOrder(infos, acc.apiKey, acc.apiSecret, acc.Name, trade.p, trade.S);
        console.log(`Ordem cancelada na conta ${acc.Name}`);
    });

    await handlePromise(pr);
}
async function handleCanceledOrdersFutures(trade) {
    const pr = accounts.map(async (acc) => {
        const infos = { symbol: trade.s };
        const response = await api.GetOrderFutures(trade, acc.apiKey, acc.apiSecret, acc.Name);

        if (!response) {
            return (`Ordem não encontrada na conta ${acc.Name}`);
        }

        console.log('response', response);
        // const orderId = response.orderId;
        // const clientOrderId = response.clientOrderId;
        // infos.orderId = orderId;
        // infos.clientOrderId = clientOrderId;
        // await api.CancelOrder(infos, acc.apiKey, acc.apiSecret, acc.Name, trade.p, trade.S);
        // console.log(`Ordem cancelada na conta ${acc.Name}`);
    });

    await handlePromise(pr);
}

async function handleNewOrders(trade) {
    const pr = accounts.map(async (acc) => {
        const data = await copyTrade(trade, acc.apiSecret, acc.apiKey, acc.Name);
        return api.newOrder(data, acc.apiKey, acc.apiSecret, acc.Name);
    });

    await handlePromise(pr);
}
async function handleNewOrdersFutures(trade) {
    const pr = accounts.map(async (acc) => {
        const response = await api.GetOrderFutures(trade, acc.apiKey, acc.apiSecret, acc.Name);
        console.log("response get order Futuros", response);
        if (!response) {
            return (`Ordem não encontrada na conta ${acc.Name}`);
        }
        const data = await copyTradeFutures(trade, acc.apiSecret, acc.apiKey, acc.Name, response);
        return api.newOrderFutures(data, acc.apiKey, acc.apiSecret, acc.Name);
    });

    await handlePromise(pr);
}

async function handleChangeLeverage(trade) {
    AlavancagemMaster = trade.l
    const pr = accounts.map(async (acc) => {
        const data = {
            symbol: trade.s,
            leverage: trade.l
        }
        return api.ChangeLeverage(data, acc.apiKey, acc.apiSecret, acc.Name);
    });

    await handlePromise(pr);
}

async function handleChangeMarginType(trade) {
    const mt = trade.P[0].mt === 'cross' ? 'CROSSED' : 'ISOLATED'
    const pr = accounts.map(async (acc) => {
        const data = {
            symbol: trade.P[0].s,
            marginType: mt,
        }
        return api.ChangeMarginType(data, acc.apiKey, acc.apiSecret, acc.Name);
    });

    await handlePromise(pr);
}

async function handlePromise(pr) {
    try {
        const results = await Promise.allSettled(pr);
        console.log('resultado', results);
        console.log('waiting trades...');
        // process.exit(0)
    } catch (error) {
        console.log('erro:', error);
    }
}

start()