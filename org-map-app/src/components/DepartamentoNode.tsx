import { Handle, Position, useEdges, NodeToolbar, useReactFlow } from 'reactflow';

const btnStyle = { 
  padding: '5px 8px', cursor: 'pointer', border: 'none', 
  background: 'transparent', color: '#fff', fontSize: '14px', 
  borderRadius: '4px', fontWeight: 'bold' 
};

export default function DepartamentoNode({ id, data, selected }: { id: string; data: any; selected?: boolean }) {
  const edges = useEdges();
  const { setNodes, setEdges, getNode } = useReactFlow();
  const totalMembros = edges.filter((edge) => edge.source === id).length;

  const handleAdd = (type: 'departamento' | 'colaborador') => {
    const currentNode = getNode(id);
    if (!currentNode) return;
    
    const newId = `${type}-${Date.now()}`;
    const newNode = {
      id: newId,
      type,
      position: { x: currentNode.position.x + (Math.random()*40 - 20), y: currentNode.position.y + 130 },
      data: type === 'colaborador' 
        ? { label: 'Novo Colaborador', cargo: 'Cargo' } 
        : { label: 'Novo Departamento', lider: 'Líder', meta: 'Meta' }
    };

    const source = type === 'departamento' ? newId : id; // O Departamento sempre manda
    const target = type === 'departamento' ? id : newId;
    const newEdge = { id: `edge-${source}-${target}`, source, target };

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdge));
  };

  const handleDelete = () => {
    setNodes((nds) => nds.filter(n => n.id !== id));
    setEdges((eds) => eds.filter(e => e.source !== id && e.target !== id));
  };

  const handleEdit = () => {
    window.dispatchEvent(new CustomEvent('openNodeEdit', { detail: id }));
  };

  return (
    <div style={{
      background: '#e2f0d9', padding: '12px', borderRadius: '8px',
      border: `2px solid ${selected ? '#1a751a' : '#2ca02c'}`,
      width: '200px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontFamily: 'sans-serif'
    }}>
      
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div style={{ display: 'flex', gap: '5px', background: '#1e1e24', padding: '6px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
          <button onClick={() => handleAdd('departamento')} title="Adicionar e Ligar Departamento" style={btnStyle}>🏢+</button>
          <button onClick={() => handleAdd('colaborador')} title="Adicionar e Ligar Colaborador" style={btnStyle}>👤+</button>
          <button onClick={handleEdit} title="Abrir Propriedades" style={btnStyle}>✏️</button>
          <div style={{ width: '1px', background: '#444', margin: '0 2px' }}></div>
          <button onClick={handleDelete} title="Excluir" style={{...btnStyle, color: '#ff6b6b'}}>🗑️</button>
        </div>
      </NodeToolbar>

      <Handle type="target" position={Position.Top} />

      <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#2ca02c', marginBottom: '6px' }}>
        {data.label}
      </div>
      <div style={{ fontSize: '12px', color: '#333', marginBottom: '2px' }}>
        <strong>Líder:</strong> {data.lider || 'Não definido'}
      </div>
      <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
        <strong>Meta:</strong> {data.meta || 'Sem meta definida'}
      </div>
      <div style={{ fontSize: '11px', background: '#2ca02c', color: '#fff', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold' }}>
        👥 Membros: {totalMembros}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}