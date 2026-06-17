export type DemoAssetType = "image" | "audio" | "model" | "video";

export type DemoAsset = {
  id: string;
  name: string;
  path: string;
  type: DemoAssetType;
  mimeType: string;
  sizeBytes: number;
  chunkCount: number;
  sharedChunkCount: number;
  headRevision: string;
  previousRevision: string;
  tags: string[];
  description: string;
  metadata: Record<string, string>;
  preview: {
    accent: string;
    secondaryAccent: string;
    caption: string;
  };
};

export type DemoAssetDiff = {
  assetId: string;
  changedPixelsPercent?: number;
  chunkDelta: number;
  sizeDeltaBytes: number;
  binarySummary: string;
  perChannelDelta?: {
    red: number;
    green: number;
    blue: number;
  };
  waveformDelta?: number[];
  geometryDelta?: {
    triangles: number;
    materials: number;
    bones: number;
  };
  framesTouched?: number;
};

export type DemoLock = {
  path: string;
  owner: string;
  acquiredAt: string;
  lockType: "exclusive" | "review";
  note: string;
};

export type DemoObliterationRequest = {
  id: string;
  path: string;
  reason: string;
  requestedBy: string;
  status: "pending" | "approved" | "executed";
  filedAt: string;
  contextId: string;
};

export const demoAssets: DemoAsset[] = [
  {
    id: "hero-corridor-albedo",
    name: "Hero Corridor Albedo",
    path: "Content/Textures/T_HeroCorridor_Albedo.png",
    type: "image",
    mimeType: "image/png",
    sizeBytes: 4812330,
    chunkCount: 96,
    sharedChunkCount: 44,
    headRevision: "f34ab29ce810",
    previousRevision: "b52fd9aa8c3e",
    tags: ["texture", "hero", "corridor"],
    description: "Primary albedo texture used in the hero corridor material pass.",
    metadata: {
      resolution: "4096 x 4096",
      colorSpace: "sRGB",
      format: "PNG",
      authoredBy: "Iris Bennett",
    },
    preview: {
      accent: "#7fd1ff",
      secondaryAccent: "#58f2c1",
      caption: "Pixel-dense texture with metallic trim and neon channel masks.",
    },
  },
  {
    id: "arena-ambience-loop",
    name: "Arena Ambience Loop",
    path: "Content/Audio/Arena/A_Ambience_Loop.wav",
    type: "audio",
    mimeType: "audio/wav",
    sizeBytes: 18244210,
    chunkCount: 132,
    sharedChunkCount: 38,
    headRevision: "f34ab29ce810",
    previousRevision: "7c91ae447bc2",
    tags: ["audio", "ambience", "loop"],
    description: "Layered loop for the arena fight space, mixed for the latest pacing pass.",
    metadata: {
      duration: "00:47",
      sampleRate: "48 kHz",
      channels: "Stereo",
      loudness: "-17 LUFS",
    },
    preview: {
      accent: "#8aa4ff",
      secondaryAccent: "#7fd1ff",
      caption: "Continuous loop with rising synth bed and distant machinery rumble.",
    },
  },
  {
    id: "hero-statue-model",
    name: "Hero Statue Model",
    path: "Content/Props/SM_HeroStatue.fbx",
    type: "model",
    mimeType: "model/fbx",
    sizeBytes: 11288321,
    chunkCount: 155,
    sharedChunkCount: 61,
    headRevision: "f34ab29ce810",
    previousRevision: "7c91ae447bc2",
    tags: ["mesh", "prop", "hero"],
    description: "High-detail hero statue used at the entrance to the arena map.",
    metadata: {
      triangles: "128,442",
      materials: "4",
      bounds: "2.4m x 1.1m x 0.9m",
      skeleton: "none",
    },
    preview: {
      accent: "#58f2c1",
      secondaryAccent: "#8aa4ff",
      caption: "Dense marble mesh with etched armor details and emissive socket placements.",
    },
  },
  {
    id: "vertical-slice-capture",
    name: "Vertical Slice Capture",
    path: "Content/Cinematics/VS_Capture_01.webm",
    type: "video",
    mimeType: "video/webm",
    sizeBytes: 24551210,
    chunkCount: 184,
    sharedChunkCount: 48,
    headRevision: "f34ab29ce810",
    previousRevision: "7c91ae447bc2",
    tags: ["video", "capture", "review"],
    description: "Editorial capture for the current vertical slice review package.",
    metadata: {
      duration: "01:24",
      resolution: "1920 x 1080",
      frameRate: "30 fps",
      codec: "VP9",
    },
    preview: {
      accent: "#ff9cac",
      secondaryAccent: "#7fd1ff",
      caption: "In-engine review cut featuring the entry flythrough and combat beat timings.",
    },
  },
];

