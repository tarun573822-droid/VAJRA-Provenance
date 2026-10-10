# Baseline verification results

Executed on 7 October 2026 using Node.js 24.19.0. All **15 tests passed** using `node --test`. The included demo generated two recipient copies and returned a cryptographically verified match for Alice's copy, with a signed acknowledgement and four ledger blocks.

| Test | Result |
|---|---|
| Native ML-KEM envelope roundtrip, wrong key and AAD rejection | Pass |
| Invisible UTF-8 session code roundtrip | Pass |
| Distinct sessions and correct recipient attribution | Pass |
| Unauthorized recipient and wrong device rejection | Pass |
| Revocation of future release | Pass |
| Authority expiry | Pass |
| No release without simulated quorum | Pass |
| Tolerance of one paused validator | Pass |
| Session replay rejection | Pass |
| Replica corruption detection | Pass |
| Truncation detection using a pinned checkpoint | Pass |
| Modified content and mark transplantation rejection | Pass |
| Modified recipient signature rejection | Pass |
| Wrong recipient and corrupted envelope rejection | Pass |
| Unsafe identifier and reserved character rejection | Pass |

These tests establish the behavior of the supplied baseline. They do not establish print/scan watermark robustness, production Byzantine consensus, physical leak attribution, trusted time, hardware device attestation, or defence certification.
