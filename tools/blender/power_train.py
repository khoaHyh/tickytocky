"""Validated power-train specification and pitch-circle layout."""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path


PINION_ROOT_RATIO = 0.58
MAX_SAFE_INTEGER = 2**53 - 1
BARREL_TIP_RADIUS = 0.0042
BARREL_ROOT_RADIUS = 0.00388
CENTER_TIP_RADIUS = 0.00315
CENTER_ROOT_RADIUS = 0.00288
THIRD_TIP_RADIUS = 0.00265
THIRD_ROOT_RADIUS = 0.00242
FOURTH_TIP_RADIUS = 0.0023
FOURTH_ROOT_RADIUS = 0.0021


@dataclass(frozen=True)
class MeshPair:
    """Tooth counts for one driving wheel and its next pinion."""

    wheel_teeth: int
    pinion_leaves: int


@dataclass(frozen=True)
class PowerTrainSpec:
    """Checked educational constants shared with the TypeScript lesson."""

    arbor_turns_at_full_wind: int
    reserve_seconds_at_full_wind: int
    barrel_to_center: MeshPair
    center_to_third: MeshPair
    third_to_fourth: MeshPair
    fourth_to_escape: MeshPair


@dataclass(frozen=True)
class PowerTrainLayout:
    """Pinion sizes and pivots derived from matching pitch circles."""

    barrel_pivot: tuple[float, float, float]
    center_pinion_tip_radius: float
    center_pivot: tuple[float, float, float]
    escape_pinion_tip_radius: float
    escape_pivot: tuple[float, float, float]
    fourth_pinion_tip_radius: float
    fourth_pivot: tuple[float, float, float]
    third_pinion_tip_radius: float
    third_pivot: tuple[float, float, float]


def load_power_train(path: Path) -> PowerTrainSpec:
    """Parse the shared JSON and reject invalid mechanical counts."""
    raw = read_record(json.loads(path.read_text(encoding="utf-8")), "power train")
    meshes = read_record(raw.get("meshes"), "meshes")
    return PowerTrainSpec(
        arbor_turns_at_full_wind=positive_integer(
            raw.get("arborTurnsAtFullWind"),
            "arborTurnsAtFullWind",
        ),
        reserve_seconds_at_full_wind=positive_integer(
            raw.get("reserveSecondsAtFullWind"),
            "reserveSecondsAtFullWind",
        ),
        barrel_to_center=read_mesh_pair(meshes, "barrelToCenter"),
        center_to_third=read_mesh_pair(meshes, "centerToThird"),
        third_to_fourth=read_mesh_pair(meshes, "thirdToFourth"),
        fourth_to_escape=read_mesh_pair(meshes, "fourthToEscape"),
    )


