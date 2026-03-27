#!/usr/bin/env python3

from __future__ import annotations

import re
from pathlib import Path
import xml.etree.ElementTree as ET

SVG_NS = {"svg": "http://www.w3.org/2000/svg"}
FOREGROUND_SCALE = 0.62
BACKGROUND_COLOR = "#000000"


def parse_viewbox(value: str) -> tuple[float, float]:
    parts = [float(part) for part in re.split(r"[\s,]+", value.strip()) if part]
    if len(parts) != 4:
        raise ValueError(f"Unexpected viewBox: {value!r}")
    return parts[2], parts[3]


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    source_svg = repo_root / "packages/desktop/assets/icon.svg"
    foreground_xml = (
        repo_root
        / "packages/android/app/src/main/res/drawable/ic_launcher_foreground.xml"
    )
    background_xml = (
        repo_root
        / "packages/android/app/src/main/res/drawable/ic_launcher_background.xml"
    )

    tree = ET.parse(source_svg)
    root = tree.getroot()

    viewbox = root.attrib.get("viewBox")
    if not viewbox:
        raise ValueError("SVG is missing a viewBox")

    viewport_width, viewport_height = parse_viewbox(viewbox)
    pivot_x = viewport_width / 2
    pivot_y = viewport_height / 2

    path = root.find("svg:path", SVG_NS)
    if path is None:
        raise ValueError("SVG is missing a path element")

    fill = path.attrib.get("fill", "#FFFFFF")
    path_data = path.attrib.get("d")
    if not path_data:
        raise ValueError("SVG path is missing its d attribute")

    foreground_xml.parent.mkdir(parents=True, exist_ok=True)
    foreground_xml.write_text(
        "\n".join(
            [
                '<?xml version="1.0" encoding="utf-8"?>',
                '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
                '  android:width="108dp"',
                '  android:height="108dp"',
                f'  android:viewportWidth="{viewport_width:g}"',
                f'  android:viewportHeight="{viewport_height:g}">',
                "  <group",
                f'    android:pivotX="{pivot_x:g}"',
                f'    android:pivotY="{pivot_y:g}"',
                f'    android:scaleX="{FOREGROUND_SCALE:.2f}"',
                f'    android:scaleY="{FOREGROUND_SCALE:.2f}">',
                "    <path",
                f'      android:fillColor="{fill}"',
                f'      android:pathData="{path_data}" />',
                "  </group>",
                "</vector>",
                "",
            ]
        ),
        encoding="utf-8",
    )

    background_xml.write_text(
        "\n".join(
            [
                '<?xml version="1.0" encoding="utf-8"?>',
                '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">',
                f'  <solid android:color="{BACKGROUND_COLOR}" />',
                "</shape>",
                "",
            ]
        ),
        encoding="utf-8",
    )

    print(f"Updated {foreground_xml.relative_to(repo_root)}")
    print(f"Updated {background_xml.relative_to(repo_root)}")


if __name__ == "__main__":
    main()
