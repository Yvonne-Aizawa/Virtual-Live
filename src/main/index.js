import { app, BrowserWindow, ipcMain } from "electron";

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== "development") {
  global.__static = require("path")
    .join(__dirname, "/static")
    .replace(/\\/g, "\\\\");
}

let mainWindow;
let live2dWindow;
let detectionWorker;
const winURL =
  process.env.NODE_ENV === "development"
    ? `http://localhost:9080/`
    : `file://${__dirname}/`;

/* create windows ------------------------------------- */

function createWindow() {
  if (mainWindow) {
    return;
  }
  mainWindow = new BrowserWindow({
    height: 230,
    width: 200,
    resizable: false,
    title: "Atelier Pumpkin"
  });

  mainWindow.loadURL(winURL + "launcher.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createLive2d(locale) {
  if (live2dWindow) {
    return;
  }
  live2dWindow = new BrowserWindow({
    height: 550,
    useContentSize: true,
    width: 950,
    show: false
  });

  live2dWindow.loadURL(winURL + "live2d.html");

  live2dWindow.once("ready-to-show", () => {
    if (locale) {
      live2dWindow.webContents.send("setLanguage", locale);
    }
    live2dWindow.show();
  });

  live2dWindow.on("closed", () => {
    live2dWindow = null;
  });
}

function createDetectionWorker(deviceId) {
  if (detectionWorker) {
    return;
  }

  detectionWorker = new BrowserWindow({
    // show: false,
    webPreferences: { nodeIntegration: true }
  });

  detectionWorker.loadURL(winURL + "detection.html");

  detectionWorker.on("ready-to-show", () => {
    deviceId.webContents.send("setVideoDevice", deviceId);
  });

  detectionWorker.on("closed", () => {
    detectionWorker = null;
  });
}

/* wrapper methods ------------------------------------- */

function sendWindowMessage(targetWindow, message, payload) {
  if (typeof targetWindow === "undefined") {
    console.log("Target window does not exist");
    return;
  }
  targetWindow.webContents.send(message, payload);
}

/* on methods ------------------------------------------ */

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/* ipc communications ---------------------------------- */

ipcMain.on("launch-live2d", (event, locale) => {
  createLive2d(locale);
});

ipcMain.on("launch-detection", (event, deviceId) => {
  createDetectionWorker(deviceId);
});

ipcMain.on("setLanguage", (event, locale) => {
  sendWindowMessage(live2dWindow, "setLanguage", locale);
});

// setup message channels
ipcMain.on("window-message-from-worker", (event, arg) => {
  sendWindowMessage(live2dWindow, "message-from-worker", arg);
});

/* ---------------------------------------------------- */

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
