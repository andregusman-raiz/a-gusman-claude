---
name: ag-R-55-patterns-python
description: Patterns Python com venv, type hints, pytest, e estrutura de projeto
context: fork
user-invocable: false
---

# Skill: Python Patterns

Referencia de patterns para projetos Python.

## Quando Ativar

- Trabalhando em projeto Python
- Configurando ambiente virtual
- Escrevendo testes com pytest

## Estrutura Recomendada

```
projeto/
├── README.md
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml
├── .env.example
├── src/
│   └── nome_projeto/
│       ├── __init__.py
│       ├── main.py
│       ├── config.py
│       ├── models/
│       ├── services/
│       ├── repositories/
│       └── utils/
├── tests/
│   ├── conftest.py
│   ├── test_models/
│   └── test_services/
└── scripts/
```

## Ambiente Virtual

```bash
python -m venv .venv
source .venv/bin/activate      # Linux/Mac
.venv\Scripts\activate         # Windows
pip install -r requirements.txt
pip freeze > requirements.txt
```

## Type Hints

```python
from typing import Optional
from dataclasses import dataclass

def greet(name: str) -> str:
    return f"Ola, {name}!"

def find_user(user_id: str) -> Optional["User"]:
    ...

def process_items(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

@dataclass
class User:
    id: str
    email: str
    name: str
    age: int | None = None
```

## Pydantic (Validacao)

```python
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID, uuid4

class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=255)

class User(UserCreate):
    id: UUID = Field(default_factory=uuid4)

    class Config:
        from_attributes = True
```

## Pytest

```python
# tests/conftest.py
import pytest

@pytest.fixture
def sample_user():
    return User(id="123", email="test@test.com", name="Test")

# tests/test_services/test_user_service.py
class TestUserService:
    def test_create_user_success(self, mock_db):
        service = UserService(db=mock_db)
        user = service.create(email="test@test.com", name="Test")
        assert user.email == "test@test.com"

    @pytest.mark.parametrize("email,valid", [
        ("user@test.com", True),
        ("invalid", False),
    ])
    def test_validate_email(self, email: str, valid: bool):
        assert UserService.validate_email(email) == valid
```

```bash
pytest                          # Todos
pytest --cov=src               # Com coverage
pytest tests/test_services/    # Especifico
pytest -x                      # Parar no primeiro erro
```

## Error Handling

```python
class AppError(Exception):
    def __init__(self, message: str, code: str, status: int = 500):
        super().__init__(message)
        self.code = code
        self.status = status

class NotFoundError(AppError):
    def __init__(self, resource: str, id: str):
        super().__init__(f"{resource} com id {id} nao encontrado", "NOT_FOUND", 404)

from contextlib import contextmanager

@contextmanager
def db_transaction(db):
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
```

## Async Python

```python
import asyncio

async def fetch_user(user_id: str) -> User:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"/api/users/{user_id}")
        return User(**response.json())

async def fetch_all_users(ids: list[str]) -> list[User]:
    tasks = [fetch_user(id) for id in ids]
    return await asyncio.gather(*tasks)
```

## pyproject.toml

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --tb=short"

[tool.mypy]
python_version = "3.11"
strict = true

[tool.ruff]
target-version = "py311"
line-length = 100
```
