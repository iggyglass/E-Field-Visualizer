export class ChargePool {
    index = 0;
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

    length() {
        return this.array.length;
    }

    asF32Array() {
        return new Float32Array(this.array.flat());
    }
}
