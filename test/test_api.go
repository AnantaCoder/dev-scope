package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const BaseURL = "http://localhost:8000"

func testEndpoint(name, method, url string, body interface{}) {
	fmt.Println("\n" + "=" + "===============================================================")
	fmt.Printf("Testing: %s\n", name)
	fmt.Println("=" + "===============================================================")

	var req *http.Request
	var err error

	if body != nil {
		jsonBody, _ := json.Marshal(body)
		req, err = http.NewRequest(method, url, bytes.NewBuffer(jsonBody))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, err = http.NewRequest(method, url, nil)
	}

	if err != nil {
		fmt.Printf("❌ Error creating request: %v\n", err)
		return
	}

	start := time.Now()
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	elapsed := time.Since(start)

	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}
	defer resp.Body.Close()

	fmt.Printf("Status Code: %d\n", resp.StatusCode)
	fmt.Printf("Response Time: %.3fs\n", elapsed.Seconds())

	bodyBytes, _ := io.ReadAll(resp.Body)

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err == nil {
		fmt.Println("\nResponse:")
		prettyJSON, _ := json.MarshalIndent(result, "", "  ")
		fmt.Println(string(prettyJSON))
	} else {
		fmt.Println(string(bodyBytes))
	}
}

func testHome() {
	testEndpoint("Home Endpoint", "GET", BaseURL+"/", nil)
}

func testHealth() {
	testEndpoint("Health Check", "GET", BaseURL+"/api/health", nil)
}

func testCacheStats() {
	testEndpoint("Cache Statistics", "GET", BaseURL+"/api/cache/stats", nil)
}

func testGetUser(username string) {
	testEndpoint(
		fmt.Sprintf("GET User: %s", username),
		"GET",
		BaseURL+"/api/status/"+username,
		nil,
	)
}

func testPostUser(username string) {
	testEndpoint(
		fmt.Sprintf("POST User: %s", username),
		"POST",
		BaseURL+"/api/status",
		map[string]string{"username": username},
	)
}

func testBatch(usernames []string) {
	testEndpoint(
		fmt.Sprintf("Batch Request (%d users)", len(usernames)),
		"POST",
		BaseURL+"/api/batch",
		map[string][]string{"usernames": usernames},
	)
}

func testCachePerformance() {
	fmt.Println("\n" + "=" + "===============================================================")
	fmt.Println("Testing: Cache Performance")
	fmt.Println("=" + "===============================================================")

	username := "torvalds"

	// First request (no cache)
	fmt.Println("\n1st request (no cache):")
	start := time.Now()
	resp1, _ := http.Get(BaseURL + "/api/status/" + username)
	time1 := time.Since(start)
	defer resp1.Body.Close()

	var result1 map[string]interface{}
	json.NewDecoder(resp1.Body).Decode(&result1)

	fmt.Printf("   Time: %.3fs\n", time1.Seconds())
	fmt.Printf("   Cached: %v\n", result1["cached"])

	// Second request (should be cached)
	fmt.Println("\n2nd request (from cache):")
	start = time.Now()
	resp2, _ := http.Get(BaseURL + "/api/status/" + username)
	time2 := time.Since(start)
	defer resp2.Body.Close()

	var result2 map[string]interface{}
	json.NewDecoder(resp2.Body).Decode(&result2)

	fmt.Printf("   Time: %.3fs\n", time2.Seconds())
	fmt.Printf("   Cached: %v\n", result2["cached"])

	speedup := time1.Seconds() / time2.Seconds()
	fmt.Printf("\n⚡ Speedup: %.1fx faster\n", speedup)
	fmt.Printf("   Saved: %.0fms\n", (time1.Seconds()-time2.Seconds())*1000)
}

func testClearCache() {
	testEndpoint("Clear Cache", "POST", BaseURL+"/api/cache/clear", nil)
}

func main() {
	fmt.Println("=" + "===============================================================")
	fmt.Println("GitHub Status API - Go Test Suite")
	fmt.Println("=" + "===============================================================")
	fmt.Println("Make sure the server is running on http://localhost:8000")
	fmt.Println("Run: go run main.go")

	// Check if server is running
	resp, err := http.Get(BaseURL + "/api/health")
	if err != nil {
		fmt.Printf("\n❌ Error: Could not connect to server!\n")
		fmt.Printf("Make sure the server is running: go run main.go\n")
		return
	}
	resp.Body.Close()

	// Run tests
	testHome()
	testHealth()
	testGetUser("torvalds")
	testCachePerformance()
	testPostUser("gvanrossum")
	testBatch([]string{"octocat", "torvalds", "gvanrossum"})
	testCacheStats()
	testClearCache()
	testCacheStats()

	fmt.Println("\n" + "=" + "===============================================================")
	fmt.Println("✅ All tests completed!")
	fmt.Println("=" + "===============================================================")
}
