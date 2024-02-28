/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./main.js":
/*!*****************!*\
  !*** ./main.js ***!
  \*****************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

eval("const { app, BrowserWindow, ipcMain } = __webpack_require__(/*! electron */ \"electron\");\r\nconst MainScreen = __webpack_require__(/*! ./screens/main/mainScreen.js */ \"./screens/main/mainScreen.js\");\r\nconst fs = __webpack_require__(/*! fs */ \"fs\");\r\n\r\nlet curWindow;\r\n\r\nfunction createWindow() {\r\n    curWindow = new MainScreen();\r\n}\r\n\r\nipcMain.on(\"saveData\", (sender, data) => {\r\n    console.log(data);\r\n    let sData = JSON.stringify(data);\r\n    fs.writeFileSync(\"data/data.json\", sData);\r\n    console.log(\"Data Saved\");\r\n});\r\n\r\nipcMain.on(\"teste\", (sender, data) => {\r\n    console.log(data);\r\n    console.log(\"Data Savedteste\");\r\n    let valor = 'valor da main'\r\n});\r\nipcMain.on(\"testeRetorno\", (sender, data) => {\r\n    console.log(data);\r\n    console.log(\"Data Savedteste\");\r\n    let valor = 'valor da main'\r\n});\r\n\r\nipcMain.on(\"dados:request\", (event) => {\r\n    // Lê os dados do arquivo data.json\r\n    const dados = lerDados();\r\n    // Envia os dados para o processo de renderização\r\n    event.sender.send(\"dados:response\", dados);\r\n});\r\n\r\n\r\napp.whenReady().then(() => {\r\n    createWindow();\r\n\r\n    app.on(\"activate\", function () {\r\n        if (BrowserWindow.getAllWindows().length == 0) createWindow();\r\n    });\r\n\r\n    //Read the data\r\n    let res = fs.existsSync(\"data/data.json\");\r\n    console.log(res);\r\n    if (res) {\r\n        let dt = fs.readFileSync(\"data/data.json\");\r\n        let data = JSON.parse(dt);\r\n        console.log('dataaaa', data);\r\n    }\r\n});\r\n\r\n//Global exception handler\r\nprocess.on(\"uncaughtException\", function (err) {\r\n    console.log(err);\r\n});\r\n\r\napp.on(\"window-all-closed\", function () {\r\n    if (process.platform != \"darwin\") app.quit();\r\n});\r\n\n\n//# sourceURL=webpack://botclone/./main.js?");

/***/ }),

/***/ "./screens/main/mainScreen.js":
/*!************************************!*\
  !*** ./screens/main/mainScreen.js ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const { app, BrowserWindow, ipcMain, globalShortcut } = __webpack_require__(/*! electron */ \"electron\")\r\nconst path = __webpack_require__(/*! path */ \"path\")\r\n\r\nclass MainScreen {\r\n    window;\r\n\r\n    position = {\r\n        width: 1000,\r\n        height: 600,\r\n        maximized: false,\r\n    };\r\n\r\n    constructor() {\r\n        this.window = new BrowserWindow({\r\n            width: this.position.width,\r\n            height: this.position.height,\r\n            title: \"This is a test application\",\r\n            show: false,\r\n            removeMenu: true,\r\n            acceptFirstMouse: true,\r\n            autoHideMenuBar: true,\r\n            webPreferences: {\r\n                contextIsolation: true,\r\n                preload: path.join(\"./mainPreload.js\"),\r\n            },\r\n        });\r\n\r\n        this.window.once(\"ready-to-show\", () => {\r\n            this.window.show();\r\n\r\n            if (this.position.maximized) {\r\n                this.window.maximize();\r\n            }\r\n        });\r\n\r\n        this.handleMessages();\r\n\r\n        let wc = this.window.webContents;\r\n        wc.openDevTools({ mode: \"undocked\" });\r\n\r\n        this.window.loadFile(\"./screens/main/main.html\");\r\n    }\r\n\r\n    close() {\r\n        this.window.close();\r\n        ipcMain.removeAllListeners();\r\n    }\r\n\r\n    hide() {\r\n        this.window.hide();\r\n    }\r\n\r\n    handleMessages() {\r\n        //Ipc functions go here.\r\n    }\r\n}\r\nmodule.exports = MainScreen\r\n\r\n// export default MainScreen;\n\n//# sourceURL=webpack://botclone/./screens/main/mainScreen.js?");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("electron");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./main.js");
/******/ 	
/******/ })()
;