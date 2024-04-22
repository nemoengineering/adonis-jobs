import app from '@adonisjs/core/services/app'
import {WorkerService} from "../src/types.js";

let worker: WorkerService

await app.booted(async () => {
  worker = await app.container.make('worker.manager')
})

export { worker as default }
