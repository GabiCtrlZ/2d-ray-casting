const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

console.log('hello')

canvas.width = 1000
canvas.height = 600

// point
class Point {
    x: number
    y: number
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
    set(x: number, y: number) {
        this.x = x
        this.y = y
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

// mouse stuff
const mouseXY = new Point(0, 0)
window.addEventListener('mousemove', ({ x, y }) => mouseXY.set(x, y))


const update = () => {
    c.beginPath()
    c.moveTo(10, 10)
    c.lineTo(10, 20)
    c.lineTo(20, 20)
    c.lineTo(20, 10)
    c.lineTo(10, 10)
    c.stroke()
    // c.fill()
    c.beginPath()
    c.arc(mouseXY.x, mouseXY.y, 4, 0, 2 * Math.PI)
    c.stroke()
    c.fill()
}


const animate = () => {
    requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)
    // scene.update()
    update()
}

animate()