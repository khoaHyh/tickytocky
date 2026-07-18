"""Generate TickyTocky's self-authored watch-model tracer asset."""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy  # type: ignore[import-not-found]


def parse_output_path() -> Path:
    """Parse arguments passed after Blender's `--` separator."""
    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    return parser.parse_args(arguments).output.resolve()


def reset_scene() -> None:
    """Remove the default scene and configure real-world metric units."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "MILLIMETERS"
    scene.unit_settings.scale_length = 0.001


def create_material(
    name: str,
    color: tuple[float, float, float, float],
    *,
    metallic: float,
    roughness: float,
) -> bpy.types.Material:
    """Create one physically based material with no texture dependencies."""
    material = bpy.data.materials.new(name=name)
    material.diffuse_color = color
    material.metallic = metallic
    material.roughness = roughness
    return material


def finish_mesh(
    name: str,
    material: bpy.types.Material,
    root: bpy.types.Object,
) -> bpy.types.Object:
    """Apply the semantic object contract to the active mesh."""
    object_ = bpy.context.active_object
    if object_ is None or object_.type != "MESH":
        raise RuntimeError(f"Expected an active mesh while creating {name}")
    object_.name = name
    object_.data.name = f"{name}_mesh"
    object_.data.materials.append(material)
    object_.parent = root
    for polygon in object_.data.polygons:
        polygon.use_smooth = True
    return object_


def add_cylinder(
    name: str,
    *,
    radius: float,
    depth: float,
    location: tuple[float, float, float],
    material: bpy.types.Material,
    root: bpy.types.Object,
    vertices: int = 48,
) -> bpy.types.Object:
    """Add a cylindrical watch part whose origin is its mechanical axis."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
    )
    return finish_mesh(name, material, root)


def add_torus(
    name: str,
    *,
    major_radius: float,
    minor_radius: float,
    location: tuple[float, float, float],
    material: bpy.types.Material,
    root: bpy.types.Object,
) -> bpy.types.Object:
    """Add a ring-shaped watch part whose origin is its mechanical axis."""
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=64,
        minor_segments=12,
        location=location,
    )
    return finish_mesh(name, material, root)


def add_hand(
    name: str,
    *,
    length: float,
    width: float,
    depth: float,
    location: tuple[float, float, float],
    angle: float,
    material: bpy.types.Material,
    root: bpy.types.Object,
) -> bpy.types.Object:
    """Add a hand with its pivot at the watch center rather than its centroid."""
    half_width = width / 2
    vertices = [
        (-half_width, 0, -depth / 2),
        (half_width, 0, -depth / 2),
        (half_width, length, -depth / 2),
        (-half_width, length, -depth / 2),
        (-half_width, 0, depth / 2),
        (half_width, 0, depth / 2),
        (half_width, length, depth / 2),
        (-half_width, length, depth / 2),
    ]
    faces = [
        (0, 1, 2, 3),
        (4, 7, 6, 5),
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (4, 0, 3, 7),
    ]
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    object_ = bpy.data.objects.new(name, mesh)
    object_.location = location
    object_.rotation_euler.z = angle
    object_.data.materials.append(material)
    object_.parent = root
    bpy.context.collection.objects.link(object_)
    return object_


