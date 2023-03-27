import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  trace,
} from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

export interface TracingOptions {
  url?: string;
  headers?: Record<string, string>;
  tracingActive?: boolean;
}

/**
 * Initialize opentelemetry tracing for the Chalk client
 */
export function initializeTracing({ url, headers }: TracingOptions) {
  // diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  const exporter = new OTLPTraceExporter({
    url,
    headers,
  });

  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: "chalk-ts-client",
      [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
    })
  );

  const provider = new NodeTracerProvider({
    resource: resource,
  });

  const processor = new BatchSpanProcessor(exporter);
  // provider.addSpanProcessor(processor);
  const zipProcessor = new BatchSpanProcessor(new ZipkinExporter());
  provider.addSpanProcessor(zipProcessor);
  // provider.register();

  const sdk = new NodeSDK({
    // traceExporter: new ConsoleSpanExporter(),
    // traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  // sdk.configureTracerProvider(provider, processor);
  sdk.configureTracerProvider(provider, zipProcessor);
  sdk.addResource(resource);

  sdk.start();
  return sdk;
}

const TRACER_NAME = "chalk-ts-tracer";

export function getTracer() {
  return trace.getTracer(TRACER_NAME);
}
