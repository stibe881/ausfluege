import requests
import sys
from datetime import datetime

class AusflugFinderAPITester:
    def __init__(self, base_url="https://ausflugfinder.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        json_data = response.json()
                        print(f"Response: {json_data}")
                    except:
                        print(f"Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}...")

            return success, response

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None

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

def main():
    print("🚀 Starting AusflugFinder API Tests...")
    
    tester = AusflugFinderAPITester()
    
    # Test basic endpoints
    tester.test_basic_endpoints()
    
    # Print results
    print(f"\n📊 API Tests Summary:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("✅ All API tests passed! Backend is accessible.")
        return 0
    else:
        print("❌ Some API tests failed. Check backend connectivity.")
        return 1

if __name__ == "__main__":
    sys.exit(main())