# Cart Functionality Tests

This directory contains comprehensive tests for the cart functionality to prevent scroll-locking bugs and ensure proper cart behavior.

## Test Structure

### E2E Tests (`tests/e2e/`)
End-to-end tests using Playwright that test the cart functionality in a real browser environment.

**`cart-interaction.spec.ts`** - Tests critical cart interactions:
- Cart button opens cart after navigating from checkout
- Multiple cart open/close cycles work correctly
- Cart closes with Escape key and unlocks scroll
- Cart closes when clicking backdrop and unlocks scroll
- Body overflow is properly managed throughout navigation

### Unit Tests (`tests/unit/`)
Component-level tests using Vitest and React Testing Library.

**`CartSlide.test.tsx`** - Tests CartSlide component:
- Scroll locks when cart opens
- Scroll unlocks when cart closes
- Scroll unlocks when component unmounts while open
- Cart renders/hides based on isOpen prop
- Cart content displays correctly

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run Unit Tests
```bash
# Run all unit tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Run E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npm run test:e2e -- cart-interaction.spec.ts

# Run in headed mode (see browser)
npm run test:e2e -- --headed
```

### Run Smoke Tests
```bash
npm run test:smoke
```

## Test Coverage

These tests specifically cover the bug where:
1. User adds item to cart (cart opens, scroll locks)
2. User proceeds to checkout (cart closes, but scroll remained locked)
3. User navigates back
4. Cart button becomes unresponsive

The tests verify that:
- Scroll lock is always released when cart closes
- Cart button remains responsive after navigation
- Multiple open/close cycles work correctly
- All close methods (button, Escape, backdrop) properly unlock scroll
- Component cleanup releases scroll lock

## CI/CD Integration

The E2E tests are configured to run automatically in CI environments:
- Retries failed tests up to 2 times in CI
- Runs in single worker mode in CI for stability
- Automatically starts Django server before running tests
- Generates HTML reports for test results

## Debugging Failed Tests

### For E2E Tests:
```bash
# Run with trace on
npm run test:e2e -- --trace on

# Open last test report
npx playwright show-report

# Run in debug mode
npm run test:e2e -- --debug
```

### For Unit Tests:
```bash
# Run specific test
npm test -- CartSlide.test.tsx

# Run in debug mode
npm test -- --inspect-brk
```

## Test Files Created

1. `tests/e2e/cart-interaction.spec.ts` - E2E cart interaction tests
2. `tests/unit/CartSlide.test.tsx` - CartSlide component unit tests
3. `tests/setup.ts` - Test setup configuration
4. `playwright.config.ts` - Playwright configuration
5. `vitest.config.ts` - Vitest configuration

## Key Testing Patterns

### E2E Tests
- Wait for network idle before interactions
- Verify DOM state changes (overflow property)
- Test user flows end-to-end
- Validate accessibility (ARIA labels)

### Unit Tests
- Test component in isolation with providers
- Verify scroll lock context integration
- Test cleanup in unmount scenarios
- Use waitFor for async state changes

## Dependencies

- `@playwright/test` - E2E testing framework
- `vitest` - Unit test runner
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Jest DOM matchers
- `jsdom` - DOM implementation for Node.js
