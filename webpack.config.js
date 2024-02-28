const path = require('path');

module.exports = {
    entry: './main.js', // O arquivo JavaScript principal do seu aplicativo
    output: {
        filename: 'bundle.js', // O nome do arquivo de saída que o Webpack irá gerar
        path: path.resolve(__dirname, 'dist') // O diretório de saída onde o bundle será gerado
    },
    target: 'electron-main', // Configuração para a versão do Electron
    node: {
        __dirname: false, // Mantém o valor padrão de __dirname
        __filename: false // Mantém o valor padrão de __filename
    },
    resolve: {
        extensions: ['.js'] // Permite importar arquivos .js sem especificar a extensão
    }
};
