# Secrets

Everything in this directory is encrypted with sops and can be committed to
git. The repo is the durable store; `.envrc.local` is only a gitignored local
fallback.

## Quick Reference

| File | Format | Contents |
|------|--------|----------|
| `local.env` | sops-encrypted dotenv | Mistral API key/model metadata plus managed ComfyUI endpoints/token |

## Current Keys

| Key | Purpose |
|-----|---------|
| `MISTRAL_API_KEY` | Mistral bearer token for managed LLM calls |
| `MISTRAL_MODEL` | Default managed LLM model copied from storyos: `mistral-small-latest` |
| `MISTRAL_BASE_URL` | Mistral OpenAI-compatible API base: `https://api.mistral.ai/v1` |
| `COMFY_UPSTREAM_BASE` | Direct ComfyUI upstream: `https://comfy.101.78.126.6.sslip.io` |
| `COMFY_API_TOKEN` | Bearer token for the ComfyUI Caddy proxy |
| `COMFY_REST_PROXY_URL` | storyos managed REST proxy: `https://worldsmith.panda.qzz.io/api/comfy/v1` |
| `COMFY_WS_URL` | storyos managed WebSocket bridge: `wss://worldsmith-comfy-ws.xiongchenyu6.workers.dev` |
| `GENERATOR_ACCESS_TOKEN` | Shared browser access token for production generator API calls |

`storyos` production also has a Cloudflare Pages secret named
`MISTRAL_API_KEY`. Cloudflare only exposes Pages secrets as encrypted/write-only,
so keep this SOPS copy as the local durable record.

## Reading Values

The dev shell auto-decrypts on `cd` into the repo when direnv is enabled:

```bash
cd spirit-forge
echo "$MISTRAL_MODEL"
echo "$COMFY_UPSTREAM_BASE"
```

To inspect ad hoc:

```bash
sops -d secrets/local.env
sops -d --extract '["MISTRAL_MODEL"]' secrets/local.env
sops -d --extract '["COMFY_API_TOKEN"]' secrets/local.env
```

## Editing Values

Open the encrypted file through sops:

```bash
sops secrets/local.env
```

After editing, run `direnv reload` or re-enter the directory.

## Adding A New AI Provider Key

```bash
sops set secrets/local.env '["MISTRAL_API_KEY"]' '"<paste-mistral-key>"'
```

The file is re-encrypted to every recipient listed in `.sops.yaml`.

## Security Notes

- `secrets/*.env` files are encrypted in place and are intended to be committed.
- Plaintext exports should use suffixes like `.dec` or `.plain`; those are
  gitignored.
- Never put plaintext shared secrets in `.envrc`; use `.envrc.local` only for
  short-lived local overrides.

## Cloudflare Worker Sync

```bash
sops -d --extract '["MISTRAL_API_KEY"]' secrets/local.env | wrangler secret put MISTRAL_API_KEY
sops -d --extract '["COMFY_API_TOKEN"]' secrets/local.env | wrangler secret put COMFY_API_TOKEN
sops -d --extract '["GENERATOR_ACCESS_TOKEN"]' secrets/local.env | wrangler secret put GENERATOR_ACCESS_TOKEN
node scripts/build-worker-assets.mjs
wrangler deploy
```
