// Package models defines data structures for DevAI chat
package models

import (
	"time"
)

// DevAIConversation represents a chat conversation
type DevAIConversation struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	Title     string    `json:"title" db:"title"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// DevAIMessage represents a message in a conversation
type DevAIMessage struct {
	ID             int       `json:"id" db:"id"`
	ConversationID int       `json:"conversation_id" db:"conversation_id"`
	Role           string    `json:"role" db:"role"`
	Content        string    `json:"content" db:"content"`
	Mentions       string    `json:"mentions,omitempty" db:"mentions"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

// DevAIConversationWithMessages combines conversation with its messages
type DevAIConversationWithMessages struct {
	DevAIConversation
	Messages []DevAIMessage `json:"messages"`
}
