import { Job as BullJob } from 'bullmq'

declare module 'bullmq' {
  interface Job<DataType = any, ReturnType = any, NameType = string>
    extends BullJob<DataType, ReturnType, NameType> {}
}
