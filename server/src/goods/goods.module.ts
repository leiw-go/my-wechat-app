import { Module } from '@nestjs/common';
import { GoodsController } from './goods.controller';
import { GoodsService } from './goods.service';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  controllers: [GoodsController, CategoryController],
  providers: [GoodsService, CategoryService],
  exports: [GoodsService],
})
export class GoodsModule {}
