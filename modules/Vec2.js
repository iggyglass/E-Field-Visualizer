export class Vec2 {
    x = 0;
    y = 0;

    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    static fromOther(other) {
        let x = other.x || other[0] || 0;
        let y = other.y || other[1] || 0;

        return new Vec2(x, y);
    }

    static fromPolar(r, theta) {
        return new Vec2(r * Math.cos(theta), r * Math.sin(theta));
    }

    static zero() {
        return new Vec2(0, 0);
    }

    static one() {
        return new Vec2(1, 1);
    }

    clone() {
        return new Vec2(this.x, this.y);
    }

    asArray() {
        return [this.x, this.y];
    }

    add(vector) {
        this.x += vector.x || vector[0] || 0;
        this.y += vector.y || vector[1] || 0;

        return this;
    }

    sub(vector) {
        this.x -= vector.x || vector[0] || 0;
        this.y -= vector.y || vector[1] || 0;

        return this;
    }

    mul(vector) {
        this.x *= vector.x || vector[0] || 0;
        this.y *= vector.y || vector[1] || 0;

        return this;
    }

    dot(vector) {
        return this.x * (vector.x || vector[0] || 0) + this.y * (vector.y || vector[1] || 0);
    }

    mulScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;

        return this;
    }

    divScalar(scalar) {
        this.x /= scalar;
        this.y /= scalar;

        return this;
    }

    distSquaredFrom(vector) {
        let c = this.clone().sub(vector);

        return c.dot(c);
    }

    distFrom(vector) {
        return Math.sqrt(this.distSquaredFrom(vector));
    }

    normalize() {
        let m = this.magnitude();

        this.x /= m;
        this.y /= m;

        return this;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}
