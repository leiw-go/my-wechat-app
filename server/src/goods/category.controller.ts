import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { Public } from '../common/jwt-auth.guard';

@ApiTags('类目 / Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * GET /api/category/list
   * 类目列表
   */
  @Public()
  @Get('list')
  @ApiOperation({ summary: '类目列表' })
  async list() {
    return this.categoryService.list();
  }
}
