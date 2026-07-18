# Watch model assets

`watch-model.glb` is generated from the self-authored Blender script at
`tools/blender/generate-watch-model.py`. It contains no third-party geometry or
textures. See `PROVENANCE.md` for its reference and rights record.

Run `pnpm asset:watch` to regenerate and inspect the optimized asset. Set
`BLENDER_BIN` when Blender is not available on `PATH` or installed at the
standard macOS application path.

The Blender source uses real-world metres. Blender's glTF conversion exports the
dial in the XZ plane, with the face pointing along positive Y and twelve o'clock
along negative Z. The scene adapter owns the one-time rotation into TickyTocky's
XY watch-face plane. Every moving object is named for its watch-domain concept
and has its origin on its mechanical pivot.

The escapement slice is intentionally generic educational geometry rather than
an NH34-dimensional reproduction. It includes a self-authored 15-tooth escape
wheel, fork and separately identifiable pallet stones, plus a lightweight
hairspring and impulse jewel at the balance assembly.
