var context = null
var canvasWidth = window.innerWidth
var canvasHeight = window.innerHeight
var dataLength = 200
var analyserNode = null
var frequencyToggle = true


function range(length) {
  return Array.apply(null, Array(length)).map(function (_, i) {return i})
}


function zeros(length) {
  return Array.apply(null, Array(length)).map(() => 0)
}


var BAR_WIDTH = Math.round(canvasWidth / dataLength)
var VERTICAL_OFFSET = 8

var oldDatas = range(dataLength).map(() => zeros(64))


function drawShape(context, points) {
  context.beginPath()
  context.moveTo(points[0][0], points[0][1])
  points.slice(1).forEach(function(point) {
    context.lineTo(point[0], point[1])
  })
  context.closePath()
  context.fill()
}


function updateAnalysers() {
  var freqByteData = new Uint8Array(64)

  if (frequencyToggle) {
    analyserNode.getByteFrequencyData(freqByteData)
  } else {
    analyserNode.getByteTimeDomainData(freqByteData)
  }

  context.clearRect(0, 0, canvasWidth, canvasHeight)

  range(oldDatas.length).forEach(function(index) {
    var i = oldDatas.length - index - 1
    if (i == oldDatas.length - 1) return

    let newer = oldDatas[i]
    let older = oldDatas[i + 1]

    range(newer.length).forEach(function(j) {
      var baseHeight = canvasHeight - 64 * VERTICAL_OFFSET
      var oldValue = older[j]
      var newValue = newer[j]

      var xLeft = i * BAR_WIDTH + j * 2
      var xRight = xLeft + BAR_WIDTH
      var yBase = baseHeight + j * VERTICAL_OFFSET

      var bottomLeftPoint = [xLeft, yBase]
      var topLeftPoint = [xLeft, yBase - newValue]
      var topRightPoint = [xRight, yBase - oldValue]
      var bottomRightPoint = [xRight, yBase]
      var shape = [bottomLeftPoint, topLeftPoint, topRightPoint, bottomRightPoint]

      context.fillStyle = `hsla(${newValue * 1.8},${((newValue / 255 * .2) + .8) * 100}%,50%,.7)`
      drawShape(context, shape)
    })
  })

  range(oldDatas.length).forEach(function(i) {
    if (i == 0) return

    var toUpdate = oldDatas.length - i
    oldDatas[toUpdate] = oldDatas[toUpdate - 1]
  })

  oldDatas[0] = freqByteData

  window.requestAnimationFrame(updateAnalysers)
}


function gotStream(stream) {
  var audioContext = new AudioContext()
  var inputPoint = audioContext.createGain()

  var audioInput = audioContext.createMediaStreamSource(stream)
  audioInput.connect(inputPoint)

  analyserNode = audioContext.createAnalyser()
  analyserNode.fftSize = 128

  inputPoint.connect(analyserNode)

  updateAnalysers()
}


function main() {
  var toggle = document.createElement('button')
  toggle.innerText = 'Toggle frequency / time domain'
  toggle.onclick = function() {
    frequencyToggle = !frequencyToggle
  }
  var canvas = document.createElement('canvas')
  navigator.getUserMedia({audio: true}, gotStream, alert)
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  root = document.getElementById('root')
  root.appendChild(toggle)
  root.appendChild(canvas)
  context = canvas.getContext('2d')
}


main()
