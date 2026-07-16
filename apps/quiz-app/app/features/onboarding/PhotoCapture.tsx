"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as faceapi from "face-api.js";
import { useUploadPhoto } from "../../lib/hooks/useAuth";
import { useSessionStore } from "../../store/session";
import { useTranslation } from "../../lib/i18n";
import {
  CameraIcon,
  CheckIcon,
  Spinner,
  RetryIcon,
} from "../../components/icons";
import { PageShell, PageHeader } from "../../components/layout/PageShell";

type CaptureState = "idle" | "checking" | "captured" | "uploading";
type PermissionState = "unknown" | "granted" | "denied" | "prompt";

export default function PhotoCapture() {
  const router = useRouter();
  const updateParticipant = useSessionStore((s) => s.updateParticipant);
  const t = useTranslation("photo");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [modelsReady, setModelsReady] = useState(false);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [permissionState, setPermissionState] =
    useState<PermissionState>("unknown");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedHasFace, setCapturedHasFace] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [cameraStarting, setCameraStarting] = useState(false);

  const { mutate: uploadPhoto, isPending: uploading } = useUploadPhoto();

  useEffect(() => {
    async function init() {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        setModelsReady(true);
      } catch {
        // models unavailable — post-capture check will be skipped
      }
    }
    init();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startCamera() {
    if (streamRef.current) return true;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser.");
      setPermissionState("denied");
      return false;
    }

    setCameraStarting(true);
    setCameraError("");
    setPermissionState("prompt");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      setPermissionState("granted");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch (error) {
      setPermissionState("denied");
      if (error instanceof DOMException) {
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          setCameraError(
            "Camera access denied. Please allow camera permissions in the browser address bar and try again.",
          );
        } else if (
          error.name === "NotFoundError" ||
          error.name === "OverconstrainedError"
        ) {
          setCameraError(t.error1);
        } else {
          setCameraError(t.error2);
        }
      } else {
        setCameraError(t.error2);
      }
      return false;
    } finally {
      setCameraStarting(false);
    }
  }

  // Re-attach the stream when returning to idle after retake —
  // the <video> element remounts on captureState change, losing srcObject.
  useEffect(() => {
    if (captureState !== "idle" || !streamRef.current || !videoRef.current)
      return;
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(() => {});
  }, [captureState]);

  async function capture() {
    if (!streamRef.current) {
      const started = await startCamera();
      if (!started) return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.9));
    setCaptureState("checking");

    if (modelsReady) {
      try {
        const detection = await faceapi.detectSingleFace(
          canvas,
          new faceapi.TinyFaceDetectorOptions({
            scoreThreshold: 0.3,
            inputSize: 224,
          }),
        );
        setCapturedHasFace(!!detection);
      } catch {
        setCapturedHasFace(true); // detection error — don't block the user
      }
    } else {
      setCapturedHasFace(true); // models not loaded — skip check
    }
    setCaptureState("captured");
  }

  function retake() {
    setCapturedImage(null);
    setCapturedHasFace(null);
    setCaptureState("idle");
  }

  async function confirmPhoto() {
    if (!capturedImage) return;
    setCaptureState("uploading");
    const blob = await (await fetch(capturedImage)).blob();
    uploadPhoto(blob, {
      onSuccess: (data) => {
        if (data.imageUrl) updateParticipant({ imageUrl: data.imageUrl });
      },
      onSettled: () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        router.push("/menu");
      },
    });
  }

  function skip() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    router.push("/menu");
  }

  const isUploading = captureState === "uploading" || uploading;
  const isChecking = captureState === "checking";
  const noFace = captureState === "captured" && capturedHasFace === false;
  const cameraReady = !!streamRef.current;

  return (
    <PageShell>
      <PageHeader onBack={() => router.back()} />

      <div className="flex flex-1 flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {t.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {t.subtitle}
          </p>
        </div>

        <div className="relative w-full max-w-2xl mx-auto">
          {captureState !== "idle" && capturedImage ? (
            <div
              className="relative overflow-hidden rounded-2xl"
              style={{ aspectRatio: "4/3" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  border: `3px solid ${noFace ? "#f59e0b" : "#22c55e"}`,
                }}
              />

              {isChecking && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-2xl"
                  style={{ background: "rgba(0,0,0,0.45)" }}
                >
                  <div className="flex items-center gap-2 text-white text-sm font-semibold">
                    <Spinner size={18} /> Checking photo…
                  </div>
                </div>
              )}

              {!isChecking && !noFace && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                  ✓ Face detected
                </div>
              )}
            </div>
          ) : (
            <div
              className="relative overflow-hidden rounded-2xl bg-black"
              style={{ aspectRatio: "4/3", border: "3px solid var(--border)" }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="rounded-full"
                  style={{
                    width: "55%",
                    aspectRatio: "1",
                    border: "2px dashed rgba(255,255,255,0.35)",
                  }}
                />
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {noFace && (
          <div
            className="flex items-start gap-3 rounded-2xl px-4 py-3 w-full max-w-2xl mx-auto"
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <span className="text-xl mt-0.5">👤</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#d97706" }}>
                No face detected in the photo
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {t.cam_face}
              </p>
            </div>
          </div>
        )}

        {cameraError && (
          <p
            className="text-sm text-center rounded-xl px-4 py-2 w-full max-w-2xl mx-auto"
            style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)" }}
          >
            {cameraError}
          </p>
        )}

        {permissionState === "denied" && !cameraError && (
          <div
            className="text-sm text-center rounded-xl px-4 py-2 w-full max-w-2xl mx-auto"
            style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)" }}
          >
            <p className="font-semibold">Camera permission required</p>
            <p className="mt-1">
              Please click the camera icon in your browser's address bar and
              allow camera access.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 w-full max-w-2xl mx-auto flex flex-col gap-3">
        {captureState === "idle" && (
          <>
            {permissionState === "denied" ? (
              <button
                onClick={() => {
                  setPermissionState("unknown");
                  setCameraError("");
                }}
                className="w-full rounded-full py-4 text-base font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                style={{
                  background: "#EB0A1E",
                  boxShadow: "0 8px 24px rgba(235,10,30,0.25)",
                }}
              >
                <CameraIcon /> {t.try_again}
              </button>
            ) : (
              <button
                onClick={capture}
                disabled={cameraStarting}
                className="w-full rounded-full py-4 text-base font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                style={{
                  background: "#EB0A1E",
                  boxShadow: "0 8px 24px rgba(235,10,30,0.25)",
                  opacity: cameraStarting ? 0.7 : 1,
                }}
              >
                {cameraStarting ? (
                  <>
                    <Spinner size={18} /> Starting camera...
                  </>
                ) : (
                  <>
                    <CameraIcon />{" "}
                    {cameraReady ? t.capture_photo : t.start_camera}
                  </>
                )}
              </button>
            )}
            <button
              onClick={skip}
              className="w-full py-3 text-sm transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              {t.skip}
            </button>
          </>
        )}

        {noFace && (
          <>
            <button
              onClick={retake}
              className="w-full rounded-full py-4 text-base font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{
                background: "#EB0A1E",
                boxShadow: "0 8px 24px rgba(235,10,30,0.25)",
              }}
            >
              <RetryIcon size={16} /> Retake Photo
            </button>
            <button
              onClick={confirmPhoto}
              disabled={isUploading}
              className="w-full rounded-full py-3.5 text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: "var(--bg-card)",
                border: "2px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              {isUploading ? (
                <>
                  <Spinner size={16} /> Uploading…
                </>
              ) : (
                "Use this photo anyway"
              )}
            </button>
          </>
        )}

        {captureState === "captured" && !noFace && (
          <>
            <button
              onClick={confirmPhoto}
              disabled={isUploading}
              className="w-full rounded-full py-4 text-base font-semibold text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{
                background: "#EB0A1E",
                boxShadow: "0 8px 24px rgba(235,10,30,0.25)",
                opacity: isUploading ? 0.7 : 1,
              }}
            >
              {isUploading ? (
                <>
                  <Spinner size={18} /> Uploading…
                </>
              ) : (
                <>
                  <CheckIcon size={16} /> {t.confirm}
                </>
              )}
            </button>
            <button
              onClick={retake}
              disabled={isUploading}
              className="w-full rounded-full py-3.5 text-base font-semibold transition-all active:scale-[0.98]"
              style={{
                background: "var(--bg-card)",
                border: "2px solid var(--border)",
                color: "var(--text)",
              }}
            >
              {t.retake}
            </button>
          </>
        )}
      </div>
    </PageShell>
  );
}
