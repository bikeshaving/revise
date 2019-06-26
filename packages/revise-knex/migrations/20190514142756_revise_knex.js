exports.up = function(knex) {
  return knex.schema
    .createTable("revise_revision", (table) => {
      table.string("doc_id").notNullable();
      table.string("client_id").notNullable();
      table.text("patch").notNullable();
      table.integer("local").notNullable();
      table.integer("received").notNullable();
      table.integer("version").notNullable();
      table.timestamps(false, true);
      table.primary(["doc_id", "version"]);
      table.unique(["client_id", "local"]);
    });
};

exports.down = function(knex) {
  return knex.schema.dropTable("revise_revision");
};
