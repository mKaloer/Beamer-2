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
let canvas

let pageOffset = window.__args__.pageOffset || 0
// Skip n pages each time
let skipPages = window.__args__.skipPages || 0
let origWidth = 0
let origHeight = 0
let maxSlideNumber = 0
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

// ------------
// PDF HANDLING
// ------------

showPdf = function(pdfUrl) {
    var data = new Uint8Array(fs.readFileSync(pdfUrl));
    PDFJS.getDocument(data).then(pdf => {
	currPdf = pdf
	// Calculate max page
	var maxPage = currPdf.numPages + pageOffset
	while ((maxPage - 1 - pageOffset) % (skipPages + 1) != 0) {
	    maxPage -= 1
	}
	maxSlideNumber = maxPage
	// Go to slide
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
    newPage = Math.max(Math.min(newPage, maxSlideNumber), 1 + pageOffset)
    goToSlide(newPage)
}

goToSlide = function(slideNbr) {
    currPdf.getPage(slideNbr).then(function(page) {
	currPage = slideNbr
	var pageViewport = page.getViewport(1.0)
	var viewport
	var widthRatio = origWidth / pageViewport.width
	var heightRatio = origHeight / pageViewport.height
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
    if (show) {
	canvas.style.visibility = "hidden"
    } else {
	canvas.style.visibility = "visible"
    }
}

module.exports = function(canvasId, type) {
    // Identify renderer
    ipcRenderer.send('subscribeRenderer', type)
    // Get bg color
    settings.get('colors.presentation_bg').then(val => {
	if (val) {
	    document.getElementsByTagName('BODY')[0].style.backgroundColor = val
	}
    })


    canvas = document.getElementById(canvasId)
    origWidth = window.innerWidth
    origHeight = window.innerHeight
}
