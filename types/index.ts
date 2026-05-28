export type Position = 'GK' | 'DEF' | 'MID' | 'FWD'
export type PlayerStatus = 'available' | 'injured' | 'suspended' | 'doubtful'
export type GameweekStatus = 'upcoming' | 'active' | 'finished'
export type ChipType = 'wildcard_1' | 'wildcard_2' | 'triple_captain' | 'bench_boost' | 'free_hit'
export type LeagueType = 'classic' | 'h2h'

export interface RealTeam {
  id: string
  name: string
  short_name: string
  badge_url?: string
  primary_color: string
  created_at?: string
}

export interface Player {
  id: string
  name: string
  display_name?: string
  position: Position
  team_id: string
  price: number
  total_points: number
  status: PlayerStatus
  news?: string
  created_at?: string
  real_teams?: RealTeam
}

export interface Season {
  id: string
  name: string
  is_active: boolean
  created_at?: string
}

export interface Gameweek {
  id: string
  season_id: string
  number: number
  deadline: string
  status: GameweekStatus
  is_current: boolean
  created_at?: string
}

export interface Fixture {
  id: string
  gameweek_id: string
  home_team_id: string
  away_team_id: string
  home_score?: number
  away_score?: number
  kickoff_time?: string
  played: boolean
  created_at?: string
  home_team?: RealTeam
  away_team?: RealTeam
  gameweeks?: Gameweek
}

export interface PlayerGameweekStats {
  id?: string
  player_id: string
  gameweek_id: string
  fixture_id?: string
  minutes: number
  goals: number
  assists: number
  clean_sheet: boolean
  saves: number
  penalty_saves: number
  yellow_cards: number
  red_cards: number
  own_goals: number
  bonus: number
  calculated_points: number
  created_at?: string
  players?: Player
  gameweeks?: Gameweek
}

export interface FantasyTeam {
  id: string
  user_id: string
  season_id: string
  name: string
  total_points: number
  overall_rank?: number
  free_transfers: number
  bank: number
  created_at?: string
}

export interface FantasyPick {
  id: string
  fantasy_team_id: string
  gameweek_id: string
  player_id: string
  is_starting: boolean
  bench_order?: number
  is_captain: boolean
  is_vice_captain: boolean
  points_scored: number
  created_at?: string
  players?: Player
}

export interface Transfer {
  id: string
  fantasy_team_id: string
  gameweek_id: string
  player_in_id: string
  player_out_id: string
  player_in_price: number
  player_out_price: number
  transfer_cost: number
  created_at?: string
  player_in?: Player
  player_out?: Player
}

export interface ChipUsed {
  id: string
  fantasy_team_id: string
  chip: ChipType
  gameweek_id: string
  created_at?: string
}

export interface League {
  id: string
  name: string
  type: LeagueType
  code: string
  created_by: string
  season_id: string
  created_at?: string
}

export interface LeagueMember {
  id: string
  league_id: string
  fantasy_team_id: string
  joined_at?: string
  fantasy_teams?: FantasyTeam
  leagues?: League
}

export interface H2HMatch {
  id: string
  league_id: string
  gameweek_id: string
  home_team_id: string
  away_team_id: string
  home_points?: number
  away_points?: number
  created_at?: string
}

export interface AdminUser {
  id: string
  user_id: string
  created_at?: string
}

export type Formation = '3-4-3' | '3-5-2' | '4-3-3' | '4-4-2' | '4-5-1' | '5-3-2' | '5-4-1'

export interface SquadSlot extends FantasyPick {
  players: Player
}
