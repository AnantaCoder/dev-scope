// Package repository provides DevAI data access layer
package repository

import (
	"context"
	"database/sql"
	"time"

	"github-api/backend/internal/database"
	"github-api/backend/internal/models"
)

// DevAIRepository handles DevAI conversation data operations
type DevAIRepository struct {
	db *database.DB
}

// NewDevAIRepository creates a new DevAI repository
func NewDevAIRepository(db *database.DB) *DevAIRepository {
	return &DevAIRepository{db: db}
}

// CreateConversation creates a new conversation for a user
func (r *DevAIRepository) CreateConversation(ctx context.Context, userID int, title string) (*models.DevAIConversation, error) {
	if title == "" {
		title = "New Chat"
	}

	query := `
		INSERT INTO devai_conversations (user_id, title, created_at, updated_at)
		VALUES ($1, $2, $3, $3)
		RETURNING id, user_id, title, created_at, updated_at
	`

	now := time.Now()
	var conv models.DevAIConversation
	err := r.db.QueryRowContext(ctx, query, userID, title, now).Scan(
		&conv.ID, &conv.UserID, &conv.Title, &conv.CreatedAt, &conv.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &conv, nil
}

// GetConversationsByUserID retrieves conversations for a user with pagination
func (r *DevAIRepository) GetConversationsByUserID(ctx context.Context, userID int, limit, offset int) ([]models.DevAIConversation, int, error) {
	// Get total count first
	countQuery := `SELECT COUNT(*) FROM devai_conversations WHERE user_id = $1`
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, userID).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Default limit
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	query := `
		SELECT id, user_id, title, created_at, updated_at
		FROM devai_conversations
		WHERE user_id = $1
		ORDER BY updated_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.QueryContext(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var conversations []models.DevAIConversation
	for rows.Next() {
		var conv models.DevAIConversation
		if err := rows.Scan(&conv.ID, &conv.UserID, &conv.Title, &conv.CreatedAt, &conv.UpdatedAt); err != nil {
			return nil, 0, err
		}
		conversations = append(conversations, conv)
	}

	return conversations, total, rows.Err()
}

// GetConversationByID retrieves a single conversation by ID (with user ownership check)
func (r *DevAIRepository) GetConversationByID(ctx context.Context, id, userID int) (*models.DevAIConversation, error) {
	query := `
		SELECT id, user_id, title, created_at, updated_at
		FROM devai_conversations
		WHERE id = $1 AND user_id = $2
	`

	var conv models.DevAIConversation
	err := r.db.QueryRowContext(ctx, query, id, userID).Scan(
		&conv.ID, &conv.UserID, &conv.Title, &conv.CreatedAt, &conv.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &conv, nil
}

// UpdateConversationTitle updates the title of a conversation
func (r *DevAIRepository) UpdateConversationTitle(ctx context.Context, id, userID int, title string) error {
	query := `
		UPDATE devai_conversations
		SET title = $1, updated_at = $2
		WHERE id = $3 AND user_id = $4
	`

	_, err := r.db.ExecContext(ctx, query, title, time.Now(), id, userID)
	return err
}

// UpdateConversationTimestamp updates the updated_at timestamp
func (r *DevAIRepository) UpdateConversationTimestamp(ctx context.Context, id int) error {
	query := `UPDATE devai_conversations SET updated_at = $1 WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, time.Now(), id)
	return err
}

// DeleteConversation deletes a conversation (cascade deletes messages)
func (r *DevAIRepository) DeleteConversation(ctx context.Context, id, userID int) error {
	query := `DELETE FROM devai_conversations WHERE id = $1 AND user_id = $2`
	_, err := r.db.ExecContext(ctx, query, id, userID)
	return err
}

// AddMessage adds a message to a conversation
func (r *DevAIRepository) AddMessage(ctx context.Context, conversationID int, role, content string, mentions *string) (*models.DevAIMessage, error) {
	query := `
		INSERT INTO devai_messages (conversation_id, role, content, mentions, created_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, conversation_id, role, content, mentions, created_at
	`

	now := time.Now()
	var msg models.DevAIMessage
	var mentionsNullable sql.NullString

	err := r.db.QueryRowContext(ctx, query, conversationID, role, content, mentions, now).Scan(
		&msg.ID, &msg.ConversationID, &msg.Role, &msg.Content, &mentionsNullable, &msg.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	if mentionsNullable.Valid {
		msg.Mentions = mentionsNullable.String
	}

	return &msg, nil
}

// GetMessagesByConversationID retrieves all messages for a conversation
func (r *DevAIRepository) GetMessagesByConversationID(ctx context.Context, conversationID int) ([]models.DevAIMessage, error) {
	query := `
		SELECT id, conversation_id, role, content, mentions, created_at
		FROM devai_messages
		WHERE conversation_id = $1
		ORDER BY created_at ASC
	`

	rows, err := r.db.QueryContext(ctx, query, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.DevAIMessage
	for rows.Next() {
		var msg models.DevAIMessage
		var mentionsNullable sql.NullString

		if err := rows.Scan(&msg.ID, &msg.ConversationID, &msg.Role, &msg.Content, &mentionsNullable, &msg.CreatedAt); err != nil {
			return nil, err
		}

		if mentionsNullable.Valid {
			msg.Mentions = mentionsNullable.String
		}
		messages = append(messages, msg)
	}

	return messages, rows.Err()
}

// GetConversationWithMessages retrieves a conversation with all its messages
func (r *DevAIRepository) GetConversationWithMessages(ctx context.Context, id, userID int) (*models.DevAIConversationWithMessages, error) {
	conv, err := r.GetConversationByID(ctx, id, userID)
	if err != nil || conv == nil {
		return nil, err
	}

	messages, err := r.GetMessagesByConversationID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &models.DevAIConversationWithMessages{
		DevAIConversation: *conv,
		Messages:          messages,
	}, nil
}
