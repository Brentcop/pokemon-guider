/* Tiny MD5 (UTF-8 string → hex). Used to build Bulbapedia image-archive paths:
   archives.bulbagarden.net/media/upload/<h[0]>/<h[0..1]>/<File_name.png>, h = md5("File_name.png"). */
window.md5 = (() => {
  "use strict";
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);
  const R = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  return (str) => {
    const bytes = new TextEncoder().encode(str), n = ((bytes.length + 8) >> 6) + 1;
    const w = new Uint32Array(n * 16);
    bytes.forEach((b, i) => { w[i >> 2] |= b << ((i % 4) * 8); });
    w[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8);
    w[n * 16 - 2] = (bytes.length * 8) >>> 0;
    w[n * 16 - 1] = Math.floor(bytes.length / 0x20000000);
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (let o = 0; o < w.length; o += 16) {
      let a = a0, b = b0, c = c0, d = d0;
      for (let i = 0; i < 64; i++) {
        const r = i >> 4;
        let f, g;
        if (r === 0) { f = (b & c) | (~b & d); g = i; }
        else if (r === 1) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
        else if (r === 2) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
        else { f = c ^ (b | ~d); g = (7 * i) % 16; }
        const s = R[r * 4 + (i % 4)], t = (a + f + K[i] + w[o + g]) >>> 0;
        a = d; d = c; c = b; b = (b + ((t << s) | (t >>> (32 - s)))) >>> 0;
      }
      a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0; c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
    }
    return [a0, b0, c0, d0].map((v) => [0, 8, 16, 24].map((s) => ((v >>> s) & 255).toString(16).padStart(2, "0")).join("")).join("");
  };
})();
