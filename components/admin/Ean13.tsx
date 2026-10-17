// Draws an EAN-13 barcode as SVG, readable by any standard retail scanner.
const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

export function ean13Bits(code: string) {
  const d = code.split('').map(Number);
  const parity = PARITY[d[0]];
  let bits = '101';
  for (let i = 1; i <= 6; i++) bits += (parity[i - 1] === 'L' ? L : G)[d[i]];
  bits += '01010';
  for (let i = 7; i <= 12; i++) bits += R[d[i]];
  return bits + '101';
}

export default function Ean13({ code, height = 40 }: { code: string; height?: number }) {
  if (!/^\d{13}$/.test(code)) {
    return <p className="text-[11px]">{code}</p>;
  }
  const bits = ean13Bits(code);
  const quiet = 9;
  const width = bits.length + quiet * 2;
  const guard = (i: number) => i < 3 || (i >= 45 && i < 50) || i >= 92;
  return (
    <svg viewBox={`0 0 ${width} ${height + 9}`} className="w-full h-auto" role="img" aria-label={`Barcode ${code}`} shapeRendering="crispEdges">
      <rect width={width} height={height + 9} fill="#fff" />
      {bits.split('').map((b, i) =>
        b === '1' ? <rect key={i} x={quiet + i} y={0} width={1} height={guard(i) ? height + 5 : height} fill="#000" /> : null,
      )}
      <text x={2} y={height + 8} fontSize="8" fontFamily="monospace">{code[0]}</text>
      <text x={quiet + 3 + 21} y={height + 8} fontSize="8" fontFamily="monospace" textAnchor="middle">{code.slice(1, 7)}</text>
      <text x={quiet + 50 + 21} y={height + 8} fontSize="8" fontFamily="monospace" textAnchor="middle">{code.slice(7)}</text>
    </svg>
  );
}
