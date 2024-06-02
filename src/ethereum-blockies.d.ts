declare module 'ethereum-blockies' {
    export interface BlockiesOptions {
      seed: string; // Seed used to generate the icon
      size?: number; // Number of pixels square for the icon
      scale?: number; // Width/height of each pixel in the icon
      color?: string; // Background color of the icon
      bgcolor?: string; // Color of the icon pixels
      spotcolor?: string; // Color of the larger, spot-like pixels
    }
  
    export function create(options: BlockiesOptions): HTMLCanvasElement;
  }