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

@app.put("/items/{item_id}")
def actualizar_item(item_id: int, item: Item):
    with Session(engine) as session:
        db_item = session.get(Item, item_id)
        if not db_item:
            return {"error": "Item no encontrado"}

        db_item.nombre = item.nombre
        db_item.cantidad = item.cantidad
        db_item.precio = item.precio

        session.add(db_item)
        session.commit()
        session.refresh(db_item)
        return db_item

@app.delete("/items/{item_id}")
def eliminar_item(item_id: int):
    with Session(engine) as session:
        db_item = session.get(Item, item_id)
        if not db_item:
            return {"error": "Item no encontrado"}

        session.delete(db_item)
        session.commit()
        return {"mensaje": "Item eliminado"}
