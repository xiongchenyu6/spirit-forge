#!/usr/bin/env python3
from __future__ import annotations

import argparse
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import os
from urllib.parse import unquote, urlparse

ROUTE_ALIAS = {
    "/": "ui_kits/landing/index.html",
    "/landing/": "ui_kits/landing/index.html",
    "/studio/": "ui_kits/studio/index.html",
    "/library/": "ui_kits/library/index.html",
    "/templates/": "ui_kits/templates/index.html",
    "/pricing/": "ui_kits/pricing/index.html",
    "/onboarding/": "ui_kits/onboarding/index.html",
    "/en/": "ui_kits/landing/index.html",
    "/en/landing/": "ui_kits/landing/index.html",
    "/en/studio/": "ui_kits/studio/index.html",
    "/en/library/": "ui_kits/library/index.html",
    "/en/templates/": "ui_kits/templates/index.html",
    "/en/pricing/": "ui_kits/pricing/index.html",
    "/en/onboarding/": "ui_kits/onboarding/index.html",
}

CLEAN_ALIAS_REDIRECT = {"/landing", "/studio", "/library", "/templates", "/pricing", "/onboarding", "/en", "/en/landing", "/en/studio", "/en/library", "/en/templates", "/en/pricing", "/en/onboarding"}
PAGE_PREFIXES = {"/landing/", "/studio/", "/library/", "/templates/", "/pricing/", "/onboarding/"}


def strip_lang_prefix(path: str) -> str:
    if path.startswith("/en/"):
        return path[3:]
    return path

def is_file_request(path: str) -> bool:
    return "." in os.path.basename(path)


class RouterHandler(SimpleHTTPRequestHandler):
    extensions_map = SimpleHTTPRequestHandler.extensions_map.copy()

    def _mapped_path(self) -> str | None:
        raw = urlparse(self.path).path
        path = unquote(raw or "/")

        # 1) 路由别名
        path = strip_lang_prefix(path)
        mapped = ROUTE_ALIAS.get(path)
        if mapped:
            target = mapped
        elif any(path.startswith(prefix) for prefix in PAGE_PREFIXES):
            target = f"ui_kits{path}"
        else:
            target = path.lstrip("/")

        candidates = [target]

        # /foo -> /foo/index.html
        if path.endswith("/") and path != "/":
            candidates.append(f"{target}index.html")
        elif not is_file_request(path) and path != "/":
            candidates.append(f"{target}/index.html")

        # 根路径 fallback
        if path == "/":
            candidates.append("ui_kits/landing/index.html")

        for cand in candidates:
            if os.path.isfile(cand):
                return cand
            if os.path.isfile(cand.lstrip("/")):
                return cand.lstrip("/")
        return None

    def translate_path(self, path: str) -> str:
        mapped = self._mapped_path()
        if mapped:
            return os.path.abspath(mapped)
        return super().translate_path(path)

    def send_error(self, code, message=None, explain=None):
        if code == HTTPStatus.NOT_FOUND:
            fallback = os.path.abspath("ui_kits/landing/index.html")
            if os.path.isfile(fallback):
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-type", self.guess_type(fallback))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                with open(fallback, "rb") as f:
                    self.wfile.write(f.read())
                return
        return super().send_error(code, message, explain)

    def do_GET(self) -> None:
        path = unquote(urlparse(self.path).path)
        if path in CLEAN_ALIAS_REDIRECT:
            self.send_response(HTTPStatus.MOVED_PERMANENTLY)
            location = f"{path}/"
            if self.headers.get("Host"):
                location = f"/{location.lstrip('/')}"
            self.send_header("Location", location)
            self.end_headers()
            return
        super().do_GET()

    def do_HEAD(self) -> None:
        path = unquote(urlparse(self.path).path)
        if path in CLEAN_ALIAS_REDIRECT:
            self.send_response(HTTPStatus.MOVED_PERMANENTLY)
            location = f"{path}/"
            if self.headers.get("Host"):
                location = f"/{location.lstrip('/')}"
            self.send_header("Location", location)
            self.end_headers()
            return
        super().do_HEAD()


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve Lingji Forge with clean route support")
    parser.add_argument("--port", type=int, default=8787)
    args = parser.parse_args()

    os.chdir(os.getcwd())
    server = ThreadingHTTPServer(("0.0.0.0", args.port), RouterHandler)
    print(f"Serving on http://127.0.0.1:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down")
        server.server_close()


if __name__ == "__main__":
    main()
