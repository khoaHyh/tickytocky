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
        add_cylinder(
            "escape_wheel",
            radius=0.0018,
            depth=0.00036,
            location=(0.0042, -0.0066, -0.00282),
            material=brass,
            root=root,
            vertices=30,
        ),
        add_hand(
            "pallet_fork",
            length=0.0031,
            width=0.00058,
            depth=0.00032,
            location=(0.0009, -0.0068, -0.00292),
            angle=math.radians(-32),
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
