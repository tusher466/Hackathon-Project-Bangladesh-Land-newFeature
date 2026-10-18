# BhumiSutra (ভূমিসূত্র) — Bangladesh Historical Land Record Lineage Platform

> **Bangladesh Digital Land Records & Cadastral Lineage Platform**  
> **Rule Version:** v1.4-bd-historical-cadastral  
> **Status:** Production-Ready Verification Platform with Cadastral Vector Maps & PDF Dossier Export

---

## 1. Executive Summary

**BhumiSutra (ভূমিসূত্র)** is an investigative decision-support platform designed to trace and explain historical land parcel relationships across different survey periods in Bangladesh:
- **CS** (Cadastral Survey, 1888–1940)
- **SA** (State Acquisition Survey, 1956–1962)
- **RS** (Revisional Survey, 1965–1990)
- **BS / City Survey** (Bangladesh Survey, 1998–Present)

Over these survey transitions, land parcels were subdivided (faraiz partition), consolidated (amalgamation), renumbered, or subjected to area adjustments and boundary erosion. BhumiSutra replaces manual guess-work and opaque assumptions with a **transparent, rule-based cross-survey matching engine** that surfaces positive corroborations, highlights discrepancies, flags missing evidence, and supports human settlement officer reviews.

> **Responsible Civic Governance Notice:**  
> BhumiSutra is an investigative support workbench, **not a legal authority**. It does not automatically certify ownership, establish conclusive title, or declare fraud. All synthetic records are clearly labelled.

---

## 2. Core Features

1. **Live Database Status & Metrics:** Dynamic calculations from current dataset (Parcels, Links, Subdivisions, Consolidations, Discrepancies, and Verified Cases).
2. **Bangladesh Location Explorer:** Hierarchical navigation (Division → District → Upazila → Mouza → Parcel) featuring an interactive schematic SVG cadastral sheet and parcel table.
3. **Multi-Survey Parcel Search:** Supports Bengali numerals (`০-৯`) and English digits (`0-9`), strip formatting, khatian index queries, and area range filters.
4. **Chronological Lineage Graph:** 4-tier visual graph (CS → SA → RS → BS) with directional Bézier curves, subdivision/consolidation branches, discrepancy indicators, zoom/pan controls, and interactive Node/Edge inspectors.
5. **Cross-Survey Matching Engine:** Configurable evidence evaluation across:
   - Archival Cross-References (35%)
   - Cadastral Spatial Overlap & Centroid offset (30%)
   - Area Consistency & Delta variance (20%)
   - Administrative Jurisdiction & Sheet consistency (15%)
6. **Side-by-Side Record Comparator:** Compare 2 or 3 records, calculate exact mathematical area shifts (`|Area_B - Area_A|`), and review hypotheses (subdivision, road widening, surveying margin, or encroachment).
7. **Printable Evidence Dossier (Case Report):** Official dossier format with unique Case ID (e.g. `BHM-2026-BD38-CS104`), QR validation stamp, lineage tree, supporting/contradictory audit, and printable stylesheet.
8. **Human Review & Verification Workflow:** Record formal settlement officer decisions (`Supported`, `Needs Evidence`, `Under Review`, `Rejected`, `Unresolved`) with audit trail logging.

---

## 3. System Architecture

```
[ Client Presentation Layer (React 19 + Tailwind CSS v4 + Lucide Icons) ]
                               │
                               ▼
[ Core Analytical Services ]
  ├── normalizer.ts      (Bengali/English digits, prefixes, land unit conversions)
  ├── spatialEngine.ts   (Polygon bounding box IoU & Centroid offset)
  ├── matchingEngine.ts  (Multi-tier rule scoring, contradiction & gap analysis)
  └── storage.ts         (Normalized database state, review queue, RFC audit trail)
                               │
                               ▼
[ Synthetic Cadastral Dataset (38 records across CS, SA, RS, BS) ]
  ├── Mouza Badda (JL No. 38)     - Multi-gen subdivision, consolidation, area variance
  ├── Mouza Tejgaon (JL No. 12)   - Physically decayed cadastral maps (missing geometry)
  └── Mouza Savar (JL No. 45)     - Fractional Batta dags (বাট্টা দাগ ২৯০/১)
```

---

## 4. Land Unit Normalization Standard

Standard revenue definitions applied in Bangladesh:
- `1 Decimal (শতক / শতাংশ)` = 435.6 sq ft = 40.4686 sq meters
- `1 Acre (একর)` = 100 Decimal
- `1 Standard Bigha (বিঘা)` = 33 Decimal (20 Kathas)
- `1 Standard Katha (কাঠা)` = 1.65 Decimal (720 sq ft)

---

## 5. Automated Test Suite

Automated tests are written with Vitest covering all core business logic:
- Exact cross-reference with consistent metadata
- Dag renumbering across surveys with area consistency
- One-to-many candidate relationships (subdivision detection)
- Many-to-one candidate relationships (consolidation detection)
- Area discrepancy detection & hypothesis generation
- Anti-hallucination guardrail (ensuring missing geometry does NOT increase score)
- Mismatched administrative jurisdiction rejection
- Isolated parcels (river diluvion / shikosti)
- Bengali and English digit normalization
- Persistence of reviewer decisions and audit events

To run the test suite:
```bash
npm test
```

---

## 6. Curated Demonstration Scenarios

For Hackathon evaluators, one-click launcher buttons on the Dashboard provide direct access to key test cases:
1. **Scenario 1 — Multi-Gen Subdivision:** CS Dag 104 (50 dec) → SA 204 → Subdivided into RS 410 (28.5 dec) & RS 411 (21.5 dec) → BS 1205 (with minor road widening deduction).
2. **Scenario 2 — Consolidation (Amalgamation):** CS Dags 108 (18 dec) & 109 (22 dec) amalgamating into SA Dag 250 (40 dec).
3. **Scenario 3 — 12-Decimal Discrepancy:** SA Dag 340 (60 dec) vs RS Dag 720 (48 dec), generating review flags and area variance calculation.
4. **Scenario 4 — Damaged Cadastral Map:** Tejgaon CS 50 & SA 110 where sheets are missing. Shows scoring strictly from ledger records without hallucinating spatial match.
5. **Scenario 5 — Fractional Batta Dag:** Savar RS Dag 290/1 (২৯০/১) partition.
6. **Scenario 6 — Diluvion (River Erosion):** Isolated CS Dag 199 with no later survey continuity.

---

## 7. Technology Stack & Licences

- **Frontend:** React 19, TypeScript 5.8
- **Styling:** Tailwind CSS v4
- **Testing:** Vitest
- **Build Tool:** Vite 6
- **Icons:** Lucide React
- **Licence:** Apache-2.0
