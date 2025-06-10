import { createRequire } from 'node:module'
import StringBuilder from '@poppinss/utils/string_builder'

import type { Closure, ClosureConstructor } from '../closure/closure.js'

export function jobName(name: string) {
  return new StringBuilder(name).removeExtension().pascalCase().toString()
}

export type SerializablePrimitive = string | number | boolean | null | undefined

export type SerializableValue =
  | SerializablePrimitive
  | SerializablePrimitive[]
  | { [key: string]: SerializablePrimitive }

export type SerializedClosure = { fn: string; args: SerializableValue[] }

export function serializeClosure<C extends ClosureConstructor>(
  closure: C,
  ...args: Parameters<InstanceType<C>['run']>
): SerializedClosure {
  return {
    fn: closure.toString(),
    args,
  }
}

export async function deserializeClosure(payload: SerializedClosure): Promise<Closure> {
  // needs to be dynamically imported because we are building the Closure class separately
  //to prevent bundling and referencing variables outside of class scope
  const { Closure } = await import('../closure/closure.js')

  const functionBody = `
${Closure.toString()}
return ${payload.fn}
  `
  const ClosureClass: ClosureConstructor = new Function(functionBody)()

  const closure = new ClosureClass()
  closure.$setArgs(payload.args)

  return closure
}

export function isModuleInstalled(moduleName: string) {
  const require = createRequire(import.meta.url)
  try {
    require.resolve(moduleName)
    return true
  } catch {
    return false
  }
}
