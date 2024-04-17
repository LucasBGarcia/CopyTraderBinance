const api = require('../api')
const WebSocket = require('ws');
const Calcula_procentagem = require('./Calcula_porcentagem');
const encontrarPrimeiroNaoZero = require('./Encontra_primeiro_nao_Zero');
var LocalStorage = require('node-localstorage').LocalStorage
localStorage = new LocalStorage('./db')
let dadosJSON = localStorage.getItem('dados.json')
let dados = JSON.parse(dadosJSON)

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


async function PegaMoedar(apiSecret, moeda, apiKey) {
    const ValorCarteiraCliente = await api.InfoAccount(apiSecret, apiKey);
    const moedaSplitCliente = moeda.split('U');
    const moedaCliente = ValorCarteiraCliente.spot.filter(pares => pares.asset === moedaSplitCliente[0]);
    return (moedaCliente);
}


async function copyTrade(trade, apiSecret, apiKey, apiName, PorcentagemMaster) {
    let CompraCliente;
    let VendaCliente;
    const valorAtual = await buscaValor(trade.s);
    if (trade.S == 'BUY') {
        const ValorCarteiraCliente = await api.InfoAccountBalance(apiSecret, apiKey);
        CompraCliente = Calcula_procentagem.calcularValorPorPorcentagem(ValorCarteiraCliente.valorSpot, PorcentagemMaster, trade.q, valorAtual, apiName);
    }
    if (trade.S == 'SELL') {
        const posicZero = encontrarPrimeiroNaoZero(trade.q);
        const ValorCarteiraCliente = await PegaMoedar(apiSecret, trade.s, apiKey);
        const valor = Number(ValorCarteiraCliente[0].free);
        const fator = Math.pow(10, posicZero);
        const arredonda = Math.floor(valor * fator) / fator;
        VendaCliente = arredonda.toFixed(posicZero);
    }
    const data = {
        symbol: trade.s,
        side: trade.S,
        type: trade.o
    };
    if (trade.q && parseFloat(trade.q)) {
        if (CompraCliente) {
            data.quantity = Math.abs(CompraCliente).toString();
        } else if (VendaCliente) {
            data.quantity = Math.abs(VendaCliente).toString();
        } else {
            data.quantity = trade.q;
        }
    }
    if (trade.p && parseFloat(trade.p)) {
        data.price = trade.p;
        data.timeInForce = trade.f;
    }
    if (trade.f && trade.f !== "GTC") {
        data.timeInForce = trade.f;
    }
    if (trade.P && parseFloat(trade.P)) {
        data.stopPrice = trade.P;
    }
    return data;
}

async function copyTradeFutures(trade, apiSecret, apiKey, apiName, isNewOrder, PorcentagemMaster, valorAtualFuturos, alavancagemMaster) {
    let ValorEntrada;
    console.log('trade', trade)
    const valorAtual = !valorAtualFuturos ? await api.GetPriceFutures(trade.s) : valorAtualFuturos
    if (isNewOrder.openPosition) {
        const ValorCarteiraCliente = await api.InfoAccountBalanceFuture(apiSecret, apiKey);
        ValorEntrada = Calcula_procentagem.calcularValorPorPorcentagem(ValorCarteiraCliente.valorFutures, PorcentagemMaster, trade.q, valorAtual, apiName);
    }
    const data = {
        symbol: trade.s,
        side: trade.S,
        type: trade.o
    };
    // if (trade.q && parseFloat(trade.q)) {
    if (isNewOrder.openPosition) {
        let valorFinalEntrada =ValorEntrada* alavancagemMaster
        console.log("ValorEntrada",ValorEntrada)
        console.log("alavancagemMaster",alavancagemMaster)
        console.log("valorFinalEntrada",valorFinalEntrada)
        data.quantity = Math.abs(ValorEntrada).toString();
    } else {
        const positivo = Math.abs(Number(isNewOrder.positionAmt))
        data.quantity = positivo;
    }
    // }
    if (trade.p && parseFloat(trade.p)) {
        data.price = trade.p;
    }
    if ((trade.f && trade.f !== "GTC") || trade.o === 'LIMIT') {
        data.timeInForce = trade.f;
    }
    if (trade.sp && parseFloat(trade.sp)) {
        data.stopPrice = trade.sp;
    }
    if (trade.ps) {
        data.positionSide = trade.ps;
    }
    if (trade.AP && parseFloat(trade.AP)) {
        data.activationPrice = trade.AP;
    }
    if (trade.cr && parseFloat(trade.cr)) {
        data.callbackRate = trade.cr;
    }
    dados.ordens.push(trade.i);
    localStorage.setItem('dados.json', JSON.stringify(dados));
    return data;
}


module.exports = {
    copyTradeFutures,
    copyTrade
}