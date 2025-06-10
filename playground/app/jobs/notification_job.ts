import { Job } from '@nemoventures/adonis-jobs'

export type NotificationJobData = {
  email: string
  subject: string
  body: string
}

export type NotificationJobReturn = {
  sent: boolean
}

export default class NotificationJob extends Job<NotificationJobData, NotificationJobReturn> {
  static nameOverride = 'email-notification'

  async process(): Promise<NotificationJobReturn> {
    this.logger.info(`Sending email notification to: ${this.data.email}`)

    // Simulate sending email
    await new Promise((resolve) => setTimeout(resolve, 500))

    return { sent: true }
  }
}
