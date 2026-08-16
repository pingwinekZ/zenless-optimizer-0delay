struct Params {
  x0: f32,
  x1: f32,
  x2: f32,
  x3: f32,
  x4: f32,
  x5: f32,
  x6: f32,
  threshold: f32,
  permLimit: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
}

struct CompactEntry {
  index: u32,
  value: f32,
}
