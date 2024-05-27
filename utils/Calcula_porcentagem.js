const api = require('../api')
const encontrarPrimeiroNaoZero = require('./Encontra_primeiro_nao_Zero');

function calcularValorPorPorcentagem(valorCarteira, porcentagem, tradeq, valorAtual, apiName) {
    const quantidadeNumber = Number(tradeq);
    const valor = encontrarPrimeiroNaoZero(quantidadeNumber.toFixed(8));
    const valorReferentePorcentagem = (porcentagem / 100) * valorCarteira;
    const result = valorReferentePorcentagem / valorAtual;
    console.log(`${apiName} - Valor gasto: USDT ${valorReferentePorcentagem}`);
    return result.toFixed(valor);
}

function calcularValorPorPorcentagemTransferencia(valorCarteira, porcentagemMaster, apiName) {
    const valorReferentePorcentagem = (porcentagemMaster / 100) * valorCarteira;
    console.log(`${apiName} - Valor transferido: USDT ${valorReferentePorcentagem.toFixed(3)}`);
    return valorReferentePorcentagem.toFixed(3);
}

async function tradePorcentageMasterFuturos(ValorTotalMasterFuturos, AlavancagemMaster) {
    const ValueAfterTrade = await api.InfoAccountBalanceFuture(process.env.TRADER0_API_SECRET, process.env.TRADER0_API_KEY);
    const valorgasto = ValorTotalMasterFuturos - ValueAfterTrade.valorFutures;
    // const valorgasto = trade.wb - trade.cw;
    const porcentagem = (valorgasto / ValorTotalMasterFuturos) * 100;
    const porcentagemFinal = porcentagem;

    // const porcentagemFinal = porcentagem.toFixed(2) * AlavancagemMaster;
    return porcentagemFinal.toFixed(2);
}

async function tradePorcentageMaster(ValorTotalMasterSpot) {
    const ValueAfterTrade = await api.InfoAccountBalance(process.env.TRADER0_API_SECRET, process.env.TRADER0_API_KEY);
    const valorgasto = ValorTotalMasterSpot - ValueAfterTrade.valorSpot;
    const porcentagem = (valorgasto / ValorTotalMasterSpot) * 100;
    return porcentagem.toFixed(2);
}


module.exports = {
    calcularValorPorPorcentagem,
    tradePorcentageMasterFuturos,
    tradePorcentageMaster,
    calcularValorPorPorcentagemTransferencia
}