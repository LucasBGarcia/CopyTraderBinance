const { app, BrowserWindow, ipcMain } = require("electron");
const MainScreen = require("./screens/main/mainScreen.js");
const fs = require("fs");

let curWindow;

function createWindow() {
    curWindow = new MainScreen();
}

ipcMain.on("saveData", (sender, data) => {
    console.log(data);
    let sData = JSON.stringify(data);
    fs.writeFileSync("data/data.json", sData);
    console.log("Data Saved");
});

ipcMain.on("teste", (sender, data) => {
    console.log(data);
    console.log("Data Savedteste");
    let valor = 'valor da main'
});
ipcMain.on("testeRetorno", (sender, data) => {
    console.log(data);
    console.log("Data Savedteste");
    let valor = 'valor da main'
});

ipcMain.on("dados:request", (event) => {
    // Lê os dados do arquivo data.json
    const dados = lerDados();
    // Envia os dados para o processo de renderização
    event.sender.send("dados:response", dados);
});


app.whenReady().then(() => {
    createWindow();

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length == 0) createWindow();
    });

    //Read the data
    let res = fs.existsSync("data/data.json");
    console.log(res);
    if (res) {
        let dt = fs.readFileSync("data/data.json");
        let data = JSON.parse(dt);
        console.log('dataaaa', data);
    }
});

//Global exception handler
process.on("uncaughtException", function (err) {
    console.log(err);
});

app.on("window-all-closed", function () {
    if (process.platform != "darwin") app.quit();
});
