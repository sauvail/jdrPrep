import { useState } from 'react';
import { useEntities } from './hooks/useEntities';
import { createEntity, exportData, importData, ExportData } from './utils/storage';
import EntityList from './components/EntityList';
import EntityDetail from './components/EntityDetail';
import EntityForm from './components/EntityForm';
import MapEditor from './components/MapEditor';
import { Entity, EntityType } from './types';
import './App.css';

type View = 'entities' | 'map';

function App() {
  const { entities, addEntity, updateEntity, deleteEntity, reloadEntities } = useEntities();
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentView, setCurrentView] = useState<View>('entities');

  const handleAddEntity = (type: EntityType, name: string, description: string) => {
    const newEntity = createEntity(type, name, description);
    addEntity(newEntity);
    setShowForm(false);
  };

  const handleSelectEntity = (entity: Entity) => {
    setSelectedEntity(entity);
  };

  const handleUpdateEntity = (id: string, updates: Partial<Entity>) => {
    updateEntity(id, updates);
    if (selectedEntity && selectedEntity.id === id) {
      setSelectedEntity({ ...selectedEntity, ...updates });
    }
  };

  const handleDeleteEntity = (id: string) => {
    deleteEntity(id);
    if (selectedEntity?.id === id) {
      setSelectedEntity(null);
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jdrprep-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData;
        const result = importData(data);
        
        if (!result.success) {
          alert(`Import failed: ${result.error}`);
          return;
        }
        
        reloadEntities();
        setSelectedEntity(null);
        // Reload the page to refresh all components including MapEditor
        window.location.reload();
      } catch (error) {
        alert('Import failed: Invalid JSON file format. Please check the file and try again.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
    // Reset the input value so the same file can be imported again if needed
    event.target.value = '';
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎲 JDR Prep - Roleplay Session Planner</h1>
        <div className="header-actions">
          <nav className="view-switcher">
            <button
              className={currentView === 'entities' ? 'active' : ''}
              onClick={() => setCurrentView('entities')}
            >
              Entities
            </button>
            <button
              className={currentView === 'map' ? 'active' : ''}
              onClick={() => setCurrentView('map')}
            >
              Map
            </button>
          </nav>
          <div className="data-actions">
            <button className="export-btn" onClick={handleExport}>
              📤 Export
            </button>
            <label className="import-btn">
              📥 Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'entities' ? (
          <div className="entities-view">
            <aside className="sidebar">
              <div className="sidebar-header">
                <button
                  className="add-entity-btn"
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? 'Cancel' : '+ Add Entity'}
                </button>
              </div>
              {showForm && (
                <EntityForm
                  onSubmit={handleAddEntity}
                  onCancel={() => setShowForm(false)}
                />
              )}
              <EntityList
                entities={entities}
                selectedEntity={selectedEntity}
                onSelect={handleSelectEntity}
                onDelete={handleDeleteEntity}
              />
            </aside>

            <section className="content">
              {selectedEntity ? (
                <EntityDetail
                  entity={selectedEntity}
                  entities={entities}
                  onUpdate={handleUpdateEntity}
                />
              ) : (
                <div className="empty-state">
                  <h2>Welcome to JDR Prep</h2>
                  <p>Organize your roleplay sessions with ease!</p>
                  <ul>
                    <li>Create and manage characters, locations, organizations, creatures, quests, and more</li>
                    <li>Connect entities to track relationships</li>
                    <li>Visualize your world on the map view</li>
                  </ul>
                  <p>Get started by adding your first entity!</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <MapEditor
            entities={entities}
            onUpdatePosition={(id, position) => handleUpdateEntity(id, { position })}
          />
        )}
      </main>
    </div>
  );
}

export default App;
