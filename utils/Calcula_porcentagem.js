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

async function tradePorcentageMasterFuturos(ValorTotalMasterFuturos, AlavancagemMaster) {
    const ValueAfterTrade = await api.InfoAccountBalanceFuture(process.env.TRADER0_API_SECRET, process.env.TRADER0_API_KEY);
    const valorgasto = ValorTotalMasterFuturos - ValueAfterTrade.valorFutures;
    // const valorgasto = trade.wb - trade.cw;
    const porcentagem = (valorgasto / ValorTotalMasterFuturos) * 100;
    console.log('ValorTotalMasterFuturos', ValorTotalMasterFuturos);
    console.log('ValueAfterTrade.valorFutures', ValueAfterTrade.valorFutures);
    console.log('valorgasto', valorgasto);
    console.log('porcentagem', porcentagem);
    const porcentagemFinal = porcentagem;
    // const porcentagemFinal = porcentagem.toFixed(2) * AlavancagemMaster;
    console.log('porcentagemFinal', porcentagemFinal)
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
    tradePorcentageMaster
}