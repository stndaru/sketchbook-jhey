import gsap from 'gsap'

class Meteor {
  constructor(options) {
    const that = this
    this.canvas = options.element
    this.options = options
    this.context = this.canvas.getContext('2d')
    this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio 
    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio

    // Create a reusable gradient
    that.gradient = that.context.createLinearGradient(that.canvas.width * 0.5, that.canvas.height * 0.5, that.canvas.width * 0.5, 0)
    that.gradient.addColorStop(0, 'hsl(30, 100%, 100%)')
    that.gradient.addColorStop(0.025, 'hsl(30, 100%, 70%)')
    that.gradient.addColorStop(0.15, 'hsl(30, 100%, 40%)')
    that.gradient.addColorStop(0.55, 'hsl(30, 100%, 20%)')
    that.gradient.addColorStop(1, 'transparent')

    that.sparkGradient = that.context.createLinearGradient(that.canvas.width * 0.5, that.canvas.height * 0.5, that.canvas.width * 0.5, 0)
    that.sparkGradient.addColorStop(0, 'hsl(30, 100%, 100%)')
    that.sparkGradient.addColorStop(0.025, 'hsl(30, 100%, 70%)')
    that.sparkGradient.addColorStop(0.15, 'hsl(30, 100%, 40%)')
    that.sparkGradient.addColorStop(0.9, 'hsl(30, 100%, 20%)')
    that.sparkGradient.addColorStop(1, 'transparent')

    this.particles = that.genParticles(gsap.utils.random(20, 100, 1))
    this.setParticlesMotion()
    gsap.ticker.add(this.draw.bind(that))


    /**
     * If the meteor has a collision, we need to detect that and use it.
     * The trick here will be to detect when the canvas animationend event happens in CSS.
     * Then make a "special" animation sequence where the sparks etc. no when to stop
     * We creat a blowing up effect and then sparks that shoot out. Extra marks here for 
     * in front and behind sparks that give the 3D effect
     * */
    if (options.collision) {
      this.canvas.addEventListener('animationend', () => {
        console.info('start collision sequence.')
        this.collided = true
        // When this collision happens, we need to do some GSAP trickery to take the tail down, etc.
        gsap.to(that.options, {
          duration: 0.5,
          length: 0,
          width: 0,
          onComplete: function() {
            gsap.delayedCall(2, function () {
              console.info('hello???')
              that.collided = false
              // that.particles = that.genParticles(gsap.utils.random(20, 100, 1))
              that.setParticlesMotion()
            })
          }
        })
        // It's all good taking the size down but you also need the explosion of particles
        // These could be like, debris pieces or something at different angles...
        // Use GSAP's Physics2D for that and then have them with different gravity

      })
    }
  }
  /**
   * Generate some particles
   * Only care about sizing
   * */
  genParticles(amount) {
    const that = this
    const particles = []
    for (let p = 0; p < amount; p++) {
      const particle = {
        size: gsap.utils.random(1, that.options.width * 1.25, 1) * window.devicePixelRatio,
      }
      particles.push(particle)
    }
    return particles
  }
  /**
   * Drawing loop.
   * 1. Draw the head
   * 2. Draw the tail
   * 3. Draw the sparks
   * 4. Draw the colliders
   * */
  draw() {
    const that = this
    that.context.clearRect(0, 0, that.canvas.width, that.canvas.height)
    // Set a blur on the canvas
    that.context.shadowBlur = 10 * window.devicePixelRatio
    that.context.shadowColor = 'hsl(30, 100%, 40%)'

    // 1. Base of the meteor (A semicircle)
    that.context.beginPath()
    const radius = that.options.width / 2 * window.devicePixelRatio
    that.context.arc(
      that.canvas.width * 0.5,
      that.canvas.height * 0.5 - radius,
      radius,
      0,
      1 * Math.PI
    )
    that.context.fill()
    // 2. The tail of the meteor (A triangle)
    that.context.fillStyle = that.gradient
    that.context.moveTo(that.canvas.width * 0.5 - radius, that.canvas.height * 0.5 - radius)
    that.context.lineTo(that.canvas.width * 0.5, (that.canvas.height * 0.5) - that.options.length * window.devicePixelRatio)
    that.context.lineTo(that.canvas.width * 0.5 + radius, that.canvas.height * 0.5 - radius)
    that.context.fill()
    // 3. Iterate over and render the particles
    for (const particle of that.particles) {
      that.context.beginPath()
      that.context.fillStyle = particle.dead ? 'transparent' : that.sparkGradient
      that.context.arc(
        particle.x,
        particle.y,
        particle.size / 2,
        0,
        2 * Math.PI
      )
      that.context.fill()
    }
    // 4. If there are collider sparks and we've collided, make sure you use them here...

  }
  /**
   * Sets the sparks in motion
   * */
  setParticlesMotion() {
    const that = this
    for (const particle of that.particles) {
      // Given an angle and distance, you can create an x and y destination
      particle.x = that.canvas.width * 0.5
      particle.y = that.canvas.height * 0.5
      particle.dead = false
      if (particle.size === 0) particle.size = gsap.utils.random(1, that.options.width * 1.25, 1) * window.devicePixelRatio
      if (particle.tl) particle.tl.kill()
      particle.tl = gsap.timeline().to(particle, {
        x: () => gsap.utils.random(that.canvas.width * 0.25, that.canvas.width * 0.75, 1),
        y: () => gsap.utils.random(0, 0, 1),
        size: 0,
        repeat: -1,
        onRepeat: function () {
          if (that.collided) {
            // Kill particles on collision fade until we bring them back
            particle.dead = true
            particle.tl.kill()
          }
        },
        ease: 'power4.out',
        repeatDelay: Math.random(),
        delay: () => gsap.utils.random(-5, 0),
        duration: () => gsap.utils.random(0, 5),
      })
    }
  }
}

const SOARERS = document.querySelectorAll('canvas')
SOARERS.forEach(c => {
  const collision = !!c.closest('article')
  new Meteor({ collision, element: c, length: gsap.utils.random(50, 80, 1), width: gsap.utils.random(4, 8, 1)})
})
