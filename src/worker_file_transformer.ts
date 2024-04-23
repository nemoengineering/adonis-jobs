import {
  CallExpression,
  FormatCodeSettings,
  Project,
  PropertyAssignment,
  SourceFile,
  SyntaxKind,
} from 'ts-morph'
import StringBuilder from '@poppinss/utils/string_builder'
import { workerName } from './helper.js'

export class WorkerFileTransformer {
  #project: Project

  #editorSettings: FormatCodeSettings = {
    indentSize: 2,
    convertTabsToSpaces: true,
    trimTrailingWhitespace: true,
    ensureNewLineAtEndOfFile: true,
    indentStyle: 2,
    // @ts-expect-error SemicolonPreference doesn't seem to be re-exported from ts-morph
    semicolons: 'remove',
  }

  constructor(project: Project) {
    this.#project = project
  }

  #getPropertyAssignmentInDefineConfigCall(propertyName: string, initializer: string) {
    const file = this.#getWorkerFileOrThrow()
    const defineConfigCall = this.#locateDefineConfigCallOrThrow(file)
    const configObject = this.#getDefineConfigObjectOrThrow(defineConfigCall)

    let property = configObject.getProperty(propertyName)

    if (!property) {
      configObject.addPropertyAssignment({ name: propertyName, initializer })
      property = configObject.getProperty(propertyName)
    }

    return property as PropertyAssignment
  }
  #getWorkerFileOrThrow() {
    return this.#project.getSourceFileOrThrow('config/worker.ts')
  }

  #getDefineConfigObjectOrThrow(defineConfigCall: CallExpression) {
    const configObject = defineConfigCall
      .getArguments()[0]
      .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

    return configObject
  }

  #locateDefineConfigCallOrThrow(file: SourceFile) {
    const call = file
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .find((statement) => statement.getExpression().getText() === 'defineConfig')

    if (!call) {
      throw new Error('Could not locate the defineConfig call.')
    }

    return call
  }

  addWorker(entity: { path: string; name: string }) {
    this.#getWorkerFileOrThrow().addImportDeclaration({
      defaultImport: workerName(entity.name),
      moduleSpecifier: `#workers/${new StringBuilder(workerName(entity.name)).snakeCase().toString()}`,
    })

    const property = this.#getPropertyAssignmentInDefineConfigCall('workers', '{}')
    const workers = property.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
    workers.addPropertyAssignment({
      name: entity.name,
      initializer: `() => new ${workerName(entity.name)}()`,
    })
  }

  save() {
    const file = this.#getWorkerFileOrThrow()
    file.formatText(this.#editorSettings)
    return file.save()
  }
}
