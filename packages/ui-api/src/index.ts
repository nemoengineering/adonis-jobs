import router from '@adonisjs/core/services/router'
import { renderJobsUi } from '@nemoventures/adonis-jobs-ui'

const DashboardController = () => import('./controllers/dashboard_controller.js')

export function uiRoutes() {
  return router.group(() => {
    router.get('/overview', [DashboardController, 'overview'])
    router.get('/global-stats', [DashboardController, 'globalStats'])
    router.get('/runs', [DashboardController, 'runs'])
    router.get('/runs/:jobId', [DashboardController, 'jobById'])
    router.get('/flows/job/:jobId/tree', [DashboardController, 'flowJobsTree'])
    router.get('/available-jobs', [DashboardController, 'availableJobs'])
    router.get('/queues', [DashboardController, 'queues'])
    router.get('/schedules', [DashboardController, 'schedules'])
    router.post('/dispatch-job', [DashboardController, 'dispatchJob'])
    router.post('/toggle-queue-pause', [DashboardController, 'toggleQueuePause'])
    router.post('/queue/clean', [DashboardController, 'cleanQueue'])
    router.post('/jobs/retry', [DashboardController, 'retryJob'])
    router.post('/jobs/rerun', [DashboardController, 'rerunJob'])
    router.post('/jobs/remove', [DashboardController, 'removeJob'])

    router.get('/app', async ({ response, request }) => {
      const baseUrl = request.completeUrl().slice(0, -4) // Remove '/app' from the URL

      const html = await renderJobsUi({ baseUrl })
      return response.type('html').send(html)
    })
  })
}
