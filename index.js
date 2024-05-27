require("dotenv").config();
const WebSocket = require('ws');
const api = require("./api");
const Transferencia = require("./utils/Transferencia")
const Calcula_procentagem = require("./utils/Calcula_porcentagem")
const Copy_Trade = require("./utils/Copy_Trade")
var LocalStorage = require('node-localstorage').LocalStorage
localStorage = new LocalStorage('./db')

const accounts = [];
const accountsFutures = [];
let ValorTotalMasterSpot;
let ValorTotalMasterFuturos;
let PorcentagemMaster;
let AlavancagemMaster = 1;
let valorAtualFuturos;
let dadosJSON = localStorage.getItem('dados.json')
let dados = JSON.parse(dadosJSON)

async function loadAccounts() {
    const listenKey = await api.connectAccount();
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
    await ShowBalances()
    return listenKey;
}

async function ShowBalances() {
    await Promise.all(accounts.map(async (account) => {
        const balance = await api.InfoAccountBalance(account.apiSecret, account.apiKey);
        console.log(`${account.Name} USDT SPOT ${balance.valorSpot}`);
    }));
    await Promise.all(accountsFutures.map(async (account) => {
        const balance = await api.InfoAccountBalanceFuture(account.apiSecret, account.apiKey);
        console.log(`${account.Name} USDT FUTURES ${balance.valorFutures}`);
    }));
}

let oldTrade = false
let oldOrders = {}

async function start() {
    console.clear();
    const valoresIniciais = await api.InfoAccountBalance(process.env.TRADER0_API_SECRET, process.env.TRADER0_API_KEY);
    const valoresIniciaisF = await api.InfoAccountBalanceFuture(process.env.TRADER0_API_SECRET, process.env.TRADER0_API_KEY);
    ValorTotalMasterSpot = valoresIniciais.valorSpot;
    ValorTotalMasterFuturos = valoresIniciaisF.valorFutures;

    const listenKey = await loadAccounts();
    const ws = new WebSocket(`${process.env.BINANCE_WS_URL}/${listenKey.listenKeySpot.listenKey}`);
    const wsFuture = new WebSocket(`${process.env.BINANCE_WS_URL_FUTURE}/${listenKey.listenKeyFutures.listenKey}`);

    wsFuture.onmessage = async (event) => {
        const trade = JSON.parse(event.data);
        // console.log('trade FUTUROS', trade)
        // console.log('trade FUTUROS', trade.a)

        console.log('Efetuando trades no futuros, aguarde...');
        if (trade.o && Number(trade.o.L) > 0) {
            valorAtualFuturos = Number(trade.o.L);
        }
        if (trade.a && trade.a.m === 'MARGIN_TYPE_CHANGE') {
            await handleChangeMarginType(trade.a);
        }
        if (trade.e === 'ACCOUNT_CONFIG_UPDATE') {
            await handleChangeLeverage(trade.ac);
        }
        PorcentagemMaster = await Calcula_procentagem.tradePorcentageMasterFuturos(ValorTotalMasterFuturos, AlavancagemMaster);
        if (trade.e === 'ORDER_TRADE_UPDATE') {
            dados.ordens.map((ordem) => {
                if (ordem === trade.o.i) {
                    oldTrade = true;
                }
            });
        }

        if (trade.e === "ORDER_TRADE_UPDATE") {
            if (!oldTrade) {
                if ((trade.o.o === 'MARKET' || trade.o.o === 'LIMIT') && trade.o.X === 'NEW') {
                    console.log('trade', trade)
                    await handleNewTradeFutures(trade.o);
                    oldTrade = false;
                }
                if ((trade.o.o === 'STOP_MARKET' || trade.o.o === 'TAKE_PROFIT_MARKET') && trade.o.X === 'NEW') {
                    await handleNewTradeFutures(trade.o);
                }
            } else if (trade.o.o === 'MARKET' && trade.o.X === 'FILLED') {
                await handleNewTradeFutures(trade.o);

            }
        }
        if (trade.e === "ORDER_TRADE_UPDATE" && trade.o.o === 'LIMIT' && trade.o.X === 'CANCELED') {
            await handleCanceledOrdersFutures(trade.o);

        }
    };
    ws.onmessage = async (event) => {
        const trade = JSON.parse(event.data);
        console.log('Verificando condições de trade, aguarde...')
        if (trade.e === 'balanceUpdate') {
            const porcentagemMaster = (trade.d / ValorTotalMasterFuturos) * 100;
            accounts.map(async (acc) => {
                const result = await Transferencia.Futuros_para_spot(acc.apiKey, acc.apiSecret, acc.Name, porcentagemMaster, trade.d, trade.a)
                // console.log('result', result)
            })
        }
        if (trade.e === 'executionReport' && trade.x === 'CANCELED') {
            if (trade.o === 'LIMIT' || trade.o === 'STOP_LOSS_LIMIT' || trade.o === 'TAKE_PROFIT_LIMIT') {
                console.log('Efetuando trades em spot, aguarde...')
                oldOrders[trade.i] = true;
                await handleCanceledOrders(trade);
            }
        }

        if (trade.e === 'executionReport' && !oldOrders[trade.i]) {
            console.log('Efetuando trades em spot, aguarde...')
            oldOrders[trade.i] = true;
            PorcentagemMaster = await Calcula_procentagem.tradePorcentageMaster(ValorTotalMasterSpot);
            await handleNewOrders(trade);
        }
    };

    console.log('waiting trades...');
    setInterval(api.connectAccount, 59 * 60 * 1000);
}

