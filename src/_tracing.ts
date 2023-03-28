import { trace } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPExporterNodeConfigBase } from "@opentelemetry/otlp-exporter-base";

export interface TracingOptions extends OTLPExporterNodeConfigBase {
  tracingActive?: boolean;
}

/**
 * Initialize opentelemetry tracing for the Chalk client
 */
export function initializeTracing(opts: OTLPExporterNodeConfigBase) {
  // diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  const exporter = new OTLPTraceExporter(opts);

  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: "chalk-ts-client",
      [SemanticResourceAttributes.SERVICE_VERSION]: "0.0.0",
    })
  );

  const provider = new NodeTracerProvider({
    resource: resource,
  });

  const processor = new BatchSpanProcessor(exporter);
  provider.addSpanProcessor(processor);

  const sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.configureTracerProvider(provider, processor);
  sdk.addResource(resource);

  sdk.start();
  return sdk;
}

const TRACER_NAME = "chalk-ts-client-tracer";

export function getTracer() {
  return trace.getTracer(TRACER_NAME);
}
