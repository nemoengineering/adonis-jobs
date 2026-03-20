import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'dashboard.overview': { paramsTuple?: []; params?: {} }
    'dashboard.global_stats': { paramsTuple?: []; params?: {} }
    'dashboard.runs': { paramsTuple?: []; params?: {} }
    'dashboard.job_by_id': { paramsTuple: [ParamValue]; params: {'jobId': ParamValue} }
    'dashboard.flow_jobs_tree': { paramsTuple: [ParamValue]; params: {'jobId': ParamValue} }
    'dashboard.available_jobs': { paramsTuple?: []; params?: {} }
    'dashboard.queues': { paramsTuple?: []; params?: {} }
    'dashboard.schedules': { paramsTuple?: []; params?: {} }
    'dashboard.dispatch_job': { paramsTuple?: []; params?: {} }
    'dashboard.toggle_queue_pause': { paramsTuple?: []; params?: {} }
    'dashboard.clean_queue': { paramsTuple?: []; params?: {} }
    'dashboard.retry_job': { paramsTuple?: []; params?: {} }
    'dashboard.rerun_job': { paramsTuple?: []; params?: {} }
    'dashboard.remove_job': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'dashboard.overview': { paramsTuple?: []; params?: {} }
    'dashboard.global_stats': { paramsTuple?: []; params?: {} }
    'dashboard.runs': { paramsTuple?: []; params?: {} }
    'dashboard.job_by_id': { paramsTuple: [ParamValue]; params: {'jobId': ParamValue} }
    'dashboard.flow_jobs_tree': { paramsTuple: [ParamValue]; params: {'jobId': ParamValue} }
    'dashboard.available_jobs': { paramsTuple?: []; params?: {} }
    'dashboard.queues': { paramsTuple?: []; params?: {} }
    'dashboard.schedules': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'dashboard.overview': { paramsTuple?: []; params?: {} }
    'dashboard.global_stats': { paramsTuple?: []; params?: {} }
    'dashboard.runs': { paramsTuple?: []; params?: {} }
    'dashboard.job_by_id': { paramsTuple: [ParamValue]; params: {'jobId': ParamValue} }
    'dashboard.flow_jobs_tree': { paramsTuple: [ParamValue]; params: {'jobId': ParamValue} }
    'dashboard.available_jobs': { paramsTuple?: []; params?: {} }
    'dashboard.queues': { paramsTuple?: []; params?: {} }
    'dashboard.schedules': { paramsTuple?: []; params?: {} }
  }
  OPTIONS: {
  }
  POST: {
    'dashboard.dispatch_job': { paramsTuple?: []; params?: {} }
    'dashboard.toggle_queue_pause': { paramsTuple?: []; params?: {} }
    'dashboard.clean_queue': { paramsTuple?: []; params?: {} }
    'dashboard.retry_job': { paramsTuple?: []; params?: {} }
    'dashboard.rerun_job': { paramsTuple?: []; params?: {} }
    'dashboard.remove_job': { paramsTuple?: []; params?: {} }
  }
  PUT: {
  }
  PATCH: {
  }
  DELETE: {
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}