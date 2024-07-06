## SQL Chain
Uses Langchain and Open AI to extract SQL queries from natural language text and execute them on a database.

## Installation
1. Clone the repository
2. Install the requirements
```
  npm install
```
3. Run the program
```
  npm server.js
```

## Usage
API Endpoint : http://localhost:3000/api/v0.0.1/query

Request Body:
```
{
  "text": "Get the name of the employees who are working in the department with id 1"
}
```

Response:
```
{
  "status": "success",
  "data": [
    {
      "name": "John Doe"
    },
    {
      "name": "Jane Doe"
    }
  ]
}
```