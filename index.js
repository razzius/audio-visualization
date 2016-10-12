var context = null
var canvasWidth = window.innerWidth
var canvasHeight = window.innerHeight
var dataLength = 100
var analyserNode = null
var frequencyToggle = true
var hueMultiplier = 1.8
var alpha = 0.2


function range(length) {
  return Array.apply(null, Array(length)).map(function (_, i) {return i})
}


function zeros(length) {
  return Array.apply(null, Array(length)).map(() => 0)
}


var bar_width = Math.round(canvasWidth / (dataLength - 1))
var VERTICAL_OFFSET = 8

var audioData = range(dataLength).map(() => zeros(64))


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

  range(audioData.length).forEach(function(index) {
    var i = audioData.length - index - 1
    if (i == audioData.length - 1) return

    let newer = audioData[i]
    let older = audioData[i + 1]

    range(newer.length).forEach(function(j) {
      var baseHeight = canvasHeight - 64 * VERTICAL_OFFSET
      var prevValue = older[j]
      var value = newer[j]

      var xLeft = i * bar_width + j * 2
      var xRight = xLeft + bar_width
      var yBase = baseHeight + j * VERTICAL_OFFSET

      var bottomLeftPoint = [xLeft, yBase]
      var topLeftPoint = [xLeft, yBase - value]
      var topRightPoint = [xRight, yBase - prevValue]
      var bottomRightPoint = [xRight, yBase]
      var shape = [bottomLeftPoint, topLeftPoint, topRightPoint, bottomRightPoint]

      context.fillStyle = `hsla(${value * hueMultiplier},100%,50%,${alpha})`
      drawShape(context, shape)
    })
  })

  range(audioData.length).forEach(function(i) {
    if (i == 0) return

    var toUpdate = audioData.length - i
    audioData[toUpdate] = audioData[toUpdate - 1]
  })

  audioData[0] = freqByteData

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
  var toggleText = {
    true: 'View Time Domain',
    false: 'View Frequency',
  }

  var toggle = document.createElement('button')
  toggle.innerText = toggleText[frequencyToggle]
  toggle.onclick = function() {
    frequencyToggle = !frequencyToggle
    toggle.innerText = toggleText[frequencyToggle]
  }

  var sliderLabel = document.createElement('label')
  sliderLabel.innerText = 'History buffer size: '

  var historySize = document.createElement('span')
  historySize.innerText = audioData.length

  var slider = document.createElement('input')
  slider.setAttribute('type', 'range')
  slider.setAttribute('min', 3)
  slider.setAttribute('max', 300)
  slider.value = audioData.length

  slider.onchange = function(e) {
    var value = e.target.value
    if (parseInt(value) > audioData.length) {
      audioData = audioData.concat(zeros(value - audioData.length))
    } else {
      audioData = audioData.slice(0, value)
    }
    historySize.innerText = value
    bar_width = Math.round(canvasWidth / (audioData.length - 1))
  }

  var hueInput = document.createElement('input')
  hueInput.value = hueMultiplier
  hueInput.onchange = function(e) {
    hueMultiplier = parseFloat(e.target.value)
  }

  var hueLabel = document.createElement('label')
  hueLabel.innerText = 'Hue multiplier'

  var alphaLabel = document.createElement('label')
  alphaLabel.innerText = 'Alpha'

  var alphaInput = document.createElement('input')
  alphaInput.value = alpha
  alphaInput.onchange = function(e) {
    alpha = parseFloat(e.target.value)
  }

  var canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  canvas.style['z-index'] = -1

  root = document.getElementById('root')

  root.appendChild(toggle)
  root.appendChild(sliderLabel)
  root.appendChild(historySize)
  root.appendChild(slider)
  root.appendChild(hueLabel)
  root.appendChild(hueInput)
  root.appendChild(alphaLabel)
  root.appendChild(alphaInput)

  root.appendChild(canvas)

  document.body.style['margin'] = '.3em 0 0 0'

  context = canvas.getContext('2d')

  navigator.getUserMedia({audio: true}, gotStream, alert)
}


main()
