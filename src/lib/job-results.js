import { buildComfyViewUrl, comfyFetchJson, firstImageOutput, firstModelOutput, firstVideoOutput, getQueueStatus, layerSeparationOutput } from "./comfy-client.js";
import { archiveResult, archiveResultSet, patchJobRecordQuietly, readJobRecord, signedLayerResultFiles } from "./storage.js";
import { contentTypeForResult } from "./result-utils.js";

export async function getJob(promptId, env, url) {
  // 优先用任务记录里固化的 kind（创建时写入，如 layer-separation）。否则缺省 ?kind
  // 的轮询会按 2d 单图抽取结果，损坏多文件的 layer-separation result.files → 预览“未就绪”。
  const existingRecord = await readJobRecord(env, promptId).catch(() => null);
  const kind = existingRecord?.kind || url.searchParams.get("kind") || "2d";
  const history = await comfyFetchJson(env, `/history/${encodeURIComponent(promptId)}`);
  const entry = history?.[promptId];
  if (!entry) {
    const queue = await getQueueStatus(env, new URL(`https://queue.local/?promptId=${encodeURIComponent(promptId)}`)).catch((error) => {
      console.warn("Comfy queue lookup failed", error);
      return null;
    });
    const queueState = queue?.current?.state || "unknown";
    if (queueState === "running" || queueState === "pending") {
      return { ok: true, status: "running", promptId, queue: queue.current };
    }
    if (existingRecord) {
      await patchJobRecordQuietly(env, promptId, {
        kind,
        status: "not_in_queue",
        rawStatus: queue?.current || null,
      });
    }
    return {
      ok: true,
      status: "not_in_queue",
      promptId,
      message: "Comfy history has no result and the prompt is not present in the current queue.",
      queue: queue?.current || null,
    };
  }

  const status = entry.status?.status_str || "complete";
  const outputs = entry.outputs || {};
  const result = kind === "3d"
    ? firstModelOutput(outputs)
    : kind === "video-sprite"
      ? firstVideoOutput(outputs)
      : kind === "layer-separation"
        ? layerSeparationOutput(outputs)
        : firstImageOutput(outputs);
  if (!result) {
    const finalStatus = status === "success" ? "complete_no_result" : status;
    await patchJobRecordQuietly(env, promptId, {
      kind,
      status: finalStatus,
      rawStatus: entry.status || null,
      completedAt: new Date().toISOString(),
    });
    return {
      ok: true,
      status: finalStatus,
      promptId,
      rawStatus: entry.status || null,
    };
  }

  const archived = result.kind === "layer-separation"
    ? await archiveResultSet(env, { promptId, kind, results: result.files, entry }).catch((error) => {
        console.warn("R2 archive failed", error);
        return null;
      })
    : await archiveResult(env, { promptId, kind, result, entry }).catch((error) => {
        console.warn("R2 archive failed", error);
        return null;
      });
  const resultPayload = result.kind === "layer-separation"
    ? {
        ...result,
        url: archived?.url || buildComfyViewUrl(result.files[0]),
        files: await signedLayerResultFiles(env, result.files, archived),
        library: archived,
      }
    : {
        ...result,
        url: archived?.url || buildComfyViewUrl(result),
        comfyUrl: buildComfyViewUrl(result),
        library: archived,
      };
  await patchJobRecordQuietly(env, promptId, {
    kind,
    status: "complete",
    rawStatus: entry.status || null,
    completedAt: new Date().toISOString(),
    result: result.kind === "layer-separation"
      ? summarizeLayerSeparationResult(resultPayload, archived)
      : summarizeJobResult(result, archived),
  });

  return {
    ok: true,
    status: "complete",
    promptId,
    result: resultPayload,
  };
}

function summarizeJobResult(result, archived) {
  return {
    filename: result.filename,
    subfolder: result.subfolder || "",
    type: result.type || "output",
    comfyUrl: buildComfyViewUrl(result),
    contentType: archived?.contentType || contentTypeForResult(result),
    bytes: archived?.bytes || null,
    fileKey: archived?.fileKey || null,
    libraryId: archived?.id || null,
  };
}

function summarizeLayerSeparationResult(result, archived) {
  const files = (result.files || []).map((file) => ({
    layerId: file.layerId,
    label: file.label,
    filename: file.filename,
    subfolder: file.subfolder || "",
    type: file.type || "output",
    comfyUrl: buildComfyViewUrl(file),
    contentType: file.contentType || contentTypeForResult(file),
    bytes: file.bytes || null,
    fileKey: file.fileKey || null,
    libraryId: file.libraryId || archived?.id || null,
  }));
  return {
    kind: "layer-separation",
    filename: files[0]?.filename || null,
    fileKey: files[0]?.fileKey || null,
    contentType: files[0]?.contentType || "image/png",
    bytes: files[0]?.bytes || null,
    libraryId: archived?.id || null,
    files,
  };
}
