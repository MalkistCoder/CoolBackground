const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

// For window resize
canvas.width = window.innerWidth
canvas.height = window.innerHeight

window.addEventListener('resize', function() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
})

// How to make right click menu not pop up, https://stackoverflow.com/questions/737022/how-do-i-disable-right-click-on-my-web-page
canvas.addEventListener('contextmenu', event => event.preventDefault());

// Mouse tracking info
let mouse = {
    x: 0,
    y: 0
}

window.addEventListener('mousemove', function(e) {
    mouse.x = e.x
    mouse.y = e.y
})

// For rainbow effect
let hue = 0

// Settings
let drawLines = true
let drawParticles = true
let frozen = false

let sizeMultiplier = 1
let speedMultiplier = 1
let lineWidth = 18

const twoPointsDist = (ax, ay, bx, by) => Math.sqrt((ax-bx)**2 + (ay-by)**2)

// Main particle/node class
class Particle {
    constructor(x,y) {
        this.x = x
        this.y = y
        this.size = Math.random() * 4 + 2
        this.vx = Math.random() * 2 - 1
        this.vy = Math.random() * 2 - 1
    }
    update() {
        this.x += this.vx * ((5/3)**speedMultiplier)
        this.y += this.vy * ((5/3)**speedMultiplier)
        if (this.x > canvas.width) {
            this.x = canvas.width
            this.vx *= -1
        }
        if (this.x < 0) {
            this.x = 0
            this.vx *= -1
        }
        if (this.y > canvas.height) {
            this.y = canvas.height
            this.vy *= -1
        }
        if (this.y < 0) {
            this.y = 0
            this.vy *= -1
        }
    }
    draw() {
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(this.x,this.y,this.size/(1/(1.2**sizeMultiplier)),0,Math.PI*2)
        ctx.fill()
    }

    // I honestly have no idea how any of this works, I just copied and pasted from google lol
    get angle() {
        return ((Math.atan2(this.vy, this.vx) * 180/Math.PI) + 90) % 360
    }
    set angle(deg) {
        const aRad = Math.PI/180 * deg
        const vel = Math.sqrt((this.vx*this.vx)+(this.vy*this.vy))
        this.vx = Math.sin(aRad) * vel * -1
        this.vy = Math.cos(aRad) * vel * -1
    }

    get vel() {
        return Math.sqrt((this.vx*this.vx)+(this.vy*this.vy))
    }
    set vel(newVel) {
        xToSpeedRatio = this.vx/this.vel
        yToSpeedRatio = this.vy/this.vel
        this.vx = newVel * xToSpeedRatio
        this.vy = newVel * yToSpeedRatio
    }
}

// Create initial particles
let particles = []
for (var i = 0; i <= 125; i++) {
    particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height))
}

// Update the particles
function updateParticles() {
    if (!frozen) {
        particles.forEach((particle, unused) => {
            particle.update()
        })
    }
    if (drawLines) {
        particles.forEach((particle, unused) => {
            particles.forEach((connection, unused) => {
                let dist = twoPointsDist(particle.x,particle.y,connection.x,connection.y)
                if (dist < 150) {
                    ctx.lineWidth = 3/10*(1.125**lineWidth)
                    ctx.beginPath()
                    ctx.moveTo(particle.x, particle.y)
                    ctx.lineTo(connection.x, connection.y)
                    ctx.strokeStyle = `hsla(${hue},100%,${(100-(100*dist/300))}%,${1-(dist/150)})`
                    ctx.stroke()
                }
            })
        })
    }
    if (drawParticles) {
        particles.forEach((particle, i) => {
            particle.draw()
        })
    }
}

/* Controls to edit settings

If you don't know how this works because you have skill issue basically:
a = !a means reverse it, so true becomes false and false becomes true
a++ or a-- means increase and decrease respecively

*/
document.addEventListener('keypress', function(e) {
    if (e.key == 'q') {
        drawLines = !drawLines
    } else if (e.key == 'e') {
        drawParticles = !drawParticles
    } else if (e.key == 's') {
        frozen = !frozen
    } else if (e.key == '.') {
        speedMultiplier++
    } else if (e.key == ',') {
        speedMultiplier--
    } else if (e.key == ']') {
        sizeMultiplier++
    } else if (e.key == '[' && sizeMultiplier >= -8) {
        sizeMultiplier--
    } else if (e.key == '`') {
        toggleTitle()
    } else if (e.key == '\'') {
        lineWidth++
    } else if (e.key == ';' && lineWidth > -2) {
        lineWidth--
    } else {
        console.log(`Key: "${e.key}", Code: "${e.code}"`)
    }
})

// Clicking
canvas.addEventListener('mousedown', function(e) {
    console.log(e.which, e.button)
    // Left mouse button
    if (e.which == 1 || e.button == 1) {
        particles.push(new Particle(mouse.x,mouse.y))
    } else {
        // Right mouse button
        particles.sort((a,b) => {
            return twoPointsDist(mouse.x,mouse.y,a.x,a.y) - twoPointsDist(mouse.x,mouse.y,b.x,b.y)
        })
        if (Math.abs(twoPointsDist(mouse.x,mouse.y,particles[0].x,particles[0].y)) <= 17 + particles[0].size * sizeMultiplier) {
            particles.shift()
        }
    }
})

// Animate stuff
function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    updateParticles()
    hue = (hue + 1) % 360
    // Call again so it loops forever
    // BUG: different speeds on different refresh rates
    requestAnimationFrame(animate)
}

// Function to hide/show title
function toggleTitle() {
    title = document.getElementById('content')
    if (title.style.display == "none") {
        title.style.display = "block"
    } else {
        title.style.display = "none"
    }
}

// Start
animate()