async function handleCanceledOrders(trade) {
    const pr = accounts.map(async (acc) => {
        const infos = { symbol: trade.s };
        const response = await api.GetOrder(trade, acc.apiKey, acc.apiSecret, acc.Name, false);

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

async function handleNewOrders(trade) {
    const pr = accounts.map(async (acc) => {
        const data = await Copy_Trade.copyTrade(trade, acc.apiSecret, acc.apiKey, acc.Name, PorcentagemMaster);
        return api.newOrder(data, acc.apiKey, acc.apiSecret, acc.Name);
    });

    await handlePromise(pr);
}
async function handleNewTradeFutures(trade) {
    const handleAccount = async (acc) => {
        const response = await api.GetOrderFutures(trade, acc.apiKey, acc.apiSecret, acc.Name);
        const data = await Copy_Trade.copyTradeFutures(trade, acc.apiSecret, acc.apiKey, acc.Name, response, PorcentagemMaster, valorAtualFuturos, AlavancagemMaster);
        return api.newOrderFutures(data, acc.apiKey, acc.apiSecret, acc.Name);
    };

    const promises = accountsFutures.map(handleAccount);
    await handlePromise(promises);
}

// async function handleNewOrdersFutures(trade) {
//     const response = {
//         openPosition: true,
//         positionAmt: 0
//     };
//     const handleAccount = async (acc) => {
//         const data = await Copy_Trade.copyTradeFutures(trade, acc.apiSecret, acc.apiKey, acc.Name, response, PorcentagemMaster);
//         return api.newOrderFutures(data, acc.apiKey, acc.apiSecret, acc.Name);
//     };


//     const promises = accounts.map(handleAccount);
//     await handlePromise(promises);
// }

async function handleChangeLeverage(trade) {
    AlavancagemMaster = trade.l;
    const pr = accountsFutures.map(async (acc) => {
        const data = {
            symbol: trade.s,
            leverage: trade.l
        };
        return api.ChangeLeverage(data, acc.apiKey, acc.apiSecret, acc.Name);
    });

    await handlePromise(pr);
}

async function handleChangeMarginType(trade) {
    const mt = trade.P[0].mt === 'cross' ? 'CROSSED' : 'ISOLATED';
    const pr = accountsFutures.map(async (acc) => {
        const data = {
            symbol: trade.P[0].s,
            marginType: mt,
        };
        return api.ChangeMarginType(data, acc.apiKey, acc.apiSecret, acc.Name);
    });

    await handlePromise(pr);
}

async function handlePromise(pr) {
    try {
        const results = await Promise.allSettled(pr);
        console.log('resultado', results);
        await ShowBalances()
        console.log('waiting trades...');
        // process.exit(0)
    } catch (error) {
        console.log('erro:', error);
    }
}

start();