export class ChargePool {
    maxSize = 0;
    array = [];

    constructor(maxLength) {
        this.maxSize = maxLength;
    }

    add(item) {
        if (this.array.length == this.maxSize) this.array.pop();

        this.array.unshift(item);
    }

    remove(index) {
        this.array.splice(index, 1);
    }

    clear() {
        this.array = [];
    }

    length() {
        return this.array.length;
    }

    asF32Array() {
        return new Float32Array(this.array.flat());
    }
}
