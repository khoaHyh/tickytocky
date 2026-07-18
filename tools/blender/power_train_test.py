"""Tests for the Blender-independent power-train contract and layout."""

from __future__ import annotations

import json
import math
import tempfile
import unittest
from pathlib import Path

import power_train


VALID_SPEC = {
    "arborTurnsAtFullWind": 3,
    "reserveSecondsAtFullWind": 28_800,
    "meshes": {
        "barrelToCenter": {"wheelTeeth": 96, "pinionLeaves": 12},
        "centerToThird": {"wheelTeeth": 80, "pinionLeaves": 10},
        "thirdToFourth": {"wheelTeeth": 75, "pinionLeaves": 10},
        "fourthToEscape": {"wheelTeeth": 96, "pinionLeaves": 6},
    },
}


class PowerTrainTest(unittest.TestCase):
    def test_rejects_fractional_counts(self) -> None:
        invalid = {**VALID_SPEC, "meshes": dict(VALID_SPEC["meshes"])}
        invalid["meshes"]["barrelToCenter"] = {
            "wheelTeeth": 96.5,
            "pinionLeaves": 12,
        }

        with self.assertRaisesRegex(ValueError, "positive integer"):
            self.load(invalid)

    def test_layout_uses_matching_pitch_circle_distances(self) -> None:
        spec = self.load(VALID_SPEC)
        layout = power_train.create_power_train_layout(spec)
        pairs = (
            (
                layout.barrel_pivot,
                layout.center_pivot,
                power_train.BARREL_TIP_RADIUS,
                power_train.BARREL_ROOT_RADIUS,
                layout.center_pinion_tip_radius,
            ),
            (
                layout.center_pivot,
                layout.third_pivot,
                power_train.CENTER_TIP_RADIUS,
                power_train.CENTER_ROOT_RADIUS,
                layout.third_pinion_tip_radius,
            ),
            (
                layout.third_pivot,
                layout.fourth_pivot,
                power_train.THIRD_TIP_RADIUS,
                power_train.THIRD_ROOT_RADIUS,
                layout.fourth_pinion_tip_radius,
            ),
            (
                layout.fourth_pivot,
                layout.escape_pivot,
                power_train.FOURTH_TIP_RADIUS,
                power_train.FOURTH_ROOT_RADIUS,
                layout.escape_pinion_tip_radius,
            ),
        )

        for wheel, pinion, tip_radius, root_radius, pinion_tip_radius in pairs:
            actual = math.dist(wheel[:2], pinion[:2])
            expected = power_train.mesh_center_distance(
                tip_radius,
                root_radius,
                pinion_tip_radius,
            )
            self.assertAlmostEqual(actual, expected)

    def load(self, value: object) -> power_train.PowerTrainSpec:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "power-train.json"
            path.write_text(json.dumps(value), encoding="utf-8")
            return power_train.load_power_train(path)


if __name__ == "__main__":
    unittest.main()
