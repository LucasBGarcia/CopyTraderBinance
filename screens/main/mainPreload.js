const { contextBridge, ipcMain, ipcRenderer } = require("electron")

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


let bridge = {
  saveData,
  teste, testeRetorno
};

contextBridge.exposeInMainWorld("Bridge", bridge);
