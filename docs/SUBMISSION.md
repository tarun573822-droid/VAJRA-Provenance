# VAJRA Provenance: submission responses

Team: **Nextra**. Team ID: **HSC|TN|00303**. State: **Tamil Nadu**.

Problem: **SIH26237 - Cryptographic Attribution and Immutable Decryption Provenance for Multi-Recipient Encrypted Document Distribution**. Ministry of Defence, Indian Navy (WESEE). Category: Software.

## 1. Abstract

VAJRA Provenance is an offline platform for accountable distribution of sensitive documents to multiple recipients. It encrypts the source document once and allows access through a controlled decryption and rendering service. Each authorized session produces an invisible forensic watermark unique to that recipient and session. The recipient signs a record containing the document version, session identifier, device evidence, authority and output digest using ML-DSA. A permissioned ledger records the signed evidence before the service releases the personalized copy, encrypted using an ML-KEM envelope. Investigators extract a watermark from a suspected leak and verify the associated signatures, ledger receipt and content evidence. The proposed deployment uses independently administered validators, local identity services, protected key storage and a trusted local time source inside an air-gapped network. The supplied executable prototype demonstrates post-quantum encryption, session attribution and audit verification on synthetic UTF-8 files. Robust PDF watermarking, hardware attestation and distributed consensus remain production milestones. The intended benefit is faster, more defensible investigation with fewer recipients treated as equally plausible suspects.

## 2. Theme

**Blockchain & Cybersecurity**. Focus: cryptographic attribution, post-quantum security and accountable document access. This matches the official SIH theme.

## 3. SDG alignment

Primary: **SDG 16 - Peace, Justice and Strong Institutions**, especially **target 16.6**, accountable and effective institutions. Verifiable evidence and separation of administrative powers support institutional accountability. This is a qualitative alignment, not a measured contribution to a UN indicator. It does not require publishing classified records publicly.

## 4. Problem in our context, people affected and key gaps

In a naval or defence office, one operational briefing may reach several cleared officers and approved departments. Conventional encryption protects the file in transit but gives every recipient identical plaintext. If that plaintext appears outside the authorized environment, investigators cannot reliably distinguish the originating decryption session.

Affected stakeholders include document owners, naval officers, security administrators, forensic investigators, auditors and personnel whose legitimate access could otherwise create unjustified suspicion.

Key gaps are identical decrypted copies, editable administrator logs, static watermarks shared across recipients, access records that do not prove decryption, weak links between device/authority and document access, classical key exchange and signatures, and dependence on connected cloud services. Screenshotting, watermark removal and collusion add further challenges. An air-gapped network also needs its own time, identity, update and incident-response services.

## 5. Approach, stack, features, outcomes and impact

### Approach

1. Enroll recipient signing/encryption keys through a local certificate authority. Verify identity, clearance and an approved device. Keep recipient signing keys on their own hardware token.
2. Encrypt the document once using AES-256-GCM. Keep the original document key inside the decryption service's protected boundary.
3. Validate MFA, current policy, clearance, purpose, device attestation and authority expiry at access time. Create a fresh challenge and session identifier.
4. Decrypt inside a controlled renderer. Insert a unique invisible watermark into the session output and calculate its digest.
5. Have the recipient sign a canonical record using ML-DSA-65. Bind identity, session, document version, output digest, authority, device evidence and observed time.
6. Commit the receipt to independently administered permissioned validators before exposing the personalized output. Release a session envelope using ML-KEM-768 and AES-256-GCM.
7. Record the client's acknowledgement separately. Preserve ambiguous states, such as a release without acknowledgement, instead of asserting a completed human read.
8. Extract a watermark from a leak, query its session, verify signatures and ledger evidence, and provide an evidence report with explicit confidence and limitations.

### Tech stack

**Implemented:** Node.js 24.8+, native OpenSSL-backed ML-KEM-768 and ML-DSA-65, AES-256-GCM, HKDF-SHA256, SHA-256, a UTF-8 watermark module, JSON quorum ledger simulation and Node's test runner. No external packages, internet or cloud service are required at runtime.

**Production proposal:** hardened local gateway and viewer, locally deployed identity/MFA service, OPA-style policy evaluation, TPM-backed device evidence, local HSM/secure enclave, encrypted object storage, and permissioned BFT consensus with PQ-aware application certificates. An existing framework such as Hyperledger Besu QBFT needs explicit integration work for PQ application signatures and its classical node/network cryptography. Default blockchain configurations are not claimed to satisfy end-to-end PQ requirements. Use local authenticated time and an independently held auditor checkpoint.

### Key features

Per-session personalization, recipient-owned signing, ledger-gated output release, authenticated recipient envelopes, revocation of future access, policy/version binding, signed release and acknowledgement states, local evidence verification and fully offline operation. Production extends the watermark to redundant spatial PDF/image channels with error correction and collusion analysis.

### Expected outcomes and intended impact

The desired outcome is a defensible match between a recovered issued copy and its recorded recipient session. This can narrow investigations, reduce reliance on editable logs and discourage unauthorized redistribution. Planned evaluation measures include tamper detection, denied-access correctness, extraction accuracy, false attribution rate, ledger outage behavior and access latency. Performance targets are hypotheses to validate on representative defence hardware, not measured results. No cryptographic mechanism alone proves who physically leaked a file or prevents all copying after legitimate access.

## 6. Source code and checklist

GitHub/GitLab publication is deferred at the user's request. The complete local open-source prototype accompanies the presentation in `VAJRA-Provenance.zip` and an editable source folder. It includes setup instructions, environment variables, architectural and sequence diagrams, synthetic sample data, functional/security test cases and an MIT license. A genuine remote URL can be added after publication under the team's account. A demo recording has not been supplied; `docs/DEMO.md` provides a recording walkthrough.

## Sources

- Official requirements and theme: https://sih.gov.in/sih2026PS
- NIST ML-KEM: https://csrc.nist.gov/pubs/fips/203/final
- NIST ML-DSA: https://csrc.nist.gov/pubs/fips/204/final
- SDG 16 / target 16.6: https://sdgs.un.org/goals/goal16

The implementation and VAJRA architecture are proposed by this submission. No claim of prior deployment, certification, independently proven novelty or measured institutional impact is made.
