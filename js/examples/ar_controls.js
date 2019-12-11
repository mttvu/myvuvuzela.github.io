import { run } from '../examples/face_tracking__threejs_overlay.js'
import { closeCamera } from '../ui/ui__input__camera.js'
import { stopTracking } from '../ui/ui__input__data.js'
import { hideThreejsOverlay } from '../ui/ui__overlay__threejs.js'


const hide = () => {
    var cameraCanvas0 = document.getElementById("__brfv5__camera_canvas_0")
    var cameraCanvas1 = document.getElementById("__brfv5__camera_canvas_1")
    var threeJsCanvas = document.getElementById("__brfv5__threejs_canvas")
    cameraCanvas0.style.display = 'none'
    cameraCanvas1.style.display = 'none'
    threeJsCanvas.style.display = 'none'
}

const show = () => {
    var cameraCanvas0 = document.getElementById("__brfv5__camera_canvas_0")
    var cameraCanvas1 = document.getElementById("__brfv5__camera_canvas_1")
    var threeJsCanvas = document.getElementById("__brfv5__threejs_canvas")
    cameraCanvas0.style.display = 'block'
    cameraCanvas1.style.display = 'block'
    threeJsCanvas.style.display = 'block'
}

const stop = () => {
    closeCamera()
    stopTracking()
    hideThreejsOverlay()
    hide()
}

window.startAR = function startAR() {
    if (document.getElementById("__brfv5__camera_canvas_0") != null) {
        show()
    }
    document.getElementById('share-content').style.display = 'none'
    run()
}

window.stopAR = function stopAR() {
    stop()
}
window.screenCapture = function screenCapture() {
    //generate image from the camera canvas and three js canvas

    document.getElementById('share-content').style.display = 'block'

    var cameraCanvas0 = document.getElementById("__brfv5__camera_canvas_0")
    var threeJsCanvas = document.getElementById("__brfv5__threejs_canvas")
    var width = cameraCanvas0.width
    var height = cameraCanvas0.height
    var screenCaptureCanvas = document.getElementById('screenCaptureCanvas')
    var screenCaptureContext = screenCaptureCanvas.getContext('2d')

    //set width and height in context 
    screenCaptureContext.canvas.width = width
    screenCaptureContext.canvas.height = height

    //draw both canvases on final canvas
    screenCaptureContext.drawImage(cameraCanvas0, 0, 0, width, height)
    screenCaptureContext.drawImage(threeJsCanvas, 0, 0, width, height)

    stop()


}


