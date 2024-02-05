const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

let db = null;

const dbPath = path.join(__dirname, "todoApplication.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        select * from todo where id=${todoId};
    `;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//API 3
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const postTodoQuery = `
        insert into todo(id,todo,priority,status) values(${id},'${todo}','${priority}','${status}');
    `;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let putTodoQuery = "";
  const todoDetails = request.body;
  const { status, priority, todo } = todoDetails;
  let updateResponse = "";
  switch (true) {
    case hasStatusProperty(todoDetails):
      putTodoQuery = `
                    update todo set status='${status}' where id=${todoId};
                `;
      updateResponse = "Status Updated";
      break;

    case hasPriorityProperty(todoDetails):
      putTodoQuery = `
                    update todo set priority='${priority}' where id=${todoId}
                `;
      updateResponse = "Priority Updated";
      break;
    default:
      putTodoQuery = `
                    update todo set todo='${todo}' where id=${todoId}
                `;
      updateResponse = "Todo Updated";
      break;
  }
  await db.run(putTodoQuery);
  response.send(updateResponse);
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        delete from todo where id=${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
