// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron')
const path = require('path')
const fs = require('fs');
const PDFJS = require('pdfjs-dist')
PDFJS.PDFJS.workerSrc = path.join(path.dirname(require.resolve('pdfjs-dist')),'pdf.worker.js')

//'pdfjs-dist/build/pdf.worker.js'

currPdf = null;
currPage = null

const settings = require('electron-settings');

// ------------
// IPC MESSAGES
// ------------

ipcRenderer.on('showPdf', (event, pdf) => {
    showPdf(pdf)
})

ipcRenderer.on('gotoRelativeSlide', (event, relSlide) => {
    gotoRelativeSlide(relSlide)
})

ipcRenderer.on('gotoPage', (event, slide) => {
    goToSlide(slide)
})


_setup = function() {
    // Identify renderer
    ipcRenderer.send('subscribeRenderer')
    // Get bg color
    settings.get('colors.presentation_bg').then(val => {
	console.log(val)
	if (val) {
	    document.getElementsByTagName('BODY')[0].style.backgroundColor = val
	}
    })
}

// ------------
// PDF HANDLING
// ------------

showPdf = function(pdfUrl) {
    var data = new Uint8Array(fs.readFileSync(pdfUrl));
    PDFJS.getDocument(data).then(pdf => {
	currPdf = pdf
	goToSlide(1)
    })
}

gotoRelativeSlide = function(relativeSlide) {
    newPage = currPage + relativeSlide
    // Make sure it is within bounds
    newPage = Math.max(Math.min(newPage, currPdf.numPages), 1)
    goToSlide(newPage)
}

goToSlide = function(slideNbr) {
    currPdf.getPage(slideNbr).then(function(page) {
	currPage = slideNbr
	var canvas = document.getElementById('main-pdf')
	var pageViewport = page.getViewport(1.0)
	var viewport
	var widthRatio = window.innerWidth / pageViewport.width
	var heightRatio = window.innerHeight / pageViewport.height
	if (widthRatio < heightRatio) {
	    viewport = page.getViewport(widthRatio)
	} else {
	    viewport = page.getViewport(heightRatio)
	}
	canvas.height = viewport.height
	canvas.width = viewport.width
	var context = canvas.getContext('2d')
	var renderContext = {
	    canvasContext: context,
	    viewport: viewport
	};
	page.render(renderContext)

    });
}


// Setup
_setup()
