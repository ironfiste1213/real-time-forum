package repo

import (
	"log"

	"real-time-forum/internal/models"
)

// CreatePrivateMessage inserts a new private message into the database
func CreatePrivateMessage(message *models.PrivateMessage) error {
	query := `
		INSERT INTO private_messages (sender_id, receiver_id, content, created_at, is_read)
		VALUES (?, ?, ?, ?, ?)
	`
	_, err := DB.Exec(query, message.SenderID, message.ReceiverID, message.Content, message.CreatedAt, message.IsRead)
	if err != nil {
		log.Printf("[messages.go:CreatePrivateMessage] Error creating private message: %v", err)
		return err
	}
	return nil
}

// GetPrivateMessagesBetweenUsers retrieves private messages between two users
func GetPrivateMessagesBetweenUsers(userID1, userID2 int, limit, offset int) ([]models.PrivateMessage, error) {
	query := `
		SELECT id, sender_id, receiver_id, content, created_at, is_read
		FROM private_messages
		WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`
	rows, err := DB.Query(query, userID1, userID2, userID2, userID1, limit, offset)
	if err != nil {
		log.Printf("[messages.go:GetPrivateMessagesBetweenUsers] Error querying private messages: %v", err)
		return nil, err
	}
	defer rows.Close()

	var messages []models.PrivateMessage
	for rows.Next() {
		var msg models.PrivateMessage
		err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &msg.CreatedAt, &msg.IsRead)
		if err != nil {
			log.Printf("[messages.go:GetPrivateMessagesBetweenUsers] Error scanning private message: %v", err)
			return nil, err
		}
		messages = append(messages, msg)
	}

	// Reverse to get chronological order (oldest first)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

// MarkMessagesAsRead marks messages from sender to receiver as read
func MarkMessagesAsRead(senderID, receiverID int) error {
	query := `
		UPDATE private_messages
		SET is_read = TRUE
		WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE
	`
	_, err := DB.Exec(query, senderID, receiverID)
	if err != nil {
		log.Printf("[messages.go:MarkMessagesAsRead] Error marking messages as read: %v", err)
		return err
	}
	return nil
}

// GetUnreadMessageCount returns the count of unread messages for a user
func GetUnreadMessageCount(userID int) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM private_messages
		WHERE receiver_id = ? AND is_read = FALSE
	`
	var count int
	err := DB.QueryRow(query, userID).Scan(&count)
	if err != nil {
		log.Printf("[messages.go:GetUnreadMessageCount] Error getting unread message count: %v", err)
		return 0, err
	}
	return count, nil
}
func GetRecentConversations(userID int, limit int) ([]map[string]interface{}, error) {
	query := `
		SELECT
			u.id            AS other_user_id,
			u.nickname,
			pm.content      AS last_message,
			pm.created_at   AS last_message_time,
			(
				SELECT COUNT(*)
				FROM private_messages
				WHERE receiver_id = ?
				  AND sender_id = u.id
				  AND is_read = FALSE
			) AS unread_count
		FROM users u
		JOIN private_messages pm ON pm.id = (
			SELECT id
			FROM private_messages
			WHERE (sender_id = ? AND receiver_id = u.id)
			   OR (sender_id = u.id AND receiver_id = ?)
			ORDER BY created_at DESC
			LIMIT 1
		)
		WHERE u.id != ?
		  AND EXISTS (
			SELECT 1
			FROM private_messages
			WHERE (sender_id = ? AND receiver_id = u.id)
			   OR (sender_id = u.id AND receiver_id = ?)
		  )
		ORDER BY pm.created_at DESC
		LIMIT ?
	`

	rows, err := DB.Query(query, userID, userID, userID, userID, userID, userID, limit)
	if err != nil {
		log.Printf("[messages.go:GetRecentConversations] Error getting recent conversations: %v", err)
		return nil, err
	}
	defer rows.Close()

	var conversations []map[string]interface{}
	for rows.Next() {
		var otherUserID int
		var nickname, lastMessage string
		var lastMessageTime string
		var unreadCount int

		if err := rows.Scan(&otherUserID, &nickname, &lastMessage, &lastMessageTime, &unreadCount); err != nil {
			log.Printf("[messages.go:GetRecentConversations] Error scanning conversation: %v", err)
			continue
		}

		conversations = append(conversations, map[string]interface{}{
			"user_id":           otherUserID,
			"nickname":          nickname,
			"last_message":      lastMessage,
			"last_message_time": lastMessageTime,
			"unread_count":      unreadCount,
		})
	}

	if err := rows.Err(); err != nil {
		log.Printf("[messages.go:GetRecentConversations] Row iteration error: %v", err)
		return nil, err
	}

	return conversations, nil
}