from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from fastapi import HTTPException, status, BackgroundTasks

# ==========================================
# Product CRUD
# ==========================================

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).order_by(models.Product.id.desc()).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Verify SKU uniqueness
    db_product = get_product_by_sku(db, product.sku)
    if db_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )
    
    new_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity_in_stock=product.quantity_in_stock
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product_update.model_dump(exclude_unset=True)
    
    # Check if SKU is changing and if it conflicts
    if "sku" in update_data and update_data["sku"] != db_product.sku:
        conflicting_product = get_product_by_sku(db, update_data["sku"])
        if conflicting_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{update_data['sku']}' already exists."
            )
            
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    # Check if the product has associated order items
    # Since DB has RESTRICT, deleting will fail, so let's raise a clean error
    order_items_count = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).count()
    if order_items_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product. It has active orders associated with it."
        )
        
    db.delete(db_product)
    db.commit()
    return db_product

# ==========================================
# Customer CRUD
# ==========================================

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).order_by(models.Customer.id.desc()).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Verify email uniqueness
    db_customer = get_customer_by_email(db, customer.email)
    if db_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists."
        )
        
    new_customer = models.Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
        
    # NOTE: Deleting customer cascades to delete orders because of ondelete="CASCADE" in models.py
    # We should restore the stock of products in those orders before deleting the customer!
    customer_orders = db.query(models.Order).filter(models.Order.customer_id == customer_id).all()
    for order in customer_orders:
        for item in order.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                product.quantity_in_stock += item.quantity
                
    db.delete(db_customer)
    db.commit()
    return db_customer

# ==========================================
# Order CRUD & Inventory Logic
# ==========================================

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.id.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_in: schemas.OrderCreate, background_tasks: BackgroundTasks = None, current_user_email: str = None):
    # 1. Verify Customer exists
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_in.customer_id} does not exist."
        )
    
    # Use database transaction
    try:
        total_amount = 0.0
        order_items_to_create = []
        
        # We need to lock the products to prevent race conditions during order placement
        # For simplicity and robustness, we can load all products and process them
        for item in order_in.items:
            # Fetch product
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item.product_id} does not exist."
                )
                
            # Verify inventory stock
            if product.quantity_in_stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). Available: {product.quantity_in_stock}, Requested: {item.quantity}."
                )
            
            # Deduct stock
            product.quantity_in_stock -= item.quantity
            
            # Trigger low stock alert if it falls below 10
            if product.quantity_in_stock < 10 and background_tasks and current_user_email:
                from .email import send_low_stock_alert_email
                send_low_stock_alert_email(
                    background_tasks=background_tasks,
                    user_email=current_user_email,
                    product_name=product.name,
                    sku=product.sku,
                    current_stock=product.quantity_in_stock
                )
            
            # Calculate pricing
            item_total = product.price * item.quantity
            total_amount += item_total
            
            # Create OrderItem object
            order_item = models.OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price
            )
            order_items_to_create.append(order_item)
            
        # Create Order
        db_order = models.Order(
            customer_id=order_in.customer_id,
            total_amount=total_amount
        )
        db.add(db_order)
        db.flush()  # Generate db_order.id
        
        # Link order items and add
        for order_item in order_items_to_create:
            order_item.order_id = db_order.id
            db.add(order_item)
            
        db.commit()
        db.refresh(db_order)
        return db_order
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating order: {str(e)}"
        )

def delete_order(db: Session, order_id: int):
    # Fetch order
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        return None
        
    try:
        # Restore stock for each product in the cancelled order
        for item in db_order.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            if product:
                product.quantity_in_stock += item.quantity
                
        db.delete(db_order)
        db.commit()
        return db_order
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting order: {str(e)}"
        )

# ==========================================
# Dashboard statistics
# ==========================================

def get_dashboard_stats(db: Session, low_stock_threshold: int = 10):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    low_stock_products = db.query(models.Product).filter(
        models.Product.quantity_in_stock < low_stock_threshold
    ).order_by(models.Product.quantity_in_stock.asc()).all()
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock_products
    }


# ==========================================
# User CRUD
# ==========================================

def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_reset_token(db: Session, token: str):
    from datetime import datetime
    return db.query(models.User).filter(
        models.User.reset_token == token,
        models.User.reset_token_expires > datetime.utcnow()
    ).first()

def create_user(db: Session, user: schemas.UserCreate):
    from .auth import get_password_hash
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        is_google_user=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_google_user(db: Session, username: str, email: str):
    db_user = models.User(
        username=username,
        email=email,
        hashed_password=None,
        is_google_user=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

