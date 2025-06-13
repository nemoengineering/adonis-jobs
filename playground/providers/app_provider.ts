import type { ApplicationService } from '@adonisjs/core/types'

import { PaymentService, StripePaymentService } from '../app/services/payment_service.js'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  async register() {
    this.app.container.singleton(PaymentService, (resolver) => resolver.make(StripePaymentService))
  }

  /**
   * The container bindings have booted
   */
  async boot() {}

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {}
}
