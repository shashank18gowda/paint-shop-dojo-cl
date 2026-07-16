"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "../../store/session";
import { useTranslation } from "../../lib/i18n";
import { PageShell, PageHeader } from "../../components/layout/PageShell";
import {
  CameraIcon,
  CheckIcon,
  Spinner,
  RetryIcon,
} from "../../components/icons";
import {
  useDesignations,
  useLines,
  usePlants,
} from "../../lib/hooks/useReference";
import {
  useUpdateProfile,
  useUploadPhoto,
  useParticipantStats,
} from "../../lib/hooks/useAuth";
import VirtualKeyboard from "../../components/VirtualKeyboard";
import { BACKEND_URL } from "../../lib/env";

function resolveImage(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
}

function Initials({ name, size = 100 }: { name: string; size?: number }) {
  const parts = name.trim().split(/\s+/);
  const text =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : (parts[0]?.[0] ?? "?");
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white select-none shrink-0"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #EB0A1E 0%, #a80016 100%)",
        fontSize: size * 0.34,
      }}
    >
      {text.toUpperCase()}
    </div>
  );
}

type CameraPhase = "closed" | "live" | "preview";

export default function ProfileView() {
  const router = useRouter();
  const participant = useSessionStore((s) => s.participant);
  const updateParticipant = useSessionStore((s) => s.updateParticipant);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesgId, setEditDesgId] = useState("");
  const [editLineId, setEditLineId] = useState("");
  const [editPlantId, setEditPlantId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [nameFocused, setNameFocused] = useState(false);

  const [cameraPhase, setCameraPhase] = useState<CameraPhase>("closed");
  const [captured, setCaptured] = useState<string | null>(null);
  const [camError, setCamError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const t = useTranslation("menu");
  const { data: desgs } = useDesignations();
  const { data: lines } = useLines();
  const { data: plants } = usePlants();
  const { data: stats } = useParticipantStats(participant?.code ?? "");

  const { mutate: updateProfile, isPending: saving } = useUpdateProfile();
  const { mutate: uploadPhoto, isPending: uploading } = useUploadPhoto();

  // Initialise edit form from session when entering edit mode
  useEffect(() => {
    if (!editing || !participant) return;
    setEditName(participant.name);
    setSaveError("");
    const matchedDesg = desgs?.find((d) => d.name === participant.designation);
    setEditDesgId(matchedDesg?.id ?? participant.designationId ?? "");
    const matchedLine = lines?.find((l) => l.name === participant.line);
    setEditLineId(matchedLine?.id ?? participant.lineId ?? "");
    const matchedPlant = plants?.find((l) => l.name === participant.plant);
    setEditPlantId(matchedPlant?.id ?? participant.plantId ?? "");
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Camera stream lifecycle
  useEffect(() => {
    if (cameraPhase !== "live") {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }
    setCamError("");
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {
        setCamError("Camera access denied.");
        setCameraPhase("closed");
      });
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [cameraPhase]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL("image/jpeg", 0.9));
    setCameraPhase("preview");
  }

  async function confirmPhoto() {
    if (!captured) return;
    const blob = await (await fetch(captured)).blob();
    uploadPhoto(blob, {
      onSuccess: (data) => {
        if (data.imageUrl) updateParticipant({ imageUrl: data.imageUrl });
        setCameraPhase("closed");
        setCaptured(null);
      },
    });
  }

  function saveProfile() {
    if (!editName.trim()) return;
    setSaveError("");
    updateProfile(
      {
        name: editName.trim(),
        ...(editDesgId ? { designationId: editDesgId } : {}),
        ...(editLineId ? { lineId: editLineId } : {}),
        ...(editPlantId ? { plantId: editPlantId } : {}),
      },
      {
        onSuccess: (updated) => {
          updateParticipant({
            name: updated.name,
            designation: updated.designation,
            designationId: updated.designationId,
            line: updated.line,
            lineId: updated.lineId,
            plant: updated.plant,
            plantId: updated.plantId,
          });
          setEditing(false);
        },
        onError: () => setSaveError("Failed to save. Please try again."),
      },
    );
  }

  if (!participant) return null;

  const imageUrl = resolveImage(participant.imageUrl);
  const cameraOpen = cameraPhase !== "closed";

  return (
    <PageShell>
      <PageHeader onBack={() => router.back()} title={t.profileTitle} />

      <div className="max-w-xl mx-auto w-full flex flex-col gap-5 pb-8">
        {/* ── Avatar ──────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={participant.name}
                className="rounded-full object-cover"
                style={{
                  width: 100,
                  height: 100,
                  border: "3px solid var(--border)",
                }}
              />
            ) : (
              <Initials name={participant.name} />
            )}
            <button
              onClick={() => setCameraPhase(cameraOpen ? "closed" : "live")}
              title="Change photo"
              className="absolute bottom-0 right-0 flex items-center justify-center rounded-full text-white transition-transform active:scale-90"
              style={{
                width: 32,
                height: 32,
                background: "#EB0A1E",
                border: "2px solid var(--bg)",
              }}
            >
              <CameraIcon size={14} />
            </button>
          </div>

          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {participant.name}
            </p>
            <p
              className="mt-0.5 text-sm font-mono tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {participant.code}
            </p>
          </div>

          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: "rgba(235,10,30,0.10)", color: "#EB0A1E" }}
          >
            {participant.type}
          </span>
        </div>

        {/* ── Inline camera ────────────────────────────────────────── */}
        {cameraOpen && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="relative bg-black overflow-hidden rounded-t-2xl"
              style={{ aspectRatio: "4/3" }}
            >
              {cameraPhase === "live" && (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              )}
              {cameraPhase === "preview" && captured && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={captured}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {camError && (
              <p
                className="text-xs text-center px-4 py-2"
                style={{ color: "#f59e0b" }}
              >
                {camError}
              </p>
            )}

            <div className="flex gap-2 p-3">
              {cameraPhase === "live" && (
                <>
                  <button
                    onClick={capture}
                    className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2"
                    style={{ background: "#EB0A1E" }}
                  >
                    <CameraIcon size={14} /> Capture
                  </button>
                  <button
                    onClick={() => setCameraPhase("closed")}
                    className="rounded-full px-4 py-2.5 text-sm font-semibold"
                    style={{
                      background: "var(--border)",
                      color: "var(--text)",
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
              {cameraPhase === "preview" && (
                <>
                  <button
                    onClick={confirmPhoto}
                    disabled={uploading}
                    className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2"
                    style={{
                      background: "#EB0A1E",
                      opacity: uploading ? 0.7 : 1,
                    }}
                  >
                    {uploading ? (
                      <>
                        <Spinner size={14} /> Saving…
                      </>
                    ) : (
                      <>
                        <CheckIcon size={14} /> Use this photo
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setCaptured(null);
                      setCameraPhase("live");
                    }}
                    disabled={uploading}
                    className="rounded-full px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5"
                    style={{
                      background: "var(--border)",
                      color: "var(--text)",
                    }}
                  >
                    <RetryIcon size={12} /> Retake
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Stats row ────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { label: "Quizzes", value: String(stats.totalSessions) },
                {
                  label: "Best Score",
                  value:
                    stats.bestScore > 0
                      ? `${Math.round(stats.bestScore)}%`
                      : "—",
                },
                { label: "Top Level", value: stats.bestPerformance ?? "—" },
              ] as const
            ).map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl p-3 text-center"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="text-lg font-bold leading-tight"
                  style={{ color: "var(--text)" }}
                >
                  {value}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Profile fields / edit form ───────────────────────────── */}
        {!editing ? (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            {[
              { label: "Full Name", value: participant.name },
              { label: "Employee Code", value: participant.code },
              { label: "Designation", value: participant.designation },
              { label: "Manufacturing Plant", value: participant.plant ?? "—" },
              { label: "Production Line", value: participant.line },
            ].map(({ label, value }, i, arr) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-3.5"
                style={{
                  borderBottom:
                    i < arr.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <span
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl p-4 flex flex-col gap-4"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Full Name
              </label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                inputMode="none"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg)",
                  border: "1.5px solid var(--border)",
                  color: "var(--text)",
                }}
                onFocus={(e) => {
                  setNameFocused(true);
                  e.target.style.borderColor = "#EB0A1E";
                }}
                onBlur={(e) => {
                  setNameFocused(false);
                  e.target.style.borderColor = "var(--border)";
                }}
              />
              {nameFocused && (
                <VirtualKeyboard
                  layout="qwerty"
                  value={editName}
                  onChange={setEditName}
                  maxLength={64}
                />
              )}
            </div>

            {/* Designation */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Designation
              </label>
              <select
                value={editDesgId}
                onChange={(e) => setEditDesgId(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg)",
                  border: "1.5px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                <option value="">— select designation —</option>
                {desgs?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Line */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Production Line
              </label>
              <select
                value={editLineId}
                onChange={(e) => setEditLineId(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg)",
                  border: "1.5px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                <option value="">— select line —</option>
                {lines?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Plant */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                Manufacturing Plant
              </label>

              <select
                value={editPlantId}
                onChange={(e) => setEditPlantId(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{
                  background: "var(--bg)",
                  border: "1.5px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                <option value="">— select plant —</option>
                {plants?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {saveError && (
              <p className="text-xs" style={{ color: "#f59e0b" }}>
                {saveError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={saveProfile}
                disabled={saving || !editName.trim()}
                className="flex-1 rounded-full py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{
                  background: "#EB0A1E",
                  opacity: saving || !editName.trim() ? 0.65 : 1,
                }}
              >
                {saving ? (
                  <>
                    <Spinner size={14} /> Saving…
                  </>
                ) : (
                  <>
                    <CheckIcon size={14} /> Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="rounded-full px-5 py-3 text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ background: "var(--border)", color: "var(--text)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Edit / action buttons ────────────────────────────────── */}
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="w-full rounded-full py-3.5 text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              background: "var(--bg-card)",
              border: "1.5px solid var(--border)",
              color: "var(--text)",
            }}
          >
            Edit Profile
          </button>
        )}
      </div>
    </PageShell>
  );
}
