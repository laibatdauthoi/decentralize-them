# AGENTS.md

## Project Overview

This project is called "decentralize them".

It is a fully decentralized music platform built on Aptos testnet.

Core architecture:

- Aptos Move smart contracts
- Wallet-based authentication
- No traditional database
- Shelby Protocol for music storage
- On-chain state for songs, Push, Love, ranking, rewards, Pull, and Claim

The platform is intentionally designed to minimize centralized infrastructure and keep critical state on-chain.

---

# Current Development Goal

The current priority is:

1. Responsive UI optimization
2. UI consistency
3. Frontend/on-chain synchronization review
4. Security and logic review
5. Minor bug fixing

The core product logic is mostly complete.

Do NOT rewrite the application architecture.

Do NOT redesign the product unless explicitly requested.

---

# Critical UI Rules

## Preserve Existing UI Text

- Do NOT change any existing UI text.
- Do NOT rewrite labels, headings, descriptions, button text, warnings, or user-facing copy.
- Do NOT translate existing UI text.
- Do NOT shorten or improve wording.
- Keep all existing text exactly as written.

Only adjust:

- spacing
- alignment
- typography scale
- responsive sizing
- flex/grid layout
- overflow handling
- mobile layout
- tablet layout
- desktop layout
- padding/margin
- visual hierarchy
- responsiveness

---

# Responsive Design Requirements

The UI must work properly on:

- small mobile devices (~360px width)
- standard mobile devices (~390px width)
- tablets (~768px width)
- laptops (~1024px width)
- desktop screens (1280px+)

Special attention:

- long song titles
- long wallet addresses
- ranking tables
- homepage top 20 layout
- profile song lists
- countdown timers
- Pull/Claim buttons
- loading states
- empty states
- error states
- modal overflow
- touch interactions

Avoid horizontal scrolling unless absolutely necessary.

---

# Code Language Rules

- All code comments must be written in English.
- All new variable names, function names, interfaces, and technical identifiers must use English.
- Do NOT introduce Vietnamese comments inside source code.
- Developer-facing documentation should use English.

UI text may remain Vietnamese.

---

# Smart Contract and Logic Rules

Do NOT change:

- Push logic
- Love logic
- Pull logic
- Claim logic
- reward distribution rules
- top 20 ranking rules
- top 5 winner calculation
- UTC daily rollover logic
- wallet ownership assumptions
- token economics
- APT payment assumptions

Do NOT modify public Move entry functions unless fixing a confirmed bug.

Do NOT introduce hidden admin controls.

Do NOT introduce centralized authority over rankings or rewards.

---

# Architecture Constraints

- No database
- No Supabase
- No Firebase
- No Prisma
- No PostgreSQL
- No Redis
- No centralized backend state

The frontend may read:

- Aptos on-chain state
- Shelby metadata

But the frontend must NEVER become the source of truth.

Critical platform state must remain on-chain.

---

# Security Review Priorities

When reviewing logic or contracts, focus on:

## Reward & Accounting

- incorrect reward distribution
- incorrect percentage calculations
- stuck funds
- rounding issues
- double claim
- double pull
- incorrect pool accounting

## Authorization

- self-love prevention
- unauthorized withdrawals
- unauthorized Push actions
- wallet spoofing assumptions

## Ranking Logic

- incorrect top 20 updates
- incorrect top 5 calculations
- race conditions near UTC rollover
- late Push edge cases
- inconsistent ranking state

## State Synchronization

- frontend and on-chain mismatch
- stale cached ranking data
- incorrect realtime updates
- inconsistent Shelby metadata handling

## Aptos / Move Safety

- resource safety
- missing ownership checks
- invalid state transitions
- unsafe assumptions around signer usage

---

# Performance & UX Expectations

Prefer:

- lightweight UI updates
- minimal rerenders
- efficient state updates
- clean loading behavior
- predictable mobile UX

Avoid:

- unnecessary animations
- heavy dependencies
- unnecessary abstraction
- large rewrites

---

# Workflow Expectations

Before making changes:

1. Read and understand the relevant files first.
2. Explain the proposed plan before editing.
3. Make small, reviewable diffs.
4. Preserve existing behavior.
5. Run relevant checks after changes.
6. Summarize changed files and risks.

Do NOT make large uncontrolled edits.

---

# Testing Expectations

After modifying code:

- run lint if available
- run build if available
- run tests if available
- run Move tests if contract files are modified

If a command fails:

- inspect project scripts first
- do NOT invent new tooling without approval

---

# Common Commands

Use existing project commands if available.

Possible commands:

- npm install
- npm run dev
- npm run build
- npm run lint
- npm run test
- aptos move test

Inspect package.json and Move.toml before changing scripts.

---

# Forbidden Actions

- Do NOT rewrite the entire frontend
- Do NOT replace the design system
- Do NOT introduce databases
- Do NOT migrate the stack
- Do NOT change UI copy
- Do NOT rename Push, Love, Pull, or Claim
- Do NOT add centralized ranking services
- Do NOT add hidden admin powers
- Do NOT change smart contract economics
- Do NOT replace Aptos architecture

---

# Future Compatibility

The architecture should remain compatible with future reactive or asynchronous blockchain execution systems similar to Rialo-style workflows.

Avoid tightly coupling business logic to centralized backend infrastructure.
