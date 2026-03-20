import type { ApplicationService } from '@adonisjs/core/types'

import { QueueService } from '../types.ts'
import { BullmqDashboardService } from '../services/queue_service/bullmq/bullmq_dashboard_service.ts'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  async register() {
    this.app.container.singleton(QueueService, () => new BullmqDashboardService())
  }
}
