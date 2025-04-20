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
    name: 'Intel Xeon Silver 4516Y+',
    cores: 24,
    frequency: '2.2 GHz',
    generation: '4th Gen',
    spec_int_base: 42.5,
    tdp: 185
  },
  {
    id: "2",
    name: 'Intel Xeon Gold 6526Y',
    cores: 16,
    frequency: '2.8 GHz',
    generation: '4th Gen',
    spec_int_base: 45.8,
    tdp: 195
  },
  {
    id: "3",
    name: 'Intel Xeon Gold 5515+',
    cores: 8,
    frequency: '3.2 GHz',
    generation: '4th Gen',
    spec_int_base: 38.2,
    tdp: 165
  },
  {
    id: "4",
    name: 'Intel Xeon Gold 6544Y',
    cores: 16,
    frequency: '3.6 GHz',
    generation: '4th Gen',
    spec_int_base: 52.3,
    tdp: 270
  },
  {
    id: "5",
    name: 'Intel Xeon Silver 4514Y',
    cores: 16,
    frequency: '2.0 GHz',
    generation: '4th Gen',
    spec_int_base: 35.6,
    tdp: 150
  },
  {
    id: "6",
    name: 'Intel Xeon Gold 6530',
    cores: 32,
    frequency: '2.1 GHz',
    generation: '4th Gen',
    spec_int_base: 48.7,
    tdp: 270
  },
  {
    id: "7",
    name: 'Intel Xeon Bronze 3408U',
    cores: 8,
    frequency: '1.8 GHz',
    generation: '4th Gen',
    spec_int_base: 28.4,
    tdp: 125
  },
  {
    id: "8",
    name: 'Intel Xeon Gold 6438Y+',
    cores: 32,
    frequency: '2.0 GHz',
    generation: '4th Gen',
    spec_int_base: 47.2,
    tdp: 205
  },
  {
    id: "9",
    name: 'Intel Xeon Platinum 8462Y+',
    cores: 32,
    frequency: '2.8 GHz',
    generation: '4th Gen',
    spec_int_base: 55.6,
    tdp: 300
  },
  {
    id: "10",
    name: 'Intel Xeon Gold 5411N',
    cores: 24,
    frequency: '1.9 GHz',
    generation: '4th Gen',
    spec_int_base: 38.9,
    tdp: 165
  },
  {
    id: "11",
    name: 'Intel Xeon Platinum 8470',
    cores: 52,
    frequency: '2.0 GHz',
    generation: '4th Gen',
    spec_int_base: 62.4,
    tdp: 350
  },
  {
    id: "12",
    name: 'Intel Xeon Platinum 8490H',
    cores: 60,
    frequency: '1.9 GHz',
    generation: '4th Gen',
    spec_int_base: 65.8,
    tdp: 350
  },
  {
    id: "13",
    name: 'Intel Xeon Platinum 8592+',
    cores: 64,
    frequency: '1.9 GHz',
    generation: '4th Gen',
    spec_int_base: 68.2,
    tdp: 350
  },
  {
    id: "14",
    name: 'Intel Xeon Gold 6434H',
    cores: 8,
    frequency: '3.7 GHz',
    generation: '4th Gen',
    spec_int_base: 42.8,
    tdp: 195
  },
  {
    id: "15",
    name: 'Intel Xeon Gold 6458Q',
    cores: 32,
    frequency: '3.1 GHz',
    generation: '4th Gen',
    spec_int_base: 58.4,
    tdp: 350
  }
]; 