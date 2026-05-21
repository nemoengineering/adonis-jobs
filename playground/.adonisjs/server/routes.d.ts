import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
  }
  OPTIONS: {
  }
  POST: {
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