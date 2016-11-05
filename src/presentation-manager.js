const electron = require('electron')
const {ipcMain, BrowserWindow} = require('electron')
const electronLocalshortcut = require('electron-localshortcut');
const path = require('path')
const url = require('url')


// Current PDF url
let currPdfUrl

// List of all presentation listeners
let rendererIpcs = []

let mainWindow
let presentationWindows = []
let displayInfo

exports.startPresentation = function(pdfUrl) {
    currPdfUrl = pdfUrl
    // Present on all external displays
    displayInfo = getDisplays()
    if (displayInfo.external.length > 0) {
	// Main window becomes note-window
	mainWindow = createNoteWindow(displayInfo.main)
	mainWindow.webContents.openDevTools()
	displayInfo.external.forEach(disp => {
	    presentationWindows.push(createPresentationWindow(disp))
	})
    } else {
	// Main window becomes presentation window
	mainWindow = createPresentationWindow(displayInfo.main)
    }
}

function getDisplays() {
    var displayInfo = {}
    var screen = electron.screen
    var displays = screen.getAllDisplays();
    var externalDisplays = []
    var mainDisplay
    for (var i in displays) {
	if (displays[i].bounds.x > 0 || displays[i].bounds.y > 0) {
	    externalDisplays.push(displays[i])
	} else {
	    mainDisplay = displays[i]
	}
    }
    displayInfo.external = externalDisplays
    displayInfo.main = mainDisplay
    return displayInfo
}

function createNoteWindow(display) {
    var window = new BrowserWindow({
	x: display.bounds.x,
	y: display.bounds.y,
	fullscreen: true,
	webPreferences: {
	    webSecurity: false,
	}
    })

    window.loadURL(url.format({
	pathname: path.join(__dirname, 'index.html'),
	protocol: 'file:',
	slashes: true
    }))

    setupKeybindings(window)
    return window
}

function createPresentationWindow(display) {
    var window = new BrowserWindow({
	x: display.bounds.x,
	y: display.bounds.y,
	fullscreen: true,
	webPreferences: {
	    webSecurity: false,
	}
    })

    window.loadURL(url.format({
	pathname: path.join(__dirname, 'presentation-view.html'),
	protocol: 'file:',
	slashes: true
    }))

    setupKeybindings(window)
    return window
}

function setupKeybindings(win) {
    electronLocalshortcut.register(win, 'Right', () => {
	nextSlide()
    })
    electronLocalshortcut.register(win, 'n', () => {
	nextSlide()
    })
    electronLocalshortcut.register(win, 'Space', () => {
	nextSlide()
    })
    electronLocalshortcut.register(win, 'Left', () => {
	prevSlide()
    })
    electronLocalshortcut.register(win, 'p', () => {
	prevSlide()
    })
}


// IPCs
ipcMain.on('subscribeRenderer', (event) => {
    rendererIpcs.push(event.sender)
    event.sender.send('showPdf', currPdfUrl)
})


function nextSlide() {
    rendererIpcs.forEach(function(renderer) {
	renderer.send('gotoRelativeSlide', 1)
    })
}

function prevSlide() {
    rendererIpcs.forEach(function(renderer) {
	renderer.send('gotoRelativeSlide', -1)
    })
}
