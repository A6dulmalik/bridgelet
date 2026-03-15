# Bridgelet Testing Documentation

This document provides comprehensive testing guidelines for the Bridgelet SDK integration, covering testing strategies, test categories, and best practices for contributors.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Categories](#test-categories)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [End-to-End (E2E) Tests](#end-to-end-e2e-tests)
6. [Manual Testing](#manual-testing)
7. [Testing Against Live Testnet](#testing-against-live-testnet)
8. [Testing with Mock Data](#testing-with-mock-data)
9. [Test Data Requirements](#test-data-requirements)
10. [Release Testing Checklist](#release-testing-checklist)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Contributing Tests](#contributing-tests)

## Testing Philosophy

The Bridgelet testing strategy is built on multiple layers of validation to ensure reliability, security, and correctness of the ephemeral account system. Our approach emphasizes:

- **Security First:** All financial interactions are thoroughly tested to prevent vulnerabilities
- **Deterministic Testing:** Tests should be reproducible and not dependent on external state
- **Clear Boundaries:** Each test category has a specific scope and responsibility
- **Coverage Goals:** Aim for >80% code coverage on critical paths (SDK, smart contracts)
- **Representative Data:** Test data should reflect real-world usage patterns

## Test Categories

Bridgelet employs a multi-tiered testing strategy:

```
┌─────────────────────────────────────────────────────────────┐
│                    End-to-End Tests (E2E)                   │
│              Full user flows across all systems              │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│             Integration Tests (SDK + Blockchain)             │
│         Tests SDK with real/mock Stellar interactions        │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│                    Unit Tests (Isolated)                     │
│         Individual functions, methods, and components        │
└─────────────────────────────────────────────────────────────┘
```

### Unit Tests (SDK Repository)

**Scope:** Individual functions and methods in isolation

**Location:** `bridgelet-sdk/src/**/*.spec.ts`

**Coverage Areas:**

- Account creation logic
- Payment processing
- Claim validation
- Cryptographic operations
- Data validation and sanitization
- Error handling paths

**Tools & Frameworks:**

- Jest for test runner
- TypeScript for type safety
- Mocking libraries (ts-mockito, jest.mock)

**Example Test Structure:**

```typescript
describe("AccountService", () => {
  describe("createEphemeralAccount", () => {
    it("should generate a valid Stellar keypair", () => {
      // Test keypair generation
    });

    it("should reject invalid configuration", () => {
      // Test input validation
    });

    it("should handle cryptographic errors gracefully", () => {
      // Test error handling
    });
  });
});
```

### Integration Tests (SDK + Blockchain)

**Scope:** SDK interactions with Stellar blockchain (testnet)

**Location:** `bridgelet-sdk/tests/integration/**`

**Coverage Areas:**

- Account creation on testnet
- Smart contract interactions
- Payment submission and validation
- Fund sweeping operations
- Testnet state transitions
- Transaction confirmation

**Setup Requirements:**

- Testnet node access
- Test account funding
- Smart contract deployment
- Environment variables for testnet RPC

### End-to-End Tests (E2E)

**Scope:** Complete user workflows from claim to fund sweep

**Location:** `bridgelet-sdk/tests/e2e/**`

**Coverage Areas:**

- Full payment initialization workflow
- Account claiming process
- Fund distribution and sweep
- Expiration and recovery flows
- Multi-recipient scenarios
- Edge cases and error recovery

**Environment:**

- Testnet for blockchain operations
- Test database with clean state
- Mock payment processor (optional)

### Manual Testing

**Scope:** User acceptance testing and exploratory testing

**When to Use:**

- Before release candidate creation
- Testing new features requiring user interaction
- Exploratory testing for edge cases
- UI/UX validation
- Manual security review

**Manual Test Scenarios:**

- Account creation and ownership verification
- Claim flow with various wallet types
- Payment settlement timing
- Fund recovery after expiration
- Error message clarity

## Unit Tests

### Writing Unit Tests

1. **Use descriptive names:**

   ```typescript
   it("should return 404 when account does not exist", () => {
     // Implementation
   });
   ```

2. **Follow AAA Pattern (Arrange, Act, Assert):**

   ```typescript
   it("should calculate sweep amount correctly", () => {
     // Arrange
     const balance = 1000;
     const fee = 0.01;

     // Act
     const sweepAmount = calculateSweepAmount(balance, fee);

     // Assert
     expect(sweepAmount).toBe(999.99);
   });
   ```

3. **Mock external dependencies:**
   ```typescript
   it("should log account creation", () => {
     // Mock the logger
     const loggerSpy = jest.spyOn(logger, "info");

     createAccount();

     expect(loggerSpy).toHaveBeenCalledWith("Account created");
   });
   ```

### Running Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- AccountService.spec.ts

# Run with coverage report
npm test -- --coverage
```

## Integration Tests

### Setting Up Integration Tests

/// To be updated later

### Integration Test Patterns

/// Not enough information

## End-to-End (E2E) Tests

### E2E Test Environment

E2E tests require a complete environment:

```
┌──────────────────────────────────┐
│  Test Client / Web Driver        │ (Puppeteer/Playwright)
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│      Backend SDK (Test Mode)     │ (NestJS on :3001)
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│    Stellar Testnet Blockchain    │
└──────────────────────────────────┘
```

### Running E2E Tests

```bash
# Start the backend in test mode
npm run start:test

# In another terminal, run E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- claim-flow.spec.ts
```

## Testing Against Live Testnet

### Prerequisites

1. **Testnet Account Setup:**

   ```bash
   # Fund a testnet account using friendbot
   curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
   ```

2. **Environment Configuration:**

   ```bash
   # .env.testnet
   STELLAR_NETWORK=testnet
   STELLAR_RPC_URL=https://soroban-testnet.stellar.org
   STELLAR_ACCOUNT_SECRET=SBBB...
   TESTNET_FUNDING_AMOUNT=1000
   ```

3. **Smart Contract Deployment:**
   ```bash
   # Deploy contracts to testnet (from bridgelet-core)
   ./scripts/deploy-testnet.sh
   ```

### Testnet Testing Strategy

**Phase 1: Smoke Tests**

- Quick validation that basic operations work
- Account creation
- Simple fund transfers

**Phase 2: Functional Tests**

- Complete workflow tests
- Multiple payment scenarios
- Expiration handling

**Phase 3: Load Tests** (optional)

- Multiple concurrent transactions
- Performance baseline establishment

## Additional Resources

- [Bridgelet SDK Repository](https://github.com/bridgelet-org/bridgelet-sdk) - Test examples
- [Stellar Testing Documentation](https://developers.stellar.org/learn/fundamentals/stellar-ubiquitous-platform)
- [Jest Documentation](https://jestjs.io/)
- [Soroban Testing Guide](https://soroban.stellar.org/docs/learn/testing)

## Getting Help

- **Test Issues:** Create an issue with `[test]` label
- **Questions:** Post in Discussions
- **Security:** See [SECURITY.md](./SECURITY.md) for responsible disclosure

---

**Last Updated:** February 2026
**Maintained By:** Bridgelet Core Team
