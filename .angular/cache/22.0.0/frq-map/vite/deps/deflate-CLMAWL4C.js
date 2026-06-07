import {
  inflate_1
} from "./chunk-FO225FRP.js";
import {
  BaseDecoder
} from "./chunk-UIA4LIVF.js";
import "./chunk-KWSTWQNB.js";

// node_modules/geotiff/dist-module/compression/deflate.js
var DeflateDecoder = class extends BaseDecoder {
  /** @param {ArrayBuffer} buffer */
  decodeBlock(buffer) {
    return inflate_1(new Uint8Array(buffer)).buffer;
  }
};
export {
  DeflateDecoder as default
};
//# sourceMappingURL=deflate-CLMAWL4C.js.map
