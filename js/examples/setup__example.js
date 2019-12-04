// This setup works for camera streams and images, just setupExample and choose either
// trackImage or trackCamera. Please take a look at the actual example files for reference.

// There is also a minimal.html which does not use these modules and shows the minimal
// possible code for working with BRFv5. But minimal.html does not include the optimisations
// provided by the modules.

// This input section gives an overview of all the parts (modules) of this example setup.

import { log, error }                                                       from '../utils/utils__logging.js'
import { SystemUtils }                                                      from '../utils/utils__system.js'
import { ScaleMode }                                                        from '../utils/utils__resize.js'
import { getURLParameter }                                                  from '../utils/utils__get_params.js'

import { drawFaceTrackingResultsDefault }                                   from '../utils/utils__draw_tracking_results.js'
import { drawInput, drawInputMirrored }                                     from '../utils/utils__canvas.js'

import { loadBRFv5Model }                                                   from '../brfv5/brfv5__init.js'

import { configureCameraInput }                                             from '../brfv5/brfv5__configure.js'
import { configureNumFacesToTrack, configureFaceTracking }                  from '../brfv5/brfv5__configure.js'

import { enableDynamicPerformance, disableDynamicPerformance, averageTime } from '../brfv5/brfv5__dynamic_performance.js'
import { onEnterFrame, onExitFrame }                                        from '../brfv5/brfv5__dynamic_performance.js'

import { mountStage }                                                       from '../ui/ui__stage.js'

import { mountCamera, openCamera, setSizeCamera, getDataFromCamera }        from '../ui/ui__input__camera.js'
import { closeCamera }                                                      from '../ui/ui__input__camera.js'

import { startTracking, stopTracking }                                      from '../ui/ui__input__data.js'

import { mountThreejsOverlay,  setSizeThreejsOverlay,  hideThreejsOverlay } from '../ui/ui__overlay__threejs.js'


const _name                     = 'BRFv5Example'

// The BRFv5 model is loaded exactly once for the examples.
// You might set the GET parameter 'type=42l' to overwrite
// the use of the 68l model type, but the 42l is only really
// suitable for the ThreeJS example and other examples
// will fail to work properly.

// _modelName might be overwritten by the example config,
// but is only loaded once for the first example.

let _modelName                  = getURLParameter(window.location.search, 'type') === '42l' ? '42l' : '68l'
let _numChunksToLoad            = SystemUtils.isMobileOS ? 4 : 8

// _brfv5Manager and _brfv5Config will be set once after the
// library was loaded successfully.
let _brfv5Manager               = null
let _brfv5Config                = null

// _width and _height will depend on the video or image dimensions
// and will be (re)set for each example.
let _width                      = 0
let _height                     = 0

// These parameters will be reset to these defaults for each example
// and might be overwritten by the example config.
let _numFacesToTrack            = 1
let _numTrackingPasses          = 3
let _enableDynamicPerformance   = SystemUtils.isMobileOS

// Optional: Set by the example config for special handling of the tracking results,
// eg. for the smile detection or the texture overlay etc.
let _onConfigure                = null
let _onTracking                 = null

let _scaleMode                  = ScaleMode.PROPORTIONAL_INSIDE

export const setupExample = (config = null) => {

  stopTracking()

  // Reset variables for each example setup.
  _width                        = 0
  _height                       = 0

  _numFacesToTrack              = 1
  _numTrackingPasses            = 3

  _enableDynamicPerformance     = SystemUtils.isMobileOS

  _onConfigure                  = null
  _onTracking                   = null

  // Overwrite some config values specifically for each example.
  if(config) { setExampleConfigValues(config) }

  log(_name + ': setupExample')

  // Check whether the examples were setup before. If so, only hide the specific parts.
  const __brfv5__stage = document.getElementById('__brfv5__stage')

  if(__brfv5__stage) {

    log(_name + ': setupExample: already set up')

    hideThreejsOverlay()

    return
  }

  // If you want to mount these examples you need a <div id="__brfv5"> in the DOM.
  const container = document.getElementById('__brfv5')

  if(!container) {

    error('DIV with id __brfv5 is missing.')
    return
  }

  const stage = mountStage(container)

  mountCamera(stage, _scaleMode)
  mountThreejsOverlay(stage, _scaleMode)

  loadBRFv5Model(_modelName, _numChunksToLoad, './js/brfv5/models/', null, null)
    .then(({ brfv5Manager, brfv5Config }) => {

      log(_name + ': loadBRFv5Model: done')

      _brfv5Manager  = brfv5Manager
      _brfv5Config   = brfv5Config

      initTracking()

    }).catch((e) => { error('BRFV5_FAILED: WebAssembly supported: ', SystemUtils.isWebAssemblySupported, e) })
}

