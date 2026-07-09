import { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, Controls, MiniMap, useNodesState, 
  useEdgesState, addEdge, BackgroundVariant 
} from 'reactflow';
import type { Node, Connection, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

import ColaboradorNode from './components/ColaboradorNode';
import DepartamentoNode from './components/DepartamentoNode';

const nodeTypes = {
  colaborador: ColaboradorNode,
  departamento: DepartamentoNode,
};

const FLOW_KEY = 'org-map-dados-salvos';

const getSavedData = () => {
  const saved = localStorage.getItem(FLOW_KEY);
  if (saved) return JSON.parse(saved);
  return { nodes: [], edges: [] };
};

export default function App() {
  const initialData = getSavedData();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);
  
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editCargo, setEditCargo] = useState('');
  const [editLider, setEditLider] = useState('');
  const [editMeta, setEditMeta] = useState('');
  const [selectedColabId, setSelectedColabId] = useState('');
  const [contextMenu, setContextMenu] = useState<{ show: boolean, x: number, y: number } | null>(null);

  // NOVO: Usamos uma referência para o evento global ter sempre acesso à versão mais recente dos nós
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  useEffect(() => {
    localStorage.setItem(FLOW_KEY, JSON.stringify({ nodes, edges }));
  }, [nodes, edges]);

  // NOVO: Escuta o pedido de "Edição" vindo dos botões da Toolbar do Nó
  useEffect(() => {
    const handleOpenEdit = (e: Event) => {
      const customEvent = e as CustomEvent;
      const nodeToEdit = nodesRef.current.find(n => n.id === customEvent.detail);
      if (nodeToEdit) {
        setEditingNode(nodeToEdit);
        setEditLabel(nodeToEdit.data.label || '');
        setEditCargo(nodeToEdit.data.cargo || '');
        setEditLider(nodeToEdit.data.lider || '');
        setEditMeta(nodeToEdit.data.meta || '');
        setSelectedColabId('');
        setContextMenu(null);
      }
    };
    window.addEventListener('openNodeEdit', handleOpenEdit);
    return () => window.removeEventListener('openNodeEdit', handleOpenEdit);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      if (sourceNode?.type === 'colaborador' && targetNode?.type === 'departamento') {
        return setEdges((eds) => addEdge({ ...params, source: targetNode.id, target: sourceNode.id }, eds));
      }
      return setEdges((eds) => addEdge(params, eds));
    },
    [nodes, setEdges]
  );

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ show: true, x: event.clientX, y: event.clientY });
  }, []);

  const onPaneClick = useCallback(() => setContextMenu(null), []);

  const handleAddCustomNode = (type: 'departamento' | 'colaborador') => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id, type, position: { x: 200 + Math.random() * 150, y: 150 + Math.random() * 150 },
      data: type === 'colaborador' ? { label: 'Novo Colaborador', cargo: 'Cargo' } : { label: 'Novo Departamento', lider: 'Líder', meta: 'Meta' }
    };
    setNodes((nds) => nds.concat(newNode));
    setContextMenu(null);
  };

  const handleClearMap = () => {
    if (window.confirm('Tem certeza que deseja apagar todo o mapa?')) {
      setNodes([]); setEdges([]); localStorage.removeItem(FLOW_KEY);
    }
    setContextMenu(null);
  };

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setEditingNode(node); setEditLabel(node.data.label || ''); setEditCargo(node.data.cargo || '');
    setEditLider(node.data.lider || ''); setEditMeta(node.data.meta || ''); setSelectedColabId(''); setContextMenu(null);
  }, []);

  const saveNode = () => {
    if (!editingNode) return;
    setNodes((nds) => nds.map((n) => (n.id === editingNode.id ? { ...n, data: { ...n.data, label: editLabel, cargo: editCargo, lider: editLider, meta: editMeta } } : n)));
    setEditingNode(null);
  };

  const handleCancelEdit = () => {
    if (!editingNode) return;
    const hasChanges = editLabel !== (editingNode.data.label || '') || editCargo !== (editingNode.data.cargo || '') || editLider !== (editingNode.data.lider || '') || editMeta !== (editingNode.data.meta || '');
    if (hasChanges) {
      if (window.confirm("Você tem alterações não salvas. Deseja mesmo fechar sem salvar?")) setEditingNode(null);
    } else {
      setEditingNode(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); saveNode(); }
  };

  const handleAddMemberEdge = () => {
    if (!selectedColabId || !editingNode) return;
    const newEdge: Edge = { id: `edge-${editingNode.id}-${selectedColabId}`, source: editingNode.id, target: selectedColabId };
    setEdges((eds) => addEdge(newEdge, eds));
    setSelectedColabId('');
  };

  const handleRemoveMemberEdge = (colabId: string) => {
    if (!editingNode) return;
    setEdges((eds) => eds.filter(e => !(e.source === editingNode.id && e.target === colabId)));
  };

  const currentMembers = editingNode && editingNode.type === 'departamento' ? edges.filter(e => e.source === editingNode.id).map(e => nodes.find(n => n.id === e.target)).filter(Boolean) : [];
  const availableColabs = editingNode && editingNode.type === 'departamento' ? nodes.filter(n => n.type === 'colaborador' && !edges.some(e => e.source === editingNode.id && e.target === n.id)) : [];
  const colabDepartments = editingNode && editingNode.type === 'colaborador' ? edges.filter(e => e.target === editingNode.id).map(e => nodes.find(n => n.id === e.source)).filter(Boolean) : [];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', fontFamily: 'sans-serif', background: '#f8f9fa' }}>
      
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDoubleClick={onNodeDoubleClick} onPaneContextMenu={onPaneContextMenu} onPaneClick={onPaneClick} fitView>
        <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
        <Controls />
        <MiniMap nodeColor={(n) => n.type === 'departamento' ? '#e2f0d9' : '#cde2f3'} nodeStrokeColor={(n) => n.type === 'departamento' ? '#2ca02c' : '#1f77b4'} nodeBorderRadius={5} />
      </ReactFlow>

      {/* Menu Flutuante Botão Direito */}
      {contextMenu?.show && (
        <div style={{ position: 'absolute', top: contextMenu.y, left: contextMenu.x, background: '#1e1e24', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'row', padding: '6px', gap: '8px', zIndex: 100 }}>
          <button onClick={() => handleAddCustomNode('departamento')} title="Adicionar Departamento" style={{ padding: '8px 12px', background: '#2ca02c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: 'bold' }}>🏢 Dep.</button>
          <button onClick={() => handleAddCustomNode('colaborador')} title="Adicionar Colaborador" style={{ padding: '8px 12px', background: '#1f77b4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: 'bold' }}>👤 Colab.</button>
          <div style={{ width: '1px', background: '#444', margin: '0 2px' }}></div>
          <button onClick={handleClearMap} title="Limpar Mapa" style={{ padding: '8px 12px', background: 'transparent', color: '#d9534f', border: '1px solid #d9534f', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '14px' }}>🗑️</button>
        </div>
      )}

      {/* Modal de Propriedades */}
      {editingNode && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div onKeyDown={handleKeyDown} style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '340px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: '#333' }}>Editar {editingNode.type === 'colaborador' ? 'Colaborador' : 'Departamento'}</h4>
              <button onClick={handleCancelEdit} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', color: '#888' }}>✕</button>
            </div>
            
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Nome</label>
            <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} style={{ width: '93%', padding: '8px', marginTop: '4px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }} autoFocus />

            {editingNode.type === 'colaborador' && (
              <>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Cargo</label>
                <input type="text" value={editCargo} onChange={(e) => setEditCargo(e.target.value)} style={{ width: '93%', padding: '8px', marginTop: '4px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }} />
                <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '15px 0' }} />
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#444', display: 'block' }}>Departamentos Vinculados ({colabDepartments.length})</label>
                <div style={{ maxHeight: '90px', overflowY: 'auto', border: '1px solid #eee', padding: '6px', borderRadius: '4px', marginTop: '4px', marginBottom: '12px', background: '#fdfdfd' }}>
                  {colabDepartments.length === 0 ? ( <span style={{ fontSize: '11px', color: '#999' }}>Não pertence a nenhum departamento</span> ) : ( colabDepartments.map((dep: any) => ( <div key={dep.id} style={{ fontSize: '12px', padding: '3px 0', borderBottom: '1px dashed #eee' }}>🏢 {dep.data.label}</div> )) )}
                </div>
              </>
            )}

            {editingNode.type === 'departamento' && (
              <>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Líder do Setor</label>
                <input type="text" value={editLider} onChange={(e) => setEditLider(e.target.value)} style={{ width: '93%', padding: '8px', marginTop: '4px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Meta Principal</label>
                <input type="text" value={editMeta} onChange={(e) => setEditMeta(e.target.value)} style={{ width: '93%', padding: '8px', marginTop: '4px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px' }} />
                <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '15px 0' }} />
                
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#444', display: 'block' }}>Membros Vinculados ({currentMembers.length})</label>
                <div style={{ maxHeight: '90px', overflowY: 'auto', border: '1px solid #eee', padding: '6px', borderRadius: '4px', marginTop: '4px', marginBottom: '12px', background: '#fdfdfd' }}>
                  {currentMembers.length === 0 ? <span style={{ fontSize: '11px', color: '#999' }}>Nenhum colaborador neste setor</span> : currentMembers.map((member: any) => ( <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '3px 0', borderBottom: '1px dashed #eee' }}><span>{member.data.label} <small style={{ color: '#777' }}>({member.data.cargo})</small></span><button onClick={() => handleRemoveMemberEdge(member.id)} style={{ background: 'none', border: 'none', color: '#d9534f', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>remover</button></div> ))}
                </div>
                
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#444', display: 'block' }}>Vincular Novo Colaborador</label>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', marginBottom: '15px' }}>
                  <select value={selectedColabId} onChange={(e) => setSelectedColabId(e.target.value)} style={{ flexGrow: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}>
                    <option value="">Escolha um colaborador...</option>
                    {availableColabs.map((colab) => <option key={colab.id} value={colab.id}>{colab.data.label}</option>)}
                  </select>
                  <button onClick={handleAddMemberEdge} disabled={!selectedColabId} style={{ padding: '6px 12px', background: '#2ca02c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: selectedColabId ? 1 : 0.5 }}>+</button>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '11px', color: '#aaa' }}>Pressione <strong>Enter</strong> para salvar</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleCancelEdit} style={{ padding: '8px 12px', cursor: 'pointer', background: '#eee', border: 'none', borderRadius: '4px' }}>Cancelar</button>
                <button onClick={saveNode} style={{ padding: '8px 12px', cursor: 'pointer', background: '#1f77b4', color: '#fff', border: 'none', borderRadius: '4px' }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}