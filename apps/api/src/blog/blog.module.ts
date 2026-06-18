import { Module } from "@nestjs/common";
import { AdminBlogController } from "./admin-blog.controller";
import { PublicBlogController } from "./public-blog.controller";

@Module({
  controllers: [AdminBlogController, PublicBlogController],
})
export class BlogModule {}
