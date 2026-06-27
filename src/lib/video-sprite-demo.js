import { buildSignedLibraryViewUrl } from "./storage.js";

const VIDEO_SPRITE_DEMOS = [
  {
    id: "pure-chroma-slime-v1",
    promptId: "358d9e40-5149-4e63-a70a-cf8358e39073",
    filename: "lingji_video_sprite_00002_.webm",
    fileKey: "library/files/video-sprite/358d9e40-5149-4e63-a70a-cf8358e39073/lingji_video_sprite_00002_.webm",
    title: "Pure chroma Video-to-Sprite",
    description: "Wan2.2 image-to-video sample from a 2D monster source frame, post-processed into 4 normalized transparent sprite frames.",
    sourceFrame: "lingji_2d_asset_00045_.png",
    frames: 4,
    dimensions: { width: 512, height: 512, length: 33, fps: 12 },
    quality: {
      status: "pass",
      score: 100,
      averageCoverage: 0.255,
      averageBounds: 0.545,
      maxCenterOffset: 0.13,
      minNormalizeScale: 1.079,
      maxNormalizeScale: 1.091,
      motion: {
        method: "visible-pixel-delta-v1",
        averageFrameDelta: 0.276,
        loopDelta: 0.164,
        motionScore: 100,
        loopScore: 54,
      },
      warnings: 0,
    },
    zipFiles: 21,
  },
  {
    id: "wan-smoke-slime-v1",
    promptId: "6a1b0da9-fb9d-400e-80da-41de463fbd4b",
    filename: "lingji_video_sprite_00001_.webm",
    fileKey: "library/files/video-sprite/6a1b0da9-fb9d-400e-80da-41de463fbd4b/lingji_video_sprite_00001_.webm",
    title: "Wan motion smoke",
    description: "First Wan2.2 image-to-video smoke sample from the same monster source frame, useful for comparing prompt/background cleanup variance.",
    sourceFrame: "lingji_2d_asset_00045_.png",
    frames: 4,
    dimensions: { width: 512, height: 512, length: 33, fps: 12 },
    quality: {
      status: "pass",
      score: 100,
      averageCoverage: 0.25,
      averageBounds: 0.516,
      maxCenterOffset: 0.15,
      minNormalizeScale: 1.024,
      maxNormalizeScale: 1.088,
      motion: {
        method: "visible-pixel-delta-v1",
        averageFrameDelta: 0.27,
        loopDelta: 0.169,
        motionScore: 100,
        loopScore: 52,
      },
      warnings: 0,
    },
    zipFiles: 21,
  },
  {
    id: "expressive-slime-hop-v1",
    promptId: "19b5ab8d-f1f8-4f04-84d2-2108c205d6ea",
    filename: "lingji_video_sprite_00003_.webm",
    fileKey: "library/files/video-sprite/19b5ab8d-f1f8-4f04-84d2-2108c205d6ea/lingji_video_sprite_00003_.webm",
    title: "Expressive slime hop",
    description: "A stronger-motion Wan2.2 sample from the same monster source frame for calibrating motion amplitude, center drift, and loop quality.",
    sourceFrame: "lingji_2d_asset_00045_.png",
    frames: 4,
    dimensions: { width: 512, height: 512, length: 33, fps: 12 },
    quality: {
      status: "pass",
      score: 100,
      averageCoverage: 0.243,
      averageBounds: 0.512,
      maxCenterOffset: 0.152,
      minNormalizeScale: 1.024,
      maxNormalizeScale: 1.091,
      motion: {
        method: "visible-pixel-delta-v1",
        averageFrameDelta: 0.267,
        loopDelta: 0.277,
        motionScore: 100,
        loopScore: 23,
      },
      warnings: 0,
    },
    zipFiles: 21,
  },
];

const VIDEO_SPRITE_DEMO = VIDEO_SPRITE_DEMOS[0];

export async function getVideoSpriteDemo(env) {
  if (!env.ASSET_BUCKET) {
    return {
      ok: true,
      available: false,
      configured: false,
      demo: VIDEO_SPRITE_DEMO,
      demos: VIDEO_SPRITE_DEMOS,
    };
  }

  const demos = [];
  for (const demo of VIDEO_SPRITE_DEMOS) {
    const object = await env.ASSET_BUCKET.head(demo.fileKey);
    if (!object) continue;
    demos.push({
      ...demo,
      url: await buildSignedLibraryViewUrl(env, demo.fileKey, 86_400),
      contentType: object.httpMetadata?.contentType || "video/webm",
      size: object.size || null,
      uploaded: object.uploaded || null,
      generatorPath: `/generator/?demo=video-sprite&sample=${encodeURIComponent(demo.id)}`,
    });
  }

  if (demos.length === 0) {
    return {
      ok: true,
      available: false,
      configured: true,
      demo: VIDEO_SPRITE_DEMO,
      demos: [],
    };
  }

  const defaultDemo = demos.find((demo) => demo.id === VIDEO_SPRITE_DEMO.id) || demos[0];
  return {
    ok: true,
    available: true,
    configured: true,
    demo: defaultDemo,
    demos,
  };
}