export const demoAssetDiffs: DemoAssetDiff[] = [
  {
    assetId: "hero-corridor-albedo",
    changedPixelsPercent: 18.4,
    chunkDelta: 14,
    sizeDeltaBytes: 412144,
    binarySummary: "Specular mask cleanup tightened the emissive seams and reduced visible compression on trim edges.",
    perChannelDelta: {
      red: 12,
      green: 21,
      blue: 19,
    },
  },
  {
    assetId: "arena-ambience-loop",
    chunkDelta: 9,
    sizeDeltaBytes: -123112,
    binarySummary: "Noise floor trimmed on the tail, with a higher low-end shelf during wave spikes.",
    waveformDelta: [12, 30, 20, 38, 24, 18, 27, 34, 16, 12, 28, 33],
  },
  {
    assetId: "hero-statue-model",
    chunkDelta: 22,
    sizeDeltaBytes: 882210,
    binarySummary: "Additional bevel pass increased triangle density around the shoulder armor and pedestal edge.",
    geometryDelta: {
      triangles: 14220,
      materials: 1,
      bones: 0,
    },
  },
  {
    assetId: "vertical-slice-capture",
    chunkDelta: 17,
    sizeDeltaBytes: 1184402,
    binarySummary: "Final capture includes a longer intro pan and denser effects during the last combat beat.",
    framesTouched: 184,
  },
];

export const demoLocks: DemoLock[] = [
  {
    path: "Content/Textures/T_HeroCorridor_Albedo.png",
    owner: "iris",
    acquiredAt: "2026-06-17T10:15:00Z",
    lockType: "exclusive",
    note: "Preventing accidental overwrite during final material export.",
  },
  {
    path: "Content/Cinematics/VS_Capture_01.webm",
    owner: "omar",
    acquiredAt: "2026-06-17T12:02:00Z",
    lockType: "review",
    note: "Locked while editorial timing notes are being collected.",
  },
];

export const demoObliterationRequests: DemoObliterationRequest[] = [
  {
    id: "obl-102",
    path: "Content/Secrets/test-api-key.txt",
    reason: "Accidental secret commit in a temporary review branch.",
    requestedBy: "maya",
    status: "executed",
    filedAt: "2026-06-16T11:00:00Z",
    contextId: "ctx-41a8c2d9",
  },
  {
    id: "obl-103",
    path: "Content/Cinematics/raw_capture_notes.mov",
    reason: "Contains licensed temp footage not permitted in the repository archive.",
    requestedBy: "omar",
    status: "approved",
    filedAt: "2026-06-17T08:40:00Z",
    contextId: "ctx-8f23b155",
  },
];

export const demoStorageAnalytics = {
  totalBytes: 70856071,
  dedupSavingsPercent: 38.2,
  sharedChunks: 191,
  uniqueChunks: 376,
  immutableStoreBytes: 62144012,
  mutableStoreBytes: 8712059,
  tierBreakdown: [
    { name: "Textures", bytes: 18321422, percent: 25.9 },
    { name: "Audio", bytes: 14500442, percent: 20.5 },
    { name: "Models", bytes: 20987111, percent: 29.6 },
    { name: "Video", bytes: 18047096, percent: 24.0 },
  ],
};

export function listAssets(type?: string) {
  if (!type || type === "all") {
    return demoAssets;
  }

  return demoAssets.filter((asset) => asset.type === type);
}

export function getAsset(assetId: string) {
  return demoAssets.find((asset) => asset.id === assetId);
}

export function getAssetDiff(assetId: string) {
  return demoAssetDiffs.find((diff) => diff.assetId === assetId);
}

export function buildLockView(action?: string, path?: string) {
  if (!action || !path) {
    return demoLocks;
  }

  if (action === "unlock") {
    return demoLocks.filter((lock) => lock.path !== path);
  }

  if (action === "lock") {
    return [
      {
        path,
        owner: "maya",
        acquiredAt: "2026-06-17T19:40:00Z",
        lockType: "exclusive",
        note: "Created from the Phase 3 lock dashboard.",
      },
      ...demoLocks,
    ];
  }

  return demoLocks;
}

export function buildObliterationView(input?: { path?: string; reason?: string }) {
  if (!input?.path?.trim() || !input.reason?.trim()) {
    return demoObliterationRequests;
  }

  return [
    {
      id: "obl-104",
      path: input.path.trim(),
      reason: input.reason.trim(),
      requestedBy: "maya",
      status: "pending",
      filedAt: "2026-06-17T19:45:00Z",
      contextId: "ctx-new-request",
    },
    ...demoObliterationRequests,
  ];
}
