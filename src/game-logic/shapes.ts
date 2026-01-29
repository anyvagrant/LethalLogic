export interface BlockShape {
  id: number;
  matrix: number[][]; // 1 for filled, 0 for empty
  colorClass: string;
  shadowClass: string;
  baseColor: string; // Hex for particles
  starPosition?: { r: number, c: number }; // Coordinates of the star within the matrix
}

// P5 Style: Flat colors, thick borders, "comic" highlight logic handled in component
export const COLORS = [
  { 
    base: 'bg-[#ff0000] border-2 border-black', 
    shadow: 'shadow-none', // Handled via comic highlight div
    baseColor: '#ff0000'
  },
  { 
    base: 'bg-[#ffffff] border-2 border-black', 
    shadow: 'shadow-none',
    baseColor: '#ffffff'
  },
  { 
    base: 'bg-[#222222] border-2 border-white', 
    shadow: 'shadow-none',
    baseColor: '#000000'
  },
  { 
    base: 'bg-[#D32F2F] border-2 border-black', 
    shadow: 'shadow-none',
    baseColor: '#D32F2F'
  },
  { 
    base: 'bg-[#757575] border-2 border-black', 
    shadow: 'shadow-none',
    baseColor: '#757575'
  },
];

const MATRICES = [
  // 1x1
  [[1]],
  // 2x1
  [[1, 1]],
  [[1], [1]],
  // 3x1
  [[1, 1, 1]],
  [[1], [1], [1]],
  // 2x2 Square
  [[1, 1], [1, 1]],
  // L shapes
  [[1, 0], [1, 0], [1, 1]],
  [[0, 1], [0, 1], [1, 1]],
  [[1, 1, 1], [1, 0, 0]],
  // T shapes
  [[1, 1, 1], [0, 1, 0]],
  [[0, 1], [1, 1], [0, 1]],
  // 4x1
  [[1, 1, 1, 1]],
  [[1], [1], [1], [1]],
  // 5x1 (Rare)
  [[1, 1, 1, 1, 1]],
  [[1], [1], [1], [1], [1]],
  // 3x3 Cross (Rare)
  [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
  // 3x3 Corner
  [[1, 1, 1], [1, 0, 0], [1, 0, 0]]
];

export function getRandomShapes(count: number): BlockShape[] {
  const shapes: BlockShape[] = [];
  for (let i = 0; i < count; i++) {
    const matrix = MATRICES[Math.floor(Math.random() * MATRICES.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // 20% Chance for a Star Block
    let starPosition: {r: number, c: number} | undefined = undefined;
    if (Math.random() < 0.20) {
      // Find all filled cells
      const filledCells: {r: number, c: number}[] = [];
      matrix.forEach((row, r) => {
        row.forEach((val, c) => {
          if (val === 1) filledCells.push({r, c});
        });
      });
      // Pick one random cell to be the star
      if (filledCells.length > 0) {
        starPosition = filledCells[Math.floor(Math.random() * filledCells.length)];
      }
    }

    shapes.push({
      id: Date.now() + i + Math.random(),
      matrix: matrix,
      colorClass: color.base,
      shadowClass: color.shadow,
      baseColor: color.baseColor,
      starPosition: starPosition
    });
  }
  return shapes;
}