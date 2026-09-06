import { describe, expect, it } from "vitest";
import {
  calculateTotal,
  carsNeeded,
  FLEET_SIZE,
  MAX_GUESTS,
  MAX_GUESTS_PER_CAR,
  MIN_GUESTS,
  TOURS,
} from "@/lib/tours";

describe("calculateTotal", () => {
  it("multiplies price per person by guest count for every tier", () => {
    for (const tour of TOURS) {
      expect(calculateTotal(tour.id, 3)).toBe(tour.pricePerPerson * 3);
      expect(calculateTotal(tour.id, MAX_GUESTS)).toBe(tour.pricePerPerson * MAX_GUESTS);
    }
  });

  it("throws for an unknown tour id rather than silently pricing at 0", () => {
    // @ts-expect-error deliberately invalid tour id
    expect(() => calculateTotal("platinum", 3)).toThrow();
  });
});

describe("carsNeeded", () => {
  it("needs exactly one car up to a full car's capacity", () => {
    expect(carsNeeded(1)).toBe(1);
    expect(carsNeeded(MIN_GUESTS)).toBe(1);
    expect(carsNeeded(MAX_GUESTS_PER_CAR)).toBe(1);
  });

  it("rounds up to a second car the moment one guest exceeds a full car", () => {
    expect(carsNeeded(MAX_GUESTS_PER_CAR + 1)).toBe(2);
  });

  it("needs exactly FLEET_SIZE cars for a full-fleet booking, never more", () => {
    expect(carsNeeded(MAX_GUESTS)).toBe(FLEET_SIZE);
  });

  it("treats non-positive or non-finite input as one car rather than throwing", () => {
    expect(carsNeeded(0)).toBe(1);
    expect(carsNeeded(-5)).toBe(1);
    expect(carsNeeded(NaN)).toBe(1);
  });
});

describe("fleet capacity constants stay consistent", () => {
  it("MAX_GUESTS is exactly what the fleet can seat in one party", () => {
    expect(MAX_GUESTS).toBe(FLEET_SIZE * MAX_GUESTS_PER_CAR);
  });
});
