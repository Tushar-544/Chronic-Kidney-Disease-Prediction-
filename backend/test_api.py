"""
API Test Script
===============
Simple script to test the Kidney Disease Classification API
"""

import requests
import json
from pathlib import Path


def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    response = requests.get("http://localhost:8000/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_model_info():
    """Test model info endpoint"""
    print("\n=== Testing Model Info Endpoint ===")
    response = requests.get("http://localhost:8000/model/info")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_prediction(image_path: str):
    """Test single prediction"""
    print(f"\n=== Testing Prediction with {image_path} ===")
    
    if not Path(image_path).exists():
        print(f"Error: Image file not found: {image_path}")
        return False
    
    with open(image_path, 'rb') as f:
        files = {'file': (Path(image_path).name, f, 'image/jpeg')}
        response = requests.post(
            "http://localhost:8000/predict",
            files=files
        )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        # Extract key info
        prediction = result['prediction']
        print(f"\n📊 Prediction Summary:")
        print(f"  Predicted Class: {prediction['predicted_class']}")
        print(f"  Confidence: {prediction['confidence']:.2%}")
        print(f"  Processing Time: {prediction['processing_time_ms']:.2f}ms")
        print(f"\n  All Probabilities:")
        for cls, prob in prediction['probabilities'].items():
            print(f"    {cls}: {prob:.4f} ({prob*100:.2f}%)")
        
        return True
    else:
        print(f"Error: {response.text}")
        return False


def test_batch_prediction(image_paths: list):
    """Test batch prediction"""
    print(f"\n=== Testing Batch Prediction with {len(image_paths)} images ===")
    
    files = []
    for path in image_paths:
        if Path(path).exists():
            files.append(('files', (Path(path).name, open(path, 'rb'), 'image/jpeg')))
        else:
            print(f"Warning: Image not found: {path}")
    
    if not files:
        print("Error: No valid images found")
        return False
    
    response = requests.post(
        "http://localhost:8000/predict/batch",
        files=files
    )
    
    # Close file handles
    for _, (_, f, _) in files:
        f.close()
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        return True
    else:
        print(f"Error: {response.text}")
        return False


def test_invalid_file():
    """Test with invalid file type"""
    print("\n=== Testing Invalid File Type ===")
    
    # Create a text file
    test_file_path = "test_invalid.txt"
    with open(test_file_path, 'w') as f:
        f.write("This is not an image")
    
    with open(test_file_path, 'rb') as f:
        files = {'file': ('test.txt', f, 'text/plain')}
        response = requests.post(
            "http://localhost:8000/predict",
            files=files
        )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Cleanup
    Path(test_file_path).unlink()
    
    return response.status_code == 400  # Should fail with 400


def run_all_tests():
    """Run all tests"""
    print("=" * 70)
    print("KIDNEY DISEASE CLASSIFICATION API - TEST SUITE")
    print("=" * 70)
    
    results = {}
    
    # Test 1: Health
    results['health'] = test_health()
    
    # Test 2: Model Info
    results['model_info'] = test_model_info()
    
    # Test 3: Invalid file (should fail gracefully)
    results['invalid_file'] = test_invalid_file()
    
    # Test 4: Single Prediction (you need to provide an image path)
    # Uncomment and update the path
    # results['prediction'] = test_prediction("path/to/test/image.jpg")
    
    # Test 5: Batch Prediction (you need to provide image paths)
    # Uncomment and update the paths
    # results['batch'] = test_batch_prediction([
    #     "path/to/image1.jpg",
    #     "path/to/image2.jpg"
    # ])
    
    # Print summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    for test_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name:20} {status}")
    
    print("=" * 70)
    
    total = len(results)
    passed = sum(results.values())
    print(f"\nTotal: {passed}/{total} tests passed")
    
    return all(results.values())


if __name__ == "__main__":
    import sys
    
    # Check if API is running
    try:
        requests.get("http://localhost:8000/health", timeout=5)
    except requests.exceptions.ConnectionError:
        print("Error: API server is not running!")
        print("Please start the server with: uvicorn main:app --reload")
        sys.exit(1)
    
    # Run tests
    success = run_all_tests()
    sys.exit(0 if success else 1)
