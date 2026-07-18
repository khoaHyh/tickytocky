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
    def test_rejects_invalid_counts(self) -> None:
        for invalid_count in (True, 96.5, power_train.MAX_SAFE_INTEGER + 1):
            with self.subTest(invalid_count=invalid_count):
                invalid = {**VALID_SPEC, "meshes": dict(VALID_SPEC["meshes"])}
                invalid["meshes"]["barrelToCenter"] = {
                    "wheelTeeth": invalid_count,
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
                spec.barrel_to_center,
            ),
            (
                layout.center_pivot,
                layout.third_pivot,
                power_train.CENTER_TIP_RADIUS,
                power_train.CENTER_ROOT_RADIUS,
                layout.third_pinion_tip_radius,
                spec.center_to_third,
            ),
            (
                layout.third_pivot,
                layout.fourth_pivot,
                power_train.THIRD_TIP_RADIUS,
                power_train.THIRD_ROOT_RADIUS,
                layout.fourth_pinion_tip_radius,
                spec.third_to_fourth,
            ),
            (
                layout.fourth_pivot,
                layout.escape_pivot,
                power_train.FOURTH_TIP_RADIUS,
                power_train.FOURTH_ROOT_RADIUS,
                layout.escape_pinion_tip_radius,
                spec.fourth_to_escape,
            ),
        )

        for wheel, pinion, tip_radius, root_radius, pinion_tip_radius, mesh in pairs:
            actual = math.dist(wheel[:2], pinion[:2])
            wheel_pitch_radius = (tip_radius + root_radius) / 2
            pinion_pitch_radius = wheel_pitch_radius * mesh.pinion_leaves / mesh.wheel_teeth
            expected = wheel_pitch_radius + pinion_pitch_radius
            self.assertAlmostEqual(
                pinion_pitch_radius,
                (pinion_tip_radius + pinion_tip_radius * power_train.PINION_ROOT_RATIO) / 2,
            )
            self.assertAlmostEqual(actual, expected)

    def load(self, value: object) -> power_train.PowerTrainSpec:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "power-train.json"
            path.write_text(json.dumps(value), encoding="utf-8")
            return power_train.load_power_train(path)


if __name__ == "__main__":
    unittest.main()
