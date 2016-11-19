/*
  This is the presentation renderer.

  Arguments:
      pageOffset: Number of pages to offset in the pdf
      skipPages:  Number of pages to skip from the page
*/

const {ipcRenderer} = require('electron')
const path = require('path')
const fs = require('fs');
const PDFJS = require('pdfjs-dist')
PDFJS.PDFJS.workerSrc = path.join(path.dirname(require.resolve('pdfjs-dist')),'pdf.worker.js')

require('electron-window').parseArgs()

currPdf = null;
currPage = null

const settings = require('electron-settings');

pageOffset = window.__args__.pageOffset || 0
// Skip n pages each time
skipPages = window.__args__.skipPages || 0

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

ipcRenderer.on('togglePresentation', (event, show) => {
    togglePresentation(show)
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
	goToSlide(1 + pageOffset)
    })
}

gotoRelativeSlide = function(relativeSlide) {
    var skip = skipPages
    if (relativeSlide < 0) {
	skip *= -1
    }
    newPage = currPage + relativeSlide + skip
    // Make sure it is within bounds
    newPage = Math.max(Math.min(newPage, currPdf.numPages), 1 + pageOffset)
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

togglePresentation = function(show) {
    var canvas = document.getElementById('main-pdf')
    if (show) {
	canvas.style.visibility = "hidden"
    } else {
	canvas.style.visibility = "visible"
    }
}


// Setup
_setup()
