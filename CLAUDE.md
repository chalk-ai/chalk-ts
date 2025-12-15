# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the TypeScript client library for Chalk (`@chalk-ai/client`), providing both HTTP and gRPC client implementations for interfacing with Chalk's feature store and machine learning infrastructure. The library is published as an npm package and provides type-safe access to Chalk's online query APIs.

## Development Commands

### Build and Test
```bash
# Build the project (TypeScript compilation)
yarn build

# Run unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run integration tests (requires Chalk credentials)
yarn test:integration

# Run integration tests in watch mode
yarn test:integration:watch
```

### Running a Single Test
```bash
# Run a specific test file
yarn test src/__test__/client.test.ts

# Run tests matching a pattern
yarn test -t "pattern"
```

### Pre-build Process
The `prebuild` script automatically generates `src/_version.ts` from `package.json` version before building.

### Package Preparation
```bash
# Prepare for publishing (clean build, no test files)
yarn prepack
```

## Architecture

### Client Implementations

The library provides two client implementations:

1. **ChalkGRPCClient** (`src/_client_grpc.ts`): Recommended gRPC-based client
   - Uses `@grpc/grpc-js` for high-performance communication
   - Connects directly to Chalk's gRPC Query Server
   - Supports: `query()`, `queryBulk()`, `multiQuery()`
   - Authentication via JWT with proactive refresh (60 seconds before expiry)

2. **ChalkClient** (`src/_client_http.ts`): Legacy HTTP client
   - REST API-based implementation
   - Supports all operations: `query()`, `queryBulk()`, `multiQuery()`, `whoami()`, `triggerResolverRun()`, `uploadSingle()`, `getRunStatus()`
   - Uses Feather/Apache Arrow format for bulk queries

### Key Components

#### Services Layer (`src/_services/`)
- **`_credentials.ts`**: Manages OAuth2 client credentials flow with automatic refresh
  - Proactively refreshes tokens 60 seconds before expiry
  - Caches credentials and environment metadata
- **`_grpc.ts`**: gRPC service wrapper with promisified calls
- **`_http.ts`**: HTTP service with fetch polyfill support

#### Utilities (`src/_utils/`)
- **`_arrow.ts`**: Apache Arrow type inference and vector construction
- **`_feather.ts`**: Feather format serialization for query requests
- **`_grpc.ts`**: gRPC mapping between Chalk types and protobuf
- **`_config.ts`**: Configuration loading from options and environment variables
- **`_polyfill.ts`**: Fetch/Headers polyfills for Node.js compatibility

#### Interfaces (`src/_interface/`)
- Type definitions for all client methods
- Request/response types with TypeScript generics for type-safe feature access
- Error types and client configuration

#### Generated Protobuf (`src/gen/proto/`)
- Auto-generated protobuf definitions using `@bufbuild/protobuf`
- Located under `chalk/`, `google/`, and `gen_bq_schema/` namespaces

### Data Formats

- **Feather/Apache Arrow**: Used for bulk query serialization in HTTP client
- **Protocol Buffers**: Used for all gRPC communication
- **Type Inference**: Automatically infers Arrow types from first non-null elements in arrays/objects

### Authentication Flow

1. Client initializes with `clientId`, `clientSecret`, and `activeEnvironment`
2. `CredentialsHolder` performs OAuth2 client credentials exchange with API server
3. JWT access token is cached with expiration tracking
4. Token is proactively refreshed 60 seconds before expiry
5. Each request includes token in Authorization header (HTTP) or metadata (gRPC)

### Query Server Resolution

Both clients support dynamic query server resolution:
- Can use explicit `queryServer` from options
- Can use `skipQueryServerFromCredentialExchange` (gRPC) / `useQueryServerFromCredentialExchange` (HTTP) to fetch server from credentials
- Falls back to `apiServer` (default: `https://api.chalk.ai`)

## Testing

### Test Structure
- **Unit tests**: `src/__test__/*.test.ts` (except integration tests)
- **Integration tests**: `src/__test__/integration.test.ts` and `src/__test__/integration_grpc.test.ts`
  - Require `CHALK_INTEGRATION=1` environment variable
  - Require Chalk credentials in environment variables

### Test Configuration
- Jest with `ts-jest` preset
- Tests run with TypeScript compilation

## Environment Variables

Required for client initialization (if not passed explicitly):
- `_CHALK_CLIENT_ID`: Your Chalk client ID
- `_CHALK_CLIENT_SECRET`: Your Chalk client secret

Optional:
- `_CHALK_ACTIVE_ENVIRONMENT`: Target environment (defaults to project default)
- `_CHALK_API_SERVER`: API server URL (defaults to `https://api.chalk.ai`)

Integration testing uses prefixed versions:
- `CI_CHALK_CLIENT_ID`, `CI_CHALK_CLIENT_SECRET`
- `_INTEGRATION_TEST_CLIENT_ID`, `_INTEGRATION_TEST_CLIENT_SECRET`, `_INTEGRATION_TEST_API_SERVER`, `_INTEGRATION_TEST_ACTIVE_ENVIRONMENT`

## Type Safety

The client uses TypeScript generics for type-safe feature access:

```typescript
interface FeaturesType {
  "user.id": string;
  "user.fraud_score": number;
}

const client = new ChalkGRPCClient<FeaturesType>();
const result = await client.query({
  inputs: { "user.id": "1" },
  outputs: ["user.fraud_score"], // Type-checked against FeaturesType
});

// result.data["user.fraud_score"].value is typed as number
```

Users should generate types from their Chalk project using:
```bash
chalk codegen typescript --out=generated_types.ts
```

## Important Notes

- The gRPC client is strongly preferred over the HTTP client for performance
- The `skipQueryServerFromCredentialExchange` option in gRPC client is the negated equivalent of `useQueryServerFromCredentialExchange` in HTTP client
- Integration tests run sequentially (`--maxWorkers=1`) to avoid credential conflicts
- The build output goes to `build/` directory with full TypeScript declarations
- `src/_version.ts` is auto-generated and should not be edited manually
