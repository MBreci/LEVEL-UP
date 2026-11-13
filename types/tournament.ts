export type TournamentStatus = "abierto" | "en_curso" | "finalizado";

export interface TournamentTeamEntry {
  teamId: string;
  paidAt: number;
  paymentMethod: "saldo" | "wompi";
  wompiRef?: string;
}

export interface Tournament {
  id: string;
  nombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cancha: string;
  direccion: string;
  valorPorJugador: number;
  valorInscripcion: number;
  premio: string;
  premio1: string;
  premio2: string;
  premio3: string;
  obs: string;
  createdBy: string;
  status: TournamentStatus;
  teams: TournamentTeamEntry[];
  createdAt: number;
}
