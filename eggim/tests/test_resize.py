"""Tests for resize sizing/path logic (no Pillow needed)."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from eggim.resize_images import _out_path, _target_size  # noqa: E402


def test_shrinks_long_edge_only_and_keeps_aspect():
    w, h, shrunk = _target_size(2000, 1600, 1280)
    assert shrunk and w == 1280 and h == 1024      # 2000->1280, aspect 1.25 kept


def test_portrait_uses_height_as_long_edge():
    w, h, shrunk = _target_size(1000, 2000, 1000)
    assert shrunk and h == 1000 and w == 500


def test_never_upscales():
    w, h, shrunk = _target_size(800, 600, 1280)
    assert not shrunk and (w, h) == (800, 600)


def test_out_path_mirrors_structure_and_changes_ext():
    dst = _out_path("/in", "/out", "/in/R001/img_003.png", "jpeg")
    assert dst == os.path.join("/out", "R001", "img_003.jpg")


def test_out_path_keep_format_preserves_ext():
    dst = _out_path("/in", "/out", "/in/R001/img_003.png", "keep")
    assert dst.endswith("img_003.png")


if __name__ == "__main__":
    import traceback
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for t in tests:
        try:
            t(); print(f"PASS {t.__name__}")
        except Exception:
            failed += 1; print(f"FAIL {t.__name__}"); traceback.print_exc()
    print(f"\n{len(tests) - failed}/{len(tests)} passed")
    sys.exit(1 if failed else 0)
