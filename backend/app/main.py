from fastapi import FastAPI
from sqlmodel import SQLModel, Field, create_engine, Session, select

app = FastAPI(title="Inventario API")

DATABASE_URL = "sqlite:///./data/data.db"
engine = create_engine(DATABASE_URL, echo=True)

class Item(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str
    cantidad: int
    precio: float

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)

@app.get("/")
def root():
    return {"mensaje": "API de Inventario Funcionando"}

@app.post("/items/")
def crear_item(item: Item):
    with Session(engine) as session:
        session.add(item)
        session.commit()
        session.refresh(item)
        return item

@app.get("/items/")
def listar_items():
    with Session(engine) as session:
        items = session.exec(select(Item)).all()
        return items