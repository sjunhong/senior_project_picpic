import { BaseController } from 'core/infra/base-controller'
import { CreatePost } from '../../use-cases/create-post/create-post-use-case'
import { UseCaseError } from '../../../core/infra/use-case-error'
import { CreatePostInputDto, CreatePostOutputDto } from './create-post-dto'
import * as CreatePostErrors from '../../use-cases/create-post/create-post-error'
import { autoInjectable } from 'tsyringe'

@autoInjectable()
export class CreatePostController extends BaseController {
  constructor(private useCase: CreatePost) {
    super()
  }

  async executeImpl(): Promise<any> {
    const inputDto: CreatePostInputDto = {
      title: this.req.body.title,
      expiredAt: this.req.body.expiredAt,
      userId: this.req.user
    } as CreatePostInputDto

    try {
      const result = await this.useCase.execute(inputDto)

      if (result instanceof UseCaseError) {
        switch (result.constructor) {
          default:
            return this.clientError(result.message)
        }
      } else {
        const outputDto: CreatePostOutputDto = result
        return this.ok(this.res, 200, outputDto)
      }
    } catch (error: unknown) {
      console.log(error)
      if (error instanceof Error) {
        return this.fail(error)
      }
    }
  }
}
