# Watch model provenance

## Current tracer

`watch-model.glb` is generated entirely by
`tools/blender/generate-watch-model.py`. No third-party meshes, textures,
photographs, logos, engravings, or diagram artwork are included.

The current model is an illustrative pipeline tracer. Its dimensions and forms
have not yet been validated against a physical NH34 movement and must not be
described as an exact 4R34 or NH34 reproduction.

The escape wheel teeth, pallet fork, pallet stones, hairspring, and impulse
jewel are independently authored, generic educational forms. They communicate
the relationships between escapement parts without claiming production
dimensions or reproducing third-party geometry or artwork.

The barrel, barrel arbor, mainspring, going-train wheels, and pinions are also
independently authored, generic educational forms. The illustrative wheel tooth
counts are 96, 80, 75, and 96 from barrel through fourth wheel; the pinion leaf
counts are 12, 10, 10, and 6 from center through escape pinion. Their simplified
profiles, spokes, proportions, and planar spring are original pipeline geometry,
not measurements or reproductions of an NH34 movement.

## Validated toolchain

- Blender 4.5.9 LTS
- glTF Transform 4.4.1 with Meshopt compression
- Optimized asset SHA-256: `2bb7814f6e6b4eae0f05b4f276baa925ecbcd403bad0ff63bc61cb1e19d85622`

Two consecutive builds with this toolchain produced the same bytes. Other
Blender patch versions may export different bytes and should be accepted only
after the semantic-node, build, and browser checks pass.

## Permitted modeling references

Future geometry may use factual dimensions, part names, and mechanical behavior
from these references:

- [TMI NH34 product page](https://www.timemodule.com/en/product_line_up/mechanical/mechanical/mechanical_NH0_NH3/?calibre=NH34)
- [TMI NH34 specification](https://www.timemodule.com/upload/category/23/spec_sheet/NH34_SS.pdf)
- [TMI NH34 technical guide](https://www.timemodule.com/upload/category/23/technical_guide/NH34_TG.pdf)
- [TMI NH34 parts list](https://www.timemodule.com/upload/category/23/parts_list/NH34_PL.pdf)
- [Seiko 4R34 operating manual](https://www.seikowatches.com/-/media/HtmlUploader/Common/Seiko/Home/instructions/html/SEIKO_4R34_EN/assets/pdf/NSY4R341_EN.pdf)
- [Watch and Clock Escapements](https://www.gutenberg.org/ebooks/17021), a public-domain construction reference
- [An Analysis of the Lever Escapement](https://www.gutenberg.org/ebooks/21978), a public-domain construction reference

TMI and Seiko documents are copyrighted reference material. Their diagrams,
photographs, and expressive artwork must not be embedded, traced, or
redistributed. Geometry must be independently authored from factual observations
and measurements.

## Planned physical validation

Before presenting the model as NH34-specific, validate visible geometry against
a legally acquired movement using original measurements and photographs. Record
the measured part, instrument, value, and date here as the model is refined.
