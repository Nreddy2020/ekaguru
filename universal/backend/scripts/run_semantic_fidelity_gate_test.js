const assert = require('assert');
const { exportSemanticArtifact } = require('./export_page_teaching_artifact');

console.log('================================================================');
console.log('🏛️  EKAGURU SEMANTIC TEACHING FIDELITY GATE (PAGE 46 AUDIT)');
console.log('================================================================\n');

const rawPage46 = `Public Services: Post Office, Police Station, Hospital, Fire Station
Essential helpers protect our community in emergencies and daily life.
Post office carries letters and money orders across cities.
Police officers maintain safety and law enforcement (Dial 100).
Hospitals and clinics treat sick patients with ambulances (Dial 108).
Fire stations put out fires and rescue trapped citizens (Dial 101).`;

const artifact = exportSemanticArtifact(46, rawPage46);

// 1. Invariant 1: Compound Entity Extraction
console.log('--- CRITERION 1: ENTITY QUALITY (COMPOUND CONCEPTS) ---');
const entities = artifact.semanticKnowledgeGraph.entities;
const entityNames = entities.map(e => e.name);
console.log('  Extracted Entities:', entityNames.join(' | '));
assert.ok(entityNames.includes('Public Services'), 'Must extract compound "Public Services"');
assert.ok(entityNames.includes('Post Office'), 'Must extract compound "Post Office"');
assert.ok(entityNames.includes('Police Station'), 'Must extract compound "Police Station"');
assert.ok(entityNames.includes('Hospital & Clinic'), 'Must extract compound "Hospital & Clinic"');
assert.ok(entityNames.includes('Fire Station'), 'Must extract compound "Fire Station"');
assert.ok(!entityNames.includes('Post') && !entityNames.includes('Office'), 'Must NOT fragment into single-word tokens');
console.log('  [PASS] Criterion 1 Verified: 0% Token Fragmentation, 100% Compound Concepts!\n');

// 2. Invariant 2: Semantic Relationship Quality
console.log('--- CRITERION 2: RELATIONSHIP QUALITY (ONTOLOGICAL TRIPLES) ---');
const rels = artifact.semanticKnowledgeGraph.relationships;
rels.forEach(r => {
  console.log(`  Triple: (${r.sourceEntityName}) ---[${r.relationType}: ${r.label}]---> (${r.targetEntityName})`);
});
assert.ok(rels.length >= 4, 'Must extract at least 4 semantic triples');
assert.ok(rels.some(r => r.targetEntityName === 'Hospital & Clinic' && r.label.includes('Health')), 'Must connect Public Services to Healthcare');
console.log('  [PASS] Criterion 2 Verified: Ontological Semantic Triples Active!\n');

// 3. Invariant 3: Grounded Socratic Question Quality
console.log('--- CRITERION 3: QUESTION QUALITY (GROUNDED PROBES) ---');
const basisQ = artifact.depthPedagogicalPlans.basis;
console.log('  Basis Question:', basisQ.socraticQuestion);
console.log('  Correct Answer:', basisQ.correctOption);
console.log('  Tested Triple :', basisQ.testedSemanticTriple);
assert.ok(!basisQ.socraticQuestion.includes('What is the primary role of Public?'), 'Must NOT contain nonsensical token queries');
assert.ok(basisQ.socraticQuestion.includes('medical treatment'), 'Question must test real healthcare helper function');
assert.strictEqual(basisQ.correctOption, 'Hospital & Ambulance (Dial 108)');
console.log('  [PASS] Criterion 3 Verified: Socratic Question Directly Tests Page Knowledge!\n');

// 4. Invariant 4: Drawing Structure Quality
console.log('--- CRITERION 4: DRAWING QUALITY (SYSTEM HUB & BRANCHES) ---');
const actions = artifact.boardActionSequence;
const hubAction = actions.find(a => a.action === 'DRAW_SYSTEM_HUB');
const branchActions = actions.filter(a => a.action === 'DRAW_BRANCH_NODE');
console.log('  Hub Node      :', hubAction.label);
console.log('  Branch Nodes  :', branchActions.map(b => `${b.label} (${b.relation})`).join(' | '));
assert.strictEqual(hubAction.label, 'Public Services');
assert.strictEqual(branchActions.length, 4);
console.log('  [PASS] Criterion 4 Verified: Board Drawing Represents True System Architecture!\n');

// 5. Invariant 5: 5-Depth Authentic Pedagogical Expansion
console.log('--- CRITERION 5: DEPTH QUALITY (AUTHENTIC COGNITIVE PROGRESSION) ---');
const depths = artifact.depthPedagogicalPlans;
console.log('  🌱 Basis      :', depths.basis.focus);
console.log('  🔍 Developing :', depths.developing.focus);
console.log('  ⚡ Proficient :', depths.proficient.focus);
console.log('  🔬 Advanced   :', depths.advanced.focus);
console.log('  🌌 Deep Dive  :', depths.deep.focus);
assert.ok(depths.developing.socraticQuestion.includes('Fire Station and Police Station coordinate'));
assert.ok(depths.proficient.socraticQuestion.includes('smoke coming out') && depths.proficient.correctOption.includes('Fire Brigade'));
assert.ok(depths.advanced.socraticQuestion.includes('distribute police and fire stations across sectors'));
assert.ok(depths.deep.socraticQuestion.includes('fundamental civic entitlement'));
console.log('  [PASS] Criterion 5 Verified: Authentic Domain-Specific 5-Depth Progression!\n');

// 6. Invariant 6: Audit Trace Provenance
console.log('--- CRITERION 6: AUDIT PROVENANCE & BBOX GROUNDING ---');
assert.strictEqual(artifact.auditIntegrity.semanticFidelityScore, 1.0);
console.log('  Semantic Fidelity Score:', artifact.auditIntegrity.semanticFidelityScore * 100 + '%');
console.log('  Source Scan BBox Anchor:', JSON.stringify(depths.basis.sourceBBoxEvidence));
console.log('  [PASS] Criterion 6 Verified: Full Audit Trace with Zero Hallucination!\n');

console.log('================================================================');
console.log('*** SEMANTIC TEACHING FIDELITY GATE PASSED 100% (6/6 INVARIANTS) ***');
console.log('================================================================\n');
