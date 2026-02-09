import { useState, useEffect } from 'react';
import { useEntities } from './hooks/useEntities';
import { createEntity, loadMaps, saveMaps, getActiveMapId, setActiveMapId, createMap } from './utils/storage';
import EntityList from './components/EntityList';
import EntityDetail from './components/EntityDetail';
import EntityForm from './components/EntityForm';
import MapEditor from './components/MapEditor';
import { Entity, EntityType, Map } from './types';
import './App.css';

type View = 'entities' | 'map';

function App() {
  const { entities, addEntity, updateEntity, deleteEntity } = useEntities();
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentView, setCurrentView] = useState<View>('entities');
  const [maps, setMaps] = useState<Map[]>([]);
  const [activeMapId, setActiveMapIdState] = useState<string | null>(null);

  useEffect(() => {
    const loadedMaps = loadMaps();
    setMaps(loadedMaps);
    
    const savedActiveMapId = getActiveMapId();
    if (savedActiveMapId && loadedMaps.find(m => m.id === savedActiveMapId)) {
      setActiveMapIdState(savedActiveMapId);
    } else if (loadedMaps.length > 0) {
      setActiveMapIdState(loadedMaps[0].id);
      setActiveMapId(loadedMaps[0].id);
    }
  }, []);

  useEffect(() => {
    if (maps.length > 0) {
      saveMaps(maps);
    }
  }, [maps]);

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

  const handleMapChange = (mapId: string) => {
    setActiveMapIdState(mapId);
    setActiveMapId(mapId);
  };

  const activeMap = maps.find(m => m.id === activeMapId) || null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎲 JDR Prep - Roleplay Session Planner</h1>
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
            maps={maps}
            activeMap={activeMap}
            onUpdateMap={(updatedMap) => {
              setMaps(maps.map(m => m.id === updatedMap.id ? updatedMap : m));
            }}
            onCreateMap={(name) => {
              const newMap = createMap(name);
              setMaps([...maps, newMap]);
              handleMapChange(newMap.id);
            }}
            onDeleteMap={(mapId) => {
              const filteredMaps = maps.filter(m => m.id !== mapId);
              setMaps(filteredMaps);
              if (activeMapId === mapId && filteredMaps.length > 0) {
                handleMapChange(filteredMaps[0].id);
              }
            }}
            onMapChange={handleMapChange}
          />
        )}
      </main>
    </div>
  );
}

export default App;
