from fastapi import FastAPI, APIRouter, HTTPException, Depends, Cookie, Request, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
import shutil
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from enum import Enum
import aiofiles
import requests
import bcrypt
from jose import JWTError, jwt
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create upload directory
UPLOAD_DIR = ROOT_DIR / "uploads" / "photos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 7 * 24 * 60  # 7 days

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Countries Enum
class Country(str, Enum):
    CH = "Schweiz"
    DE = "Deutschland"
    IT = "Italien"
    FR = "Frankreich"
    AT = "Österreich"

# Swiss Cantons
class SwissCantons(str, Enum):
    AG = "Aargau"
    AI = "Appenzell Innerrhoden"
    AR = "Appenzell Ausserrhoden"
    BE = "Bern"
    BL = "Basel-Landschaft"
    BS = "Basel-Stadt"
    FR = "Freiburg"
    GE = "Genf"
    GL = "Glarus"
    GR = "Graubünden"
    JU = "Jura"
    LU = "Luzern"
    NE = "Neuenburg"
    NW = "Nidwalden"
    OW = "Obwalden"
    SG = "St. Gallen"
    SH = "Schaffhausen"
    SO = "Solothurn"
    SZ = "Schwyz"
    TG = "Thurgau"
    TI = "Tessin"
    UR = "Uri"
    VD = "Waadt"
    VS = "Wallis"
    ZG = "Zug"
    ZH = "Zürich"

# German Bundesländer
class GermanStates(str, Enum):
    BW = "Baden-Württemberg"
    BY = "Bayern"
    BE = "Berlin"
    BB = "Brandenburg"
    HB = "Bremen"
    HH = "Hamburg"
    HE = "Hessen"
    MV = "Mecklenburg-Vorpommern"
    NI = "Niedersachsen"
    NW = "Nordrhein-Westfalen"
    RP = "Rheinland-Pfalz"
    SL = "Saarland"
    SN = "Sachsen"
    ST = "Sachsen-Anhalt"
    SH = "Schleswig-Holstein"
    TH = "Thüringen"

# Italian Regions
class ItalianRegions(str, Enum):
    ABR = "Abruzzen"
    BAS = "Basilikata"
    CAL = "Kalabrien"
    CAM = "Kampanien"
    EMR = "Emilia-Romagna"
    FVG = "Friaul-Julisch Venetien"
    LAZ = "Latium"
    LIG = "Ligurien"
    LOM = "Lombardei"
    MAR = "Marken"
    MOL = "Molise"
    PIE = "Piemont"
    PUG = "Apulien"
    SAR = "Sardinien"
    SIC = "Sizilien"
    TOS = "Toskana"
    TAA = "Trentino-Südtirol"
    UMB = "Umbrien"
    VAL = "Aostatal"
    VEN = "Venetien"

# French Regions
class FrenchRegions(str, Enum):
    ARA = "Auvergne-Rhône-Alpes"
    BFC = "Burgund-Franche-Comté"
    BRE = "Bretagne"
    CVL = "Centre-Val de Loire"
    COR = "Korsika"
    GES = "Grand Est"
    HDF = "Hauts-de-France"
    IDF = "Île-de-France"
    NOR = "Normandie"
    NAQ = "Nouvelle-Aquitaine"
    OCC = "Okzitanien"
    PDL = "Pays de la Loire"
    PAC = "Provence-Alpes-Côte d'Azur"

# Austrian States
class AustrianStates(str, Enum):
    BGL = "Burgenland"
    KTN = "Kärnten"
    NÖ = "Niederösterreich"
    OÖ = "Oberösterreich"
    SBG = "Salzburg"
    STK = "Steiermark"
    TIR = "Tirol"
    VLB = "Vorarlberg"
    WIE = "Wien"

# Categories Enum
class Category(str, Enum):
    HIKING = "Wanderung"
    ADVENTURE_PARK = "Erlebnisbad"
    AMUSEMENT_PARK = "Freizeitpark"
    PUBLIC_POOL = "Freibad"
    MUSEUM = "Museum"
    PLAYGROUND = "Spielplatz"
    ZOO = "Zoo/Tierpark"
    RESTAURANT = "Restaurant"
    VIEWPOINT = "Aussichtspunkt"
    LAKE = "See/Strand"
    CASTLE = "Schloss/Burg"
    CLIMBING = "Klettern"
    CYCLING = "Velofahren"
    WINTER_SPORTS = "Wintersport"
    OTHER = "Andere"

