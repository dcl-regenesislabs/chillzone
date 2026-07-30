# Spawn & Chill

Decentraland SDK7 scene deployed as the world **[chillzone.dcl.eth](https://play.decentraland.org/?realm=chillzone.dcl.eth)**. A hangout hub with portals that jump players into other experiences.

Built with the [Decentraland Creator Hub](https://decentraland.org/creator-hub/) (scene editor) plus hand-written TypeScript for behavior.

## Requirements

- Node.js >= 16 (CI uses 22.22.0 — see notes below)
- npm

## Getting started

```bash
npm install
npm run start
```

This opens the scene in the Decentraland preview at `http://localhost:8000`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run start` | Run the scene locally in preview mode |
| `npm run build` | Compile the scene |
| `npm run deploy` | Deploy interactively (prompts for target) |
| `npm run deploy:production` | Deploy straight to `chillzone.dcl.eth` on the Worlds production content server |
| `npm run server-logs` | Stream logs from the deployed World |
| `npm run upgrade-sdk` | Bump `@dcl/sdk` to latest |
| `npm run upgrade-sdk:next` | Bump `@dcl/sdk` to the `next` prerelease channel |

## Project structure

- `assets/scene/main.composite` — Creator Hub scene graph (entities, transforms, components) edited visually via the editor.
- `src/index.ts` — scene entry point (`main()`); wires up portals and pointer interactions on scene props (smartphone, laptop).
- `src/portals.ts` — portal destinations config (name, target realm, position, thumbnail).
- `src/portals-kit/` — self-contained portal system (vortex visuals, proximity door animation, walk-in trigger activation). See its own [README](src/portals-kit/README.md) for implementation details and tuning constants.
- `src/ui.tsx` — optional UI, currently unused (commented out in `index.ts`).
- `scene.json` — scene manifest: title, description, parcels, spawn points, and `worldConfiguration.name` (the World ENS, `chillzone.dcl.eth`).

## Portals

Portals are walk-in triggered (no click required): doors open when a player approaches, and the destination prompt fires once the player actually steps into the doorway. Current destinations (`src/portals.ts`):

- **Cozy Farm** → `cozyfarm.dcl.eth`
- **Flag Tag** → `flagtag.dcl.eth`

To add a destination, drop a thumbnail under `assets/images/` and add an entry to `DESTINATIONS` in `src/portals.ts`.

## Deployment

Deploys run via GitHub Actions ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)), triggered on:
- publishing a GitHub **release**, or
- manual `workflow_dispatch`

The workflow builds the scene and runs `npm run deploy:production`, which pushes to the Worlds production content server under `chillzone.dcl.eth`.

**Required secret:** `DCL_WORLDS_PRIVATE_KEY` — the private key of a wallet authorized to deploy to `chillzone.dcl.eth` (owner of the ENS name, or granted deployer permissions on it). Configure it under repo **Settings → Secrets and variables → Actions**.
