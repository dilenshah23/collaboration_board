import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { workspaceAPI, boardAPI } from '@/api/djangoClient';
import type { Workspace, Board } from '@/api/types';

export const WorkspacesPage = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<number | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newBoardName, setNewBoardName] = useState('');

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const data = await workspaceAPI.list();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBoards = async (workspaceId: number) => {
    try {
      const data = await boardAPI.list(workspaceId);
      setBoards(data);
      setSelectedWorkspace(workspaceId);
    } catch (error) {
      console.error('Failed to load boards:', error);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName) return;
    try {
      await workspaceAPI.create({ name: newWorkspaceName });
      setNewWorkspaceName('');
      setShowCreateWorkspace(false);
      loadWorkspaces();
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName || !selectedWorkspace) return;
    try {
      await boardAPI.create(selectedWorkspace, { name: newBoardName });
      setNewBoardName('');
      setShowCreateBoard(false);
      loadBoards(selectedWorkspace);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Workspaces</h1>
        <div>
          <span style={{ marginRight: '15px' }}>Welcome, {user?.username}</span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: '0 0 300px', borderRight: '1px solid #ddd', paddingRight: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Your Workspaces</h2>
            <button
              onClick={() => setShowCreateWorkspace(!showCreateWorkspace)}
              style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              + New
            </button>
          </div>

          {showCreateWorkspace && (
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
              />
              <button onClick={handleCreateWorkspace} style={{ padding: '8px', marginRight: '8px' }}>
                Create
              </button>
              <button onClick={() => setShowCreateWorkspace(false)} style={{ padding: '8px' }}>
                Cancel
              </button>
            </div>
          )}

          {workspaces.length === 0 ? (
            <p>No workspaces yet. Create one to get started!</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {workspaces.map((workspace) => (
                <li
                  key={workspace.id}
                  onClick={() => loadBoards(workspace.id)}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: selectedWorkspace === workspace.id ? '#e3f2fd' : '#f5f5f5',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{workspace.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {workspace.member_count} member{workspace.member_count !== 1 ? 's' : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ flex: 1 }}>
          {selectedWorkspace ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2>Boards</h2>
                <button
                  onClick={() => setShowCreateBoard(!showCreateBoard)}
                  style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  + New Board
                </button>
              </div>

              {showCreateBoard && (
                <div style={{ marginBottom: '15px' }}>
                  <input
                    type="text"
                    placeholder="Board name"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    style={{ width: '300px', padding: '8px', marginRight: '8px' }}
                  />
                  <button onClick={handleCreateBoard} style={{ padding: '8px', marginRight: '8px' }}>
                    Create
                  </button>
                  <button onClick={() => setShowCreateBoard(false)} style={{ padding: '8px' }}>
                    Cancel
                  </button>
                </div>
              )}

              {boards.length === 0 ? (
                <p>No boards yet. Create one to start collaborating!</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                  {boards.map((board) => (
                    <div
                      key={board.id}
                      onClick={() => navigate(`/board/${board.id}`)}
                      style={{
                        padding: '20px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '2px solid transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.border = '2px solid #1976d2')}
                      onMouseLeave={(e) => (e.currentTarget.style.border = '2px solid transparent')}
                    >
                      <h3>{board.name}</h3>
                      {board.description && <p style={{ fontSize: '14px', color: '#666' }}>{board.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>Select a workspace to view its boards</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