# Parking Situation Enum
class ParkingSituation(str, Enum):
    EXCELLENT = "Ausgezeichnet"
    GOOD = "Gut"
    LIMITED = "Begrenzt" 
    POOR = "Schlecht"
    NONE = "Keine Parkplätze"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    picture: Optional[str] = None
    is_oauth: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExcursionCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    address: str = Field(..., min_length=5, max_length=300)
    country: str  # Accept string, validate in endpoint
    region: str  # Accept string, validate in endpoint (canton/bundesland/région etc.)
    category: str  # Accept string, validate in endpoint
    website_url: Optional[str] = None
    has_grill: bool = False
    is_outdoor: bool = True
    is_free: bool = True
    parking_situation: str  # Accept string, validate in endpoint
    parking_is_free: bool = True

class Excursion(ExcursionCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_id: str
    author_name: str
    photos: List[str] = []
    average_rating: float = 0.0
    review_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=10, max_length=1000)

class Review(ReviewCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    excursion_id: str
    user_id: str
    user_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Auth functions
async def get_current_user(request: Request, session_token: str = Cookie(None, alias="session_token")):
    token = session_token
    
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # First try to verify as JWT token (normal login)
    payload = verify_token(token)
    if payload:
        user_id = payload.get("sub")
        if user_id:
            user = await db.users.find_one({"id": user_id})
            if user:
                return User(**user)
    
    # If not JWT, try as OAuth session token
    session = await db.sessions.find_one({"session_token": token})
    if session and datetime.now(timezone.utc) <= session["expires_at"]:
        user = await db.users.find_one({"id": session["user_id"]})
        if user:
            return User(**user)
    
    raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_optional_user(request: Request, session_token: str = Cookie(None, alias="session_token")):
    try:
        return await get_current_user(request, session_token)
    except HTTPException:
        return None

def prepare_for_mongo(data: dict) -> dict:
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('expires_at'), datetime):
        data['expires_at'] = data['expires_at'].isoformat()
    return data

