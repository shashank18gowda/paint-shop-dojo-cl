import { QuestionKind, RuntimeQuizQuestion, StartRunPayload, StartRunResponse, SubmitBatchPayload, SubmitBatchResponse } from "../types/interfaces";
import { PROCESS_KEY_MAP } from "../utils/constants";

// const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'; // Default to localhost if not set
const BASE_URL = 'http://localhost:3001'
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMTlmNjQ0Yi00YTg1LTc1MjctYjNjMi1jNDg0MzkwOWY1ODgiLCJraW5kIjoicGFydGljaXBhbnQiLCJjb2RlIjoiRU1QMDAxIiwiZGVzaWduYXRpb25JZCI6IjAxOWY2NDRiLTQ5YzItNzc3OS05MGJlLTE2NTFiYTM0Y2QwZiIsImlhdCI6MTc4NDA5NDEzMSwiZXhwIjoxNzg0MTIyOTMxfQ.txG6rQ6tdbWpY9G5lBqQbOmfI_VXsYXKFbL0-eONLFg"

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BEARER_TOKEN}` },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`[${res.status}] ${endpoint} — ${errorText}`);
  }

  return res.json() as Promise<T>;
}


// ─── 1. Start Batch Run ───────────────────────────────────────────────────────
// Replaces the old fetchQuizData and initGameRun. 
// Fetches all questions up front and initializes the run on the server.

export async function startGameSession(payload: StartRunPayload): Promise<StartRunResponse> {
  // Assuming your standard API prefix routes to the controller
  console.log('[API] Starting game session with payload:', payload);
  return request<StartRunResponse>('/api/game/runs/start-batch', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


// ─── 2. Submit Completed Run ──────────────────────────────────────────────────
// Called once on game completion. Sends the batch of answers to the backend
// where the score is authoritatively calculated.

export async function submitGameRun(runId: string, payload: SubmitBatchPayload): Promise<SubmitBatchResponse> {
  return request<SubmitBatchResponse>(`/api/game/runs/${runId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Helper function to safely convert standard text into file-friendly asset keys.
// Example: "Degreasing" -> "degreasing"
// Example: "Surface Conditioning & Phosphating" -> "surface_conditioning_phosphating"
const generateAssetKey = (str?: string): string => {
    if (!str) return 'unknown';
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_') // Replace spaces/special chars with underscores
        .replace(/^_+|_+$/g, '');    // Trim trailing/leading underscores
};

export const mapQuizDataFromApi = (apiData: any): RuntimeQuizQuestion[] => {
    // Safely extract the questions array whether the whole API response or just the array is passed
    const questions = apiData.questions || apiData.data?.questions || apiData;

    return questions.map((q: any) => {
        // Derive texture keys directly from the descriptive fields
        const beforeKey = generateAssetKey(q.carVisualBefore);
        const afterKey = generateAssetKey(q.carVisualAfter);
        const kind = q.kind as QuestionKind;
        const isColorPick = kind === QuestionKind.COLOUR_PICK;

        // Find the correct option text to generate the video key, fallback to carVisualAfter if missing
        // const correctOpt = q.options.find((o: any) => o.id === q.correctProcessId);
        // const processAssetKey = generateAssetKey(correctOpt?.translations?.en || q.carVisualAfter);

        return {
            processId: q.questionId,
            kind,
            step: q.stepNo - 1, // Align with 0-indexed arrays
            isColorPick: isColorPick,
            
            // Map localized headers and instructions
            header: {
                en: q.translations?.en?.questionText || '',
                hi: q.translations?.hi?.questionText || '',
                kn: q.translations?.kn?.questionText || ''
            },
            instruction: {
                en: q.translations?.en?.initialVisualText || '',
                hi: q.translations?.hi?.initialVisualText || '',
                kn: q.translations?.kn?.initialVisualText || ''
            },
            
            // Dynamically construct asset keys
            carTexture: `car_${beforeKey}`,
            successTexture: `car_${afterKey}`,
            successVideo: `${afterKey}_video`,

            // Map options
            options: (q.options || []).map((opt: any) => {
                const optKey = PROCESS_KEY_MAP[opt.translations?.en];
                // console.log(`\n Mapping option ${opt.id}: label=${optKey}, isCorrect=${opt.id === q.correctProcessId}`);

                return {
                    id: opt.id,
                    label: {
                        en: opt.translations?.en || '',
                        hi: opt.translations?.hi || '',
                        kn: opt.translations?.kn || ''
                    },
                    imageKey: `option_${optKey}`,
                    // Non-scored colour choices are all valid selections.
                    isCorrect: isColorPick || opt.id === q.correctProcessId
                };
            }),
            
            // Map and sort hints
            hints: (q.hints || [])
                .sort((a: any, b: any) => a.order - b.order)
                .map((h: any) => ({
                    en: h.translations?.en || '',
                    hi: h.translations?.hi || '',
                    kn: h.translations?.kn || ''
                }))
        };
    });
};
