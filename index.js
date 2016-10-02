var audioContext = new AudioContext()
var context = null
var canvasWidth = window.innerWidth
var canvasHeight = window.innerHeight
var dataLength = 100
function range(length) {
  return Array.apply(null, Array(length)).map(function (_, i) {return i})
}

function zeros(length) {
  return Array.apply(null, Array(length)).map(function (_, i) {return 0})
}

function ones(length) {
  return Array.apply(null, Array(length)).map(function (_, i) {return 255})
}

var samplePeriod = 1
var cycleCounter = 0
var BAR_WIDTH = Math.round(canvasWidth / dataLength)
var VERTICAL_OFFSET = 8

var oldDatas = []
range(dataLength).forEach(function() {
  oldDatas.push(zeros(64))
})

// var oldDatas = [
//   zeros(32),
//   ones(32),
//   zeros(32),
//   ones(32),
//   ones(32)
// ]

function drawShape(context, points) {
  context.beginPath()
  context.moveTo(points[0][0], points[0][1])
  points.slice(1).forEach(function(point) {
    context.lineTo(point[0], point[1])
  })
  context.closePath()
  // context.stroke()
  context.fill()
}

function updateAnalysers() {
  cycleCounter = (cycleCounter + 1) % samplePeriod
  if (cycleCounter != 0) {
    window.requestAnimationFrame(updateAnalysers)
    return
  }

  var freqByteData = new Uint8Array(64)

  analyserNode.getByteFrequencyData(freqByteData)
  // analyserNode.getByteTimeDomainData(freqByteData)

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

      // var oldValue = (older[j] - 120) * 15
      // var newValue = (newer[j] - 120) * 15

      var xLeft = i * BAR_WIDTH + j * 2
      var xRight = xLeft + BAR_WIDTH
      var yBase = baseHeight + j * VERTICAL_OFFSET

      bottomLeftPoint = [xLeft, yBase]
      topLeftPoint = [xLeft, yBase - newValue]
      topRightPoint = [xRight, yBase - oldValue]
      bottomRightPoint = [xRight, yBase]
      shape = [bottomLeftPoint, topLeftPoint, topRightPoint, bottomRightPoint]
      // console.log(shape)

      // var color = `hsla(${(newValue / 250) * 100}, ${(newValue / 250) * 100}, 50, .4)`
      // var color = `hsl(${newValue / 4},${((newValue / 255 * .2) + .8) * 100}%,${(255 - newValue) / 255 * 100}%)`
      // var color = `hsl(${newValue * 1.8},${((newValue / 255 * .2) + .8) * 100}%,50%)`
      var color = `hsla(${newValue * 1.8},${((newValue / 255 * .2) + .8) * 100}%,50%,.7)`
      context.fillStyle = color
      // context.fillStyle = `rgba(${255 - newValue}, 0, ${Math.random() * 255}, .4)`
      drawShape(context, shape)
    })
  })


  range(oldDatas.length).forEach(function(i) {
    // return
    if (i == 0) return

    var toUpdate = oldDatas.length - i
    oldDatas[toUpdate] = oldDatas[toUpdate - 1].slice()
  })

  oldDatas[0] = freqByteData

  window.requestAnimationFrame(updateAnalysers)
}


function gotStream(stream) {
  var inputPoint = audioContext.createGain()

  var audioInput = audioContext.createMediaStreamSource(stream)
  audioInput.connect(inputPoint)

  analyserNode = audioContext.createAnalyser()
  analyserNode.fftSize = 128
  inputPoint.connect( analyserNode )

  zeroGain = audioContext.createGain()
  zeroGain.gain.value = 0.0
  inputPoint.connect( zeroGain )
  zeroGain.connect( audioContext.destination )
  updateAnalysers()
}

function gotError(error) {
  alert(error)
}

function main() {
  var canvas = document.createElement('canvas')
  navigator.getUserMedia({audio: true}, gotStream, gotError)
  document.getElementById('root').appendChild(canvas)
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  context = canvas.getContext('2d')
  // context.strokeStyle = 'rgba(255, 0, 0, .4)'
}

main()
