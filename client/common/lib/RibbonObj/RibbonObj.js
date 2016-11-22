import * as THREE from 'three'
import RibbonGeometry from './RibbonGeometry'

const PI = Math.PI

export default class RibbonObj {

  constructor(start, end, opts = {}) {

    this.options = Object.assign({
      // Normalised
      name: undefined,
      color: 0x0000FF,
      numPoint: 50,
      width: 15,
      texture: undefined,
      isPerpendicular: false
    }, opts)

    // Setup start, end and mid point
    this.start = start || new THREE.Vector3()
    this.end = end || new THREE.Vector3(400, 400, 400)
    this.midpoint = this._getMidPoint(this.start, this.end, 0.3, 0.2)
    this.midpoint2 = this._getMidPoint(this.start, this.end, 0.5, 0.25)
    this.midpoint3 = this._getMidPoint(this.start, this.end, 0.7, 0.2)

    this.group = new THREE.Object3D()

    // higest point
    this.apex = this.midpoint2.clone()

    this.geometry = new THREE.Geometry()
    this.geometry.vertices.push(this.start)
    this.geometry.vertices.push
    this.geometry.vertices.push(this.end)

    this.curve = new THREE.CatmullRomCurve3([this.start, this.midpoint, this.midpoint2, this.midpoint3, this.end])

    this.curveGeometry = new THREE.Geometry()
    this.curveGeometry.vertices = this.curve.getPoints( this.options.numPoint )

    // this.drawLine()
    this.drawRibbon()

  }

  /**
   * draw line
   * @return {[type]} [description]
   */
  drawLine() {
    let curveMaterial = new THREE.LineBasicMaterial({color: this.options.color, linewidth: 3})
    let curveLine = new THREE.Line(this.curveGeometry, curveMaterial)
    this.group.add(curveLine)
  }

  drawRibbon() {

    let ribbonGeo = new RibbonGeometry({
      curve: this.curve,
      isVariableWidth: true,
      numSegments: 256,
      width: this.options.width
    })


    let material = new THREE.MeshPhongMaterial({
      map: this.options.texture,
      shininess: 0,
      transparent: true,
      shading: THREE.FlatShading
    })

    material.side = THREE.DoubleSide
    this.mesh = new THREE.Mesh(ribbonGeo, material)
    if(this.options.name) this.mesh.name = this.options.name
    this.group.add(this.mesh)

    if(this.options.isPerpendicular) {
      let centerPoint = this.getCenterPoint()
      let axis = this.start.clone().sub(this.end).normalize()
      this.mesh.rotateOnAxis(axis, -PI/2)
      this.mesh.geometry.center()
      this.mesh.position.x = centerPoint.x + 6
      this.mesh.position.y = centerPoint.y - 8
      this.mesh.position.z = centerPoint.z
    }
  }

  getCenterPoint() {
    let middle = new THREE.Vector3()
    this.mesh.geometry.computeBoundingBox()

    middle.x = (this.mesh.geometry.boundingBox.max.x + this.mesh.geometry.boundingBox.min.x) / 2;
    middle.y = (this.mesh.geometry.boundingBox.max.y + this.mesh.geometry.boundingBox.min.y) / 2;
    middle.z = (this.mesh.geometry.boundingBox.max.z + this.mesh.geometry.boundingBox.min.z) / 2;

    this.mesh.localToWorld( middle )
    return middle
  }

  /**
   * get midpoint
   * @param  {[type]} v0               [description]
   * @param  {[type]} v1               [description]
   * @param  {[type]} fraction         =             0.5 [description]
   * @param  {[type]} verticalFraction =             0.6 [description]
   * @return {[type]}                  [description]
   */
  _getMidPoint(v0, v1, fraction = 0.5, verticalFraction = 0.35) {

    let dir = v1.clone().sub(v0)
    let len = dir.length()

    dir = dir.normalize().multiplyScalar( len * fraction )
    dir = v0.clone().add(dir)

    return dir.clone().add(dir.normalize().multiplyScalar(len * verticalFraction))
  }



}
