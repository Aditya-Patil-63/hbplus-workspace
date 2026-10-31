import { isAllowedEmail, ALLOWED_DOMAIN } from './domainValidation';

interface TestCase {
  description: string;
  input: string | null | undefined;
  expected: boolean;
}

const testCases: TestCase[] = [
  // Valid cases
  {
    description: 'Exact match with valid email',
    input: 'employee@hbplus.fit',
    expected: true,
  },
  {
    description: 'Trim and case-insensitivity check',
    input: '  Employee.Name@HBPlus.FIT  ',
    expected: true,
  },
  {
    description: 'Tag / plus addressing in username',
    input: 'employee+dev@hbplus.fit',
    expected: true,
  },

  // Invalid cases specified in prompt
  {
    description: 'Reject subdomain evil suffix (hbplus.fit.evil.com)',
    input: 'user@hbplus.fit.evil.com',
    expected: false,
  },
  {
    description: 'Reject prefix attack (evilhbplus.fit)',
    input: 'user@evilhbplus.fit',
    expected: false,
  },
  {
    description: 'Reject unauthorized subdomain (sub.hbplus.fit)',
    input: 'user@sub.hbplus.fit',
    expected: false,
  },
  {
    description: 'Reject multiple @ symbols (a@b@hbplus.fit)',
    input: 'a@b@hbplus.fit',
    expected: false,
  },
  {
    description: 'Reject empty string',
    input: '',
    expected: false,
  },
  {
    description: 'Reject null',
    input: null,
    expected: false,
  },
  {
    description: 'Reject undefined',
    input: undefined,
    expected: false,
  },
  {
    description: 'Reject whitespace-only',
    input: '   ',
    expected: false,
  },
  {
    description: 'Reject missing username (@hbplus.fit)',
    input: '@hbplus.fit',
    expected: false,
  },
  {
    description: 'Reject missing domain (user@)',
    input: 'user@',
    expected: false,
  },
  {
    description: 'Reject standard non-whitelisted domain (user@gmail.com)',
    input: 'user@gmail.com',
    expected: false,
  },
];

console.log(`Running domainValidation tests against ALLOWED_DOMAIN = "${ALLOWED_DOMAIN}"...\n`);

let passed = 0;
let failed = 0;

for (const { description, input, expected } of testCases) {
  const result = isAllowedEmail(input);
  if (result === expected) {
    console.log(`  ✓ PASS: ${description} (input: ${JSON.stringify(input)}) -> ${result}`);
    passed++;
  } else {
    console.error(
      `  ✗ FAIL: ${description} (input: ${JSON.stringify(input)}): expected ${expected}, got ${result}`
    );
    failed++;
  }
}

console.log(`\nTest results: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All domain validation tests passed successfully!');
  process.exit(0);
}

