"use client";

import { useEffect, useRef, useState } from "react";
import {
  REPAIR_CHECKLIST,
  REPAIR_VIDEO_MAX_SECONDS,
} from "@vendy/shared";
import {
  adminApi,
  uploadRepairMedia,
  type RepairMedia,
} from "@/lib/admin-api";
import { cls } from "@/lib/ui";

/** Lê a duração do vídeo no navegador; em caso de falha, deixa o servidor decidir. */
function videoDurationOk(file: File, maxSeconds: number): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration <= maxSeconds + 0.5);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    v.src = url;
  });
}

export default function MediaChecklist({ deviceId }: { deviceId: string }) {
  const [media, setMedia] = useState<RepairMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function load() {
    try {
      setMedia(await adminApi.get<RepairMedia[]>(`/admin/repair-devices/${deviceId}/media`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  async function onPick(slot: string, kind: string, file: File) {
    setError(null);
    if (kind === "video" && !(await videoDurationOk(file, REPAIR_VIDEO_MAX_SECONDS))) {
      setError(`O vídeo de ${slot} deve ter no máximo ${REPAIR_VIDEO_MAX_SECONDS}s.`);
      return;
    }
    setUploading(slot);
    try {
      const m = await uploadRepairMedia(deviceId, slot, file);
      setMedia((list) => [...list, m]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  async function remove(id: string) {
    try {
      await adminApi.del(`/admin/repair-media/${id}`);
      setMedia((list) => list.filter((m) => m.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className={cls.card + " space-y-4"}>
      <div>
        <h2 className="font-semibold">Comprovações de funcionamento</h2>
        <p className="text-xs text-muted">
          Anexe foto/vídeo para cada item. Vídeos até {REPAIR_VIDEO_MAX_SECONDS}s.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading && <p className="text-sm text-muted">Carregando...</p>}

      {!loading &&
        REPAIR_CHECKLIST.map((item) => {
          const items = media.filter((m) => m.slot === item.slot);
          return (
            <div key={item.slot} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {item.label}{" "}
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-muted">
                      {item.kind === "video" ? "vídeo" : "foto"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{item.hint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => inputs.current[item.slot]?.click()}
                  disabled={uploading === item.slot}
                  className={cls.btnGhost + " shrink-0"}
                >
                  {uploading === item.slot ? "Enviando..." : "+ Anexar"}
                </button>
                <input
                  ref={(el) => {
                    inputs.current[item.slot] = el;
                  }}
                  type="file"
                  accept={item.kind === "video" ? "video/*" : "image/*"}
                  capture={item.kind === "video" ? "environment" : undefined}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPick(item.slot, item.kind, f);
                    e.target.value = "";
                  }}
                />
              </div>

              {items.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {items.map((m) => (
                    <div key={m.id} className="group relative overflow-hidden rounded-lg border border-border bg-surface-2">
                      {m.kind === "video" ? (
                        <video src={m.url ?? ""} controls className="h-28 w-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url ?? ""} alt="" className="h-28 w-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                        aria-label="Remover"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
