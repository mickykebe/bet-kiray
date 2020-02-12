import Knex from "knex";

class Db {
  private knex: Knex;
  private constructor() {
    this.knex = Knex({
      client: "pg",
      connection: process.env.DATABASE_URL
    });
  }
  private static _db: Db;

  static getInstance() {
    if (!this._db) {
      this._db = new Db();
    }
    return this._db;
  }
}
