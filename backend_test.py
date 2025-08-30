import requests
import sys
from datetime import datetime
import uuid

class AusflugFinderAPITester:
    def __init__(self, base_url="https://ausflugfinder.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.jwt_token = None
        self.test_user_id = None
        self.test_excursion_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_token=None, cookies=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, cookies=cookies, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, cookies=cookies, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        json_data = response.json()
                        print(f"Response: {json_data}")
                        return success, response, json_data
                    except:
                        print(f"Response: {response.text[:200]}...")
                        return success, response, None
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}...")

            return success, response, None

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None, None

    def test_basic_endpoints(self):
        """Test basic API endpoints"""
        print("=== Testing Basic API Endpoints ===")
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test health endpoint
        self.run_test("Health Check", "GET", "health", 200)
        
        # Test utility endpoints
        self.run_test("Get Cantons", "GET", "cantons", 200)
        self.run_test("Get Categories", "GET", "categories", 200)
        self.run_test("Get Parking Situations", "GET", "parking-situations", 200)
        
        # Test excursions endpoint (should return empty list initially)
        self.run_test("Get Excursions", "GET", "excursions", 200)

    def test_authentication_system(self):
        """Test the dual authentication system"""
        print("\n=== Testing DUAL AUTHENTICATION SYSTEM ===")
        
        # Generate unique test user data
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_{timestamp}@example.com"
        test_password = "testpassword123"
        test_name = f"Test User {timestamp}"
        
        print(f"Using test credentials: {test_email} / {test_password}")
        
        # Test 1: User Registration (Traditional Auth)
        print("\n--- Testing Traditional Registration ---")
        registration_data = {
            "name": test_name,
            "email": test_email,
            "password": test_password
        }
        
        success, response, json_data = self.run_test(
            "User Registration", 
            "POST", 
            "auth/register", 
            200, 
            registration_data
        )
        
        if success and json_data:
            self.jwt_token = json_data.get('access_token')
            user_data = json_data.get('user', {})
            self.test_user_id = user_data.get('id')
            print(f"✅ Registration successful! JWT Token: {self.jwt_token[:20]}...")
            print(f"✅ User ID: {self.test_user_id}")
            print(f"✅ User is_oauth: {user_data.get('is_oauth', 'N/A')}")
        else:
            print("❌ Registration failed - cannot continue with auth tests")
            return False
        
        # Test 2: Duplicate Registration (Should fail)
        print("\n--- Testing Duplicate Registration ---")
        self.run_test(
            "Duplicate Registration", 
            "POST", 
            "auth/register", 
            400, 
            registration_data
        )
        
        # Test 3: Traditional Login
        print("\n--- Testing Traditional Login ---")
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        success, response, json_data = self.run_test(
            "User Login", 
            "POST", 
            "auth/login", 
            200, 
            login_data
        )
        
        if success and json_data:
            login_token = json_data.get('access_token')
            print(f"✅ Login successful! JWT Token: {login_token[:20]}...")
        
        # Test 4: Invalid Login
        print("\n--- Testing Invalid Login ---")
        invalid_login_data = {
            "email": test_email,
            "password": "wrongpassword"
        }
        
        self.run_test(
            "Invalid Login", 
            "POST", 
            "auth/login", 
            401, 
            invalid_login_data
        )
        
        # Test 5: Get Current User (JWT Auth)
        print("\n--- Testing JWT Authentication ---")
        success, response, json_data = self.run_test(
            "Get Current User (JWT)", 
            "GET", 
            "auth/me", 
            200, 
            auth_token=self.jwt_token
        )
        
        if success and json_data:
            print(f"✅ JWT Auth working! User: {json_data.get('name')}")
        
        # Test 6: Unauthenticated Access
        print("\n--- Testing Unauthenticated Access ---")
        self.run_test(
            "Unauthenticated Access", 
            "GET", 
            "auth/me", 
            401
        )
        
        return True

    def test_protected_routes(self):
        """Test protected routes with JWT authentication"""
        print("\n=== Testing Protected Routes with JWT ===")
        
        if not self.jwt_token:
            print("❌ No JWT token available - skipping protected route tests")
            return False
        
        # Test 1: Create Excursion (Protected)
        print("\n--- Testing Create Excursion (Protected) ---")
        excursion_data = {
            "title": "Test Wanderung JWT",
            "description": "Eine schöne Testwanderung für JWT Authentication",
            "address": "Teststraße 123, 8001 Zürich",
            "canton": "Zürich",
            "category": "Wanderung",
            "website_url": "https://test.example.com",
            "has_grill": True,
            "is_outdoor": True,
            "is_free": True,
            "parking_situation": "Gut",
            "parking_is_free": True
        }
        
        success, response, json_data = self.run_test(
            "Create Excursion (JWT Auth)", 
            "POST", 
            "excursions", 
            200, 
            excursion_data,
            auth_token=self.jwt_token
        )
        
        if success and json_data:
            self.test_excursion_id = json_data.get('id')
            print(f"✅ Excursion created! ID: {self.test_excursion_id}")
        
        # Test 2: Create Excursion without Auth (Should fail)
        print("\n--- Testing Create Excursion (No Auth) ---")
        self.run_test(
            "Create Excursion (No Auth)", 
            "POST", 
            "excursions", 
            401, 
            excursion_data
        )
        
        # Test 3: Create Review (Protected)
        if self.test_excursion_id:
            print("\n--- Testing Create Review (Protected) ---")
            review_data = {
                "rating": 5,
                "comment": "Fantastische Wanderung! Sehr empfehlenswert für die ganze Familie."
            }
            
            success, response, json_data = self.run_test(
                "Create Review (JWT Auth)", 
                "POST", 
                f"excursions/{self.test_excursion_id}/reviews", 
                200, 
                review_data,
                auth_token=self.jwt_token
            )
            
            if success and json_data:
                print(f"✅ Review created! Rating: {json_data.get('rating')}")
        
        return True

    def test_data_persistence(self):
        """Test that data persists correctly"""
        print("\n=== Testing Data Persistence ===")
        
        # Test 1: Get All Excursions (Should include our test excursion)
        success, response, json_data = self.run_test(
            "Get All Excursions", 
            "GET", 
            "excursions", 
            200
        )
        
        if success and json_data and isinstance(json_data, list):
            print(f"✅ Found {len(json_data)} excursions in database")
            
            # Check if our test excursion exists
            test_excursion = None
            for exc in json_data:
                if exc.get('id') == self.test_excursion_id:
                    test_excursion = exc
                    break
            
            if test_excursion:
                print(f"✅ Test excursion found: {test_excursion.get('title')}")
                print(f"✅ Author: {test_excursion.get('author_name')}")
                print(f"✅ Review count: {test_excursion.get('review_count', 0)}")
            else:
                print("❌ Test excursion not found in list")
        
        # Test 2: Get Specific Excursion
        if self.test_excursion_id:
            success, response, json_data = self.run_test(
                "Get Specific Excursion", 
                "GET", 
                f"excursions/{self.test_excursion_id}", 
                200
            )
            
            if success and json_data:
                print(f"✅ Excursion details retrieved: {json_data.get('title')}")
        
        # Test 3: Get Reviews for Excursion
        if self.test_excursion_id:
            success, response, json_data = self.run_test(
                "Get Excursion Reviews", 
                "GET", 
                f"excursions/{self.test_excursion_id}/reviews", 
                200
            )
            
            if success and json_data and isinstance(json_data, list):
                print(f"✅ Found {len(json_data)} reviews for excursion")
                if len(json_data) > 0:
                    review = json_data[0]
                    print(f"✅ Review by: {review.get('user_name')}")
                    print(f"✅ Rating: {review.get('rating')}/5")

def main():
    print("🚀 Starting COMPREHENSIVE AusflugFinder API Tests...")
    print("🔐 Testing DUAL AUTHENTICATION SYSTEM")
    
    tester = AusflugFinderAPITester()
    
    # Test basic endpoints first
    tester.test_basic_endpoints()
    
    # Test authentication system
    auth_success = tester.test_authentication_system()
    
    if auth_success:
        # Test protected routes
        tester.test_protected_routes()
        
        # Test data persistence
        tester.test_data_persistence()
    
    # Print final results
    print(f"\n📊 COMPREHENSIVE API Tests Summary:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("✅ ALL API TESTS PASSED! Dual authentication system working perfectly.")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"❌ {failed_tests} API tests failed. Check authentication implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())