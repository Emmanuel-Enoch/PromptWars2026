# MedLens — Clinical Evidence Intelligence

MedLens is a clinical information intelligence system that ingests unstructured laboratory reports and standardizes them into structured, verifiable data with complete source traceability.

## Core Architecture

MedLens follows a strict evidence-first pipeline:

**Source Report** → **Deterministic Local Parser** → **Structured Findings** → **Source-Only Range Evaluation** → **Provenance Tracking** → **Evidence Inspection** → **Human Verification** → **Audit Trail** → **Safe Summary** → **Report Comparison**

## Key Features

- **Source-Only Reference Ranges**: Reference ranges are evaluated strictly from source text; ranges not provided in the source are marked as `NOT_PROVIDED_IN_SOURCE` (never fabricated)
- **Complete Traceability**: Every finding is tied to its exact source snippet via `sourceSnippet`
- **Immutable Evidence**: Original extractions are preserved in `originalExtracted` even after human edits
- **Human Verification Workflow**: Verify, Edit, or Reject each result with mandatory audit reasons
- **Comprehensive Audit Trail**: All verification actions are logged with timestamps, actors, and reasons
- **Honest Provenance**: All extractions are labeled `LOCAL_EXTRACTED` (no AI washing)
- **Report Comparison**: Factual numerical comparison between multiple reports without clinical interpretation
- **Safe Patient Summary**: Non-diagnostic informational summary with "questions to ask your healthcare professional"

## Implementation Mapping

| Feature | Component |
|---------|-----------|
| Patient Intake | `PatientIntakeForm` |
| Report Processing | `deterministicParser` / `ReportIngestion` |
| Structured Results | `StructuredResultsTable` |
| Reference Range Evaluation | `referenceRangeEvaluator` |
| Provenance Tracking | `LabTestResult.provenance` |
| Evidence Inspection | `SourceInspectorModal` |
| Verification Actions | `VerificationActions` / `EditResultModal` / `RejectResultModal` |
| Audit Trail | `AuditTrailPanel` |
| Patient Summary | `PatientSummary` |
| Report Comparison | `ReportComparisonView` |
| Evidence Intelligence | `EvidenceIntelligencePanel` |
| Persistence | `storageService` |

## Clinical Safety Guarantees

✓ Reference ranges come ONLY from source reports
✓ Missing ranges are NEVER fabricated (`NOT_PROVIDED_IN_SOURCE`)
✓ Local extraction is honestly labeled (`LOCAL_EXTRACTED`)
✓ Source snippets remain tied to actual source text
✓ `originalExtracted` is immutable snapshot
✓ No diagnosis, treatment, or dosage recommendations
✓ Patient summaries are informational and non-diagnostic
✓ Comparison does not mutate original reports
✓ Unit mismatches prevent misleading numerical changes
✓ Division-by-zero cases are handled safely

## Testing

The project includes comprehensive automated verification tests:

```bash
npm test
```

**Current Status**: 194 / 194 verification assertions pass

The test suite covers:
- Report date metadata bug regression
- Provenance honesty (LOCAL_EXTRACTED labeling)
- Reference range evaluation (normal, high, low, missing)
- Source snippet preservation
- Human verification actions (verify, edit, reject, undo)
- LocalStorage persistence
- Multi-category reports
- Compound units (e.g., mL/min/1.73m²)
- User-provided report ingestion
- Report comparison with edge cases

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build
npm run build

# Run automated tests
npm test

# Preview production build
npm run preview
```

## Important Disclaimers

- This is a **demonstration** clinical intelligence system, not a production medical device
- Results are for **informational purposes only** and require verification by qualified healthcare professionals
- The system does **not** provide medical advice, diagnosis, or treatment recommendations
- Reference ranges shown are those documented exclusively in each source report
- Always discuss laboratory results with a qualified healthcare professional

## Technology Stack

- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS v4 for styling
- Lucide React for icons
- Local deterministic parser (no AI/LLM dependencies)

## Submission Details

**Hackathon**: PromptWars 2026
**Category**: Clinical Intelligence
**Version**: 2.0 (Phase 2)
**Status**: Production Ready (194/194 tests passing)
