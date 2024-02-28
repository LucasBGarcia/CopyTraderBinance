import { contextBridge, ipcMain, ipcRenderer } from ("electron")
import { ipcRenderer } from ("electron");

// require("dotenv").config();
import WebSocket from ('ws')
import api from ("../../api")
const accounts = []


let saveData = (fname, city, site, car, song, mobile) => {
  let data = { fname, city, site, car, song, mobile };
  console.log(data);
  ipcRenderer.send("saveData", data);
};
let teste = (data) => {
  console.log('mainPreload', data);
  console.log(data);
  const valorPreload = 'valorPreload'
  ipcRenderer.send("teste", data);
};
let testeRetorno = (data) => {
  console.log('mainPreload', data);
  console.log(data);
  const valorPreload = 'valorPreload'
  ipcRenderer.send("teste", data);
};

// Solicita os dados do arquivo data.json ao processo principal
ipcRenderer.send("dados:request");

// Ouve a resposta do processo principal
ipcRenderer.on("dados:response", (event, dados) => {
  // Faça o que desejar com os dados recebidos
  console.log('Dados recebidos:', dados);
});



let bridge = {
  saveData,
  teste, testeRetorno
};

contextBridge.exposeInMainWorld("Bridge", bridge);
