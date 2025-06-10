import { register } from 'node:module'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { createAddHookMessageChannel } from 'import-in-the-middle'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const { registerOptions, waitForAllMessagesAcknowledged } = createAddHookMessageChannel()
register('import-in-the-middle/hook.mjs', import.meta.url, registerOptions as any)

export async function initOtel(serviceName: string) {
  const sdk = new NodeSDK({
    serviceName,
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),
    traceExporter: new OTLPTraceExporter({ url: 'http://localhost:4318/v1/traces' }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: 'http://localhost:4318/v1/traces' }),
    }),

    instrumentations: [getNodeAutoInstrumentations()],
  })

  sdk.start()
  await waitForAllMessagesAcknowledged()
}