export const setExampleConfigValues = (config) => {

  log(_name + ': setExampleConfigValues: config:', config)

  _onConfigure = config.onConfigure
  _onTracking  = config.onTracking

  // GET parameter type overwrites example config.
  const modelType = getURLParameter(window.location.search, 'type')

  if(!modelType && config.modelName)  { _modelName                = config.modelName }
  if(config.numChunksToLoad >= 4)     { _numChunksToLoad          = config.numChunksToLoad }
  if(config.numFacesToTrack >= 0)     { _numFacesToTrack          = config.numFacesToTrack }
  if(config.enableDynamicPerformance) { _enableDynamicPerformance = config.enableDynamicPerformance }
  if(config.numTrackingPasses)        { _numTrackingPasses        = config.numTrackingPasses }
}

export const trackCamera = () => {
  openCamera()
    .then(({ width, height }) => setSizeAndInitTracking(width, height))
    .catch((e) => { if(e) { error('CAMERA_FAILED: ', e) } })
}


const setSizeAndInitTracking = (width, height) => {

  log(_name + ': setSizeAndInitTracking: ' + width + 'x' + height)

  _width  = width
  _height = height

  setSizeCamera(_width, _height)
  setSizeThreejsOverlay(_width, _height)

  initTracking()
}

const initTracking = () => {

  log(_name + ': initTracking: ' + (_brfv5Config !== null && _width > 0),
    'config:', _brfv5Config,
    'width:' , _width,
  )

  if(_brfv5Config !== null && _width > 0) {
    // Setup the video/image input size and configure sensible defaults for that size.
      configureCameraInput(_brfv5Config, _width, _height)

    // Setup the face tracking settings that impact performance.
    configureFaceTracking(_brfv5Config, _numTrackingPasses, true)

    // In most cases a single face should be tracked.
    configureNumFacesToTrack(_brfv5Config, _numFacesToTrack)

    _brfv5Manager.reset()

    if(_onConfigure) { _onConfigure(_brfv5Config) }

    if(_enableDynamicPerformance) {

      // Let BRFv5 manager the numTrackingPasses depending on the CPU usage or...
      enableDynamicPerformance(_brfv5Manager, _brfv5Config)

    } else {

      disableDynamicPerformance()

      // ... use fixed numTrackingPasses and enableFreeRotation
    }

    _brfv5Manager.configure(_brfv5Config)


      const { input, canvas0, canvas1 } = getDataFromCamera()
      startTracking(input, canvas0, canvas1, drawInputMirrored, false,
        onImageDataUpdate, onEnterFrame, onExitFrame)
    
  }
}

const onImageDataUpdate = (imageData, activeCanvas, inactiveCanvas, trackOnlyOnce ) => {

  if(!_brfv5Manager || !imageData || !activeCanvas) { return }
  // !trackOnlyOnce > continuous tracking, only update once
  // trackOnlyOnce  > * 2 because BRFv5 was build for continuous tracking and
  // will need a few updated per still image to get the best result possible.

  const numUpdates = !trackOnlyOnce ? 1 : _brfv5Config.faceTrackingConfig.numFacesToTrack * 2

  for(let i = 0; i < numUpdates; i++) {

    _brfv5Manager.update(imageData)
  }

  let drawDebug = false

  if(_onTracking) {

    drawDebug = _onTracking(_brfv5Manager, _brfv5Config, activeCanvas)

  } else {

    drawDebug = true
  }

  if(drawDebug) {

    drawFaceTrackingResultsDefault(_brfv5Manager, _brfv5Config, activeCanvas)
  }

}

export default {
  setupExample,
  setExampleConfigValues,
  trackCamera
}
