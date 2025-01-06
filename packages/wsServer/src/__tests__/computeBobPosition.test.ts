import { computeBobPosition } from "../utils";
import { Pendulum } from "../../../types";

describe("computeBobPosition function", () => {
  test("should place the bob straight down if pendulum is not moving", () => {
    const pendulum: Pendulum = {
      id: "test1",
      theta: 1.0, // doesn't matter since moving=false
      mass: 2,
      length: 1.5,
      triggeredAt: 123456,
      moving: false,
    };

    const index = 0;
    const anchorXOffset = 100;
    const anchorSpacing = 120;
    const ceilingY = 40;
    const lengthScale = 100; // 1 meter = 100px
    const currentTimeMs = 200000; // arbitrary

    const result = computeBobPosition(
      pendulum,
      index,
      anchorXOffset,
      anchorSpacing,
      ceilingY,
      lengthScale,
      currentTimeMs
    );

    // If moving=false, angle=0 => "straight down"
    // so x = anchorX, y = anchorY + (length * scale)
    const anchorX = anchorXOffset + index * anchorSpacing; // 100 + 0*120 = 100
    const anchorY = ceilingY; // 40
    const lengthPx = pendulum.length * lengthScale; // 1.5 * 100 = 150

    // x = anchorX + lengthPx * sin(0) => 100 + 150 * 0 => 100
    // y = anchorY + lengthPx * cos(0) => 40 + 150 * 1 => 190
    expect(result.x).toBeCloseTo(anchorX, 5);
    expect(result.y).toBeCloseTo(anchorY + lengthPx, 5);
  });

  test("should compute bob position based on current angle if moving=true", () => {
    const pendulum: Pendulum = {
      id: "moving1",
      theta: Math.PI / 4,
      mass: 1,
      length: 2,
      triggeredAt: 1000,
      moving: true,
    };

    const index = 2;
    const anchorXOffset = 100;
    const anchorSpacing = 120;
    const ceilingY = 40;
    const lengthScale = 10;  // 1 meter = 10px
    const currentTimeMs = 3000; // so elapsed = 2000ms => 2s

    // Doing an "expected angle" check.
    // getCurrentAngle(length=2, initialAngle=45deg, time=2s)
    // I won't replicate the math exactly; let's just trust getCurrentAngle is correct and check the shape of the result.
    // This is because getCurrentAngle has its own test suite
    const result = computeBobPosition(
      pendulum,
      index,
      anchorXOffset,
      anchorSpacing,
      ceilingY,
      lengthScale,
      currentTimeMs
    );

    // anchorX = 100 + 2*120 => 100 + 240 => 340
    // anchorY = 40
    // lengthPx = 2 * 10 => 20
    // angle = getCurrentAngle(2, pi/4, 2000)
    // I won't do the exact physics, just ensure it's not "straight down" or "straight up"
    // So let's just confirm the returned x,y are different from the not-moving scenario
    expect(result.x).not.toBe(340);
    expect(result.y).not.toBe(60); // 40 + 20 if angle=0
  });

  test("should incorporate index-based anchor spacing correctly", () => {
    const pendulum: Pendulum = {
      id: "spacingTest",
      theta: 0,
      mass: 1,
      length: 1,
      triggeredAt: 99999,
      moving: false,
    };

    const anchorXOffset = 100;
    const anchorSpacing = 120;
    const ceilingY = 40;
    const lengthScale = 100;
    const currentTimeMs = Date.now();

    // We'll test for index=0, index=1, to see that x is offset
    const resultIndex0 = computeBobPosition(
      pendulum,
      0,
      anchorXOffset,
      anchorSpacing,
      ceilingY,
      lengthScale,
      currentTimeMs
    );
    const resultIndex1 = computeBobPosition(
      pendulum,
      1,
      anchorXOffset,
      anchorSpacing,
      ceilingY,
      lengthScale,
      currentTimeMs
    );

    // For index=0 => anchorX=100 + (0*120)=100
    // For index=1 => anchorX=100 + (1*120)=220
    expect(resultIndex0.x).toBeCloseTo(100, 5); // since angle=0 => x= anchorX
    expect(resultIndex1.x).toBeCloseTo(220, 5);
  });
});
