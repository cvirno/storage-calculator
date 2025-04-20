export interface Processor {
  id: string;
  name: string;
  cores: number;
  frequency: string;
  generation: string;
  spec_int_base: number;
  tdp: number;
}

export const mockProcessors: Processor[] = [
  {
    id: "1",
    name: 'Intel Xeon Gold 6338',
    cores: 32,
    frequency: '2.0 GHz',
    generation: 'Ice Lake',
    spec_int_base: 45.2,
    tdp: 205
  },
  {
    id: "2",
    name: 'Intel Xeon Gold 6348',
    cores: 28,
    frequency: '2.6 GHz',
    generation: 'Ice Lake',
    spec_int_base: 48.5,
    tdp: 235
  },
  {
    id: "3",
    name: 'Intel Xeon Platinum 8380',
    cores: 40,
    frequency: '2.3 GHz',
    generation: 'Ice Lake',
    spec_int_base: 52.8,
    tdp: 270
  },
  {
    id: "4",
    name: 'AMD EPYC 7763',
    cores: 64,
    frequency: '2.45 GHz',
    generation: 'Milan',
    spec_int_base: 58.3,
    tdp: 280
  },
  {
    id: "5",
    name: 'AMD EPYC 7713',
    cores: 64,
    frequency: '2.0 GHz',
    generation: 'Milan',
    spec_int_base: 52.1,
    tdp: 240
  }
]; 