def create_power_train_layout(spec: PowerTrainSpec) -> PowerTrainLayout:
    """Lay out the train backward from the escapement's fixed pivot."""
    center_pinion_tip_radius = matched_pinion_tip_radius(
        BARREL_TIP_RADIUS,
        BARREL_ROOT_RADIUS,
        spec.barrel_to_center,
    )
    third_pinion_tip_radius = matched_pinion_tip_radius(
        CENTER_TIP_RADIUS,
        CENTER_ROOT_RADIUS,
        spec.center_to_third,
    )
    fourth_pinion_tip_radius = matched_pinion_tip_radius(
        THIRD_TIP_RADIUS,
        THIRD_ROOT_RADIUS,
        spec.third_to_fourth,
    )
    escape_pinion_tip_radius = matched_pinion_tip_radius(
        FOURTH_TIP_RADIUS,
        FOURTH_ROOT_RADIUS,
        spec.fourth_to_escape,
    )

    escape_pivot = (0.0042, -0.0066, -0.00282)
    fourth_pivot = offset_pivot(
        escape_pivot,
        direction=(2, 3.6),
        distance=mesh_center_distance(
            FOURTH_TIP_RADIUS,
            FOURTH_ROOT_RADIUS,
            escape_pinion_tip_radius,
        ),
        depth=-0.0025,
    )
    third_pivot = offset_pivot(
        fourth_pivot,
        direction=(-2.1, 4),
        distance=mesh_center_distance(
            THIRD_TIP_RADIUS,
            THIRD_ROOT_RADIUS,
            fourth_pinion_tip_radius,
        ),
        depth=-0.00215,
    )
    center_pivot = offset_pivot(
        third_pivot,
        direction=(-4.1, -1),
        distance=mesh_center_distance(
            CENTER_TIP_RADIUS,
            CENTER_ROOT_RADIUS,
            third_pinion_tip_radius,
        ),
        depth=-0.0018,
    )
    barrel_pivot = offset_pivot(
        center_pivot,
        direction=(-4.8, 3.6),
        distance=mesh_center_distance(
            BARREL_TIP_RADIUS,
            BARREL_ROOT_RADIUS,
            center_pinion_tip_radius,
        ),
        depth=-0.0014,
    )
    return PowerTrainLayout(
        barrel_pivot=barrel_pivot,
        center_pinion_tip_radius=center_pinion_tip_radius,
        center_pivot=center_pivot,
        escape_pinion_tip_radius=escape_pinion_tip_radius,
        escape_pivot=escape_pivot,
        fourth_pinion_tip_radius=fourth_pinion_tip_radius,
        fourth_pivot=fourth_pivot,
        third_pinion_tip_radius=third_pinion_tip_radius,
        third_pivot=third_pivot,
    )


def pinion_root_radius(tip_radius: float) -> float:
    """Return the shared root radius used by the educational pinions."""
    return tip_radius * PINION_ROOT_RATIO


def read_mesh_pair(meshes: dict[str, object], name: str) -> MeshPair:
    """Parse one positive-integer wheel and pinion pair."""
    mesh = read_record(meshes.get(name), name)
    return MeshPair(
        wheel_teeth=positive_integer(mesh.get("wheelTeeth"), f"{name}.wheelTeeth"),
        pinion_leaves=positive_integer(
            mesh.get("pinionLeaves"),
            f"{name}.pinionLeaves",
        ),
    )


def read_record(value: object, name: str) -> dict[str, object]:
    """Parse one JSON object with string keys."""
    if isinstance(value, dict) and all(isinstance(key, str) for key in value):
        return value
    raise ValueError(f'Power-train constant "{name}" must be an object.')


def positive_integer(value: object, name: str) -> int:
    """Parse a positive JSON integer without accepting booleans or truncation."""
    if (
        isinstance(value, int)
        and not isinstance(value, bool)
        and 0 < value <= MAX_SAFE_INTEGER
    ):
        return value
    raise ValueError(f'Power-train constant "{name}" must be a positive integer.')


def pitch_radius(tip_radius: float, root_radius: float) -> float:
    return (tip_radius + root_radius) / 2


def matched_pinion_tip_radius(
    wheel_tip_radius: float,
    wheel_root_radius: float,
    mesh: MeshPair,
) -> float:
    pinion_pitch_radius = (
        pitch_radius(wheel_tip_radius, wheel_root_radius)
        * mesh.pinion_leaves
        / mesh.wheel_teeth
    )
    return pinion_pitch_radius * 2 / (1 + PINION_ROOT_RATIO)


def mesh_center_distance(
    wheel_tip_radius: float,
    wheel_root_radius: float,
    pinion_tip_radius: float,
) -> float:
    return pitch_radius(wheel_tip_radius, wheel_root_radius) + pitch_radius(
        pinion_tip_radius,
        pinion_root_radius(pinion_tip_radius),
    )


def offset_pivot(
    origin: tuple[float, float, float],
    *,
    direction: tuple[float, float],
    distance: float,
    depth: float,
) -> tuple[float, float, float]:
    direction_length = math.hypot(*direction)
    return (
        origin[0] + direction[0] / direction_length * distance,
        origin[1] + direction[1] / direction_length * distance,
        depth,
    )
