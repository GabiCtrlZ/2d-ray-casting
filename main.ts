const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

/* ---- consts ---- */

canvas.width = 1000
canvas.height = 600

const MOUSE_BUDDIES_DIST = 7

const mouseBuddies = [
    [0, 0],
    [MOUSE_BUDDIES_DIST, 0],
    [-MOUSE_BUDDIES_DIST, 0],
    [0, MOUSE_BUDDIES_DIST],
    [0, -MOUSE_BUDDIES_DIST],
    [Math.sqrt(0.5) * MOUSE_BUDDIES_DIST, Math.sqrt(0.5) * MOUSE_BUDDIES_DIST],
    [Math.sqrt(0.5) * MOUSE_BUDDIES_DIST, -Math.sqrt(0.5) * MOUSE_BUDDIES_DIST],
    [-Math.sqrt(0.5) * MOUSE_BUDDIES_DIST, Math.sqrt(0.5) * MOUSE_BUDDIES_DIST],
    [-Math.sqrt(0.5) * MOUSE_BUDDIES_DIST, -Math.sqrt(0.5) * MOUSE_BUDDIES_DIST],
]

/* ---- classes ---- */

// point
class Point {
    x: number
    y: number
    radius: number
    constructor(x: number, y: number, radius: number = 4) {
        this.x = x
        this.y = y
        this.radius = radius
    }
    set(x: number, y: number): void {
        this.x = x
        this.y = y
    }
    draw(): void {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
        c.fillStyle = 'rgba(255, 164, 0, 1)'
        c.fill()
        c.fillStyle = 'white'
    }
}

// line segment
class LineSegment {
    p1: Point
    p2: Point
    constructor(p1: Point, p2: Point) {
        this.p1 = p1
        this.p2 = p2
    }
}

// ray
class Ray {
    source: Point
    d: number
    r: Point
    constructor(p: Point, r: Point) {
        this.source = p
        this.r = new Point(r.x - p.x, r.y - p.y)

        const d = (Math.atan(this.r.y / (this.r.x || 0.000001)) + (Math.PI * 2)) % (Math.PI * 2)

        if (this.r.y <= 0 && this.r.x === 0) this.d = d
        if (this.r.y <= 0 && this.r.x < 0) this.d = d + Math.PI
        else if (this.r.y > 0 && this.r.x < 0) this.d = d - Math.PI
        else this.d = d
    }
    setSource(p: Point): void {
        this.source = p
    }
    setDirection(d: number): void {
        this.d = d
        this.r.set(Math.cos(d), Math.sin(d))
    }
    rayLineIntersection(l: LineSegment): number {
        const { x: px, y: py } = this.source
        const { x: rx, y: ry } = this.r
        const { x: qx, y: qy } = l.p1
        const sx = (l.p2.x - qx) || 0.01
        const sy = l.p2.y - qy

        const m = (l.p2.y - l.p1.y) / ((l.p2.x - l.p1.x) || 0.01)

        if (m === (ry / rx)) return Infinity

        /* 
        * based on the idea that: source + (t * r) = p1 + (u * s)
        * where source is a the ray source point, r is (cos(d), sin(d))
        * p1 is the first point of the line segment and s is (p2.x - p1.x, p2.y - p1.y)
        * b and c are helper to calculate t for debuging and stuff
        */
        const b = ((sy / sx) * (px - qx)) + qy - py
        const c = ry - ((sy * rx) / sx)
        const t = b / c
        const u = (px + (rx * t) - qx) / sx
        if (u > 1 || u < 0 || t < 0) return Infinity
        return t
    }
    findClosest(shapes: Shape[]): Point {
        let closest = Infinity
        shapes.forEach(shape => shape.lines.forEach(line => {
            const t = this.rayLineIntersection(line)
            if (t < closest) closest = t
        }))
        const { x: px, y: py } = this.source
        const { x: rx, y: ry } = this.r
        return new Point(px + (rx * closest), py + (ry * closest))
    }
}

