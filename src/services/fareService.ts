export interface FareCalculation {
  baseFare: number;
  distanceFare: number;
  emergencyCharge: number;
  femaleDriverCharge: number;
  totalFare: number;
  breakdown: {
    base: number;
    distance: number;
    emergency: number;
    femaleDriver: number;
  };
}

class FareService {
  private readonly BASE_FARE = 10; // Rs. 10
  private readonly FIRST_5KM_RATE = 5; // Rs. 5 per km
  private readonly NEXT_10KM_RATE = 8; // Rs. 8 per km
  private readonly ABOVE_15KM_RATE = 10; // Rs. 10 per km
  private readonly EMERGENCY_CHARGE = 10; // Rs. 10 extra
  private readonly FEMALE_DRIVER_CHARGE = 5; // Rs. 5 extra

calculateFare(
  distance: number, // in kilometers
  isEmergency: boolean = false,
  preferFemaleDriver: boolean = false
): FareCalculation {
  const baseFare = this.BASE_FARE;
  let distanceFare = 0;

  if (distance <= 5) {
    distanceFare = distance * this.FIRST_5KM_RATE;
  } else if (distance <= 15) {
    distanceFare =
      5 * this.FIRST_5KM_RATE +
      (distance - 5) * this.NEXT_10KM_RATE;
  } else {
    distanceFare =
      5 * this.FIRST_5KM_RATE +
      10 * this.NEXT_10KM_RATE +
      (distance - 15) * this.ABOVE_15KM_RATE;
  }

  const emergencyCharge = isEmergency ? this.EMERGENCY_CHARGE : 0;
  const femaleDriverCharge = preferFemaleDriver ? this.FEMALE_DRIVER_CHARGE : 0;

  const totalFare = Math.round(
    baseFare + distanceFare + emergencyCharge + femaleDriverCharge
  );

  return {
    baseFare,
    distanceFare: Math.round(distanceFare),
    emergencyCharge,
    femaleDriverCharge,
    totalFare,
    breakdown: {
      base: baseFare,
      distance: Math.round(distanceFare),
      emergency: emergencyCharge,
      femaleDriver: femaleDriverCharge,
    }
  };
}


  formatCurrency(amount: number): string {
    return `₹${amount.toFixed(0)}`;
  }

getFareBreakdownText(
  calculation: FareCalculation,
  distanceKm: number
): string {
    const parts: string[] = [];

    parts.push(`Base Fare: ${this.formatCurrency(calculation.breakdown.base)}`);
    parts.push(
      `Distance (${distanceKm.toFixed(1)} km): ${this.formatCurrency(
        calculation.breakdown.distance
      )}`
    );

    if (calculation.breakdown.emergency > 0) {
      parts.push(`Emergency: ${this.formatCurrency(calculation.breakdown.emergency)}`);
    }

    if (calculation.breakdown.femaleDriver > 0) {
      parts.push(
        `Female Driver: ${this.formatCurrency(calculation.breakdown.femaleDriver)}`
      );
    }

    return parts.join(" + ");
  }
}
export default new FareService(); 