"""Download one product image per slug using icrawler GoogleImageCrawler."""

from __future__ import annotations

import os
import shutil
import tempfile
import traceback
from pathlib import Path
from typing import Iterable, List, Tuple

from icrawler.builtin import BingImageCrawler, GoogleImageCrawler


PRODUCTS: List[Tuple[str, str]] = [
    ("sony-walkman-tps-l2", "Sony Walkman TPS-L2 vintage product photo"),
    ("apple-macintosh-128k", "Apple Macintosh 128K computer original product photo"),
    ("polaroid-sx-70", "Polaroid SX-70 instant camera studio product photo"),
    ("nintendo-nes", "Nintendo Entertainment System NES console vintage product photo"),
    ("braun-t1000", "Braun T1000 world receiver radio industrial design product photo"),
    ("sony-trinitron-kv1310", "Sony Trinitron KV-1310 television vintage product photo"),
    ("hasselblad-500c", "Hasselblad 500C medium format camera product photo"),
    ("ibm-model-m", "IBM Model M keyboard original product photo"),
    ("atari-2600", "Atari 2600 console vintage product photo"),
    ("technics-sl1200", "Technics SL-1200 turntable product photo"),
    ("commodore-64", "Commodore 64 home computer product photo"),
    ("leica-m3", "Leica M3 rangefinder camera product photo"),
]

OUTPUT_DIR = Path("media") / "products"
MIN_SIZE = (400, 400)
MAX_CANDIDATES = 6


def _get_downloaded_files(folder: Path) -> List[Path]:
    return [p for p in folder.iterdir() if p.is_file()]


def _pick_best_candidate(files: Iterable[Path]) -> tuple[Path | None, bool]:
    files = list(files)
    if not files:
        return None, False

    jpeg_exts = {".jpg", ".jpeg"}
    jpeg_files = [p for p in files if p.suffix.lower() in jpeg_exts]

    if jpeg_files:
        best_jpeg = max(jpeg_files, key=lambda p: p.stat().st_size)
        return best_jpeg, True

    best_any = max(files, key=lambda p: p.stat().st_size)
    return best_any, False


def _crawl_google(keyword: str, temp_dir: Path) -> tuple[List[Path], str | None]:
    crawler = GoogleImageCrawler(storage={"root_dir": str(temp_dir)})
    try:
        crawler.crawl(keyword=keyword, max_num=MAX_CANDIDATES, min_size=MIN_SIZE)
    except Exception as exc:  # pragma: no cover - network/parser variability
        short_tb = traceback.format_exc(limit=2).strip().replace("\n", " | ")
        return [], f"google crawl exception: {exc} ({short_tb})"
    return _get_downloaded_files(temp_dir), None


def _crawl_bing(keyword: str, temp_dir: Path) -> tuple[List[Path], str | None]:
    crawler = BingImageCrawler(storage={"root_dir": str(temp_dir)})
    try:
        crawler.crawl(
            keyword=keyword,
            max_num=MAX_CANDIDATES,
            filters={"size": "large"},
        )
    except Exception as exc:  # pragma: no cover - network/parser variability
        short_tb = traceback.format_exc(limit=2).strip().replace("\n", " | ")
        return [], f"bing crawl exception: {exc} ({short_tb})"
    return _get_downloaded_files(temp_dir), None


def _download_single_product(slug: str, keyword: str, output_dir: Path) -> tuple[bool, str]:
    print(f"[START] {slug} -> {keyword}")

    with tempfile.TemporaryDirectory(prefix=f"img_{slug}_") as temp_dir_str:
        temp_dir = Path(temp_dir_str)

        print(f"[SOURCE] {slug}: trying GoogleImageCrawler (min_size={MIN_SIZE})")
        downloaded, google_error = _crawl_google(keyword, temp_dir)

        source_used = "google"
        if not downloaded:
            if google_error:
                print(f"[WARN] {slug}: Google failed: {google_error}")
            else:
                print(f"[WARN] {slug}: Google returned no files; switching to Bing fallback")

            print(f"[SOURCE] {slug}: trying BingImageCrawler (filters={{'size': 'large'}})")
            downloaded, bing_error = _crawl_bing(keyword, temp_dir)
            source_used = "bing"

            if not downloaded:
                if bing_error:
                    return False, f"google produced 0 files; bing failed: {bing_error}"
                return False, "google produced 0 files; bing fallback also produced 0 files"

        selected, is_jpeg = _pick_best_candidate(downloaded)
        if selected is None:
            return False, "no valid candidate found"

        target = output_dir / f"{slug}.jpg"
        if target.exists():
            target.unlink()

        shutil.move(str(selected), str(target))

        if is_jpeg:
            return True, f"saved JPEG via {source_used} as {target}"
        return True, f"saved non-JPEG via {source_used} as {target} (no JPEG available)"


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    total = len(PRODUCTS)
    success = 0
    failures: List[tuple[str, str]] = []

    print("=== Product Image Download (Step 2) ===")
    print(f"Output directory: {OUTPUT_DIR.resolve()}")
    print(f"Products to process: {total}")
    print(f"Minimum image size filter: {MIN_SIZE}")
    print("-")

    for i, (slug, keyword) in enumerate(PRODUCTS, start=1):
        print(f"[{i}/{total}] Processing {slug}")
        ok, message = _download_single_product(slug, keyword, OUTPUT_DIR)
        if ok:
            success += 1
            print(f"[OK] {slug}: {message}")
        else:
            failures.append((slug, message))
            print(f"[FAIL] {slug}: {message}")
        print("-")

    failed = len(failures)
    print("=== Download Complete ===")
    print(f"Total: {total}")
    print(f"Success: {success}")
    print(f"Failure: {failed}")

    if failures:
        print("Failed products:")
        for slug, reason in failures:
            print(f"- {slug}: {reason}")


if __name__ == "__main__":
    main()