def parse_from_mongo(item: dict) -> dict:
    """Parse datetime strings back from MongoDB"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('expires_at'), str):
        item['expires_at'] = datetime.fromisoformat(item['expires_at'])
    return item

# Password and JWT utilities
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "AusflugFinder API is running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Authentication Routes

# Traditional Login/Register
@api_router.post("/auth/register", response_model=Token)
async def register_user(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        picture=f"https://ui-avatars.com/api/?name={user_data.name}&background=10b981&color=fff",
        is_oauth=False
    )
    
    # Store user with hashed password
    user_dict = prepare_for_mongo(user.dict())
    user_dict["password_hash"] = hashed_password
    await db.users.insert_one(user_dict)
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    user_dict = user.dict()
    user_dict['created_at'] = user_dict['created_at'].isoformat() if user_dict.get('created_at') else None
    
    response = JSONResponse({
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    })
    
    response.set_cookie(
        key="session_token",
        value=access_token,
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return response

@api_router.post("/auth/login", response_model=Token)
async def login_user(credentials: UserLogin):
    # Find user by email
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc or user_doc.get("is_oauth", False):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = User(**user_doc)
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    user_dict = user.dict()
    user_dict['created_at'] = user_dict['created_at'].isoformat() if user_dict.get('created_at') else None
    
    response = JSONResponse({
        "access_token": access_token,
        "token_type": "bearer", 
        "user": user_dict
    })
    
    response.set_cookie(
        key="session_token",
        value=access_token,
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return response

# OAuth Login (existing)
@api_router.post("/auth/profile")
async def handle_auth_callback(request: Request):
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent auth API
    headers = {"X-Session-ID": session_id}
    try:
        response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers=headers
        )
        response.raise_for_status()
        auth_data = response.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid session")
    
    # Create or get user
    user_data = {
        "id": str(uuid.uuid4()),
        "email": auth_data["email"],
        "name": auth_data["name"],
        "picture": auth_data["picture"],
        "is_oauth": True,
        "created_at": datetime.now(timezone.utc)
    }
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": auth_data["email"]})
    if existing_user:
        user = User(**existing_user)
    else:
        user_dict = prepare_for_mongo(user_data)
        await db.users.insert_one(user_dict)
        user = User(**user_data)
    
    # Create session
    session_data = {
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "session_token": auth_data["session_token"],
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    
    session_dict = prepare_for_mongo(session_data)
    await db.sessions.insert_one(session_dict)
    
    # Create response with cookie
    response = JSONResponse({"user": user.dict()})
    response.set_cookie(
        key="session_token",
        value=auth_data["session_token"],
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600  # 7 days
    )
    
    return response

@api_router.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    # Remove all sessions for user
    await db.sessions.delete_many({"user_id": current_user.id})
    
    response = JSONResponse({"message": "Logged out successfully"})
    response.delete_cookie(key="session_token", path="/")
    return response

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Excursion Routes
@api_router.get("/excursions", response_model=List[Excursion])
async def get_excursions(
    canton: Optional[Canton] = None,
    category: Optional[Category] = None,
    is_free: Optional[bool] = None,
    is_outdoor: Optional[bool] = None,
    has_grill: Optional[bool] = None
):
    query = {}
    if canton:
        query["canton"] = canton
    if category:
        query["category"] = category
    if is_free is not None:
        query["is_free"] = is_free
    if is_outdoor is not None:
        query["is_outdoor"] = is_outdoor
    if has_grill is not None:
        query["has_grill"] = has_grill
    
    excursions = await db.excursions.find(query).sort("created_at", -1).to_list(length=None)
    return [Excursion(**exc) for exc in excursions]

@api_router.get("/excursions/{excursion_id}", response_model=Excursion)
async def get_excursion(excursion_id: str):
    excursion = await db.excursions.find_one({"id": excursion_id})
    if not excursion:
        raise HTTPException(status_code=404, detail="Excursion not found")
    return Excursion(**excursion)

@api_router.post("/excursions", response_model=Excursion)
async def create_excursion(
    excursion_data: ExcursionCreate,
    current_user: User = Depends(get_current_user)
):
    # Convert frontend enum keys to backend enum values
    excursion_dict = excursion_data.dict()
    
    # Map canton keys to values
    canton_map = {canton.name: canton.value for canton in Canton}
    canton_reverse_map = {canton.value: canton.value for canton in Canton}
    
    if excursion_dict['canton'] in canton_map:
        excursion_dict['canton'] = canton_map[excursion_dict['canton']]
    elif excursion_dict['canton'] not in canton_reverse_map:
        raise HTTPException(status_code=400, detail=f"Invalid canton: {excursion_dict['canton']}")
    
    # Map category keys to values  
    category_map = {category.name: category.value for category in Category}
    category_reverse_map = {category.value: category.value for category in Category}
    
    if excursion_dict['category'] in category_map:
        excursion_dict['category'] = category_map[excursion_dict['category']]
    elif excursion_dict['category'] not in category_reverse_map:
        raise HTTPException(status_code=400, detail=f"Invalid category: {excursion_dict['category']}")
        
    # Map parking situation keys to values
    parking_map = {parking.name: parking.value for parking in ParkingSituation}
    parking_reverse_map = {parking.value: parking.value for parking in ParkingSituation}
    
    if excursion_dict['parking_situation'] in parking_map:
        excursion_dict['parking_situation'] = parking_map[excursion_dict['parking_situation']]
    elif excursion_dict['parking_situation'] not in parking_reverse_map:
        raise HTTPException(status_code=400, detail=f"Invalid parking situation: {excursion_dict['parking_situation']}")
    
    excursion = Excursion(
        **excursion_dict,
        author_id=current_user.id,
        author_name=current_user.name
    )
    
    excursion_dict = prepare_for_mongo(excursion.dict())
    await db.excursions.insert_one(excursion_dict)
    return excursion

@api_router.put("/excursions/{excursion_id}", response_model=Excursion)
async def update_excursion(
    excursion_id: str,
    excursion_data: ExcursionCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if excursion exists and user owns it
    existing_excursion = await db.excursions.find_one({"id": excursion_id})
    if not existing_excursion:
        raise HTTPException(status_code=404, detail="Excursion not found")
    
    if existing_excursion["author_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this excursion")
    
    # Convert enum keys to values (same logic as create)
    excursion_dict = excursion_data.dict()
    
    # Map canton keys to values
    canton_map = {canton.name: canton.value for canton in Canton}
    canton_reverse_map = {canton.value: canton.value for canton in Canton}
    
    if excursion_dict['canton'] in canton_map:
        excursion_dict['canton'] = canton_map[excursion_dict['canton']]
    elif excursion_dict['canton'] not in canton_reverse_map:
        raise HTTPException(status_code=400, detail=f"Invalid canton: {excursion_dict['canton']}")
    
    # Map category keys to values  
    category_map = {category.name: category.value for category in Category}
    category_reverse_map = {category.value: category.value for category in Category}
    
    if excursion_dict['category'] in category_map:
        excursion_dict['category'] = category_map[excursion_dict['category']]
    elif excursion_dict['category'] not in category_reverse_map:
        raise HTTPException(status_code=400, detail=f"Invalid category: {excursion_dict['category']}")
        
    # Map parking situation keys to values
    parking_map = {parking.name: parking.value for parking in ParkingSituation}
    parking_reverse_map = {parking.value: parking.value for parking in ParkingSituation}
    
    if excursion_dict['parking_situation'] in parking_map:
        excursion_dict['parking_situation'] = parking_map[excursion_dict['parking_situation']]
    elif excursion_dict['parking_situation'] not in parking_reverse_map:
        raise HTTPException(status_code=400, detail=f"Invalid parking situation: {excursion_dict['parking_situation']}")
    
    # Update excursion in database
    await db.excursions.update_one(
        {"id": excursion_id},
        {"$set": excursion_dict}
    )
    
    # Return updated excursion
    updated_excursion = await db.excursions.find_one({"id": excursion_id})
    return Excursion(**updated_excursion)

@api_router.delete("/excursions/{excursion_id}")
async def delete_excursion(
    excursion_id: str,
    current_user: User = Depends(get_current_user)
):
    # Check if excursion exists and user owns it
    excursion = await db.excursions.find_one({"id": excursion_id})
    if not excursion:
        raise HTTPException(status_code=404, detail="Excursion not found")
    
    if excursion["author_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this excursion")
    
    # Delete all reviews for this excursion
    await db.reviews.delete_many({"excursion_id": excursion_id})
    
    # Delete the excursion
    await db.excursions.delete_one({"id": excursion_id})
    
    return {"message": "Excursion deleted successfully"}

@api_router.post("/excursions/{excursion_id}/photos")
async def upload_photos(
    excursion_id: str,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    # Check if excursion exists and user owns it
    excursion = await db.excursions.find_one({"id": excursion_id})
    if not excursion:
        raise HTTPException(status_code=404, detail="Excursion not found")
    
    if excursion["author_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    uploaded_files = []
    for file in files:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Only image files allowed")
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        uploaded_files.append(filename)
    
    # Update excursion photos
    await db.excursions.update_one(
        {"id": excursion_id},
        {"$push": {"photos": {"$each": uploaded_files}}}
    )
    
    return {"uploaded_files": uploaded_files}

# Review Routes
@api_router.get("/excursions/{excursion_id}/reviews", response_model=List[Review])
async def get_reviews(excursion_id: str):
    reviews = await db.reviews.find({"excursion_id": excursion_id}).sort("created_at", -1).to_list(length=None)
    return [Review(**review) for review in reviews]

@api_router.post("/excursions/{excursion_id}/reviews", response_model=Review)
async def create_review(
    excursion_id: str,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if excursion exists
    excursion = await db.excursions.find_one({"id": excursion_id})
    if not excursion:
        raise HTTPException(status_code=404, detail="Excursion not found")
    
    # Check if user already reviewed
    existing_review = await db.reviews.find_one({
        "excursion_id": excursion_id,
        "user_id": current_user.id
    })
    if existing_review:
        raise HTTPException(status_code=400, detail="You already reviewed this excursion")
    
    review = Review(
        **review_data.dict(),
        excursion_id=excursion_id,
        user_id=current_user.id,
        user_name=current_user.name
    )
    
    review_dict = prepare_for_mongo(review.dict())
    await db.reviews.insert_one(review_dict)
    
    # Update excursion rating
    reviews = await db.reviews.find({"excursion_id": excursion_id}).to_list(length=None)
    average_rating = sum(r["rating"] for r in reviews) / len(reviews)
    
    await db.excursions.update_one(
        {"id": excursion_id},
        {
            "$set": {
                "average_rating": round(average_rating, 1),
                "review_count": len(reviews)
            }
        }
    )
    
    return review

# User Routes
@api_router.get("/user/reviews", response_model=List[Review])
async def get_user_reviews(current_user: User = Depends(get_current_user)):
    reviews = await db.reviews.find({"user_id": current_user.id}).sort("created_at", -1).to_list(length=None)
    return [Review(**review) for review in reviews]

# Utility Routes
@api_router.get("/cantons")
async def get_cantons():
    return [{"value": canton.name, "label": canton.value} for canton in Canton]

@api_router.get("/categories")
async def get_categories():
    return [{"value": category.name, "label": category.value} for category in Category]

@api_router.get("/parking-situations")
async def get_parking_situations():
    return [{"value": parking.name, "label": parking.value} for parking in ParkingSituation]

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()