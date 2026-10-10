# VAJRA Provenance

Offline cryptographic document attribution research prototype for **SIH26237**, prepared for **Nextra**, team **HSC|TN|00303**, Tamil Nadu.

## What runs today

A dependency-free Node.js CLI encrypts a synthetic document once with AES-256-GCM, opens recipient-specific sessions using ML-KEM-768, embeds an invisible UTF-8 session watermark, signs release records with the recipient's ML-DSA-65 key, obtains three of four simulated validator signatures, and verifies an exact leaked copy against the ledger. All runtime operations work without internet access.

**Research prototype, not a defence-ready product.** The four replicas are local files under one coordinator. They demonstrate quorum certificates, not distributed Byzantine consensus or independent administration. The watermark survives exact UTF-8 copies only. It does not survive screenshot, print/scan, sanitization or format conversion. Device identity and authority are synthetic checks; MFA, hardware attestation, HSM protection and secure time are production integrations. The process reads demonstration recipient private keys to simulate recipient signing. A production server must never possess those keys.

## Setup

1. Install **Node.js 24.8 or newer with ML-KEM and ML-DSA support** on a connected staging computer. Tested using Node.js 24.19.0. Transfer the verified runtime and this repository to the disconnected machine. Verify software signatures and checksums before transfer. No npm install is required.
2. Extract the repository and open a terminal in its root.
3. Run `node --test` or `npm test`.
4. Run `node src/cli.mjs demo` or `npm run demo` using a fresh state directory.
5. Run `node src/cli.mjs verify`.

The demo creates `demo-output/alice-briefing.txt`, `bob-briefing.txt`, `evidence.json`, `trusted-keys.json` and `auditor-checkpoint.json`. The visible text is identical, while the two files contain different invisible session codes. Do not normalize or re-save the file before the exact-copy test.

### Manual workflow

```sh
node src/cli.mjs init
node src/cli.mjs distribute briefing sample-data/briefing.txt
node src/cli.mjs open briefing alice alice-device
node src/cli.mjs open briefing bob bob-device
node src/cli.mjs investigate demo-output/alice-briefing.txt demo-output/trusted-keys.json demo-output/auditor-checkpoint.json
node src/cli.mjs revoke alice
node src/cli.mjs verify
```

Use either the demo or the manual init workflow in one fresh state directory. Manual mode does not export trust/checkpoint automatically: for manual investigation omit the two optional arguments, or copy `state/trust.json` and `state/checkpoint.json` to an independently controlled auditor location after the relevant commit. Default local copies establish only local integrity, not independent trust.

### Environment variables

Copy `.env.example` to `.env` if desired, then use `node --env-file=.env src/cli.mjs demo`. Node does not automatically load `.env`.

| Variable | Default | Purpose |
|---|---|---|
| `VAJRA_STATE` | `./state` | Synthetic identities, encrypted documents, replicas, policy and checkpoint |
| `VAJRA_OUTPUT` | `./demo-output` | Recipient copies and investigation evidence |
| `VAJRA_OFFLINE_VALIDATORS` | empty | Comma-separated paused validator indices, e.g. `0,1` |

PowerShell example for a second demo: `$env:VAJRA_STATE='./state-second'; $env:VAJRA_OUTPUT='./demo-second'; node src/cli.mjs demo`.

Two paused validators prevent release. One paused validator is tolerated. Existing replicas must be reconciled to the trusted head before a production validator rejoins. The demo coordinator can copy its verified current chain into a rejoining logical replica on the next commit.

## Security model and proof limits

- Release requires policy checks, recipient signature and a committed quorum receipt.
- A subsequent signed acknowledgement shows the client completed its receive routine. Neither event proves that a human read the file.
- The recipient package is encrypted with a fresh ML-KEM envelope and bound to document, recipient, session and output hash through authenticated associated data.
- Exact-copy investigation validates pinned recipient/validator public keys, block hashes, quorum signatures, chain length/head and the watermarked output digest.
- A single altered replica is tolerated; two divergent replicas fail the integrity check. An attacker controlling all private keys and trusted checkpoint files can rewrite this local demonstration. Deploy independently administered nodes and auditor checkpoints to address that threat.
- Private keys are unencrypted local demonstration files. POSIX mode 0600 is best effort; configure NTFS ACLs explicitly on Windows. Never use real identities or classified material in this prototype.
- The broker decrypts the source before producing the session copy. Protect this boundary in a measured hardware enclave in production. Sending the original content key to an unrestricted recipient would allow an unwatermarked leak.
- Revocation controls future releases. It cannot erase previously exported copies or keys. Offline cached plaintext remains available to its holder.
- Timestamps are host-clock observations, not independently trusted global time. The chain proves order. Production needs a signed local time authority with uncertainty and anti-rollback controls.
- These are standardized algorithms, not a claim of FIPS-validated implementation or end-to-end quantum-safe deployment.

## Repository checklist

- [x] Complete executable prototype: `src/`
- [x] Setup and environment variables: this README and `.env.example`
- [x] Technical design, trust boundaries and diagrams: `docs/TECHNICAL_DESIGN.md`
- [x] Submission abstract and requested responses: `docs/SUBMISSION.md`
- [x] Synthetic sample data: `sample-data/briefing.txt`
- [x] Adversarial and functional test cases: `test/provenance.test.mjs`
- [x] MIT license: `LICENSE`
- [x] Demo walkthrough: `docs/DEMO.md`
- [ ] Remote GitHub/GitLab publication: intentionally deferred at the user's request

## Publishing later

Create an empty repository under your own account. From this directory:

```sh
git init
git add .
git commit -m "Add SIH26237 VAJRA provenance prototype"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

Do not commit `state`, demo output, private keys or real evidence. Generated data is ignored. Replace `YOUR_REPOSITORY_URL` with the actual repository URL. No hosted repository or video link is claimed in this submission.

## References

- Official SIH statement: https://sih.gov.in/sih2026PS (search SIH26237)
- ML-KEM: https://csrc.nist.gov/pubs/fips/203/final
- ML-DSA: https://csrc.nist.gov/pubs/fips/204/final
- Native Node crypto: https://nodejs.org/docs/latest-v24.x/api/crypto.html
- SDG 16: https://sdgs.un.org/goals/goal16

See `docs/TECHNICAL_DESIGN.md` for the production roadmap and watermark acceptance tests.