def add_mesh(
    name: str,
    *,
    vertices: list[tuple[float, float, float]],
    faces: list[tuple[int, ...]],
    location: tuple[float, float, float],
    material: bpy.types.Material,
    root: bpy.types.Object,
    smooth: bool = False,
) -> bpy.types.Object:
    """Add a self-authored mesh while keeping its origin at `location`."""
    mesh = bpy.data.meshes.new(f"{name}_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    object_ = bpy.data.objects.new(name, mesh)
    object_.location = location
    object_.data.materials.append(material)
    object_.parent = root
    bpy.context.collection.objects.link(object_)
    for polygon in object_.data.polygons:
        polygon.use_smooth = smooth
    return object_


def add_radial_prism(
    name: str,
    *,
    outline: list[tuple[float, float]],
    depth: float,
    location: tuple[float, float, float],
    material: bpy.types.Material,
    root: bpy.types.Object,
    center: tuple[float, float] = (0, 0),
    smooth: bool = False,
) -> bpy.types.Object:
    """Extrude a star-shaped radial outline around a mechanical pivot."""
    half_depth = depth / 2
    vertex_count = len(outline)
    vertices = [
        (x, y, z)
        for z in (-half_depth, half_depth)
        for x, y in outline
    ]
    bottom_center = len(vertices)
    vertices.append((center[0], center[1], -half_depth))
    top_center = len(vertices)
    vertices.append((center[0], center[1], half_depth))
    faces: list[tuple[int, ...]] = []
    for index in range(vertex_count):
        next_index = (index + 1) % vertex_count
        faces.extend(
            [
                (bottom_center, next_index, index),
                (top_center, vertex_count + index, vertex_count + next_index),
                (
                    index,
                    next_index,
                    vertex_count + next_index,
                    vertex_count + index,
                ),
            ]
        )
    return add_mesh(
        name,
        vertices=vertices,
        faces=faces,
        location=location,
        material=material,
        root=root,
        smooth=smooth,
    )


def add_escape_wheel(
    *,
    location: tuple[float, float, float],
    material: bpy.types.Material,
    root: bpy.types.Object,
) -> bpy.types.Object:
    """Add a generic 15-tooth educational escape wheel."""
    tooth_count = 15
    sector = math.tau / tooth_count
    root_radius = 0.0013
    tip_radius = 0.00205
    outline = []
    for tooth in range(tooth_count):
        angle = tooth * sector
        for radius, phase in (
            (root_radius, 0.0),
            (tip_radius, 0.16),
            (tip_radius * 0.94, 0.38),
            (root_radius, 0.68),
        ):
            point_angle = angle + sector * phase
            outline.append(
                (radius * math.cos(point_angle), radius * math.sin(point_angle))
            )
    # Center the odd-tooth bounds so Meshopt quantization retains the wheel axis.
    x_extent = max(max(x for x, _ in outline), -min(x for x, _ in outline))
    y_extent = max(max(y for _, y in outline), -min(y for _, y in outline))
    positive_x = max(x for x, _ in outline)
    negative_x = -min(x for x, _ in outline)
    positive_y = max(y for _, y in outline)
    negative_y = -min(y for _, y in outline)
    outline = [
        (
            x * x_extent / (positive_x if x >= 0 else negative_x),
            y * y_extent / (positive_y if y >= 0 else negative_y),
        )
        for x, y in outline
    ]
    return add_radial_prism(
        "escape_wheel",
        outline=outline,
        depth=0.00036,
        location=location,
        material=material,
        root=root,
    )


def add_prism_parts(
    name: str,
    *,
    outlines: list[list[tuple[float, float]]],
    depth: float,
    location: tuple[float, float, float],
    material: bpy.types.Material,
    root: bpy.types.Object,
) -> bpy.types.Object:
    """Combine a few lightweight convex prisms into one semantic mesh."""
    half_depth = depth / 2
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    for outline in outlines:
        base = len(vertices)
        count = len(outline)
        vertices.extend((x, y, -half_depth) for x, y in outline)
        vertices.extend((x, y, half_depth) for x, y in outline)
        faces.append(tuple(base + index for index in reversed(range(count))))
        faces.append(tuple(base + count + index for index in range(count)))
        for index in range(count):
            next_index = (index + 1) % count
            faces.append(
                (
                    base + index,
                    base + next_index,
                    base + count + next_index,
                    base + count + index,
                )
            )
    return add_mesh(
        name,
        vertices=vertices,
        faces=faces,
        location=location,
        material=material,
        root=root,
    )


def rectangle_outline(
    *,
    center: tuple[float, float],
    length: float,
    width: float,
    angle: float,
) -> list[tuple[float, float]]:
    """Return a counter-clockwise oriented rectangle."""
    along = (math.cos(angle) * length / 2, math.sin(angle) * length / 2)
    across = (-math.sin(angle) * width / 2, math.cos(angle) * width / 2)
    return [
        (center[0] - along[0] - across[0], center[1] - along[1] - across[1]),
        (center[0] + along[0] - across[0], center[1] + along[1] - across[1]),
        (center[0] + along[0] + across[0], center[1] + along[1] + across[1]),
        (center[0] - along[0] + across[0], center[1] - along[1] + across[1]),
    ]


def add_pallet_fork(
    *,
    location: tuple[float, float, float],
    material: bpy.types.Material,
    root: bpy.types.Object,
) -> bpy.types.Object:
    """Add a fork with horns toward the balance and arms toward the escape wheel."""
    outlines = [
        [
            (-0.00135, -0.00022),
            (0.00055, -0.00025),
            (0.00085, -0.00013),
            (0.00085, 0.00013),
            (0.00055, 0.00025),
            (-0.00135, 0.00022),
        ],
        [
            (-0.00265, 0.00032),
            (-0.00135, 0.00018),
            (-0.00135, 0.00043),
            (-0.00265, 0.0006),
        ],
        [
            (-0.00265, -0.0006),
            (-0.00135, -0.00043),
            (-0.00135, -0.00018),
            (-0.00265, -0.00032),
        ],
        [
            (0.00055, 0.00013),
            (0.00172, 0.00043),
            (0.00162, 0.00072),
            (0.00055, 0.00025),
        ],
        [
            (0.00055, -0.00025),
            (0.00162, -0.00072),
            (0.00172, -0.00043),
            (0.00055, -0.00013),
        ],
    ]
    # Keep the pivot at the bounds center through Meshopt quantization.
    x_center = (
        min(x for outline in outlines for x, _ in outline)
        + max(x for outline in outlines for x, _ in outline)
    ) / 2
    outlines = [[(x - x_center, y) for x, y in outline] for outline in outlines]
    return add_prism_parts(
        "pallet_fork",
        outlines=outlines,
        depth=0.00032,
        location=location,
        material=material,
        root=root,
    )


def add_hairspring(
    *,
    location: tuple[float, float, float],
    material: bpy.types.Material,
    root: bpy.types.Object,
) -> bpy.types.Object:
    """Add a lightweight planar Archimedean spiral around the balance pivot."""
    spiral_segment_count = 60
    terminal_segment_count = 24
    turn_count = 2.5
    inner_radius = 0.00038
    outer_radius = 0.0027
    ribbon_width = 0.00009
    center_points: list[tuple[float, float]] = []
    for index in range(spiral_segment_count + 1):
        progress = index / spiral_segment_count
        center_points.append(
            (
                math.tau * turn_count * progress,
                inner_radius + (outer_radius - inner_radius) * progress,
            )
        )
    terminal_start = math.tau * turn_count
    center_points.extend(
        (terminal_start + math.tau * index / terminal_segment_count, outer_radius)
        for index in range(1, terminal_segment_count + 1)
    )

    vertices: list[tuple[float, float, float]] = []
    for angle, radius in center_points:
        for edge_radius in (radius - ribbon_width / 2, radius + ribbon_width / 2):
            vertices.append(
                (
                    edge_radius * math.cos(angle),
                    edge_radius * math.sin(angle),
                    0,
                )
            )
    faces = [
        (index * 2, index * 2 + 1, index * 2 + 3, index * 2 + 2)
        for index in range(len(center_points) - 1)
    ]
    return add_mesh(
        "hairspring",
        vertices=vertices,
        faces=faces,
        location=location,
        material=material,
        root=root,
    )


def create_watch() -> tuple[bpy.types.Object, ...]:
    """Create the semantic watch parts in their assembled pose."""
    steel = create_material(
        "steel",
        (0.42, 0.48, 0.52, 1),
        metallic=0.9,
        roughness=0.22,
    )
    dial_material = create_material(
        "dial_ink",
        (0.035, 0.045, 0.05, 1),
        metallic=0.15,
        roughness=0.34,
    )
    brass = create_material(
        "brass",
        (0.58, 0.33, 0.08, 1),
        metallic=0.78,
        roughness=0.3,
    )
    accent = create_material(
        "ruby_accent",
        (0.55, 0.02, 0.055, 1),
        metallic=0.15,
        roughness=0.24,
    )

    root = bpy.data.objects.new("watch_root", None)
    bpy.context.collection.objects.link(root)

    parts = [
        add_torus(
            "case",
            major_radius=0.0147,
            minor_radius=0.0013,
            location=(0, 0, 0.0015),
            material=steel,
            root=root,
        ),
        add_cylinder(
            "dial",
            radius=0.0135,
            depth=0.00035,
            location=(0, 0, 0.0017),
            material=dial_material,
            root=root,
            vertices=96,
        ),
        add_hand(
            "hour_hand",
            length=0.0062,
            width=0.00072,
            depth=0.00016,
            location=(0, 0, 0.00205),
            angle=math.radians(-38),
            material=steel,
            root=root,
        ),
        add_hand(
            "minute_hand",
            length=0.0094,
            width=0.00048,
            depth=0.00013,
            location=(0, 0, 0.00224),
            angle=math.radians(54),
            material=steel,
            root=root,
        ),
        add_hand(
            "gmt_hand",
            length=0.0112,
            width=0.0003,
            depth=0.00011,
            location=(0, 0, 0.00243),
            angle=math.radians(142),
            material=accent,
            root=root,
        ),
        add_cylinder(
            "barrel",
            radius=0.0042,
            depth=0.00145,
            location=(-0.0048, 0.0036, -0.0014),
            material=steel,
            root=root,
        ),
        add_cylinder(
            "center_wheel",
            radius=0.00315,
            depth=0.00048,
            location=(0, 0, -0.0018),
            material=brass,
            root=root,
        ),
        add_cylinder(
            "third_wheel",
            radius=0.00265,
            depth=0.00045,
            location=(0.0041, 0.001, -0.00215),
            material=brass,
            root=root,
        ),
        add_cylinder(
            "fourth_wheel",
            radius=0.0023,
            depth=0.00042,
            location=(0.0062, -0.003, -0.0025),
            material=brass,
            root=root,
        ),
        add_escape_wheel(
            location=(0.0042, -0.0066, -0.00282),
            material=brass,
            root=root,
        ),
        add_pallet_fork(
            location=(0.0009, -0.0068, -0.00292),
            material=steel,
            root=root,
        ),
        add_prism_parts(
            "entry_pallet_stone",
            outlines=[
                rectangle_outline(
                    center=(0.00166, 0.00057),
                    length=0.00055,
                    width=0.00023,
                    angle=math.radians(13),
                )
            ],
            depth=0.00038,
            location=(0.0009, -0.0068, -0.00292),
            material=accent,
            root=root,
        ),
        add_prism_parts(
            "exit_pallet_stone",
            outlines=[
                rectangle_outline(
                    center=(0.00166, -0.00057),
                    length=0.00055,
                    width=0.00023,
                    angle=math.radians(-13),
                )
            ],
            depth=0.00038,
            location=(0.0009, -0.0068, -0.00292),
            material=accent,
            root=root,
        ),
        add_torus(
            "balance_wheel",
            major_radius=0.00345,
            minor_radius=0.00032,
            location=(-0.0027, -0.0075, -0.00275),
            material=brass,
            root=root,
        ),
        add_hairspring(
            location=(-0.0027, -0.0075, -0.00275),
            material=steel,
            root=root,
        ),
        add_radial_prism(
            "impulse_jewel",
            outline=[
                (
                    0.00016 * math.cos(math.tau * index / 16) + 0.00058,
                    0.00016 * math.sin(math.tau * index / 16) + 0.00011,
                )
                for index in range(16)
            ],
            center=(0.00058, 0.00011),
            depth=0.00034,
            location=(-0.0027, -0.0075, -0.00275),
            material=accent,
            root=root,
            smooth=True,
        ),
    ]
    return tuple(parts)


def export_model(output_path: Path) -> None:
    """Export a GLB while preserving semantic node names and local pivots."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        export_yup=True,
        export_apply=False,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_materials="EXPORT",
    )


def main() -> None:
    """Build and export the tracer model."""
    output_path = parse_output_path()
    reset_scene()
    parts = create_watch()
    export_model(output_path)
    part_names = ", ".join(part.name for part in parts)
    print(f"Exported {output_path} with parts: {part_names}")


main()
