import { useState, useEffect } from 'react';
import api from '../api';

export default function Comments({ entityType, entityId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [entityType, entityId]);

  const loadComments = async () => {
    try {
      const res = await api.get('/comments', {
        params: { entity_type: entityType, entity_id: entityId },
      });
      setComments(res.data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post('/comments', {
        entity_type: entityType,
        entity_id: entityId,
        text: newComment.trim(),
      });
      setComments([res.data, ...comments]);
      setNewComment('');
    } catch (err) {
      alert('Ошибка добавления комментария');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Удалить комментарий?')) return;
    try {
      await api.delete(`/comments/${id}`);
      setComments(comments.filter((c) => c.id !== id));
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center py-4 text-dark-400">Загрузка комментариев...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Написать комментарий..."
          className="input-field"
          rows={3}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Отправка...' : 'Добавить комментарий'}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-dark-500">
          <p className="text-lg mb-1">💬</p>
          <p>Нет комментариев</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-dark-900 border border-dark-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm font-medium">
                    {(comment.author_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-dark-200">
                      {comment.author_name || 'Неизвестный'}
                    </span>
                    <span className="text-xs text-dark-500 ml-2">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-dark-500 hover:text-red-400 transition-colors text-sm"
                  title="Удалить"
                >
                  ✕
                </button>
              </div>
              <p className="text-dark-300 text-sm mt-3 whitespace-pre-wrap">{comment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
