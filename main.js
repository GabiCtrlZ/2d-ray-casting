var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var canvas = document.querySelector('canvas');
var c = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 600;
var MOUSE_BUDDIES_DIST = 7;
var mouseBuddies = [
    [0, 0],
    [MOUSE_BUDDIES_DIST, 0],
    [-MOUSE_BUDDIES_DIST, 0],
    [0, MOUSE_BUDDIES_DIST],
    [0, -MOUSE_BUDDIES_DIST],
    [Math.sqrt(0.5) * MOUSE_BUDDIES_DIST, Math.sqrt(0.5) * MOUSE_BUDDIES_DIST],
    [Math.sqrt(0.5) * MOUSE_BUDDIES_DIST, -Math.sqrt(0.5) * MOUSE_BUDDIES_DIST],
    [-Math.sqrt(0.5) * MOUSE_BUDDIES_DIST, Math.sqrt(0.5) * MOUSE_BUDDIES_DIST],
    [-Math.sqrt(0.5) * MOUSE_BUDDIES_DIST, -Math.sqrt(0.5) * MOUSE_BUDDIES_DIST],
];
var Point = (function () {
    function Point(x, y, radius) {
        if (radius === void 0) { radius = 4; }
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
    Point.prototype.set = function (x, y) {
        this.x = x;
        this.y = y;
    };
    Point.prototype.draw = function () {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        c.fillStyle = 'rgba(255, 164, 0, 1)';
        c.fill();
        c.fillStyle = 'white';
    };
    return Point;
}());
var LineSegment = (function () {
    function LineSegment(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }
    return LineSegment;
}());
var Ray = (function () {
    function Ray(p, r) {
        this.source = p;
        this.r = new Point(r.x - p.x, r.y - p.y);
        var d = (Math.atan(this.r.y / (this.r.x || 0.000001)) + (Math.PI * 2)) % (Math.PI * 2);
        if (this.r.y <= 0 && this.r.x === 0)
            this.d = d;
        if (this.r.y <= 0 && this.r.x < 0)
            this.d = d + Math.PI;
        else if (this.r.y > 0 && this.r.x < 0)
            this.d = d - Math.PI;
        else
            this.d = d;
    }
    Ray.prototype.setSource = function (p) {
        this.source = p;
    };
    Ray.prototype.setDirection = function (d) {
        this.d = d;
        this.r.set(Math.cos(d), Math.sin(d));
    };
    Ray.prototype.rayLineIntersection = function (l) {
        var _a = this.source, px = _a.x, py = _a.y;
        var _b = this.r, rx = _b.x, ry = _b.y;
        var _c = l.p1, qx = _c.x, qy = _c.y;
        var sx = (l.p2.x - qx) || 0.01;
        var sy = l.p2.y - qy;
        var m = (l.p2.y - l.p1.y) / ((l.p2.x - l.p1.x) || 0.01);
        if (m === (ry / rx))
            return Infinity;
        var b = ((sy / sx) * (px - qx)) + qy - py;
        var c = ry - ((sy * rx) / sx);
        var t = b / c;
        var u = (px + (rx * t) - qx) / sx;
        if (u > 1 || u < 0 || t < 0)
            return Infinity;
        return t;
    };
    Ray.prototype.findClosest = function (shapes) {
        var _this = this;
        var closest = Infinity;
        shapes.forEach(function (shape) { return shape.lines.forEach(function (line) {
            var t = _this.rayLineIntersection(line);
            if (t < closest)
                closest = t;
        }); });
        var _a = this.source, px = _a.x, py = _a.y;
        var _b = this.r, rx = _b.x, ry = _b.y;
        return new Point(px + (rx * closest), py + (ry * closest));
    };
    return Ray;
}());
var Shape = (function () {
    function Shape(points, withLines) {
        if (withLines === void 0) { withLines = true; }
        this.points = points;
        if (withLines)
            this.lines = points.map(function (p, i) { return new LineSegment(p, points[(i + 1) % points.length]); });
    }
    Shape.prototype.draw = function (withFill, color) {
        if (withFill === void 0) { withFill = false; }
        if (color === void 0) { color = 'rgba(255, 255, 255, 1)'; }
        var points = this.points;
        if (!points.length)
            return;
        c.fillStyle = color;
        c.strokeStyle = color;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(points[points.length - 1].x, points[points.length - 1].y);
        points.forEach(function (_a) {
            var x = _a.x, y = _a.y;
            return c.lineTo(x, y);
        });
        c.stroke();
        if (withFill)
            c.fill();
    };
    return Shape;
}());
var Scene = (function () {
    function Scene(m) {
        this.shapes = [];
        this.mouse = m;
        this.rays = [];
    }
    Scene.prototype.addRay = function (r) {
        this.rays.push(r);
    };
    Scene.prototype.addRays = function (r) {
        var _a;
        (_a = this.rays).push.apply(_a, r);
    };
    Scene.prototype.addShape = function (s) {
        this.shapes.push(s);
    };
    Scene.prototype.addShapes = function (s) {
        var _a;
        (_a = this.shapes).push.apply(_a, s);
    };
    Scene.prototype.fivePoints = function (p1, p2) {
        return [
            new Ray(p1, p2),
            new Ray(p1, new Point(p2.x + 0.002, p2.y + 0.001)),
            new Ray(p1, new Point(p2.x + 0.001, p2.y + 0.001)),
            new Ray(p1, new Point(p2.x - 0.001, p2.y - 0.001)),
            new Ray(p1, new Point(p2.x - 0.002, p2.y - 0.001)),
        ];
    };
    Scene.prototype.draw = function () {
        var _this = this;
        c.fillStyle = 'black';
        c.fillRect(0, 0, canvas.width, canvas.height);
        this.shapes.forEach(function (s) { return s.draw(); });
        mouseBuddies.forEach(function (dir, i) {
            var mouseBuddy = new Point(_this.mouse.x + dir[0], _this.mouse.y + dir[1]);
            var rays = _this.shapes.reduce(function (prev, p) { return __spreadArray(__spreadArray([], prev), p.points.reduce(function (prev, c) { return __spreadArray(__spreadArray([], prev), _this.fivePoints(mouseBuddy, c)); }, [])); }, []);
            var points = rays.sort(function (a, b) { return a.d - b.d; }).map(function (r) { return r.findClosest(_this.shapes); });
            var color = i ? 'rgba(255, 255, 255, 0.2)' : 'white';
            new Shape(points, false).draw(true, color);
        });
        this.mouse.draw();
    };
    return Scene;
}());
var maker = function (x, y) { return new Point(x, y); };
var mouseXY = new Point(0, 0);
var scene = new Scene(mouseXY);
var borderLeft = new Shape([maker(0, canvas.height), maker(0, 0)]);
var borderRight = new Shape([maker(canvas.width, canvas.height), maker(canvas.width, 0)]);
var borderBottom = new Shape([maker(0, canvas.height), maker(canvas.width, canvas.height)]);
var borderTop = new Shape([maker(0, 0), maker(canvas.width, 0)]);
scene.addShapes([borderLeft, borderBottom, borderRight, borderTop]);
var shape1 = new Shape([maker(10, 10), maker(120, 120), maker(10, 50)]);
var shape2 = new Shape([maker(600, 50), maker(450, 250), maker(230, 150)]);
var shape3 = new Shape([maker(50, 350), maker(100, 350), maker(60, 200), maker(20, 180)]);
var shape4 = new Shape([maker(800, 500), maker(900, 400), maker(870, 320), maker(760, 410)]);
var shape5 = new Shape([maker(300, 300), maker(310, 580), maker(510, 420), maker(560, 500), maker(550, 280)]);
scene.addShapes([shape1, shape2, shape3, shape4, shape5]);
var animate = function () {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);
    scene.draw();
};
animate();
window.addEventListener('mousemove', function (_a) {
    var x = _a.x, y = _a.y;
    return mouseXY.set(x, y);
});
//# sourceMappingURL=main.js.map