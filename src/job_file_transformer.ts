import {
  CallExpression,
  FormatCodeSettings,
  Project,
  SourceFile,
  SyntaxKind,
  TypeLiteralNode,
} from 'ts-morph'
import StringBuilder from '@poppinss/utils/string_builder'
import { jobName } from './helper.js'
import { join } from 'node:path'

export class JobFileTransformer {
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

  addJob(entity: { path: string; name: string }) {
    const fileName = new StringBuilder(jobName(entity.name)).snakeCase().toString()
    const filePath = join(entity.path, fileName)

    this.#getJobsFileOrThrow().addImportDeclaration({
      defaultImport: jobName(entity.name),
      moduleSpecifier: `#jobs/${filePath}`,
      isTypeOnly: true,
    })

    const jobsList = this.#getJobsListOrThrow()
    jobsList.addProperty({ name: entity.name, type: jobName(entity.name) })

    this.#getJobsAssignmentInSetJobsCall().addPropertyAssignment({
      name: entity.name,
      initializer: `() => import('#jobs/${filePath}'),`,
    })
  }

  save() {
    const file = this.#getJobsFileOrThrow()
    file.formatText(this.#editorSettings)
    return file.save()
  }

  #getJobsAssignmentInSetJobsCall() {
    const file = this.#getJobsFileOrThrow()
    const defineConfigCall = this.#locateSetJobsCallOrThrow(file)
    return this.#getDefineConfigObjectOrThrow(defineConfigCall)
  }

  #getJobsFileOrThrow() {
    return this.#project.getSourceFileOrThrow('start/jobs.ts')
  }

  #locateSetJobsCallOrThrow(file: SourceFile) {
    const call = file
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .find((statement) => statement.getExpression().getText() === 'jobs.set')

    if (!call) {
      throw new Error('Could not locate the jobs.set call.')
    }

    return call
  }

  #getDefineConfigObjectOrThrow(defineConfigCall: CallExpression) {
    return defineConfigCall.getArguments()[0].asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
  }

  #getJobsListOrThrow() {
    const file = this.#getJobsFileOrThrow()
    return this.#locateJobListTypeOrThrow(file)
      .asKindOrThrow(SyntaxKind.TypeAliasDeclaration)
      .getTypeNodeOrThrow() as TypeLiteralNode
  }

  #locateJobListTypeOrThrow(file: SourceFile) {
    const declaration = file
      .getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration)
      .find((i) => i.getName() === 'JobList')

    if (!declaration) {
      throw new Error('Could not locate the JobList type.')
    }

    return declaration
  }
}
