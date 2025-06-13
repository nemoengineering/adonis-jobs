import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'

import { PaymentService } from '#services/payment_service'

@inject()
export class TestService {
  constructor(
    protected logger: Logger,
    private paymentService: PaymentService,
  ) {}

  async doSomething() {
    this.logger.info('TestService is doing something!')

    this.paymentService.processPayment(100)
  }
}
