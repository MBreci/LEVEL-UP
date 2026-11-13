export interface HwAction {
  icon: string;
  title: string;
  text: string;
  btn: string;
  href: string;
}

export const HW_ACTIONS: HwAction[] = [
  { icon: "🔍", title: "BUSCAR PARTIDOS", text: "Encuentra partidos cerca de ti. Filtra por ciudad, barrio y tipo de fútbol. Revisa horarios y cupos. Inscríbete y confirma asistencia.", btn: "Buscar Partidos", href: "/buscar-partido" },
  { icon: "📋", title: "CREAR PARTIDOS", text: "Organiza un partido en segundos. Selecciona cancha, fecha y hora. Invita jugadores y administra la lista de asistentes.", btn: "Crear Partido", href: "/buscar-partido" },
  { icon: "🛡️", title: "CREAR EQUIPO", text: "Construye tu propio club. Ponle nombre, diseña su identidad e invita hasta seis jugadores. Designa un capitán.", btn: "Crear Equipo", href: "/equipos?tab=crear" },
  { icon: "👑", title: "REY DEL BARRIO", text: "Reta a otros equipos registrados. Compara OVR y jugadores, selecciona la cancha y programa el desafío.", btn: "Retar Equipo", href: "/equipos?tab=rey" },
  { icon: "🃏", title: "BUSCAR JUGADORES", text: "Explora toda la comunidad. Consulta perfiles, estadísticas y posiciones. Invítalos a tu equipo.", btn: "Buscar Jugadores", href: "/jugadores" },
  { icon: "📈", title: "MI CARRERA", text: "Consulta tu trayectoria completa: OVR, LP, XP, partidos, goles, asistencias, MVP, logros y ranking.", btn: "Ver Mi Carrera", href: "/carta" },
];

export const HW_FLOW: string[] = [
  "Creas tu perfil", "Juegas partidos", "Los administradores registran tus estadísticas",
  "Tu carta evoluciona automáticamente", "Obtienes LP y XP", "Subes de OVR", "Asciendes de rango",
  "Ingresas a mejores partidos", "Creas equipos", "Retas equipos", "Participas en temporadas", "Construyes tu legado",
];

export const HW_RANK_INFO: Record<string, { desc: string; perk: string }> = {
  CANTERANO: { desc: "Tu primer contrato profesional. Estás comenzando y disputando tus primeros partidos.", perk: "Carta de bronce + acceso a partidos abiertos" },
  DEBUTANTE: { desc: "Tus primeros partidos oficiales. Empiezas a mostrar regularidad en la cancha.", perk: "Carta azul eléctrico + prioridad media en invitaciones" },
  "REVELACIÓN": { desc: "El jugador que explotó. Empiezas a llamar la atención de toda la zona.", perk: "Carta de hielo con escarcha + destacado en búsquedas" },
  CONSAGRADO: { desc: "Jugador totalmente consolidado. Tu nombre ya pesa en la cancha.", perk: "Carta esmeralda con aura + creación de equipos" },
  ELITE: { desc: "Jugador top. Compites contra los mejores de la plataforma.", perk: "Carta dorada premium + retos de Rey del Barrio" },
  "ÍDOLO": { desc: "Amado por toda la comunidad. Eres referente e inspiración.", perk: "Carta granate y dorada + prioridad alta en invitaciones" },
  LEYENDA: { desc: "Carta histórica. Tu historia ya es parte de LEVEL UP.", perk: "Carta plateada grabada + insignia de leyenda" },
  GOAT: { desc: "El mejor de todos los tiempos. Una carta imposible de conseguir.", perk: "Carta cósmica animada + estatus máximo de la plataforma" },
};

export const HW_SOON: { icon: string; name: string }[] = [
  { icon: "🎮", name: "Fantasy League" },
  { icon: "🤖", name: "IA analizando partidos" },
  { icon: "🛒", name: "Marketplace" },
  { icon: "🤝", name: "Patrocinios" },
  { icon: "🎬", name: "Clips automáticos" },
  { icon: "📱", name: "App móvil" },
  { icon: "📡", name: "Streaming" },
  { icon: "🏆", name: "Torneos oficiales" },
  { icon: "📊", name: "Estadísticas avanzadas" },
  { icon: "🌎", name: "Ranking por ciudades" },
];
