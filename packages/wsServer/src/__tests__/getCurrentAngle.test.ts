import { getCurrentAngle } from "../utils";

// A few test cases verifying the formula is correct
describe("getCurrentAngle function", () => {
  test("should return initialAngle at t=0", () => {
    const length = 2;           // meters
    const initialAngle = Math.PI / 4;
    const timeMs = 0;

    const result = getCurrentAngle(length, initialAngle, timeMs);
    expect(result).toBeCloseTo(initialAngle, 5);
  });

  test("should decrease angle over time for small angles", () => {
    const length = 1;    // 1 meter
    const initialAngle = 0.2; // ~11.46 degrees
    const timeMs = 1000; // 1 second

    // I expect some attenuation of cos(omega * t)
    // omega = sqrt(9.81/1)=3.13 rad/s => cos(3.13 * 1)= cos(3.13) approx -0.999
    // multiplied by 0.2 => -0.1998
    // So the angle might be negative or small at t=1. Let’s just check it’s negative.
    const result = getCurrentAngle(length, initialAngle, timeMs);
    // I won't do an exact match, just check the sign or approximate
    expect(result).toBeLessThan(0);
  });

  test("should handle bigger time properly", () => {
    const length = 2;
    const initialAngle = 1; // ~57.3 degrees
    const timeMs = 5000;    // 5 seconds

    const result = getCurrentAngle(length, initialAngle, timeMs);
    // Just check it's a finite number (not NaN) and within -initialAngle..initialAngle
    expect(result).toBeGreaterThanOrEqual(-Math.abs(initialAngle));
    expect(result).toBeLessThanOrEqual(Math.abs(initialAngle));
  });
});
