# Learning System Documentation

## Overview
The learning system allows users to create multiple learning topics and build visual knowledge graphs for each topic. All data is automatically saved to MongoDB.

## Features

### 1. Learning Topics
- Create multiple learning topics/subjects
- Each topic has:
  - Title
  - Description  
  - Custom icon (emoji)
  - Color for visual distinction
  - Tags for organization
- View all topics in a grid layout
- Delete topics (also deletes associated graphs)

### 2. Learning Graphs
- Each topic has its own knowledge graph
- Visual tree structure showing relationships
- Each node can contain:
  - Title
  - Notes
  - Resource links
  - YouTube video links
- Add child nodes to create hierarchies
- Edit and delete nodes
- Auto-save functionality (saves 1 second after changes)
- Beautiful dark/light mode support

## Routes

### `/learning`
- Main page showing all learning topics
- Create new topics
- Click on a topic to view its graph

### `/learning/[id]`
- Individual learning graph for a specific topic
- Build and edit the knowledge graph
- Auto-saves changes to MongoDB

## API Endpoints

### Topics
- `GET /api/learning/topics` - Get all topics for the user
- `POST /api/learning/topics` - Create a new topic
- `GET /api/learning/topics/[id]` - Get a specific topic
- `PATCH /api/learning/topics/[id]` - Update a topic
- `DELETE /api/learning/topics/[id]` - Delete a topic and its graph

### Graphs
- `GET /api/learning/graph/[id]` - Get the graph for a topic
- `POST /api/learning/graph/[id]` - Save the graph for a topic

## Database Collections

### `learning_topics`
Stores learning topic metadata
```typescript
{
  id: string;
  userId: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### `learning_graphs`
Stores the complete graph structure for each topic
```typescript
{
  id: string;
  userId: string;
  topicId: string;
  rootNode: {
    id: string;
    name: string;
    notes: string;
    resources: string[];
    youtubeLinks: string[];
    children?: NodeData[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage Example

1. Navigate to `/learning`
2. Click "New Topic" to create a learning topic
3. Enter topic details (e.g., "React Fundamentals")
4. Click on the topic card to open its graph
5. Click the center "+" button to create your first node
6. Add notes, resources, and YouTube links
7. Click the "+" button on any node to add child nodes
8. Changes are automatically saved to MongoDB

## Auto-Save Behavior

- Graph changes are debounced by 1 second
- Saves automatically after you stop editing
- Visual indicator shows when saving is in progress
- No need to manually save

## Features in Action

### Creating Nodes
- Click "+" button on any node or the center button for first node
- Fill in title, notes, resources, and YouTube links
- Resources and YouTube links support multiple entries (one per line)

### Editing Nodes
- Click the edit icon on any node card
- Modify any field
- Changes auto-save

### Deleting Nodes  
- Click the delete icon on any node
- Confirmation dialog appears
- Warning if node has children
- Deletion cascades to all child nodes

### Viewing Node Details
- Click on any node card
- View dialog shows all notes, resources, and YouTube links
- Links are clickable and open in new tabs
- Can edit or delete from the view dialog

## Styling
- Responsive design
- Dark mode support throughout
- Smooth animations and transitions
- Beautiful gradient backgrounds
- Card-based UI with hover effects

## Future Enhancements
- Export graphs as images
- Share graphs with others
- Templates for common topics
- Progress tracking
- Search within graphs
- Archive/unarchive topics
