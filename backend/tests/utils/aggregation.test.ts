import { calculateSummary, groupByCategory, groupByDate } from '../../src/utils/aggregation';

describe('Aggregation Utils', () => {
  describe('calculateSummary', () => {
    it('should calculate summary statistics correctly', () => {
      const data = [
        { value: 100 },
        { value: 200 },
        { value: 150 },
        { value: 50 },
      ];

      const summary = calculateSummary(data);

      expect(summary).toEqual({
        total: 500,
        average: 125,
        min: 50,
        max: 200,
        count: 4,
      });
    });

    it('should handle empty array', () => {
      const summary = calculateSummary([]);

      expect(summary).toEqual({
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        count: 0,
      });
    });

    it('should handle single value', () => {
      const data = [{ value: 100 }];
      const summary = calculateSummary(data);

      expect(summary).toEqual({
        total: 100,
        average: 100,
        min: 100,
        max: 100,
        count: 1,
      });
    });
  });

  describe('groupByCategory', () => {
    it('should group data by category', () => {
      const data = [
        { id: '1', category: 'plano_original', value: 100 },
        { id: '2', category: 'situacao_atual', value: 200 },
        { id: '3', category: 'plano_original', value: 150 },
        { id: '4', category: 'custo_vida', value: 300 },
      ];

      const grouped = groupByCategory(data);

      expect(grouped).toEqual({
        plano_original: [
          { id: '1', category: 'plano_original', value: 100 },
          { id: '3', category: 'plano_original', value: 150 },
        ],
        situacao_atual: [
          { id: '2', category: 'situacao_atual', value: 200 },
        ],
        custo_vida: [
          { id: '4', category: 'custo_vida', value: 300 },
        ],
      });
    });

    it('should handle empty array', () => {
      const grouped = groupByCategory([]);
      expect(grouped).toEqual({});
    });
  });

  describe('groupByDate', () => {
    it('should group data by date', () => {
      const data = [
        {
          id: '1',
          date: new Date('2024-01-01'),
          category: 'plano_original',
          value: 100,
        },
        {
          id: '2',
          date: new Date('2024-01-01'),
          category: 'situacao_atual',
          value: 200,
        },
        {
          id: '3',
          date: new Date('2024-01-02'),
          category: 'plano_original',
          value: 150,
        },
      ];

      const grouped = groupByDate(data);

      expect(grouped).toEqual([
        {
          date: '2024-01-01',
          plano_original: 100,
          situacao_atual: 200,
          custo_vida: 0,
        },
        {
          date: '2024-01-02',
          plano_original: 150,
          situacao_atual: 0,
          custo_vida: 0,
        },
      ]);
    });

    it('should handle empty array', () => {
      const grouped = groupByDate([]);
      expect(grouped).toEqual([]);
    });

    it('should sum values for same category and date', () => {
      const data = [
        {
          id: '1',
          date: new Date('2024-01-01'),
          category: 'plano_original',
          value: 100,
        },
        {
          id: '2',
          date: new Date('2024-01-01'),
          category: 'plano_original',
          value: 50,
        },
      ];

      const grouped = groupByDate(data);

      expect(grouped).toEqual([
        {
          date: '2024-01-01',
          plano_original: 150,
          situacao_atual: 0,
          custo_vida: 0,
        },
      ]);
    });
  });
});
