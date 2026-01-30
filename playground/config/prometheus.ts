import { defineConfig } from '@julr/adonisjs-prometheus'
import { bullmqCollector } from '@nemoventures/adonis-jobs/metrics'
import { httpCollector } from '@julr/adonisjs-prometheus/collectors/http_collector'
import { mailCollector } from '@julr/adonisjs-prometheus/collectors/mail_collector'
import { lucidCollector } from '@julr/adonisjs-prometheus/collectors/lucid_collector'
import { systemCollector } from '@julr/adonisjs-prometheus/collectors/system_collector'

import env from '#start/env'

export default defineConfig({
  /**
   * Endpoint where metrics will be exposed
   */
  endpoint: '/metrics',

  /**
   * A prefix that will be added to all metrics
   * names
   */
  metricsPrefix: env.get('APP_NAME'),

  /**
   * List of IPs that are allowed to access the
   * metrics endpoint. If empty, then everyone
   * can access the endpoint
   */
  ipsWhitelist: [],

  /**
   * List of collectors that will be registered
   * and expose new metrics.
   *
   * Feel free to remove collectors that you
   * don't want to use
   */
  collectors: [
    httpCollector(),
    mailCollector(),
    lucidCollector(),
    systemCollector(),
    bullmqCollector(),
  ],
})
