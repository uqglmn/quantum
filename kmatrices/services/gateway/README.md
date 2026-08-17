# Optional compute gateway

The first platform release is static and does not require this service. This
boundary will expose validated, versioned compute operations for dressing,
custom parameters, R-matrices, reflection-equation verification, spectra,
characteristic identities, and factorisation.

The browser must depend on a `ComputeProvider`, not on a Wolfram-specific API.
The gateway can therefore route initially to Wolfram Cloud and later to a
licensed kernel service or another symbolic backend. Requests will use bounded
rank/type enums and the restricted expression schema; arbitrary Wolfram source
will never be accepted.
