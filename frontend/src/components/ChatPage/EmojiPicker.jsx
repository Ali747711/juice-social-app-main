// /frontend/components/ChatPage/EmojiPicker.jsx
import React from 'react';
import styles from './EmojiPicker.module.css';

// Common emoji categories
const emojiCategories = [
  {
    name: 'Smileys & Emotion',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜']
  },
  {
    name: 'People & Body',
    emojis: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉']
  },
  {
    name: 'Objects & Symbols',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟']
  }
];

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  return (
    <div className={styles.emojiPickerContainer}>
      <div className={styles.emojiPickerHeader}>
        <h4 className={styles.emojiPickerTitle}>Emojis</h4>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.emojiPickerBody}>
        {emojiCategories.map((category, index) => (
          <div key={index} className={styles.emojiCategory}>
            <h5 className={styles.categoryName}>{category.name}</h5>
            <div className={styles.emojiGrid}>
              {category.emojis.map((emoji, emojiIndex) => (
                <button
                  key={emojiIndex}
                  className={styles.emojiButton}
                  onClick={() => onEmojiSelect(emoji)}
                  type="button"
                  aria-label={`Emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;