const electron = require('electron')
const {ipcMain} = require('electron')
const electronLocalshortcut = require('electron-localshortcut');
const window = require('electron-window')
const path = require('path')
const url = require('url')


// Current PDF url
let currPdfUrl

// List of all presentation listeners
let rendererIpcs = []

let mainWindow
let presentationWindows = []
let displayInfo
let isHidden = false

exports.startPresentation = function(pdfUrl) {
    currPdfUrl = pdfUrl
    // Present on all external displays
    displayInfo = getDisplays()
    if (displayInfo.external.length > 0) {
	// Main window becomes note-window
	mainWindow = createNoteWindow(displayInfo.main)
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
    var noteWindow = window.createWindow({
	x: display.bounds.x,
	y: display.bounds.y,
	fullscreen: true,
	webPreferences: {
	    webSecurity: false,
	}
    })

    const windowArgs = {
	skipPages: 1,
	pageOffset: 1,
	type: 'notes'
    }

    noteWindow.showUrl(path.join(__dirname, 'notes-view.html'), windowArgs)

    setupKeybindings(noteWindow)
    return noteWindow
}

function createPresentationWindow(display) {
    var presentationWindow = window.createWindow({
	x: display.bounds.x,
	y: display.bounds.y,
	fullscreen: true,
	webPreferences: {
	    webSecurity: false,
	}
    })

    const windowArgs = {
	skipPages: 1,
	pageOffset: 0,
	type: 'presenter'
    }

    presentationWindow.showURL(path.join(__dirname, 'presentation-view.html'), windowArgs)

    setupKeybindings(presentationWindow)
    return presentationWindow
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
    electronLocalshortcut.register(win, 'b', () => {
	togglePresentation()
    })
    electronLocalshortcut.register(win, 'h', () => {
	togglePresentation()
    })
}


// IPCs
ipcMain.on('subscribeRenderer', (event, type) => {
    rendererIpcs.push({
	ipc: event.sender,
	type: type
    })
    event.sender.send('showPdf', currPdfUrl)
})

function nextSlide() {
    rendererIpcs.forEach(function(renderer) {
	renderer.ipc.send('gotoRelativeSlide', 1)
    })
}

function prevSlide() {
    rendererIpcs.forEach(function(renderer) {
	renderer.ipc.send('gotoRelativeSlide', -1)
    })
}

function togglePresentation() {
    isHidden = !isHidden
    rendererIpcs.forEach(function(renderer) {
	if (renderer.type == 'presenter') {
	    renderer.ipc.send('togglePresentation', isHidden)
	}
    })
}
