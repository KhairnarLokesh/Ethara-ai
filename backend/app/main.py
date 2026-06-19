from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import time
import logging
import sys
import secrets
from datetime import datetime, timedelta

from .database import engine, Base, get_db
from .config import settings
from . import crud, schemas, models
from .auth import get_current_user, verify_password, create_access_token, verify_google_token

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("inventory_system")

# Create database tables with a retry loop
def init_db():
    retries = 5
    while retries > 0:
        try:
            logger.info("Attempting to connect to the database and create tables...")
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables initialized successfully.")
            break
        except Exception as e:
            retries -= 1
            logger.warning(f"Database connection failed: {e}. Retries left: {retries}")
            if retries == 0:
                logger.error("Failed to connect to the database. Exiting.")
                raise e
            time.sleep(3)

# Initialize database tables only when not running unit/integration tests
if "pytest" not in sys.modules:
    init_db()

app = FastAPI(
    title="Inventory & Order Management API",
    description="Python backend API using FastAPI for tracking products, customers, and orders.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Inventory & Order Management API",
        "docs_url": "/docs",
        "status": "healthy"
    }

# ==========================================
# Authentication Routes
# ==========================================

@app.post("/auth/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already registered."
        )
    db_email = crud.get_user_by_email(db, user.email)
    if db_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered."
        )
    
    new_user = crud.create_user(db=db, user=user)
    
    # Send welcome email
    from .email import send_welcome_email
    send_welcome_email(background_tasks, new_user.email, new_user.username)
    
    return new_user

@app.post("/auth/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, user_credentials.username)
    if not user:
        user = crud.get_user_by_email(db, user_credentials.username)
        
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/google-login", response_model=schemas.Token)
async def google_login(request: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    google_data = await verify_google_token(request.credential_token)
    email = google_data.get("email")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Google account info."
        )
        
    user = crud.get_user_by_email(db, email)
    if not user:
        username = email.split("@")[0]
        base_username = username
        counter = 1
        while crud.get_user_by_username(db, username):
            username = f"{base_username}{counter}"
            counter += 1
            
        user = crud.create_google_user(db, username=username, email=email)
        
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/auth/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, request.email)
    if not user:
        return {"message": "If the email is registered, a password reset link has been sent."}
        
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    
    from .email import send_password_reset_email
    send_password_reset_email(background_tasks, user.email, token)
    
    return {"message": "If the email is registered, a password reset link has been sent."}

@app.post("/auth/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_reset_token(db, request.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
        
    from .auth import get_password_hash
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Password reset successfully. You can now log in with your new password."}

# ==========================================
# Product Routes
# ==========================================

@app.post("/products", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_product(db=db, product=product)

@app.get("/products", response_model=List[schemas.ProductOut])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_products(db=db, skip=skip, limit=limit)

@app.get("/products/{product_id}", response_model=schemas.ProductOut)
def read_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_product = crud.get_product(db=db, product_id=product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return db_product

@app.put("/products/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_product = crud.update_product(db=db, product_id=product_id, product_update=product_update)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return db_product

@app.delete("/products/{product_id}", response_model=schemas.ProductOut)
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_product = crud.delete_product(db=db, product_id=product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return db_product

# ==========================================
# Customer Routes
# ==========================================

@app.post("/customers", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_customer(db=db, customer=customer)

@app.get("/customers", response_model=List[schemas.CustomerOut])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_customers(db=db, skip=skip, limit=limit)

@app.get("/customers/{customer_id}", response_model=schemas.CustomerOut)
def read_customer(customer_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_customer = crud.get_customer(db=db, customer_id=customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    return db_customer

@app.delete("/customers/{customer_id}", response_model=schemas.CustomerOut)
def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_customer = crud.delete_customer(db=db, customer_id=customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    return db_customer

# ==========================================
# Order Routes
# ==========================================

@app.post("/orders", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    order: schemas.OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.create_order(
        db=db,
        order_in=order,
        background_tasks=background_tasks,
        current_user_email=current_user.email
    )

@app.get("/orders", response_model=List[schemas.OrderOut])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_orders(db=db, skip=skip, limit=limit)

@app.get("/orders/{order_id}", response_model=schemas.OrderOut)
def read_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_order = crud.get_order(db=db, order_id=order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    return db_order

@app.delete("/orders/{order_id}", response_model=schemas.OrderOut)
def delete_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    
    order_out = schemas.OrderOut.model_validate(db_order)
    crud.delete_order(db=db, order_id=order_id)
    return order_out

# ==========================================
# Dashboard Statistics
# ==========================================

@app.get("/dashboard", response_model=schemas.DashboardStats)
def read_dashboard_stats(low_stock_threshold: int = 10, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_dashboard_stats(db=db, low_stock_threshold=low_stock_threshold)

