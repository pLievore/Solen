export type RepairDevice = {
  id: string;
  model: string;
  imageUrl: string | null;
  technicianId: string | null;
  technicianEmail: string | null;
  accessNotes: string | null;
  priorDefects: string | null;
  services: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export const STATUS_LABEL: Record<string, string> = {
  RECEBIDO: "Recebido",
  EM_REPARO: "Em reparo",
  CONCLUIDO: "Concluído",
  ENTREGUE: "Entregue",
};

export const STATUS_COLOR: Record<string, string> = {
  RECEBIDO: "bg-blue-100 text-blue-700",
  EM_REPARO: "bg-yellow-100 text-yellow-700",
  CONCLUIDO: "bg-green-100 text-green-700",
  ENTREGUE: "bg-surface-2 text-muted",
};
