import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser,JsonOutputParser } from "@langchain/core/output_parsers";


const sqlQueryChainPropmpt  = PromptTemplate.fromTemplate(`Based on the provided SQL table schema below, write a SQL query that would answer the user's question.    
  ------------
  SCHEMA: {schema}
  ------------  
  QUESTION: {question}
  ------------
  SQL QUERY:`
)

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


class Controller {
  constructor() {
    this.datasource = new DataSource({
      type: "sqlite",
      database: "/Users/rushikumar/Downloads/northwind.db",
    });
    this.llm = new ChatOpenAI();

  }

  async run(question) {
    const db = await SqlDatabase.fromDataSourceParams({
      appDataSource: this.datasource,
    });

    const sqlQueryChain = RunnableSequence.from([
      {
        schema: async () => db.allTables,
        question: (input) => input.question,
      },
      sqlQueryChainPropmpt,
      this.llm.bind({ stop: ["\nSQLResult:"] }),
      new StringOutputParser(),
    ]);

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
      this.llm,
      new JsonOutputParser(),
    ]);

    console.log("Prompting for SQL query...");
    const res = await finalChain.invoke({
      question: question,
    });
    return res;
  }
}


export default Controller;