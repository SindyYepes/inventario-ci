from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_item():
    response = client.post("/items", json={"name": "Mouse", "quantity": 10})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Mouse"
    assert data["quantity"] == 10
