function encontrarPrimeiroNaoZero(numero) {
    const string = numero.toString();
    let valorSplit = string.split('.');
    let valor = valorSplit[1];
    let contador = 0;
    for (let i = valor.length - 1; i >= 0; i--) {
        contador++;
        if (valor[i] !== '0') {
            return valor.length - contador + 1;
        }
    }
    return 0; // Retorna 0 se todos os dígitos forem zeros
}

module.exports = encontrarPrimeiroNaoZero