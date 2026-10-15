import { runDataIntegrityAndSyncTests } from './src/utils/dataIntegrityAndSync.test';
import { runNavigationAndAppShellTests } from './src/utils/navigationAndAppShell.test';

console.log('========================================================');
console.log('  NLU YOUTH 2026 — AUTOMATED TEST RUNNER (ALL SUITES)   ');
console.log('========================================================\n');

// Suite 1: Data Integrity & Deep Sync
console.log('--- [SUITE 1] Data Integrity & Firestore Deep Sync ---');
const syncResult = runDataIntegrityAndSyncTests();
syncResult.tests.forEach(t => {
  console.log(`${t.passed ? '✅ [PASS]' : '❌ [FAIL]'} ${t.name}`);
});
console.log(`-> Suite 1 Result: ${syncResult.passed}/${syncResult.total} passed.\n`);

// Suite 2: Navigation Architecture, RBAC & App Shell
console.log('--- [SUITE 2] Navigation Architecture, RBAC & App Shell ---');
const navResult = runNavigationAndAppShellTests();
navResult.tests.forEach(t => {
  console.log(`${t.passed ? '✅ [PASS]' : '❌ [FAIL]'} ${t.name}`);
});
console.log(`-> Suite 2 Result: ${navResult.passed}/${navResult.total} passed.\n`);

// Overall Summary
const totalTests = syncResult.total + navResult.total;
const totalPassed = syncResult.passed + navResult.passed;
const totalFailed = syncResult.failed + navResult.failed;

console.log('========================================================');
console.log(`OVERALL SUMMARY: ${totalPassed}/${totalTests} tests passed.`);
console.log('========================================================');

if (totalFailed > 0) {
  console.error(`\n❌ TEST SUITE FAILED: ${totalFailed} tests failed.`);
  process.exit(1);
} else {
  console.log('\n🎉 ALL AUTOMATED TESTS COMPLETED AND PASSED 100%!');
  process.exit(0);
}
