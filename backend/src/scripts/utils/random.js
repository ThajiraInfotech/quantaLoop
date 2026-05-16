function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function chance(p) {
  return Math.random() < p;
}

function intBetween(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

module.exports = { pick, pickN, chance, intBetween };
