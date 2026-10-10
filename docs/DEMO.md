# Demo walkthrough

No demo video has been recorded. Use these steps for a 2-3 minute recording on synthetic data.

1. Show the team name, SIH26237 and the README's prototype scope.
2. Run `node --test` and show the test result.
3. In a fresh state directory run `node src/cli.mjs demo`. Explain that Alice and Bob receive different sessions of the same visible briefing.
4. Open the two UTF-8 copies in an editor that does not display control characters. Show matching visible text. Do not save or normalize the copies.
5. Run `node src/cli.mjs investigate demo-output/alice-briefing.txt demo-output/trusted-keys.json demo-output/auditor-checkpoint.json`. Show Alice's session, authority, signature certificate and acknowledged state.
6. Run `node src/cli.mjs open briefing mallory mallory-device` to show denied access.
7. Pause validators in PowerShell: `$env:VAJRA_OFFLINE_VALIDATORS='0,1'`, then run `node src/cli.mjs open briefing alice alice-device`. Show blocked release. Clear the setting with `Remove-Item Env:VAJRA_OFFLINE_VALIDATORS`.
8. Explain that the ledger is a local simulation and that the baseline watermark fails if zero-width marks are removed. Robust PDF watermarking and independent validators are the next engineering milestones.

Do not show real secrets, use fake performance numbers, or describe the prototype as certified.
