import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser,JsonOutputParser } from "@langchain/core/output_parsers";


/**
 * This example uses Chinook database, which is a sample database available for SQL Server, Oracle, MySQL, etc.
 * To set it up follow the instructions on https://database.guide/2-sample-databases-sqlite/, placing the .db file
 * in the examples folder.
 */
const datasource = new DataSource({
  type: "sqlite",
  database: "/Users/rushikumar/Downloads/northwind.db",
});



const db = await SqlDatabase.fromDataSourceParams({
  appDataSource: datasource,
});

db.sampleRowsInTableInfo = 1;
const tableInfo = await db.getTableInfo(["Products"]);
console.log({ tableInfo });

const llm = new ChatOpenAI();


/**
 * Create the first prompt template used for getting the SQL query.
 */
const prompt =
  PromptTemplate.fromTemplate(`Based on the provided SQL table schema below, write a SQL query that would answer the user's question.    
------------
SCHEMA: {schema}
------------  
QUESTION: {question}
------------
SQL QUERY:`);

/**
 * Create a new RunnableSequence where we pipe the output from `db.getTableInfo()`
 * and the users question, into the prompt template, and then into the llm.
 * We're also applying a stop condition to the llm, so that it stops when it
 * sees the `\nSQLResult:` token.
 */
const sqlQueryChain = RunnableSequence.from([
  {
    schema: async () => db.allTables,
    question: (input) => input.question,
  },
  prompt,
  llm.bind({ stop: ["\nSQLResult:"] }),
  new StringOutputParser(),
]);

console.log("Prompting for SQL query...");

const res = await sqlQueryChain.invoke({
  question: "top 5 Products by UnitPrice",
});
console.log({ res });

// SELECT ProductName, UnitPrice FROM Products ORDER BY UnitPrice DESC LIMIT 5;

/**
 * { res: SELECT ProductName, UnitPrice\n' +
    'FROM Products\n' +
    'ORDER BY UnitPrice DESC\n' +
    'LIMIT 5;' }
 */

// /**
//  * Create the final prompt template which is tasked with getting the natural language response.
//  */
const finalResponsePrompt =
  PromptTemplate.fromTemplate(`Based on the table schema below, question, SQL query, and SQL response, write a JSON response:
------------
SCHEMA: {schema}
------------
QUESTION: {question}
------------
SQL QUERY: {query}
------------
SQL RESPONSE: {response}
------------
JSON RESPONSE:`);

/**
 * Create a new RunnableSequence where we pipe the output from the previous chain, the users question,
 * and the SQL query, into the prompt template, and then into the llm.
 * Using the result from the `sqlQueryChain` we can run the SQL query via `db.run(input.query)`.
 */
const finalChain = RunnableSequence.from([
  {
    question: (input) => input.question,
    query: sqlQueryChain,
  },
  {
    schema: async () => db.allTables,
    question: (input) => input.question,
    query: (input) => input.query,
    response: (input) => db.run(input.query),
  },
  finalResponsePrompt,
  llm,
  new JsonOutputParser(),
]);

const finalResponse = await finalChain.invoke({
  question: "top 5 Products by UnitPrice?",
});

console.log({ finalResponse });
