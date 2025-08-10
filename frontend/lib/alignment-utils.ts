export function calculateAlignmentScore(currentAllocation: Record<string, number>, targetAllocation: Record<string, number>): number {
  let score = 0;
  let totalWeight = 0;

  for (const assetClass in targetAllocation) {
    const current = currentAllocation[assetClass] || 0;
    const target = targetAllocation[assetClass];

    // Calculate the difference for each asset class
    const difference = Math.abs(current - target);

    // A simple scoring mechanism: the smaller the difference, the higher the score for this asset class
    // You might want to normalize this based on the target value or overall portfolio size
    score += (1 - Math.min(difference / target, 1)) * target; // Weighted by target allocation
    totalWeight += target;
  }

  // Normalize the score to be between 0 and 100
  return totalWeight > 0 ? (score / totalWeight) * 100 : 0;
}

export function getRebalanceSuggestions(currentAllocation: Record<string, number>, targetAllocation: Record<string, number>, totalPortfolioValue: number): Record<string, number> {
  const suggestions: Record<string, number> = {};

  for (const assetClass in targetAllocation) {
    const currentAmount = (currentAllocation[assetClass] || 0) * totalPortfolioValue;
    const targetAmount = targetAllocation[assetClass] * totalPortfolioValue;

    const difference = targetAmount - currentAmount;

    // Suggest buying if current is less than target, selling if current is more than target
    suggestions[assetClass] = difference;
  }

  return suggestions;
}