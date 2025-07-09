import router from '@adonisjs/core/services/router'

const DashboardController = () => import('#controllers/dashboard_controller')

export function uiRoutes() {
  router.get('/overview', [DashboardController, 'overview'])
  router.get('/global-stats', [DashboardController, 'globalStats'])
  router.get('/runs', [DashboardController, 'runs'])
  router.get('/runs/:jobId', [DashboardController, 'jobById'])
  router.get('/available-jobs', [DashboardController, 'availableJobs'])
  router.get('/queues', [DashboardController, 'queues'])
  router.get('/schedules', [DashboardController, 'schedules'])
  router.post('/dispatch-job', [DashboardController, 'dispatchJob'])
  router.post('/toggle-queue-pause', [DashboardController, 'toggleQueuePause'])
}
