import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'

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
