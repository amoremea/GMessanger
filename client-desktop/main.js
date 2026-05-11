const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
  width: 800,
  height: 600,
  webPreferences: {
    nodeIntegration: true,    
    contextIsolation: false,  
    webSecurity: false        
    }
  });

  win.loadURL("http://localhost:3000");
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);