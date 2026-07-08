import { useCallback, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  BackgroundVariant 
} from 'reactflow';
import type { Node, Connection, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

// 1. Importar o nosso novo componente
import ColaboradorNode from './components/ColaboradorNode';

// 2. Definir os tipos de nós que o React Flow vai reconhecer
const nodeTypes = {
  colaborador: ColaboradorNode,
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Estados para edição (agora com campo de cargo)
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editName, setEditName] = useState('');
  const [editCargo, setEditCargo] = useState('');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddColaborador = () => {
    const newNode: Node = {
      id: `colaborador-${Date.now()}`,
      type: 'colaborador', // AQUI dizemos que é o nosso componente customizado
      position: { x: 250, y: 250 },
      data: { label: 'Novo Colaborador', cargo: 'Cargo' }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onNodeDoubleClick = useCallback((_: any, node: Node) => {
    setEditingNode(node);
    setEditName(node.data.label);
    setEditCargo(node.data.cargo || '');
  }, []);

  const saveNode = () => {
    if (!editingNode) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === editingNode.id ? { ...n, data: { ...n.data, label: editName, cargo: editCargo } } : n))
    );
    setEditingNode(null);
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      {/* ... (painel lateral com botão chamando handleAddColaborador) */}
      <button onClick={handleAddColaborador}>+ Colaborador</button>

      <div style={{ flexGrow: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes} // 3. REGISTRAR O nodeTypes AQUI
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
        </ReactFlow>
      </div>

      {/* 4. MODAL DE EDIÇÃO (Adicionar campo para cargo) */}
      {editingNode && (
        <div>
          <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome" />
          <input value={editCargo} onChange={(e) => setEditCargo(e.target.value)} placeholder="Cargo" />
          <button onClick={saveNode}>Salvar</button>
        </div>
      )}
    </div>
  );
}