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
    date: '2026-02-08',
    homeTeam: 'New England Patriots',
    homeColor: '#002244',
    awayTeam: 'Seattle Seahawks',
    awayColor: '#69BE28',
    name: 'Super Bowl LX',
  },
];
