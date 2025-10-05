"use client"
import React, { useState, useEffect } from 'react';
import Tree from 'react-d3-tree';
import { Plus, FileText, Link, Youtube, X, Edit2, Trash2, Save, FolderPlus, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';

interface NodeData {
  id?: string;
  name: string;
  attributes?: {
    notes: string;
    resourcesCount: number;
    youtubeLinksCount: number;
    resources: string[];
    youtubeLinks: string[];
  };
  children?: NodeData[];
}

interface GraphicalNotesProps {
  topicId: string;
}

const GraphicalNotes = ({ topicId }: GraphicalNotesProps) => {
  const [treeData, setTreeData] = useState<NodeData | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingNode, setViewingNode] = useState<NodeData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<NodeData | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  // UI settings: orientation and spacing between nodes
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [spacing, setSpacing] = useState<number>(160); // nodeSize.x default
  // Expanded state: Set of node IDs that are explicitly expanded by the user
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    resources: '',
    youtubeLinks: ''
  });

  useEffect(() => {
    loadGraph();
    loadSettings();
  }, [topicId]);

  // Auto-save whenever treeData changes
  useEffect(() => {
    if (treeData && !loading) {
      const timeoutId = setTimeout(() => {
        saveGraph();
      }, 1000); // Debounce save by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [treeData, loading]);

  const loadGraph = async () => {
    try {
      const response = await fetch(`/api/learning/graph/${topicId}`);
      const data = await response.json();
      
      if (data.graph?.rootNode) {
        setTreeData(data.graph.rootNode);
        // Initialize expanded nodes: start with none expanded (so depth > 1 are collapsed by default)
        setExpandedNodes(new Set());
      }
    } catch (error) {
      console.error('Error loading graph:', error);
      toast.error('Failed to load graph');
    } finally {
      setLoading(false);
    }
  };

  const saveGraph = async () => {
    if (!treeData || saving) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/learning/graph/${topicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootNode: treeData })
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }
      // show success toast
      toast.success('Graph saved');
    } catch (error) {
      console.error('Error saving graph:', error);
      toast.error('Failed to save graph');
    } finally {
      setSaving(false);
    }
  };

  const findNodeAndParent = (node: NodeData, targetId: string, parent: NodeData | null = null): { node: NodeData; parent: NodeData | null } | null => {
    if (node.id === targetId) {
      return { node, parent };
    }
    if (node.children) {
      for (let child of node.children) {
        const result = findNodeAndParent(child, targetId, node);
        if (result) return result;
      }
    }
    return null;
  };

  const SETTINGS_KEY = `learning-graph-settings:${topicId}`;

  const loadSettings = () => {
    try {
      if (typeof window === 'undefined') return;
      // Load from localStorage first
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.orientation) setOrientation(parsed.orientation);
        if (typeof parsed.spacing === 'number') setSpacing(parsed.spacing);
      }

      // Try to fetch server-side saved settings (if user is authenticated)
      fetch(`/api/learning/graph/${topicId}`)
        .then(res => res.json())
        .then(data => {
          if (data?.viewSettings) {
            if (data.viewSettings.orientation) setOrientation(data.viewSettings.orientation);
            if (typeof data.viewSettings.spacing === 'number') setSpacing(data.viewSettings.spacing);
          }
        })
        .catch(() => {
          // ignore errors; client-side settings exist
        });
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const saveSettings = () => {
    try {
      if (typeof window === 'undefined') return;
      const payload = { orientation, spacing };
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));

      // Persist to server-side as well (saves via the graph POST endpoint)
      fetch(`/api/learning/graph/${topicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootNode: treeData || {}, viewSettings: payload })
      }).then(res => {
        if (res.ok) {
          toast.success('Graph view settings saved');
        } else {
          toast.error('Failed to save settings to server');
        }
      }).catch(err => {
        console.error('Failed to save settings to server', err);
        toast.error('Failed to save settings to server');
      });
    } catch (err) {
      console.error('Failed to save settings', err);
      toast.error('Failed to save settings');
    }
  };

  const resetSettings = () => {
    setOrientation('horizontal');
    setSpacing(160);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(SETTINGS_KEY);
      }
      toast.success('Settings reset');
    } catch (err) {
      console.error('Failed to reset settings', err);
    }
  };

  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleNodeClick = (nodeData: any) => {
    setViewingNode(nodeData);
    setViewDialogOpen(true);
  };

  const toggleCollapse = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // convertToTreeFormat now accepts a depth parameter (root = 1)
  const convertToTreeFormat = (node: NodeData, depth = 1): any => {
    const hasChildren = node.children && node.children.length > 0;
    // Nodes at depth > 1 should be collapsed by default; they are expanded only if in expandedNodes set
    const defaultCollapsed = depth > 1;
    const isExplicitlyExpanded = node.id ? expandedNodes.has(node.id) : false;
    const isCollapsed = defaultCollapsed && !isExplicitlyExpanded;

    const converted: any = {
      name: node.name,
      id: node.id,
      // If node is collapsed, don't include children
      children: (isCollapsed ? [] : node.children?.map(child => convertToTreeFormat(child, depth + 1))) || []
    };
    
    if (node.attributes) {
      converted.attributes = {
        notes: node.attributes.notes,
        resourcesCount: node.attributes.resourcesCount,
        youtubeLinksCount: node.attributes.youtubeLinksCount
      };
      converted._fullData = node;
    }
    
    // Store collapse state and whether node has children for rendering
    converted._isCollapsed = isCollapsed;
    converted._hasChildren = hasChildren;
    
    return converted;
  };

  const handleAddChild = (parentNode: NodeData | null = null) => {
    setSelectedNode(parentNode);
    setEditMode(false);
    setFormData({
      title: '',
      notes: '',
      resources: '',
      youtubeLinks: ''
    });
    setDialogOpen(true);
  };

  const handleEditNode = (node: NodeData) => {
    setSelectedNode(node);
    setEditMode(true);
    setFormData({
      title: node.name,
      notes: node.attributes?.notes || '',
      resources: (node.attributes?.resources || []).join('\n'),
      youtubeLinks: (node.attributes?.youtubeLinks || []).join('\n')
    });
    setDialogOpen(true);
  };

  const handleDeleteNode = (nodeToDelete: NodeData) => {
    setNodeToDelete(nodeToDelete);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteNode = () => {
    if (!nodeToDelete?.id || !treeData) return;
    
    if (nodeToDelete.id === treeData.id) {
      // If deleting the root node, clear the entire tree
      setTreeData(null);
    } else {
      setTreeData(prevData => {
        if (!prevData) return null;
        const newData = JSON.parse(JSON.stringify(prevData));
        const result = findNodeAndParent(newData, nodeToDelete.id!);
        
        if (result && result.parent) {
          result.parent.children = result.parent.children?.filter((child: NodeData) => child.id !== nodeToDelete.id);
        }
        
        return newData;
      });
    }
    
    setSelectedNode(null);
    setNodeToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleSave = () => {
    const resources = formData.resources.split('\n').filter(r => r.trim());
    const youtubeLinks = formData.youtubeLinks.split('\n').filter(l => l.trim());
    
    const processedData: NodeData = {
      name: formData.title || 'New Topic',
      attributes: {
        notes: formData.notes,
        resourcesCount: resources.length,
        youtubeLinksCount: youtubeLinks.length,
        resources: resources,
        youtubeLinks: youtubeLinks
      },
      children: []
    };

    if (!treeData) {
      setTreeData({
        ...processedData,
        id: generateId()
      });
    } else {
      setTreeData(prevData => {
        if (!prevData) return null;
        const newData = JSON.parse(JSON.stringify(prevData));
        
        if (editMode && selectedNode?.id) {
          const result = findNodeAndParent(newData, selectedNode.id);
          if (result) {
            result.node.name = processedData.name;
            result.node.attributes = processedData.attributes;
          }
        } else if (selectedNode) {
          const newNode = {
            ...processedData,
            id: generateId()
          };
          
          if (selectedNode.id) {
            const result = findNodeAndParent(newData, selectedNode.id);
            if (result) {
              if (!result.node.children) result.node.children = [];
              result.node.children.push(newNode);
            }
          } else {
            if (!newData.children) newData.children = [];
            newData.children.push(newNode);
          }
        }
        
        return newData;
      });
    }

    setDialogOpen(false);
    setFormData({ title: '', notes: '', resources: '', youtubeLinks: '' });
  };

  const renderCustomNode = ({ nodeDatum }: { nodeDatum: any }) => {
    const fullData = nodeDatum._fullData || nodeDatum;
    
    const isVertical = orientation === 'vertical';

    return (
      <g>
        <foreignObject x="-70" y={isVertical ? -56 : -40} width="140" height="80">
          <Card 
            className="relative w-full h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-gray-600/60 shadow-sm hover:shadow-lg dark:shadow-gray-900/20 transition-all cursor-pointer text-xs hover:bg-white/95 dark:hover:bg-gray-800/95"
            onClick={(e) => {
              e.stopPropagation();
              handleNodeClick(fullData);
            }}
          >
            <CardHeader className={isVertical ? 'p-0 pb-0' : 'p-2 pb-1'}>
              <div className={isVertical ? 'flex flex-col items-center gap-1' : 'flex justify-between items-start gap-1'}>
                <CardTitle className={`text-xs font-medium text-gray-800 dark:text-gray-200 truncate ${isVertical ? 'text-center w-full leading-none' : 'flex-1 leading-tight'}`}>
                  {nodeDatum.name}
                </CardTitle>
                {!isVertical && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddChild(fullData);
                    }}
                  >
                    <Plus className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-2 pt-0 space-y-1">
              <div className="flex gap-1 justify-between">
                <div className="flex gap-1">
                  {fullData.attributes?.resourcesCount > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                      <Link className="w-2 h-2 mr-0.5" />
                      {fullData.attributes.resourcesCount}
                    </Badge>
                  )}
                  
                  {fullData.attributes?.youtubeLinksCount > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                      <Youtube className="w-2 h-2 mr-0.5" />
                      {fullData.attributes.youtubeLinksCount}
                    </Badge>
                  )}
                </div>
                {/* edit/delete removed as requested */}
                <div />
              </div>

              {/* In vertical mode, show the add (+) button below the card content */}
              {isVertical && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                  <Button
                    size="sm"
                    className="h-7 w-7 p-0 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddChild(fullData);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </foreignObject>

        {/* connector dot: render after the foreignObject so it appears above the card (higher z-index) */}
        {/* Only show connector if node has children */}
        {nodeDatum._hasChildren && (
          <g
            onClick={(e) => {
              e.stopPropagation();
              if (fullData.id) {
                toggleCollapse(fullData.id);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            {isVertical ? (
              <>
                {/* Connector circle */}
                <circle r="8" cx="0" cy="26" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" className="dark:fill-blue-400 dark:stroke-blue-300" />
                {/* Plus/Minus indicator */}
                {nodeDatum._isCollapsed ? (
                  // Show + when collapsed
                  <>
                    <line x1="-3" y1="26" x2="3" y2="26" stroke="white" strokeWidth="1.5" />
                    <line x1="0" y1="23" x2="0" y2="29" stroke="white" strokeWidth="1.5" />
                  </>
                ) : (
                  // Show - when expanded
                  <line x1="-3" y1="26" x2="3" y2="26" stroke="white" strokeWidth="1.5" />
                )}
              </>
            ) : (
              <>
                {/* Connector circle */}
                <circle r="8" cx="70" cy="0" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" className="dark:fill-blue-400 dark:stroke-blue-300" />
                {/* Plus/Minus indicator */}
                {nodeDatum._isCollapsed ? (
                  // Show + when collapsed
                  <>
                    <line x1="67" y1="0" x2="73" y2="0" stroke="white" strokeWidth="1.5" />
                    <line x1="70" y1="-3" x2="70" y2="3" stroke="white" strokeWidth="1.5" />
                  </>
                ) : (
                  // Show - when expanded
                  <line x1="67" y1="0" x2="73" y2="0" stroke="white" strokeWidth="1.5" />
                )}
              </>
            )}
          </g>
        )}
      </g>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-[90vh] flex items-center justify-center">
        <div className="w-full max-w-4xl p-4">
          <Skeleton className="h-12 w-48 mb-4" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32 col-span-1" />
            <Skeleton className="h-32 col-span-1" />
            <Skeleton className="h-32 col-span-1" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[90vh] relative">
      {saving && (
        <div className="absolute top-4 right-4 z-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          Saving...
        </div>
      )}
      
      <div className="w-full h-full">
        {/* Controls dropdown (spacing & orientation) */}
        <div className="absolute top-4 right-4 z-30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Save className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-3">
              <DropdownMenuLabel className="mb-2">Graph View</DropdownMenuLabel>
              <div className="mb-3">
                <Label className="text-xs">Orientation</Label>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant={orientation === 'horizontal' ? undefined : 'ghost'} onClick={() => setOrientation('horizontal')}>Horizontal</Button>
                  <Button size="sm" variant={orientation === 'vertical' ? undefined : 'ghost'} onClick={() => setOrientation('vertical')}>Vertical</Button>
                </div>
              </div>

              <div className="mb-3">
                <Label className="text-xs">Spacing</Label>
                <div className="mt-2">
                  <Slider
                    value={[spacing]}
                    min={80}
                    max={320}
                    onValueChange={(val: number[] | number) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setSpacing(v);
                    }}
                  />
                  <div className="text-xs text-muted-foreground mt-1">{spacing}px</div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={resetSettings}>Reset</Button>
                <Button size="sm" onClick={saveSettings} className="bg-indigo-600 hover:bg-indigo-700">Save</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {treeData ? (
          <>
            <Tree
              data={convertToTreeFormat(treeData)}
              orientation={orientation}
              translate={{ x: orientation === 'horizontal' ? 120 : window.innerWidth / 2, y: orientation === 'horizontal' ? window.innerHeight / 2 - 100 : 120 }}
              nodeSize={{ x: spacing, y: 100 }}
              separation={{ siblings: 1.2, nonSiblings: 1.4 }}
              renderCustomNodeElement={renderCustomNode}
              onNodeClick={(node) => handleNodeClick((node.data as any)._fullData || node.data)}
              pathFunc="diagonal"
              pathClassFunc={() => 'lr-edge'}
              enableLegacyTransitions
              transitionDuration={500}
            />
            {/* global style to enforce edge color and thickness */}
            <style jsx global>{`
              .lr-edge {
                stroke: #2961dbff !important;
                stroke-width: 2 !important;
                fill: none !important;
              }
            `}</style>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="p-8 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg dark:shadow-gray-900/20 border-dashed border-2 border-indigo-200 dark:border-indigo-600">
              <div className="space-y-4">
                <Button
                  size="lg"
                  onClick={() => handleAddChild(null)}
                  className="h-16 w-16 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <Plus className="w-8 h-8 text-white" />
                </Button>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Create Your First Topic</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Start building your knowledge graph</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200">
              {editMode ? 'Edit Topic' : 'Add New Topic'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Topic Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter topic title"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Add your notes here"
                className="mt-1 resize-none"
              />
            </div>

            <div>
              <Label htmlFor="resources" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Resources (one per line)
              </Label>
              <Textarea
                id="resources"
                value={formData.resources}
                onChange={(e) => setFormData({ ...formData, resources: e.target.value })}
                rows={2}
                placeholder="https://example.com/resource&#10;https://docs.example.com"
                className="mt-1 resize-none"
              />
            </div>

            <div>
              <Label htmlFor="youtube" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                YouTube Links (one per line)
              </Label>
              <Textarea
                id="youtube"
                value={formData.youtubeLinks}
                onChange={(e) => setFormData({ ...formData, youtubeLinks: e.target.value })}
                rows={2}
                placeholder="https://youtube.com/watch?v=...&#10;https://youtu.be/..."
                className="mt-1 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {viewingNode?.name}
            </DialogTitle>
          </DialogHeader>

          {viewingNode && (
            <div className="space-y-4">
              {viewingNode.attributes?.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {viewingNode.attributes.notes}
                  </div>
                </div>
              )}

              {viewingNode.attributes?.resources && viewingNode.attributes.resources.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Resources</Label>
                  <div className="mt-1 space-y-2">
                    {viewingNode.attributes.resources.map((resource, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <Link className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        <a 
                          href={resource} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline flex-1 truncate"
                        >
                          {resource}
                        </a>
                        <ExternalLink className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingNode.attributes?.youtubeLinks && viewingNode.attributes.youtubeLinks.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">YouTube Videos</Label>
                  <div className="mt-1 space-y-2">
                    {viewingNode.attributes.youtubeLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                        <Youtube className="w-4 h-4 text-red-500 dark:text-red-400" />
                        <a 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 underline flex-1 truncate"
                        >
                          {link}
                        </a>
                        <ExternalLink className="w-3 h-3 text-red-500 dark:text-red-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              {viewingNode?.id && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false);
                    if (viewingNode) handleDeleteNode(viewingNode);
                  }}
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button onClick={() => {
                setViewDialogOpen(false);
                if (viewingNode) handleEditNode(viewingNode);
              }}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Topic
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete "{nodeToDelete?.name}"? 
              {nodeToDelete?.children && nodeToDelete.children.length > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ This will also delete all {nodeToDelete.children.length} subtopic(s).
                </span>
              )}
              <span className="block mt-2">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false);
                setNodeToDelete(null);
              }}
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteNode}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GraphicalNotes;