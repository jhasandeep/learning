import type { TaskPath } from './types'

// FastAPI is checked against what the code must contain, so you can learn it with no server.

export const fastapi: TaskPath = {
  id: 'fastapi',
  title: 'FastAPI',
  blurb: 'Build an API with typed routes, Pydantic models, dependencies, errors and routers.',
  tasks: [
    {
      id: 'first-routes',
      kind: 'rules',
      language: 'python',
      title: 'Create your first routes',
      goal: 'Create the app with a health route and an item route that has a path and a query parameter.',
      steps: [
        'Create `app = FastAPI()` and a `GET /` route that returns `{"status": "ok"}`.',
        'Add `GET /items/{item_id}` where `item_id` is typed as `int`.',
        'Add an optional query parameter `q: str | None = None` and return both values.',
      ],
      starter: `from fastapi import FastAPI

`,
      hints: ['Routes are decorators: `@app.get("/")` above a function.', 'FastAPI reads parameter types from the function signature.', 'A parameter not in the path is a query parameter, e.g. `?q=pen`.'],
      solution: `from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
`,
      rules: [
        { label: 'Creates `app = FastAPI()`', match: /app\s*=\s*FastAPI\(/, hint: 'app = FastAPI()' },
        { label: 'Has `@app.get("/")` returning a status', match: /@app\.get\(\s*["']\/["']\s*\)\s*\n\s*(async\s+)?def\s+\w+\([^)]*\)\s*:\s*\n\s*return\s*\{[^}]*status/, hint: 'Return {"status": "ok"} from the root route.' },
        { label: 'Has `@app.get("/items/{item_id}")`', match: /@app\.get\(\s*["']\/items\/\{item_id\}["']\s*\)/, hint: 'Use the {item_id} placeholder in the path.' },
        { label: '`item_id` is typed as `int`', match: /item_id\s*:\s*int/, hint: 'def read_item(item_id: int, …)' },
        { label: 'Has an optional query parameter `q`', match: /q\s*:\s*str\s*\|\s*None\s*=\s*None/, hint: 'q: str | None = None' },
      ],
      learned: 'FastAPI builds routes from decorators and reads types from your function signature, giving automatic conversion, validation and docs.',
    },
    {
      id: 'pydantic-post',
      kind: 'rules',
      language: 'python',
      title: 'Validate a request body with Pydantic',
      goal: 'Accept a new item with `POST /items`, validating it and hiding private fields in the response.',
      steps: [
        'Write `ItemIn(BaseModel)` with `name: str` (min length 1), `price: float` (greater than 0) and `secret_code: str`.',
        'Write `ItemOut(BaseModel)` with only `id: int`, `name: str` and `price: float`.',
        'Add `@app.post("/items", response_model=ItemOut, status_code=201)` taking `item: ItemIn`.',
      ],
      starter: `from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()
`,
      hints: ['`Field(min_length=1)` and `Field(gt=0)` add validation rules.', '`response_model` filters the output to the fields of that model.', 'A Pydantic model parameter is read from the JSON request body.'],
      solution: `from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class ItemIn(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(gt=0)
    secret_code: str

class ItemOut(BaseModel):
    id: int
    name: str
    price: float

@app.post("/items", response_model=ItemOut, status_code=201)
def create_item(item: ItemIn):
    return {"id": 1, "name": item.name, "price": item.price}
`,
      rules: [
        { label: '`ItemIn` is a Pydantic `BaseModel` with `name`, `price` and `secret_code`', match: /class\s+ItemIn\(\s*BaseModel\s*\)[\s\S]*name\s*:\s*str[\s\S]*price\s*:\s*float[\s\S]*secret_code\s*:\s*str/, hint: 'class ItemIn(BaseModel): name: str … price: float … secret_code: str' },
        { label: 'The name needs `min_length=1`', match: /name\s*:\s*str\s*=\s*Field\([^)]*min_length=1/, hint: 'name: str = Field(min_length=1)' },
        { label: 'The price must be greater than 0 (`gt=0`)', match: /price\s*:\s*float\s*=\s*Field\([^)]*gt=0/, hint: 'price: float = Field(gt=0)' },
        { label: '`ItemOut` has `id`, `name`, `price` but no `secret_code`', match: /class\s+ItemOut\(\s*BaseModel\s*\)(?:(?!secret_code)[\s\S])*?id\s*:\s*int(?:(?!secret_code)[\s\S])*?price\s*:\s*float(?![\s\S]*class\s+\w+[\s\S]*secret_code)/, hint: 'Do not put secret_code in ItemOut.' },
        { label: 'The route is `@app.post("/items")` with `response_model=ItemOut` and `status_code=201`', match: /@app\.post\(\s*["']\/items["']\s*,\s*(response_model=ItemOut\s*,\s*status_code=201|status_code=201\s*,\s*response_model=ItemOut)\s*\)/, hint: '@app.post("/items", response_model=ItemOut, status_code=201)' },
        { label: 'The handler takes `item: ItemIn`', match: /def\s+\w+\(\s*item\s*:\s*ItemIn\s*\)/, hint: 'def create_item(item: ItemIn):' },
      ],
      learned: 'Pydantic checks incoming data against your types, and `response_model` makes sure private fields never leave the API.',
    },
    {
      id: 'http-errors',
      kind: 'rules',
      language: 'python',
      title: 'Return proper errors',
      goal: 'Return a 404 for unknown items and a 409 when creating one that already exists.',
      steps: [
        'Import `HTTPException` from `fastapi`.',
        'In `get_item`, raise `HTTPException(status_code=404, detail="Item not found")` when the id is missing from `DB`.',
        'In `create_item`, raise a 409 `HTTPException` when the id is already in `DB`.',
      ],
      starter: `from fastapi import FastAPI

app = FastAPI()
DB = {1: {"name": "pen"}}

@app.get("/items/{item_id}")
def get_item(item_id: int):
    return DB[item_id]

@app.post("/items/{item_id}", status_code=201)
def create_item(item_id: int, name: str):
    DB[item_id] = {"name": name}
    return DB[item_id]
`,
      hints: ['`raise HTTPException(status_code=404, detail="…")` stops the function and sends the error.', 'Check with `if item_id not in DB:` and `if item_id in DB:`.', '409 means conflict: the item already exists.'],
      solution: `from fastapi import FastAPI, HTTPException

app = FastAPI()
DB = {1: {"name": "pen"}}

@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id not in DB:
        raise HTTPException(status_code=404, detail="Item not found")
    return DB[item_id]

@app.post("/items/{item_id}", status_code=201)
def create_item(item_id: int, name: str):
    if item_id in DB:
        raise HTTPException(status_code=409, detail="Item already exists")
    DB[item_id] = {"name": name}
    return DB[item_id]
`,
      rules: [
        { label: 'Imports `HTTPException`', match: /from\s+fastapi\s+import\s+[^\n]*HTTPException/, hint: 'from fastapi import FastAPI, HTTPException' },
        { label: 'Raises a 404 with a `detail` message', match: /raise\s+HTTPException\(\s*status_code=404\s*,\s*detail=/, hint: 'raise HTTPException(status_code=404, detail="Item not found")' },
        { label: 'Checks `item_id not in DB` before reading', match: /if\s+item_id\s+not\s+in\s+DB/, hint: 'if item_id not in DB: raise …' },
        { label: 'Raises a 409 for duplicates', match: /raise\s+HTTPException\(\s*status_code=409/, hint: 'raise HTTPException(status_code=409, detail="Item already exists")' },
        { label: 'Checks `item_id in DB` before creating', match: /if\s+item_id\s+in\s+DB/, hint: 'if item_id in DB: raise …' },
      ],
      learned: 'Raising `HTTPException` sends the right status code and a JSON error body, so clients can react to what went wrong.',
    },
    {
      id: 'dependencies',
      kind: 'rules',
      language: 'python',
      title: 'Share logic with dependencies',
      goal: 'Create a `get_db` dependency that opens and always closes a session, and use it with `Depends`.',
      steps: [
        'Write `get_db()` as a generator: create `db = SessionLocal()`, `yield db`, and close it in `finally`.',
        'Write a second dependency `get_current_user(token: str = Header())` that raises a 401 when the token is not `"secret"`.',
        'Use both in a route: `db = Depends(get_db)` and `user = Depends(get_current_user)`.',
      ],
      starter: `from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI()

class SessionLocal:
    def close(self): ...

@app.get("/me")
def me():
    return {"user": "?"}
`,
      hints: ['`yield` gives the value to the route; code after it runs when the request is finished.', 'Wrap the yield in `try:` and the close in `finally:`.', 'A dependency parameter is written `name = Depends(function)`.'],
      solution: `from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI()

class SessionLocal:
    def close(self): ...

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Header()):
    if token != "secret":
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"name": "admin"}

@app.get("/me")
def me(db = Depends(get_db), user = Depends(get_current_user)):
    return {"user": user["name"]}
`,
      rules: [
        { label: '`get_db` yields a session', match: /def\s+get_db\(\)\s*:[\s\S]*SessionLocal\(\)[\s\S]*yield\s+db/, hint: 'db = SessionLocal(); yield db' },
        { label: '`get_db` closes the session in `finally`', match: /finally\s*:\s*\n\s*db\.close\(\)/, hint: 'try: yield db / finally: db.close()' },
        { label: '`get_current_user` raises a 401 for a bad token', match: /def\s+get_current_user\([^\n]*\)\s*:[\s\S]*raise\s+HTTPException\(\s*status_code=401/, hint: 'Raise HTTPException(status_code=401, …) when the token is wrong.' },
        { label: 'The route uses `Depends(get_db)`', match: /Depends\(\s*get_db\s*\)/, hint: 'def me(db = Depends(get_db), …)' },
        { label: 'The route uses `Depends(get_current_user)`', match: /Depends\(\s*get_current_user\s*\)/, hint: 'def me(…, user = Depends(get_current_user))' },
      ],
      learned: 'Dependencies let FastAPI supply shared resources (a database session, the current user) to any route and clean them up afterwards.',
    },
    {
      id: 'router',
      kind: 'rules',
      language: 'python',
      title: 'Organise routes with an APIRouter',
      goal: 'Move the user routes into their own router and mount it on the app under `/users`.',
      steps: [
        'Create `router = APIRouter(prefix="/users", tags=["users"])`.',
        'Define `@router.get("/")` and `@router.get("/{user_id}")` routes.',
        'Mount it with `app.include_router(router)`.',
      ],
      starter: `from fastapi import FastAPI

app = FastAPI()
`,
      hints: ['`from fastapi import APIRouter`', 'With `prefix="/users"` the route `"/{user_id}"` becomes `/users/{user_id}`.', '`app.include_router(router)` goes after the routes are defined.'],
      solution: `from fastapi import APIRouter, FastAPI

app = FastAPI()
router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
def list_users():
    return [{"id": 1, "name": "Asha"}]

@router.get("/{user_id}")
def get_user(user_id: int):
    return {"id": user_id}

app.include_router(router)
`,
      rules: [
        { label: 'Imports `APIRouter`', match: /from\s+fastapi\s+import\s+[^\n]*APIRouter/, hint: 'from fastapi import APIRouter, FastAPI' },
        { label: 'Creates a router with `prefix="/users"` and `tags`', match: /APIRouter\(\s*prefix=["']\/users["']\s*,\s*tags=\[["']users["']\]\s*\)/, hint: 'APIRouter(prefix="/users", tags=["users"])' },
        { label: 'Has a list route `@router.get("/")`', match: /@router\.get\(\s*["']\/["']\s*\)/, hint: '@router.get("/")' },
        { label: 'Has a detail route `@router.get("/{user_id}")` with `user_id: int`', match: /@router\.get\(\s*["']\/\{user_id\}["']\s*\)\s*\n\s*def\s+\w+\(\s*user_id\s*:\s*int/, hint: '@router.get("/{user_id}") and user_id: int' },
        { label: 'Mounts it with `app.include_router(router)`', match: /app\.include_router\(\s*router\s*\)/, hint: 'app.include_router(router)' },
      ],
      learned: 'Routers split a growing API into feature files, each with its own prefix and tags, then plug into the app.',
    },
  ],
}
