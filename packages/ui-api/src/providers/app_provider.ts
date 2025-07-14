import type { ApplicationService } from '@adonisjs/core/types'

import { QueueService } from '../types.js'
import { BullmqDashboardService } from '../services/queue_service/bullmq/bullmq_dashboard_service.js'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  async register() {
    this.app.container.singleton(QueueService, () => new BullmqDashboardService())
  }
}
