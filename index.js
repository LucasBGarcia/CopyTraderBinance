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
            data.quantity = CompraCliente.toString()
        } else if (VendaCliente) {
            data.quantity = VendaCliente.toString()
        } else {
            data.quantity = trade.q
        }
    }
    if (trade.p && parseFloat(trade.p)) {
        data.price = trade.ptes
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
let option;
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
                const promises = await api.newOrder(data, acc.apiKey, acc.apiSecret, acc.Name);
                return promises;
            });
            if (pr) {
                const results = await Promise.allSettled(pr);
                console.log('resultado', results);
            } else {
                console.log('erro no if pr');
            }
        }

    };
    console.log('waiting trade...')
    setInterval(() => {
        api.connectAccount();
    }, 59 * 60 * 1000);

}

async function menu() {
    console.log('menu')


    do {
        titulo('Controle de Estoque Mercado')
        console.log('1. Cadastrar Produto')
        console.log('2. Produtos Cadastrados')
        console.log('3. Vender Produto')
        console.log('4. Caixa')
        console.log('5. Remover Produto da Lista')
        console.log('6. Encerrar seção')
        var opcao = Number(prompt('Opção: '))
        switch (opcao) {
            case 1:
                await start()
                break
            case 2: console.log('2')
                break
            case 3:
                console.log('33')
                break
            case 4:
                caixa()
                break
            case 5:
                RemoverProduto()
        }
    } while (opcao != 6)



}
function titulo(mensa) {
    console.log()
    console.log(mensa)
    console.log('================================================')
}

function mensagem(aviso) {
    console.log(`\n${aviso}\n`)
    prompt('Pressione "Enter" para continuar...')
}
menu()