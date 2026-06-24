# Vendored Lore gRPC bindings

These `.rs` files are **generated tonic/prost bindings copied verbatim** from
Epic Games' `lore-proto` crate (`lore-proto/src/grpc/`, MIT-licensed), which
ships pregenerated sources alongside its `.proto` definitions.

They are vendored here — rather than depending on the `lore-proto` crate — so
LoreHub builds without `protoc` and without `lore-proto`'s transitive
`lore-base` native (C/rpmalloc) toolchain.

Only the four self-contained modules LoreHub needs are vendored; they reference
one another solely through `crate::lore::model`:

| File | Package | Used for |
| --- | --- | --- |
| `lore.model.v1.rs` | `lore.model.v1` | shared types (`RevisionIdentifier`, `Branch`, `Address`, …) |
| `lore.repository.v1.rs` | `lore.repository.v1` | `RepositoryService` — provision / get |
| `lore.revision.v1.rs` | `lore.revision.v1` | `RevisionService` — branch & revision lists |
| `lore.thin_client.v1.rs` | `lore.thin_client.v1` | `ThinClientService` — tree / revision info / diff |

The module tree is reconstructed in `../lib.rs` (`pub mod lore { … }`) so the
`crate::lore::*` paths in the generated code resolve.

## Regenerating

When the proto contract changes, re-copy the four files from a matching
`lore-proto` checkout:

```sh
for f in lore.model.v1 lore.revision.v1 lore.repository.v1 lore.thin_client.v1; do
  cp "$LORE/lore-proto/src/grpc/$f.rs" "packages/lore-client/src/proto/$f.rs"
done
```

Keep `tonic` / `prost` in `Cargo.toml` aligned with the versions `lore-proto`
generated against (currently tonic 0.14, prost 0.14).
