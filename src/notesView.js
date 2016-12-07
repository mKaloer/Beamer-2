/*
  This is the note view renderer. It manages the timer, slide number etc.
*/

const {ipcRenderer} = require('electron')
const util = require('util')

const timerText = document.getElementById('timer-text')

let timerStartTime = 0
let timerOffset = 0

// ------------
// IPC MESSAGES
// ------------

ipcRenderer.on('startTimer', (event) => {
    startTimer()
})

ipcRenderer.on('pauseTimer', (event) => {
    stopTimer()
})

startTimer = function() {
    timerStartTime = new Date().getTime()
    setInterval(_updateTimer, 1000)
}

stopTimer = function() {
    timerOffset = new Date().getTime() - timerStartTime()
}

_updateTimer = function() {
    var diff = new Date().getTime() - timerStartTime + timerOffset
    var t = new Date(diff)
    var timeFormat = util.format('%s:%s:%s',
				 _numFmt(t.getHours() - 1, "00"),
				 _numFmt(t.getMinutes(), "00"),
				 _numFmt(t.getSeconds(), "00"))
    timerText.innerHTML = timeFormat
}

_setup = function() {
    // Identify renderer
    ipcRenderer.send('subscribeNotesView')
}

_numFmt = function(num, mask) {
    // From https://groups.google.com/forum/#!topic/nodejs/df5UzXFAByA
    return (mask + num).slice(-Math.max(mask.length, (num + "").length));
};

// Setup
_setup()
