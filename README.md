# 🎲 JDR Prep - Roleplay Session Planner

A web application to help you prepare and organize your roleplay sessions (D&D, Pathfinder 2e, and other tabletop RPG systems).

## Features

- **Entity Management**: Create and organize different types of entities:
  - Characters
  - Locations
  - Organizations
  - Creatures
  - Quests
  - General items

- **Connections**: Create relationships between entities with custom types and descriptions
  - Track allies, enemies, locations, quest objectives, and more
  - View all connections for each entity

- **Map Editor**: Visualize your world with an interactive map
  - Place entities on the map
  - Drag entities to reposition them
  - Visual connection indicators between related entities
  - Color-coded entity types for easy identification

- **Local Storage**: All data is saved automatically in your browser's local storage

## Getting Started

### Prerequisites

- Node.js (version 20.19 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sauvail/jdrPrep.git
cd jdrPrep
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Add Entities**: Click the "+ Add Entity" button to create new characters, locations, quests, etc.
2. **View Details**: Click on any entity in the sidebar to view and edit its details
3. **Create Connections**: In the entity detail view, use "Add Connection" to link entities together
4. **Map View**: Switch to the Map view to visualize your entities spatially
5. **Position on Map**: Click on unmapped entities to add them to the map, then drag them to arrange

## Technology Stack

- React 18
- TypeScript
- Vite
- CSS3

## License

ISC