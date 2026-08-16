/* INJECT SETTINGS */

@group(0) @binding(0) var<uniform> params : Params;

/* INJECT COORDS */

@group(2) @binding(1) var<storage, read_write> compactCount : atomic<u32>;
@group(2) @binding(2) var<storage, read_write> compactResults : array<CompactEntry>;
@group(2) @binding(3) var<storage, read_write> validCount : atomic<u32>;

@compute @workgroup_size(WORKGROUP_SIZE)
fn main(
  @builtin(workgroup_id) workgroup_id : vec3<u32>,
  @builtin(local_invocation_index) local_invocation_id : u32,
  @builtin(num_workgroups) num_workgroups : vec3<u32>,
) {
  let workgroup_index = workgroup_id.x + workgroup_id.y * num_workgroups.x + workgroup_id.z * num_workgroups.x * num_workgroups.y;
  let indexGlobal = workgroup_index * WORKGROUP_SIZE + local_invocation_id;

  let cycleIndex = indexGlobal * CYCLES_PER_INVOCATION;

  /* INJECT PRELUDE */

  var i: u32 = 0u;
  var localValidCount: u32 = 0u;

  /* INJECT INDEX DECODE */

  /* INJECT READ BASE */

  loop {
    if (i >= CYCLES_PER_INVOCATION || cycleIndex + i >= params.permLimit) {
      break;
    }

    /* INJECT EVAL CONSTRAINTS */

    /* INJECT FILTER CONSTRAINTS */

    /* INJECT EVAL OBJECTIVE */

    /* INJECT FILTER */

    continuing {
      i += 1u;

      /* INJECT INDEX CARRY */
    }
  }

  if (localValidCount > 0u) {
    atomicAdd(&validCount, localValidCount);
  }
}
