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
function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

class Boid {
  position: Vector;
  velocity: Vector;
  acceleration: Vector;
  maxForce: number;
  maxSpeed: number;
  isPredator: boolean;
  perceptionRadius: number;
  constructor(width: number, height: number) {
    this.position = new Vector(random(width), random(height));
    this.velocity = Vector.random2D();
    this.velocity.setMag(random(0.8, 1));
    this.acceleration = new Vector(0, 0);
    this.maxForce = 0.01;
    this.maxSpeed = 1;
    this.isPredator = false;
    this.perceptionRadius = 100;
  }

  edges(width: number, height: number) {
    if (this.position.x > width) this.position.x = 0;
    else if (this.position.x < 0) this.position.x = width;
    if (this.position.y > height) this.position.y = 0;
    else if (this.position.y < 0) this.position.y = height;
  }

  seekPrey(boids: Boid[]): Vector {
    const steering = new Vector(0, 0);
    let total = 0;
    if (!this.isPredator) return steering;
    for (const other of boids) {
      const d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y,
      );
      if (other !== this && d < this.perceptionRadius) {
        if (!other.isPredator) {
          steering.add(other.position);
          total++;
        }
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.sub(this.position);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  avoidPredators(boids: Boid[]): Vector {
    const steering = new Vector(0, 0);
    if (this.isPredator) return steering;
    for (const other of boids) {
      if (!other.isPredator) continue;
      const d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y,
      );
      if (other !== this && d < this.perceptionRadius) {
        const diff = Vector.sub(this.position, other.position);
        diff.div(d);
        steering.add(diff);
      }
    }
    return steering;
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
      );
      if (other !== this && d < this.perceptionRadius) {
        const diff = Vector.sub(this.position, other.position);
        diff.div(d);
        steering.add(diff);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
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
      );
      if (other !== this && d < this.perceptionRadius) {
        if (this.isPredator === other.isPredator) {
          steering.add(other.position);
          total++;
        }
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.sub(this.position);
      steering.setMag(this.maxSpeed);
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
      );
      if (other !== this && d < this.perceptionRadius) {
        total++;
        steering.add(other.velocity);
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  flock(
    boids: Boid[],
    options: {
      alignWeight: 1.0;
      cohesionWeight: 1.0;
      separationWeight: 1.5;
      avoidPredatorsWeigh: 2.0;
      seekPreyWeight: 1.0;
    },
  ) {
    const alignment = this.align(boids).mult(options.alignWeight); // weight: 1.0
    const cohesion = this.cohesion(boids).mult(options.cohesionWeight); // weight: 1.0
    const separation = this.separation(boids).mult(options.separationWeight); // weight: 1.5
    const avoidPredators = this.avoidPredators(boids).mult(
      options.avoidPredatorsWeigh,
    );
    const seekPrey = this.seekPrey(boids).mult(options.seekPreyWeight); // weight: 1.0

    
    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
    this.acceleration.add(avoidPredators);
    this.acceleration.add(seekPrey);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);

    // Reset acceleration to 0 each cycle
    this.acceleration.mult(0);
  }
}

export { Vector, Boid };
