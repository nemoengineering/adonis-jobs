import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import type { ApplicationService } from '@adonisjs/core/types'

@inject()
export abstract class PaymentService {
  constructor(protected logger: Logger) {}

  abstract processPayment(amount: number): Promise<void>
}

export class StripePaymentService extends PaymentService {
  async processPayment(amount: number): Promise<void> {
    this.logger.info(`Processing payment of $${amount} using Stripe`)
  }
}

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
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
