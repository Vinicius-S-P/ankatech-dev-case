export interface SummaryStats {
  total: number;
  average: number;
  min: number;
  max: number;
  count: number;
}

export function calculateSummary(data: { value: number }[]): SummaryStats {
  if (data.length === 0) {
    return {
      total: 0,
      average: 0,
      min: 0,
      max: 0,
      count: 0,
    };
  }

  const values = data.map(d => d.value);
  const total = values.reduce((sum, val) => sum + val, 0);
  const average = total / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    total,
    average,
    min,
    max,
    count: data.length,
  };
}

export function groupByCategory<T extends { category: string }>(
  data: T[]
): Record<string, T[]> {
  return data.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function groupByDate(
  data: { date: Date; category: string; value: number }[]
): Array<{
  date: string;
  plano_original: number;
  situacao_atual: number;
  custo_vida: number;
}> {
  const grouped = data.reduce((acc, item) => {
    const dateKey = item.date.toISOString().split('T')[0];
    
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        plano_original: 0,
        situacao_atual: 0,
        custo_vida: 0,
      };
    }
    
    if (item.category in acc[dateKey]) {
      acc[dateKey][item.category as keyof typeof acc[string]] += item.value;
    }
    
    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
