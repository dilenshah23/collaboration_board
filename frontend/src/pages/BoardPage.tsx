import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardAPI } from '@/api/djangoClient';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { Card, Board } from '@/api/types';

export const BoardPage = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<'todo' | 'in_progress' | 'done'>('todo');

  useEffect(() => {
    if (boardId) {
      loadBoard();
    }
  }, [boardId]);

  const loadBoard = async () => {
    try {
      const data = await boardAPI.get(parseInt(boardId!));
      setBoard(data);
    } catch (error) {
      console.error('Failed to load board:', error);
    }
  };

  const { isConnected, sendAction } = useWebSocket({
    boardId: parseInt(boardId!),
    onInitialState: (initialCards) => {
      setCards(initialCards);
    },
    onCardCreated: (card) => {
      setCards((prev) => [...prev, card]);
    },
    onCardUpdated: (card) => {
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
    },
    onCardMoved: (card) => {
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
    },
    onCardDeleted: (data) => {
      setCards((prev) => prev.filter((c) => c.id !== data.id));
    },
  });

  const handleCreateCard = () => {
    if (!newCardTitle.trim()) return;

    sendAction({
      action: 'card.create',
      data: {
        title: newCardTitle,
        column: selectedColumn,
        position: cards.filter((c) => c.column === selectedColumn).length,
      },
    });

    setNewCardTitle('');
  };

  const handleMoveCard = (card: Card, newColumn: 'todo' | 'in_progress' | 'done') => {
    sendAction({
      action: 'card.move',
      data: {
        id: card.id,
        column: newColumn,
        position: cards.filter((c) => c.column === newColumn).length,
      },
    });
  };

  const handleDeleteCard = (cardId: number) => {
    sendAction({
      action: 'card.delete',
      data: { id: cardId },
    });
  };

  const getCardsInColumn = (column: string) => {
    return cards.filter((card) => card.column === column);
  };

  const columns: { id: 'todo' | 'in_progress' | 'done'; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: '#e3f2fd' },
    { id: 'in_progress', title: 'In Progress', color: '#fff3e0' },
    { id: 'done', title: 'Done', color: '#e8f5e9' },
  ];

  return (
    <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <button onClick={() => navigate('/workspaces')} style={{ marginRight: '15px', cursor: 'pointer' }}>
            ← Back
          </button>
          <h1 style={{ display: 'inline' }}>{board?.name || 'Board'}</h1>
        </div>
        <div>
          <span style={{ marginRight: '15px', color: isConnected ? 'green' : 'red' }}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <select
          value={selectedColumn}
          onChange={(e) => setSelectedColumn(e.target.value as any)}
          style={{ padding: '8px', marginRight: '8px' }}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <input
          type="text"
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCreateCard()}
          placeholder="New card title"
          style={{ padding: '8px', width: '300px', marginRight: '8px' }}
        />
        <button onClick={handleCreateCard} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Add Card
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'auto' }}>
        {columns.map((column) => (
          <div
            key={column.id}
            style={{
              flex: 1,
              backgroundColor: column.color,
              borderRadius: '8px',
              padding: '15px',
              minHeight: '500px',
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: '15px' }}>
              {column.title} ({getCardsInColumn(column.id).length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {getCardsInColumn(column.id).map((card) => (
                <div
                  key={card.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    padding: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  }}
                >
                  <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{card.title}</div>
                  {card.description && (
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{card.description}</div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    {column.id !== 'todo' && (
                      <button onClick={() => handleMoveCard(card, 'todo')} style={{ fontSize: '11px', padding: '4px 8px' }}>
                        → To Do
                      </button>
                    )}
                    {column.id !== 'in_progress' && (
                      <button onClick={() => handleMoveCard(card, 'in_progress')} style={{ fontSize: '11px', padding: '4px 8px' }}>
                        → In Progress
                      </button>
                    )}
                    {column.id !== 'done' && (
                      <button onClick={() => handleMoveCard(card, 'done')} style={{ fontSize: '11px', padding: '4px 8px' }}>
                        → Done
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
