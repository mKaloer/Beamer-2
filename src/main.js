const electron = require('electron')
const {ipcMain, app} = require('electron')
const window = require('electron-window')
const settings = require('electron-settings')
const path = require('path')

const presentationManager = require('./presentation-manager.js');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
    // Create the browser window.
    //startPresentation()
    // and load the index.html of the app.
    mainWindow = window.createWindow({
	webPreferences: {
	    webSecurity: false,
	}
    })
    mainWindow.showUrl(path.join(__dirname, 'index.html'))
    //mainWindow.webContents.openDevTools()

    // Open the DevTools.
    //mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
	mainWindow = null
	app.exit()
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
	createWindow()
    }
})

function startPresentation(pdfUrl, noteFormat) {
    const {dialog} = require('electron')
    currPdfUrl = pdfUrl
    presentationManager.startPresentation(pdfUrl, noteFormat)
}

ipcMain.on('startPresentation', (event, path) => {
    startPresentation(path)
})
