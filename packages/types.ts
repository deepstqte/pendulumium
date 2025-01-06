export interface Pendulum {
  id: string;      // unique ID
  theta: number;   // initial angle (radians)
  mass: number;
  length: number;
  triggeredAt: number; // stored in milliseconds
  moving: boolean;
}
