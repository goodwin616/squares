export interface GameConfig {
  date: string; // YYYY-MM-DD
  homeTeam: string;
  homeColor?: string;
  awayTeam: string;
  awayColor?: string;
  name?: string;
}

export const GAMES_SCHEDULE: GameConfig[] = [
  {
    date: '2024-02-11',
    homeTeam: 'Kansas City Chiefs',
    homeColor: '#E31837',
    awayTeam: 'San Francisco 49ers',
    awayColor: '#B3995D', // Using Gold for 49ers to be lighter/vibrant
    name: 'Super Bowl LVIII',
  },
  {
    date: '2025-02-09',
    homeTeam: 'Philadelphia Eagles',
    homeColor: '#004C54',
    awayTeam: 'Kansas City Chiefs',
    awayColor: '#E31837',
    name: 'Super Bowl LIX',
  },
  {
    date: '2026-02-08',
    homeTeam: 'New England Patriots',
    homeColor: '#002244',
    awayTeam: 'Seattle Seahawks',
    awayColor: '#69BE28',
    name: 'Super Bowl LX',
  },
];
