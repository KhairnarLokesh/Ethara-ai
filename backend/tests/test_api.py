import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add parent directory to path so app can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app, get_db
from app.database import Base
from app import models

from sqlalchemy.pool import StaticPool

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

from app.auth import get_current_user

# Apply dependency override
app.dependency_overrides[get_db] = override_get_db

def override_get_current_user():
    return models.User(id=1, username="testuser", email="test@example.com", is_google_user=False)

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    # Enforce local overrides for this test suite
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    # Setup: Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown: Drop tables
    Base.metadata.drop_all(bind=engine)


def test_create_and_read_product():
    # Create product
    response = client.post(
        "/products",
        json={"name": "Laptop", "sku": "LAP123", "price": 999.99, "quantity_in_stock": 10}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Laptop"
    assert data["sku"] == "LAP123"
    assert data["price"] == 999.99
    assert data["quantity_in_stock"] == 10
    product_id = data["id"]

    # Read product
    response = client.get(f"/products/{product_id}")
    assert response.status_code == 200
    assert response.json()["sku"] == "LAP123"


def test_sku_uniqueness():
    # Create first product
    client.post(
        "/products",
        json={"name": "Laptop", "sku": "LAP123", "price": 999.99, "quantity_in_stock": 10}
    )
    # Create second product with duplicate SKU
    response = client.post(
        "/products",
        json={"name": "Notebook", "sku": "LAP123", "price": 799.99, "quantity_in_stock": 5}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_negative_quantity_validation():
    # Try to create product with negative stock
    response = client.post(
        "/products",
        json={"name": "Laptop", "sku": "LAP123", "price": 999.99, "quantity_in_stock": -5}
    )
    assert response.status_code == 422  # Pydantic validation error


def test_create_customer_and_uniqueness():
    # Create customer
    response = client.post(
        "/customers",
        json={"full_name": "John Doe", "email": "john@example.com", "phone_number": "1234567890"}
    )
    assert response.status_code == 201
    assert response.json()["email"] == "john@example.com"

    # Try duplicate email
    response = client.post(
        "/customers",
        json={"full_name": "Jane Smith", "email": "john@example.com", "phone_number": "0987654321"}
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_create_order_insufficient_stock():
    # Create customer
    cust_resp = client.post(
        "/customers",
        json={"full_name": "John Doe", "email": "john@example.com", "phone_number": "1234567890"}
    )
    customer_id = cust_resp.json()["id"]

    # Create product with stock = 2
    prod_resp = client.post(
        "/products",
        json={"name": "Keyboard", "sku": "KEY77", "price": 50.0, "quantity_in_stock": 2}
    )
    product_id = prod_resp.json()["id"]

    # Try to place order with quantity = 3 (insufficient stock)
    order_resp = client.post(
        "/orders",
        json={
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "quantity": 3}]
        }
    )
    assert order_resp.status_code == 400
    assert "Insufficient stock" in order_resp.json()["detail"]

    # Verify stock is still 2
    prod_check = client.get(f"/products/{product_id}")
    assert prod_check.json()["quantity_in_stock"] == 2


def test_create_order_success_and_stock_reduction():
    # Create customer
    cust_resp = client.post(
        "/customers",
        json={"full_name": "John Doe", "email": "john@example.com", "phone_number": "1234567890"}
    )
    customer_id = cust_resp.json()["id"]

    # Create product with stock = 10
    prod_resp = client.post(
        "/products",
        json={"name": "Mouse", "sku": "MOU88", "price": 25.0, "quantity_in_stock": 10}
    )
    product_id = prod_resp.json()["id"]

    # Create order for 3 items
    order_resp = client.post(
        "/orders",
        json={
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "quantity": 3}]
        }
    )
    assert order_resp.status_code == 201
    order_data = order_resp.json()
    assert order_data["total_amount"] == 75.0  # Auto-calculated total amount: 25.0 * 3
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["quantity"] == 3
    assert order_data["items"][0]["unit_price"] == 25.0

    # Verify stock reduced to 7
    prod_check = client.get(f"/products/{product_id}")
    assert prod_check.json()["quantity_in_stock"] == 7


def test_delete_order_restores_stock():
    # Create customer
    cust_resp = client.post(
        "/customers",
        json={"full_name": "John Doe", "email": "john@example.com", "phone_number": "1234567890"}
    )
    customer_id = cust_resp.json()["id"]

    # Create product with stock = 10
    prod_resp = client.post(
        "/products",
        json={"name": "Mouse", "sku": "MOU88", "price": 25.0, "quantity_in_stock": 10}
    )
    product_id = prod_resp.json()["id"]

    # Create order for 4 items
    order_resp = client.post(
        "/orders",
        json={
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "quantity": 4}]
        }
    )
    order_id = order_resp.json()["id"]

    # Verify stock reduced to 6
    prod_check = client.get(f"/products/{product_id}")
    assert prod_check.json()["quantity_in_stock"] == 6

    # Cancel (delete) order
    del_resp = client.delete(f"/orders/{order_id}")
    assert del_resp.status_code == 200

    # Verify stock restored to 10
    prod_check2 = client.get(f"/products/{product_id}")
    assert prod_check2.json()["quantity_in_stock"] == 10