// shape - array of points the connect with lines
class Shape {
    points: Point[]
    lines: LineSegment[]
    constructor(points: Point[], withLines: boolean = true) {
        this.points = points
        if (withLines) this.lines = points.map((p, i) => new LineSegment(p, points[(i + 1) % points.length]))
    }
    draw(withFill: boolean = false, color: string = 'rgba(255, 255, 255, 1)'): void {
        const { points } = this
        if (!points.length) return
        c.fillStyle = color
        c.strokeStyle = color
        c.lineWidth = 2
        c.beginPath()
        c.moveTo(points[points.length - 1].x, points[points.length - 1].y)
        points.forEach(({ x, y }) => c.lineTo(x, y))
        c.stroke()
        if (withFill) c.fill()
    }
}

// scene - game controller basicly
class Scene {
    shapes: Shape[]
    mouse: Point
    rays: Ray[]
    constructor(m: Point) {
        this.shapes = []
        this.mouse = m
        this.rays = []
    }
    addRay(r: Ray): void {
        this.rays.push(r)
    }
    addRays(r: Ray[]): void {
        this.rays.push(...r)
    }
    addShape(s: Shape): void {
        this.shapes.push(s)
    }
    addShapes(s: Shape[]): void {
        this.shapes.push(...s)
    }
    fivePoints(p1: Point, p2: Point): Ray[] {
        return [
            new Ray(p1, p2),
            new Ray(p1, new Point(p2.x + 0.002, p2.y + 0.001)),
            new Ray(p1, new Point(p2.x + 0.001, p2.y + 0.001)),
            new Ray(p1, new Point(p2.x - 0.001, p2.y - 0.001)),
            new Ray(p1, new Point(p2.x - 0.002, p2.y - 0.001)),
        ]
    }
    draw(): void {
        c.fillStyle = 'black'
        c.fillRect(0, 0, canvas.width, canvas.height)
        this.shapes.forEach(s => s.draw())

        mouseBuddies.forEach((dir, i) => {
            const mouseBuddy = new Point(this.mouse.x + dir[0], this.mouse.y + dir[1])

            const rays = this.shapes.reduce((prev, p) => [
                ...prev,
                ...p.points.reduce((prev, c) => [...prev, ...this.fivePoints(mouseBuddy, c)], []),
            ], [])

            const points = rays.sort((a, b) => a.d - b.d).map(r => r.findClosest(this.shapes))

            const color = i ? 'rgba(255, 255, 255, 0.2)' : 'white'
            new Shape(points, false).draw(true, color)
        })
        this.mouse.draw()
    }
}

const maker = (x: number, y: number): Point => new Point(x, y)

/* ---- class instances ---- */

const mouseXY = new Point(0, 0)
const scene = new Scene(mouseXY)

const borderLeft = new Shape([maker(0, canvas.height), maker(0, 0)])
const borderRight = new Shape([maker(canvas.width, canvas.height), maker(canvas.width, 0)])
const borderBottom = new Shape([maker(0, canvas.height), maker(canvas.width, canvas.height)])
const borderTop = new Shape([maker(0, 0), maker(canvas.width, 0)])
scene.addShapes([borderLeft, borderBottom, borderRight, borderTop])

const shape1 = new Shape([maker(10, 10), maker(120, 120), maker(10, 50)])
const shape2 = new Shape([maker(600, 50), maker(450, 250), maker(230, 150)])
const shape3 = new Shape([maker(50, 350), maker(100, 350), maker(60, 200), maker(20, 180)])
const shape4 = new Shape([maker(800, 500), maker(900, 400), maker(870, 320), maker(760, 410)])
const shape5 = new Shape([maker(300, 300), maker(310, 580), maker(510, 420), maker(560, 500), maker(550, 280)])
scene.addShapes([shape1, shape2, shape3, shape4, shape5])

const animate = (): void => {
    requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)
    scene.draw()
}

animate()

// listeners
window.addEventListener('mousemove', ({ x, y }) => mouseXY.set(x, y))
