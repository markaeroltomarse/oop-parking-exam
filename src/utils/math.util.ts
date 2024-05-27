export function getPercentageOf(number: number, baseNumber: number): number {
  return (number / baseNumber) * 100;
}

export function getValueFromPercentage(
  percentage: number,
  total: number
): number {
  return (percentage / 100) * total;
}
