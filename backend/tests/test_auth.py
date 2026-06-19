import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

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

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    # Enforce database override for this test suite
    app.dependency_overrides[get_db] = override_get_db
    
    # Manage authentication overrides (must not override get_current_user during auth tests)
    from app.auth import get_current_user
    old_auth_override = app.dependency_overrides.get(get_current_user)
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]
        
    # Setup: Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Teardown: Drop tables
    Base.metadata.drop_all(bind=engine)
    
    # Restore authentication overrides for subsequent test suites
    if old_auth_override is not None:
        app.dependency_overrides[get_current_user] = old_auth_override

def test_signup_and_login():
    # 1. Signup
    signup_data = {
        "username": "tester",
        "email": "tester@example.com",
        "password": "securepassword123"
    }
    resp = client.post("/auth/signup", json=signup_data)
    assert resp.status_code == 201
    user_info = resp.json()
    assert user_info["username"] == "tester"
    assert user_info["email"] == "tester@example.com"
    assert "id" in user_info

    # 2. Signup duplicate username
    resp = client.post("/auth/signup", json=signup_data)
    assert resp.status_code == 400
    assert "Username is already registered" in resp.json()["detail"]

    # 3. Login with correct credentials
    login_data = {
        "username": "tester",
        "password": "securepassword123"
    }
    resp = client.post("/auth/login", json=login_data)
    assert resp.status_code == 200
    token_info = resp.json()
    assert "access_token" in token_info
    assert token_info["token_type"] == "bearer"
    token = token_info["access_token"]

    # 4. Access secured resource with token
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["username"] == "tester"

    # 5. Access secured resource with invalid token
    bad_headers = {"Authorization": "Bearer invalidtoken"}
    resp = client.get("/auth/me", headers=bad_headers)
    assert resp.status_code == 401

def test_login_invalid_credentials():
    # Setup user
    signup_data = {
        "username": "tester",
        "email": "tester@example.com",
        "password": "securepassword123"
    }
    client.post("/auth/signup", json=signup_data)

    # Login with bad password
    resp = client.post("/auth/login", json={"username": "tester", "password": "wrongpassword"})
    assert resp.status_code == 401
    
    # Login with non-existent user
    resp = client.post("/auth/login", json={"username": "nonexistent", "password": "password"})
    assert resp.status_code == 401

def test_unauthenticated_access_blocked():
    # Request secured endpoints without credentials
    resp = client.get("/products")
    assert resp.status_code == 401

    resp = client.get("/dashboard")
    assert resp.status_code == 401
