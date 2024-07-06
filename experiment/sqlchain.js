/**
 *  SQL CHAIN using Node.js and MySQL and Open AI and langchain
 */

import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { ChatOpenAI } from "@langchain/openai";
import { SqlDatabaseChain } from "langchain/chains/sql_db";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";


const datasource = new DataSource({
  type: "sqlite",
  database: "/Users/rushikumar/Downloads/northwind.db",
});

const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: datasource,
});


const llm = new ChatOpenAI();
const chain = new SqlDatabaseChain({
  llm: llm,
  database: db,
});


const res = await chain.run("give me top 5 products by price");

