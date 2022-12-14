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
let lightMode = false

let sizeMultiplier = 1
let speedMultiplier = 1
let lineWidth = 5
let maxConnections = 9
let targetFPS = 45

let lineCol = 'rainbow'
let nodeCol = '#ffffff'

// Variables we will use later
let connectionsMade = 0
const twoPointsDist = (ax, ay, bx, by) => Math.sqrt((ax-bx)**2 + (ay-by)**2)

// Main particle/node class
class Particle {
    constructor(x,y) {
        this.x = x
        this.y = y
        this.size = Math.random() * 4 + 2
        this.vx = Math.random() * 2 - 1
        this.vy = Math.random() * 2 - 1
        this.reachedMaxConnections = false
    }
    update() {
        this.x += this.vx * ((5/3)**speedMultiplier) * (48/targetFPS)
        this.y += this.vy * ((5/3)**speedMultiplier) * (48/targetFPS)
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
        ctx.fillStyle = nodeCol
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
        const vel = this.vel
        this.vx = Math.sin(aRad) * vel * -1
        this.vy = Math.cos(aRad) * vel * -1
    }

    wander() {
        this.vx += ((Math.random()-0.5)/10)
        this.vy += ((Math.random()-0.5)/10)
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
for (var i = 0; i <= (window.innerWidth * window.innerHeight)*0.000075; i++) { // 0.000048226 because 75 pixels per 1000*1000 pixels
    particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height))
}

// Update the particles
function updateParticles() {
    particles.forEach((particle, unused) => {
        particle.reachedMaxConnections = false
    });

    if (!frozen && targetFPS >= 1) {
        particles.forEach((particle, unused) => {
            particle.update()
        })
        /*
        particles.forEach((particle, i) => {
            particle.wander()
        });
        wanderingFrame = 0
        */
    }
    if (drawLines) {
        particles.forEach((particle, unused) => {
            connectionsMade = 0
            for (var connection of particles) {
                if (particle != connection || Math.abs(particle.x-connection.x) <= 150 || Math.abs(particle.y-connection.y) <= 150) {
                    let dist = twoPointsDist(particle.x,particle.y,connection.x,connection.y)
                    if (dist < 150 && !connection.reachedMaxConnections) {
                        ctx.lineWidth = 3/10*(1.5**lineWidth)
                        ctx.beginPath()
                        ctx.moveTo(particle.x, particle.y)
                        ctx.lineTo(connection.x, connection.y)
                        if (lineCol == 'rainbow') {
                            ctx.strokeStyle = `hsla(${hue},100%,${((lightMode ? 0 : 100)-(100*dist/300))}%,${1-(dist/150)})`
                        } else {
                            ctx.strokeStyle = lineCol + String(1-(dist/150)) + ')'
                        }
                        ctx.stroke()
                        if (connectionsMade >= maxConnections) {
                            break
                        } else {
                            connectionsMade++
                        }
                    }
                }
            }
            particle.reachedMaxConnections = true
        })
    }
    if (drawParticles) {
        particles.forEach((particle, i) => {
            particle.draw()
        })
    }
    if (lineCol == 'rainbow') {
        hue++
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
    } else if (e.key == 'a') {
        particles.push(new Particle(mouse.x,mouse.y))
    } else if (e.key == 'd') {
        particles.sort((a,b) => {
            return twoPointsDist(mouse.x,mouse.y,a.x,a.y) - twoPointsDist(mouse.x,mouse.y,b.x,b.y)
        })
        if (Math.abs(twoPointsDist(mouse.x,mouse.y,particles[0].x,particles[0].y)) <= 17 + particles[0].size * sizeMultiplier) {
            particles.shift()
        }
    } else if (e.key == '.' && speedMultiplier < 6) {
        speedMultiplier++
    } else if (e.key == ',' && speedMultiplier > -4) {
        speedMultiplier--
    } else if (e.key == ']' && sizeMultiplier < 14) {
        sizeMultiplier++
    } else if (e.key == '[' && sizeMultiplier > -8) {
        sizeMultiplier--
    } else if (e.key == '\'' && lineWidth < 16) {
        lineWidth++
    } else if (e.key == ';' && lineWidth > -2) {
        lineWidth--
    } else if (e.key == '`') {
        toggleTitle()
    } else {
        console.log(`Key: "${e.key}", Code: "${e.code}"`)
    }
    console.log(lineWidth)
    updateSettingsToForm()
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
    if (lightMode) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0,0,canvas.width,canvas.height)
    }
    updateParticles()
    // Call again so it loops forever
    setTimeout(function () {
        requestAnimationFrame(animate)
    }, 1000/targetFPS);
}

