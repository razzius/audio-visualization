let context = null
let analyserNode = null
let frequencyToggle = true
const canvasWidth = window.innerWidth
const canvasHeight = window.innerHeight
const dataLength = 100
let hueMultiplier = 1.8
let alpha = 0.2


function range(length) {
  return [...Array(length)].map((_, i) => i)
}


function zeros(length) {
  return [...Array(length)].map(() => 0)
}


let barWidth = Math.round(canvasWidth / (dataLength - 1))
const VERTICAL_OFFSET = 8

let audioData = range(dataLength).map(() => zeros(64))


function drawShape(points) {
  context.beginPath()
  context.moveTo(points[0][0], points[0][1])
  points.slice(1).forEach(point => {
    context.lineTo(point[0], point[1])
  })
  context.closePath()
  context.fill()
}


function updateAnalysers() {
  const freqByteData = new Uint8Array(64)

  if (frequencyToggle) {
    analyserNode.getByteFrequencyData(freqByteData)
  } else {
    analyserNode.getByteTimeDomainData(freqByteData)
  }

  context.globalCompositeOperation = 'copy'
  context.drawImage(context.canvas, barWidth, 0);
  context.globalCompositeOperation = 'soft-light'

  const newer = audioData[0]
  const older = audioData[1]

  range(newer.length).forEach(j => {
    const baseHeight = canvasHeight - 64 * VERTICAL_OFFSET
    const prevValue = older[j]
    const value = newer[j]

    const xLeft = j * 2

    const xRight = xLeft + barWidth
    const yBase = baseHeight + j * VERTICAL_OFFSET

    const bottomLeftPoint = [xLeft, yBase]
    const topLeftPoint = [xLeft, yBase - value]
    const topRightPoint = [xRight, yBase - prevValue]
    const bottomRightPoint = [xRight, yBase]
    const shape = [bottomLeftPoint, topLeftPoint, topRightPoint, bottomRightPoint]

    context.fillStyle = `hsla(${value * hueMultiplier},100%,50%,${alpha})`
    drawShape(shape)
  })

  range(audioData.length).forEach(i => {
    if (i === 0) return

    const toUpdate = audioData.length - i
    audioData[toUpdate] = audioData[toUpdate - 1]
  })

  audioData[0] = freqByteData

  window.requestAnimationFrame(updateAnalysers)
}


function gotStream(stream) {
  const audioContext = new AudioContext()
  const inputPoint = audioContext.createGain()

  const audioInput = audioContext.createMediaStreamSource(stream)
  audioInput.connect(inputPoint)

  analyserNode = audioContext.createAnalyser()
  analyserNode.fftSize = 128

  inputPoint.connect(analyserNode)

  updateAnalysers()
}


function main() {
  const toggleText = {
    true: 'View Time Domain',
    false: 'View Frequency',
  }

  const toggle = document.createElement('button')
  toggle.innerText = toggleText[frequencyToggle]
  toggle.onclick = () => {
    frequencyToggle = !frequencyToggle
    toggle.innerText = toggleText[frequencyToggle]
  }

  const sliderLabel = document.createElement('label')
  sliderLabel.innerText = 'History buffer size: '

  const historySize = document.createElement('span')
  historySize.innerText = audioData.length

  const slider = document.createElement('input')
  slider.setAttribute('type', 'range')
  slider.setAttribute('min', 3)
  slider.setAttribute('max', 300)
  slider.value = audioData.length

  slider.onchange = e => {
    const { value } = e.target
    if (parseInt(value, 10) > audioData.length) {
      audioData = audioData.concat(zeros(value - audioData.length))
    } else {
      audioData = audioData.slice(0, value)
    }
    historySize.innerText = value
    barWidth = Math.round(canvasWidth / (audioData.length - 1))
  }

  const hueInput = document.createElement('input')
  hueInput.value = hueMultiplier
  hueInput.onchange = e => {
    hueMultiplier = parseFloat(e.target.value)
  }

  const hueLabel = document.createElement('label')
  hueLabel.innerText = 'Hue multiplier'

  const alphaLabel = document.createElement('label')
  alphaLabel.innerText = 'Alpha'

  const alphaInput = document.createElement('input')
  alphaInput.value = alpha
  alphaInput.onchange = e => {
    alpha = parseFloat(e.target.value)
  }

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  canvas.style['z-index'] = -1

  const root = document.getElementById('root')

  root.appendChild(toggle)
  root.appendChild(sliderLabel)
  root.appendChild(historySize)
  root.appendChild(slider)
  root.appendChild(hueLabel)
  root.appendChild(hueInput)
  root.appendChild(alphaLabel)
  root.appendChild(alphaInput)

  root.appendChild(canvas)

  document.body.style.margin = '.3em 0 0 0'

  context = canvas.getContext('2d')
  navigator.mediaDevices.getUserMedia({audio: true}).then(gotStream).catch(alert)
}


main()
