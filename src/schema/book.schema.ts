/**
 * 书籍表
 */

import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  /** 书籍简介 */
  description: text("description"),
  

});