// Function to hide/show title
function toggleTitle() {
    const title = document.getElementById('content')
    if (title.style.display != "none") {
        title.style.setProperty('animation-name', 'title-exit')
        setTimeout(function () {
            title.style.display = "none"
        }, 999);
    } else {
        title.style.setProperty('animation-name', 'title-entrance')
        title.style.display = "block"
    }
}

function toggleSettingsMenu() {
    const overlay = document.getElementsByClassName('overlay')[0]
    const settingsMenu = document.getElementsByClassName('settings')[0]
    if (settingsMenu.style.display == "inline-block") {
        settingsMenu.style.setProperty('animation-timing-function', 'ease-in')
        settingsMenu.style.setProperty('animation-name', 'settings-exit')
        overlay.style.setProperty('animation-name', 'overlay-exit')
        setTimeout(function () {
            settingsMenu.style.setProperty('display', 'none', 'important')
            overlay.style.setProperty('display', 'none')
        }, 1450) // To prevent flicker, the duration is cut down slightly.
    } else {
        settingsMenu.style.setProperty('animation-timing-function', 'ease-out')
        settingsMenu.style.setProperty('animation-name', 'settings-entrance')
        overlay.style.setProperty('animation-name', 'overlay-entrance')
        settingsMenu.style.setProperty('display', 'inline-block', 'important')
        overlay.style.setProperty('display', 'inline-block')
    }
    // Toggles off title if title is still there
    const title = document.getElementById('content')
    console.log(title.style.display)
    if (title.style.display != "none") {
        toggleTitle()
    }
}

function updateSettingsFromForm() {
    settingsMenu = document.getElementsByClassName('settings-form')[0]
    speedMultiplier = settingsMenu.querySelector('#speedMultiplier').value
    sizeMultiplier = settingsMenu.querySelector('#nodeSize').value
    lineWidth = settingsMenu.querySelector('#connectionSize').value

    frozen = settingsMenu.querySelector('#frozen').checked
    targetFPS = settingsMenu.querySelector('#targetFPS').value
    maxConnections = settingsMenu.querySelector('#maxConnections').value
    drawLines = settingsMenu.querySelector('#lines').checked
    drawParticles = settingsMenu.querySelector('#nodes').checked

    lineCol = settingsMenu.querySelector('#connectionColor').value
    nodeCol = settingsMenu.querySelector('#nodeColor').value
    lightMode = settingsMenu.querySelector('#lightMode').checked
}

function updateSettingsToForm() {
    settingsMenu = document.getElementsByClassName('settings-form')[0]
    settingsMenu.querySelector('#speedMultiplier').value = speedMultiplier
    settingsMenu.querySelector('#nodeSize').value = sizeMultiplier
    settingsMenu.querySelector('#connectionSize').value = lineWidth

    settingsMenu.querySelector('#frozen').checked = frozen
    settingsMenu.querySelector('#lines').checked = drawLines
    settingsMenu.querySelector('#nodes').checked = drawParticles
}

// Start
animate()
setTimeout(function () {
    const overlay = document.querySelector('#overlay')
    overlay.style.setProperty('display', 'none')
    overlay.style.setProperty('animation-name', 'overlay-entrance')
}, 1450)
