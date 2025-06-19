const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('isElectron', true);
