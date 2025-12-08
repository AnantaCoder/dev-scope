// Package cache provides thread-safe LRU cache with TTL
package cache

import (
	"fmt"
	"sync"
	"time"

	"github-api/internal/models"
)

// Entry represents a cache entry with expiry
type Entry struct {
	Data      models.GitHubUser
	ExpiresAt time.Time
}

// Cache represents a thread-safe LRU cache with TTL
type Cache struct {
	data        map[string]Entry
	accessOrder []string
	mu          sync.RWMutex
	maxSize     int
	ttl         time.Duration
	hits        int64
	misses      int64
}

// New creates a new cache instance
func New(maxSize int, ttl time.Duration) *Cache {
	return &Cache{
		data:        make(map[string]Entry),
		accessOrder: make([]string, 0),
		maxSize:     maxSize,
		ttl:         ttl,
	}
}

// Get retrieves a value from cache
func (c *Cache) Get(key string) (models.GitHubUser, bool) {
	c.mu.RLock()
	entry, exists := c.data[key]
	c.mu.RUnlock()

	if !exists {
		c.mu.Lock()
		c.misses++
		c.mu.Unlock()
		return models.GitHubUser{}, false
	}

	// Check if expired
	if time.Now().After(entry.ExpiresAt) {
		c.mu.Lock()
		delete(c.data, key)
		c.removeFromAccessOrder(key)
		c.misses++
		c.mu.Unlock()
		return models.GitHubUser{}, false
	}

	// Update access order
	c.mu.Lock()
	c.updateAccessOrder(key)
	c.hits++
	c.mu.Unlock()

	return entry.Data, true
}

// Set adds a value to cache
func (c *Cache) Set(key string, value models.GitHubUser) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Remove oldest if at capacity
	if len(c.data) >= c.maxSize {
		if _, exists := c.data[key]; !exists {
			if len(c.accessOrder) > 0 {
				oldest := c.accessOrder[0]
				delete(c.data, oldest)
				c.accessOrder = c.accessOrder[1:]
			}
		}
	}

	c.data[key] = Entry{
		Data:      value,
		ExpiresAt: time.Now().Add(c.ttl),
	}
	c.updateAccessOrder(key)
}

// Clear removes all cache entries
func (c *Cache) Clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data = make(map[string]Entry)
	c.accessOrder = make([]string, 0)
	c.hits = 0
	c.misses = 0
}

// Size returns current cache size
func (c *Cache) Size() int {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return len(c.data)
}

// Stats returns cache statistics
func (c *Cache) Stats() models.CacheStats {
	c.mu.RLock()
	defer c.mu.RUnlock()

	total := c.hits + c.misses
	hitRate := 0.0
	if total > 0 {
		hitRate = float64(c.hits) / float64(total) * 100
	}

	return models.CacheStats{
		Size:    len(c.data),
		Hits:    c.hits,
		Misses:  c.misses,
		HitRate: fmt.Sprintf("%.2f", hitRate),
	}
}

func (c *Cache) updateAccessOrder(key string) {
	// Remove from current position
	c.removeFromAccessOrder(key)
	// Add to end
	c.accessOrder = append(c.accessOrder, key)
}

func (c *Cache) removeFromAccessOrder(key string) {
	for i, k := range c.accessOrder {
		if k == key {
			c.accessOrder = append(c.accessOrder[:i], c.accessOrder[i+1:]...)
			break
		}
	}
}
