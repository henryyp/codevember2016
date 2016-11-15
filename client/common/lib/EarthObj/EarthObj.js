import * as THREE from 'three'
import earthVert from './shader/earth.vert'
import earthFrag from './shader/earth.frag'
import cloudVert from './shader/cloud.vert'
import cloudFrag from './shader/cloud.frag'

const PI = Math.PI
const DEFAULT_TEXTURES = {
  groundTexture: '/public/texture/world2.jpg',
  atmosphereTexture: '/public/texture/cloud.jpg'
}



export default class EarthObj {

  constructor(opts) {

    this.options = Object.assign({
      earthSize: 200,
      cityFloatDistance: 3,
      isRotating: false,
      groundTexture: DEFAULT_TEXTURES.groundTexture,
      atmosphereTexture: DEFAULT_TEXTURES.atmosphereTexture,
      onLoadComplete: undefined
    }, opts)

    this.isLoaded = false
    this.isFlattened = false
    this.group = new THREE.Object3D()

    this.cities = {}

    this.earthUniform = {
      texture: { type: 't', value: null },
      targetWidth: { type: 'f', value: 600.0 },
      targetHeight: { type: 'f', value: 400.0 },
      mixAmount: 	 { type: 'f', value: 0.0 }
    }

    this._worldTexLoaded = this._worldTexLoaded.bind(this)
    this._cloudTexLoaded = this._cloudTexLoaded.bind(this)
    this._loadComplete = this._loadComplete.bind(this)

    this.loaderManager = new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(this.loaderManager)

    this.loaderManager.onLoad = this._loadComplete
  }

  /**
   * Load Textures
   * @return {[type]} [description]
   */
  load() {
    let { groundTexture, atmosphereTexture } = this.options

    this.textureLoader.load(groundTexture, this._worldTexLoaded)
    this.textureLoader.load(atmosphereTexture, this._cloudTexLoaded)
  }

  /**
   * get Vector by Lat Lng
   * @param  {[type]} lat [description]
   * @param  {[type]} lng [description]
   * @return {[type]}     [description]
   */
  getVectorByLatLng(lat, lng) {

    let { earthSize, cityFloatDistance } = this.options
    let distance = earthSize + cityFloatDistance
    let phi = -( 90 - lat ) * PI / 180
    let theta = ( 180 - lng ) * PI / 180

    let sinPhi = Math.sin(phi)
    let cosPhi = Math.cos(phi)
    let sinTheta = Math.sin(theta)
    let cosTheta = Math.cos(theta)

    let x = ( distance * sinPhi * cosTheta )
    let y = ( distance * cosPhi )
    let z = ( distance * sinPhi * sinTheta )

    return new THREE.Vector3(x, y, z)
  }

  addCity({ name = 'london', lat = 51.509865, lng = -0.118092 } = {}) {

    let pos = this.getVectorByLatLng(lat, lng)
    let material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 0,
      shading: THREE.FlatShading
    })

    let geom = new THREE.SphereGeometry(1, 4, 4)
    let city = {
      position: pos,
      material,
      mesh: new THREE.Mesh(geom, material)
    }

    city.mesh.position.x = pos.x
    city.mesh.position.y = pos.y
    city.mesh.position.z = pos.z
    city.mesh.lookAt(new THREE.Vector3())
    this.group.add(city.mesh)

    this.cities[name] = city
  }

  getCity(name) {
    return this.cities[name]
  }


  /**
   * world texture loaded handler
   * @param  {[type]} tex [description]
   * @return {[type]}     [description]
   */
  _worldTexLoaded(tex) {

    this.earthUniform.texture.value = tex

    this.earthMaterial = new THREE.ShaderMaterial({
      uniforms: this.earthUniform,
      vertexShader: earthVert,
      fragmentShader: earthFrag,
      visible: true
    })

    this.earthGeometry = new THREE.SphereGeometry(this.options.earthSize, 40, 30)
    this.earthMesh = new THREE.Mesh(this.earthGeometry, this.earthMaterial)
  }

  /**
   * atmosphere texture loaded handler
   * @param  {[type]} tex [description]
   * @return {[type]}     [description]
   */
  _cloudTexLoaded(tex) {

    this.atmosphereUniform = Object.assign({}, this.earthUniform, {
      texture: { type: 't', value: tex }
    })

    this.atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: this.atmosphereUniform,
      vertexShader: cloudVert,
      fragmentShader: cloudFrag,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      visible: true
    })

    this.atmosphereGeometry = new THREE.SphereGeometry(this.options.earthSize, 40, 30)
    this.atmosphereMesh = new THREE.Mesh(this.atmosphereGeometry, this.atmosphereMaterial)
    this.atmosphereMesh.scale.set(1.04, 1.04, 1.04)

  }


  /**
   * all loaded complete handler
   * @return {[type]} [description]
   */
  _loadComplete() {

    this.isLoaded = true
    this.group.add(this.earthMesh)
    this.group.add(this.atmosphereMesh)

    let { onLoadComplete } = this.options
    if( onLoadComplete ) {
      onLoadComplete.call(null, {
        geometry: {
          earthGeometry: this.earthGeometry,
          atmosphereGeometry: this.atmosphereGeometry
        },
        material: {
          earthMaterial: this.earthMaterial,
          atmosphereMaterial: this.atmosphereMaterial
        },
        mesh: {
          earthMesh: this.earthMesh,
          atmosphereMesh: this.atmosphereMesh
        },
        group: this.group
      })
    }
  }

  /**
   * animate frame function
   * @return {[type]} [description]
   */
  animate() {

    if(!this.isLoaded) return

    if(this.group && this.options.isRotating) {
      this.group.rotation.y -= 0.001
    }

    if(this.atmosphereMesh) {

      if(this.earthUniform.mixAmount.value !== 0) {

        if(this.t >= 0) {
          this.atmosphereMesh.rotation.x = THREE.Math.lerp(0, this.rotationSnap.x, this.t/10)
          this.atmosphereMesh.rotation.y = THREE.Math.lerp(0, this.rotationSnap.y, this.t/10)
          this.t--
        }

      } else {
        this.atmosphereMesh.rotation.y += 0.0002
        this.atmosphereMesh.rotation.x += 0.0002
        this.rotationSnap = new THREE.Vector2(this.atmosphereMesh.rotation.x, this.atmosphereMesh.rotation.y)
        this.t = 10
      }
    }
  }

}
