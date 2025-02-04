import { call, type Operation } from "effection";

declare global {
  interface Promise<T> extends Operation<T> {}
}

Object.defineProperty(Promise.prototype, Symbol.iterator, {
  value() {
    return call(() => this)[Symbol.iterator]();
  },
});
