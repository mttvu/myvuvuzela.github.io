import { run } from '../examples/face_tracking__threejs_overlay.js'
import { closeCamera } from '../ui/ui__input__camera.js'
import { stopTracking } from '../ui/ui__input__data.js'
import { hideThreejsOverlay } from '../ui/ui__overlay__threejs.js'

const stop = () => {
    closeCamera()
    stopTracking()
    hideThreejsOverlay()
}

window.startAR = function startAR() {
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


