/*
  This is the main renderer.
*/

const {ipcRenderer} = require('electron')
const path = require('path')

const settings = require('electron-settings');

var startPresentationBtn = document.querySelector('#start-btn')
startPresentationBtn.disabled = true // Disable until file has been picked
var pdfPicker = document.querySelector('#pdf-file')
pdfPicker.addEventListener('change', function () {
    if (pdfPicker.value) {
	startPresentationBtn.disabled = false
    } else {
	startPresentationBtn.disabled = true
    }
})
startPresentationBtn.addEventListener('click', function () {
    ipcRenderer.send('startPresentation', pdfPicker.files[0].path)
})
