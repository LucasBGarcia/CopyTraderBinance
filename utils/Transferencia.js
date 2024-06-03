const api = require("../api")
const Calcula_procentagem = require("./Calcula_porcentagem")

async function Futuros_para_spot(apiKey, apiSecret, apiName, porcentagem, symbol) {
    const ValorCarteiraCliente = await api.InfoAccountBalanceFuture(apiSecret, apiKey);
    const valorTransferenciaCliente = Calcula_procentagem.calcularValorPorPorcentagemTransferencia(ValorCarteiraCliente.valorFutures, porcentagem, apiName)
    const data = {
        type: "UMFUTURE_MAIN",
        asset: symbol,
        amount: valorTransferenciaCliente
    }
    const response = await api.TransferFuturesToSpot(data, apiKey, apiSecret, apiName)
    return (response)
}

async function Spot_para_futuros(apiKey, apiSecret, apiName, porcentagem, symbol) {
    const ValorCarteiraCliente = await api.InfoAccountBalance(apiSecret, apiKey);
    const valorTransferenciaCliente = Calcula_procentagem.calcularValorPorPorcentagemTransferencia(ValorCarteiraCliente.valorSpot, porcentagem, apiName)
    const data = {
        type: "MAIN_UMFUTURE",
        asset: symbol,
        amount: valorTransferenciaCliente
    }
    const response = await api.TransferFuturesToSpot(data, apiKey, apiSecret, apiName)
    return (response)
}


module.exports = {
    Futuros_para_spot,
    Spot_para_futuros
}