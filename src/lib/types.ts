// Rôle interne Test3 (mappé depuis le rôle standardisé Chanv)
// - superadmin : accès total
// - admin      : gestion
// - membre     : accès standard (rôle Consulter)
// - blocked    : pas d'accès
export type Role = "superadmin" | "admin" | "membre" | "blocked";

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Super Administrateur",
  admin: "Administrateur",
  membre: "Membre",
  blocked: "Bloqué",
};
