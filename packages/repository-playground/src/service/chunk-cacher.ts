// import xxhash from "xxhash-wasm";
// const { h64ToString } = await xxhash();
import crypto from "crypto";

function convertBase(value: string, from_base: number, to_base: number) {
  var range = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("");
  var from_range = range.slice(0, from_base);
  var to_range = range.slice(0, to_base);

  var dec_value = value
    .split("")
    .reverse()
    .reduce(function (carry, digit, index) {
      if (from_range.indexOf(digit) === -1)
        throw new Error("Invalid digit `" + digit + "` for base " + from_base + ".");
      return (carry += from_range.indexOf(digit) * Math.pow(from_base, index));
    }, 0);

  var new_value = "";
  while (dec_value > 0) {
    new_value = to_range[dec_value % to_base] + new_value;
    dec_value = (dec_value - (dec_value % to_base)) / to_base;
  }
  return new_value || "0";
}

class StringCache {
  constructor(
    private hashes: { [key: string]: number } = {},
    private caches: string[] = [],
    private getHash: (value: string) => string = (value) => crypto.createHash("md5").update(value).digest("hex")
  ) {}

  set(value: string) {
    const hash = this.getHash(value);
    return (this.hashes[hash] = this.hashes[hash] === undefined ? this.caches.push(value) - 1 : this.hashes[hash]);
  }

  get(key: number) {
    return this.caches[key];
  }

  toJSON() {
    return { hashes: this.hashes, caches: this.caches };
  }

  static fromJson(state: ReturnType<StringCache["toJSON"]>) {
    return new StringCache(state.hashes, state.caches);
  }
}

export class ChunkCacher {
  private stringCache: StringCache;

  constructor(private chunkSize: number) {
    this.stringCache = new StringCache();
  }

  public cache(value: string) {
    const chunks = value === "" ? [""] : value.match(new RegExp(`[^]{1,${this.chunkSize}}`, "mg"));

    if (chunks === null) throw new Error("it should be impossible");

    for (var i = 0; i < chunks.length; i++) {
      chunks[i] = Buffer.from(chunks[i]).toString();
    }

    const result = chunks
      .map((x) => this.stringCache.set(x))
      .map((x) => convertBase(x + "", 10, 64))
      .join("-");

    return result;
  }

  public toJSON() {
    return this.stringCache;
  }
}
