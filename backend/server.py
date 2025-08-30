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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create upload directory
UPLOAD_DIR = ROOT_DIR / "uploads" / "photos"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Swiss Cantons Enum
class Canton(str, Enum):
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
    picture: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    canton: Canton
    category: Category
    website_url: Optional[str] = None
    has_grill: bool = False
    is_outdoor: bool = True
    is_free: bool = True
    parking_situation: ParkingSituation
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
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check session in database
    session = await db.sessions.find_one({"session_token": session_token})
    if not session or datetime.now(timezone.utc) > session["expires_at"]:
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one({"id": session["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

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

# Authentication Routes
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
    excursion = Excursion(
        **excursion_data.dict(),
        author_id=current_user.id,
        author_name=current_user.name
    )
    
    excursion_dict = prepare_for_mongo(excursion.dict())
    await db.excursions.insert_one(excursion_dict)
    return excursion

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