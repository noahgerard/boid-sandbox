// Vector utility class
class Vector {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  add(v: Vector) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  sub(v: Vector) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  mult(n: number) {
    this.x *= n;
    this.y *= n;
    return this;
  }
  div(n: number) {
    this.x /= n;
    this.y /= n;
    return this;
  }
  setMag(n: number) {
    const m = this.mag();
    if (m !== 0) this.mult(n / m);
    return this;
  }
  limit(max: number) {
    if (this.mag() > max) this.setMag(max);
    return this;
  }
  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  static sub(a: Vector, b: Vector) {
    return new Vector(a.x - b.x, a.y - b.y);
  }
  static random2D() {
    const angle = Math.random() * Math.PI * 2;
    return new Vector(Math.cos(angle), Math.sin(angle));
  }
}
function random(a: number, b?: number) {
  return b === undefined ? Math.random() * a : a + Math.random() * (b - a);
}
// Toroidal distance function
function dist(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  height: number,
) {
  let dx = Math.abs(x2 - x1);
  let dy = Math.abs(y2 - y1);
  if (dx > width / 2) dx = width - dx;
  if (dy > height / 2) dy = height - dy;
  return Math.hypot(dx, dy);
}

class Boid {
  position: Vector;
  velocity: Vector;
  acceleration: Vector;
  // Maximum steering force
  maxForce: number;
  // Maximum speed
  maxVel: number;
  // Perception radius for alignment, cohesion, and separation
  alignRadius: number;
  cohesionRadius: number;
  sepRadius: number;

  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.position = new Vector(random(width), random(height));
    this.velocity = Vector.random2D();
    this.velocity.setMag(random(0.8, 1));
    this.acceleration = new Vector(0, 0);
    this.maxForce = 0.05;
    this.maxVel = 0.5;
    this.alignRadius = 50;
    this.cohesionRadius = 50;
    this.sepRadius = 25;
    this.width = width;
    this.height = height;
  }

  edges(width: number, height: number) {
    if (this.position.x > width) this.position.x = 0;
    else if (this.position.x < 0) this.position.x = width;
    if (this.position.y > height) this.position.y = 0;
    else if (this.position.y < 0) this.position.y = height;
  }

  separation(boids: Boid[]): Vector {
    const steering = new Vector(0, 0);
    let total = 0;
    for (const other of boids) {
      const d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y,
        this.width,
        this.height,
      );
      if (other !== this && d < this.sepRadius) {
        const diff = Vector.sub(this.position, other.position);
        diff.div(d);
        steering.add(diff);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxVel);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  cohesion(boids: Boid[]): Vector {
    const steering = new Vector(0, 0);
    let total = 0;
    for (const other of boids) {
      const d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y,
        this.width,
        this.height,
      );
      if (other !== this && d < this.cohesionRadius) {
        steering.add(other.position);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.sub(this.position);
      steering.setMag(this.maxVel);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  align(boids: Boid[]): Vector {
    const steering = new Vector(0, 0);
    let total = 0;
    for (const other of boids) {
      const d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y,
        this.width,
        this.height,
      );
      if (other !== this && d < this.alignRadius) {
        total++;
        steering.add(other.velocity);
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxVel);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  flock(
    boids: Boid[],
    options: {
      alignWeight: number;
      cohesionWeight: number;
      separationWeight: number;
    },
  ) {
    const alignment = this.align(boids).mult(options.alignWeight);
    const cohesion = this.cohesion(boids).mult(options.cohesionWeight);
    const separation = this.separation(boids).mult(options.separationWeight);

    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxVel);
    this.position.add(this.velocity);

    // Reset acceleration to 0 each cycle
    this.acceleration.mult(0);
  }
}

export { Vector, Boid };
